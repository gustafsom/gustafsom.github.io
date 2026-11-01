import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const a=app.indexOf('function installFamilyReunionPlan(doc){');
const b=app.indexOf('function openFrame(html){',a);
assert.ok(a>=0&&b>a,'Plano de reencontro nao encontrado');

const stored=new Map(),all=[],events=[],printed={count:0},copied=[];
class Node {
 constructor(tag){this.tag=tag;this.id='';this.className='';this.value='';this.textContent='';this.children=[];this.attrs={};this.hidden=false;this.listeners={};all.push(this)}
 append(...values){this.children.push(...values)}
 appendChild(v){this.children.push(v)}
 replaceChildren(...values){this.children=[...values]}
 addEventListener(event,cb){this.listeners[event]=cb}
 setAttribute(k,v){this.attrs[k]=v}
 insertAdjacentElement(where,v){this.inserted={where,node:v}}
 querySelector(selector){return selector==='h1'&&this.tag==='page'?heading:null}
}
const heading=new Node('h1'),page=new Node('page'),head=new Node('head'),body=new Node('body');
const view={print:()=>{printed.count++}};
const doc={head,body,defaultView:view,createElement:tag=>new Node(tag),
 getElementById:id=>id==='apoio'?page:all.find(x=>x.id===id)||null,
 querySelector:()=>null};
const sandbox={
 user:{uid:'synthetic-user-123'},TRIP:'ny26',doc,
 localStorage:{getItem:key=>stored.get(key)||null,setItem:(key,val)=>stored.set(key,val)},
 navigator:{clipboard:{writeText:async x=>copied.push(x)}},
 console:{warn:()=>{}}
};
const install=vm.runInNewContext('('+app.slice(a,b).trim()+')',sandbox);
install(doc);
assert.ok(heading.inserted,'Painel nao montado apos o titulo Apoio');
const root=heading.inserted.node;
assert.equal(root.id,'ny26-reunion-plan');
assert.ok(root.children.some(x=>String(x.textContent).includes('NÃO sai procurando sozinho')));
const details=all.filter(x=>x.tag==='details');
assert.equal(details.length,3,'Prevenção, locais e frases devem existir');
const safePlaces=all.filter(x=>x.tag==='li').map(x=>x.textContent).join(' ');
for(const place of ['Times Square','SUMMIT','Central Park','DUMBO','Help Point','Ferry']){
 assert.ok(safePlaces.includes(place),'Faltou local seguro '+place)
}
const fields=all.filter(x=>x.tag==='input');
assert.equal(fields.length,2);
fields[0].value='+55 85 99999-1111';
fields[1].value='+55 85 99999-2222';
const save=all.find(x=>x.tag==='button'&&x.textContent.includes('Salvar contatos'));
const print=all.find(x=>x.tag==='button'&&x.textContent.includes('Imprimir 4'));
const copy=all.find(x=>x.tag==='button'&&x.textContent.includes('Copiar instruções'));
assert.ok(save&&print&&copy);
save.listeners.click();
assert.equal(stored.size,1,'Telefones guardados apenas localmente');
const local=JSON.parse([...stored.values()][0]);
assert.equal(local.phone1,'+55 85 99999-1111');
assert.equal(local.phone2,'+55 85 99999-2222');
print.listeners.click();
assert.equal(printed.count,1);
const printable=all.find(x=>x.id==='ny26-reunion-print');
assert.equal(printable.children.length,4);
assert.deepEqual(printable.children.map(x=>x.children[0].textContent),[
 'HELP — Lia · cópia 1','HELP — Laís · cópia 1',
 'HELP — Lia · cópia 2','HELP — Laís · cópia 2'
]);
await copy.listeners.click();
assert.match(copied[0],/Gustavo: \+55 85 99999-1111/);
assert.match(copied[0],/911/);
const before=all.length;install(doc);
assert.equal(all.length,before,'Nao duplicar quando iframe recarrega');
assert.ok(!app.includes('99999-1111'),'Telefones de teste nao podem estar no codigo publico');
assert.ok(app.includes('try{installFamilyReunionPlan(doc)}'));
console.log('NY26 plano NY12: protocolos, locais seguros, frases, telefones locais, 4 cartoes e idempotencia: PASS');
