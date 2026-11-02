import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../photos.js',import.meta.url),'utf8');
const app=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8');
const sw=fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8');
assert.match(script,/ny26-private-place-photos-v1/);
assert.match(script,/store\.put\(record\)/);
assert.match(script,/tx\.oncomplete=\(\)=>resolve\(\)/,'Confirmar gravacao apos commit');
assert.match(script,/ev\.stopImmediatePropagation\(\)/,'Bloquear o manipulador legado');
assert.match(script,/modal\.showModal\(\)/,'Abrir zoom');
assert.match(script,/Ver mapa do AirTrain/);
assert.match(app,/NY26Photos\.install\(doc,TRIP\+':'\+user\.uid\)/);
assert.match(html,/<script src="\.\/photos\.js" defer><\/script>/);
assert.match(sw,/\.\/photos\.js/);

const records=new Map();
const db={
 transaction:()=>{
  const tx={objectStore:()=>({
   index:()=>({getAll:owner=>{
    const req={};
    queueMicrotask(()=>{req.result=[...records.values()].filter(x=>x.owner===owner);req.onsuccess?.()});
    return req;
   }}),
   put:rec=>{queueMicrotask(()=>{records.set(rec.id,rec);tx.oncomplete?.()})},
   delete:id=>{queueMicrotask(()=>{records.delete(id);tx.oncomplete?.()})}
  })};
  return tx;
 },
 close:()=>{}
};
const indexedDB={open:()=>{
 const req={};
 queueMicrotask(()=>{req.result=db;req.onsuccess?.()});
 return req;
}};
let urlIndex=0;
const win={
 URL:{createObjectURL:()=>('blob:img-'+(++urlIndex)),revokeObjectURL:()=>{}},
 addEventListener:()=>{},confirm:()=>true,
 fetch:async()=>({blob:async()=>({type:'image/png',size:100})})
};
let section,sheet,actions,cover,label,hint,input,latest;
class Node{
 constructor(tag){this.tag=tag;this.children=[];this.attributes={};this.classList={add:()=>{},remove:()=>{},toggle:()=>{}};this.dataset={};this.listeners={};this.disabled=false;this.textContent='';this.src='';this.href='';this.parent=null}
 append(...children){for(const n of children){this.children.push(n);if(n instanceof Node)n.parent=this}}
 appendChild(n){this.append(n);return n}
 prepend(n){this.children.unshift(n);n.parent=this}
 replaceChildren(...children){this.children=[];this.append(...children)}
 setAttribute(k,v){this.attributes[k]=v}
 getAttribute(k){return this.attributes[k]||null}
 addEventListener(k,fn){this.listeners[k]=fn}
 insertAdjacentElement(_at,n){this.parent?.append(n)}
 insertBefore(n){this.append(n);return n}
 closest(sel){
  if(sel==='input[data-photo-upload]')return this.tag==='input'?this:null;
  if(sel==='.sheet-section')return section;
  if(sel==='.place-sheet')return sheet;
  if(sel==='label')return this.tag==='input'?label:null;
  return null;
 }
 querySelector(sel){
  if(this===section&&sel==='.sheet-photo-tools')return hint;
  if(this===sheet&&sel==='.sheet-actions')return actions;
  if(this===cover&&sel==='img.photo')return null;
  return null;
 }
 showModal(){this.open=true}
 close(){this.open=false}
}
function makeDoc(){
 section=new Node('section');sheet=new Node('sheet');actions=new Node('actions');cover=new Node('cover');label=new Node('label');hint=new Node('p');
 input=new Node('input');input.getAttribute=k=>k==='data-photo-upload'?'etapa-1-1':null;
 input.files=[];label.append(input);section.append(hint,label);
 const elts={};latest={
  head:new Node('head'),body:new Node('body'),defaultView:win,
  querySelectorAll:sel=>sel==='input[data-photo-upload]'?[input]:[],
  querySelector:sel=>sel==='[data-photo-cover="etapa-1-1"]'?cover:null,
  getElementById:id=>elts[id]||null,
  addEventListener:(k,fn,capture)=>{if(k==='change'){latest.change=fn;latest.capture=capture}},
  createElement:tag=>{const n=new Node(tag);if(tag==='style')n.id='ny26-place-photo-style';if(tag==='dialog')n.id='ny26-place-photo-dialog';return n}
 };
 return latest;
}
const context={window:win,indexedDB,console:{warn:()=>{}},Date,Math,Promise,Error,Map,Array,Object,RegExp,Set,String,Number};
vm.runInNewContext(script,context);
assert.equal(typeof win.NY26Photos.install,'function');
const doc=makeDoc();
await win.NY26Photos.install(doc,'ny26:synthetic');
assert.equal(input.disabled,false,'Permitir anexo depois de abrir banco');
assert.equal(latest.capture,true,'Capturar antes do manipulador v1.40');
const file={type:'image/png',name:'Mapa-AirTrain-Estacoes.png',size:9000};
input.files=[file];
let stopped=false;
await latest.change({target:input,stopPropagation(){},stopImmediatePropagation(){stopped=true}});
assert.ok(stopped);
assert.equal(records.size,1,'Anexo persistente');
assert.equal([...records.values()][0].step,'etapa-1-1');
assert.equal([...records.values()][0].blob,file,'Preservar resolucao original do mapa');
assert.match(actions.children[0].textContent,/Ver mapa do AirTrain \(1\)/);
const gallery=section.children.find(x=>x.className==='ny26-photo-gallery');
assert.ok(gallery,'Galeria visivel na ficha');
assert.equal(gallery.children.length,1);
gallery.children[0].children[0].listeners.click();
assert.equal(doc.body.children[0].open,true,'Zoom abre');
doc.body.children[0].children[0].children[2].listeners.click();
assert.equal(doc.body.children[0].open,false,'Zoom fecha');
const doc2=makeDoc();
await win.NY26Photos.install(doc2,'ny26:synthetic');
assert.match(actions.children[0].textContent,/Ver mapa do AirTrain \(1\)/,'Persiste ao recarregar');
const gallery2=section.children.find(x=>x.className==='ny26-photo-gallery');
await gallery2.children[0].children[2].children[1].listeners.click();
assert.equal(records.size,0,'Remove apenas com confirmacao');
console.log('NY26 fotos: upload, IndexedDB, miniatura, zoom, recarga e remocao: PASS');