import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const script=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=script.indexOf('const NY26_EMERGENCY_CONTACTS=');
const end=script.indexOf('function openFrame(html){',start);
assert.ok(start>0&&end>start,'Modulo de emergencia nao encontrado');
const copyCalls=[];
const {contacts,install}=vm.runInNewContext(script.slice(start,end)+
 '({contacts:NY26_EMERGENCY_CONTACTS,install:installEmergencyContacts})',{
 navigator:{clipboard:{writeText:async s=>copyCalls.push(s)}},
 console:{warn:()=>{}}
});
assert.equal(contacts.length,4);
const actual=Object.fromEntries(Array.from(contacts,x=>[x.id,x.tel]));
assert.deepEqual(JSON.parse(JSON.stringify(actual)),{
 usa:'911',ny:'+16464032676',dc:'+12027148017',br:'+5561982600610'
});
assert.equal(contacts.find(x=>x.id==='ny').generalTel,'+19179437155');
assert.equal(contacts.find(x=>x.id==='dc').generalTel,'+12024613000');
const created=[],all={},phoneLinks=[];
class FakeNode{
 constructor(tag){this.tag=tag;this.children=[];this.attrs={};this.textContent='';this.hidden=false;this.listeners={};created.push(this)}
 setAttribute(k,v){this.attrs[k]=v}
 append(...items){this.children.push(...items)}
 appendChild(item){this.children.push(item)}
 addEventListener(name,fn){this.listeners[name]=fn}
 insertAdjacentElement(position,node){this.position=position;this.sibling=node;all[node.id]=node}
 querySelector(sel){
  if(this.tag==='page'&&sel==='h1')return heading;
  if(this.tag==='page'&&sel==='.ny26-v140-critical')return legacy;
  return null
 }
}
const heading=new FakeNode('h1'),legacy=new FakeNode('legacy');
const page=new FakeNode('page'),head=new FakeNode('head');
const doc={
 head,
 getElementById:id=>id==='apoio'?page:all[id]||null,
 querySelector:()=>null,
 createElement:name=>new FakeNode(name),
 createTextNode:text=>({text})
};
install(doc);
const wrapper=all['ny26-emergency-contacts'];
assert.ok(wrapper,'Painel nao foi inserido');
assert.equal(heading.position,'afterend');
assert.equal(legacy.hidden,true,'Aviso antigo deve ficar oculto');
assert.equal(wrapper.attrs['aria-label'],'Telefones úteis e emergências durante a viagem');
const telLinks=created.filter(x=>x.tag==='a'&&String(x.href||'').startsWith('tel:'));
for(const tel of Object.values(actual))assert.ok(telLinks.some(x=>x.href==='tel:'+tel),'Telefone clicavel: '+tel);
const emergency=created.find(x=>x.attrs['data-contact']==='usa');
assert.ok(emergency&&emergency.attrs['data-kind']==='urgent');
const copies=created.filter(x=>x.tag==='button'&&x.className==='ny26-e-copy');
assert.equal(copies.length,4);
await copies[1].listeners.click();
assert.equal(copyCalls[0],'+16464032676');
const existingCount=created.length;install(doc);
assert.equal(created.length,existingCount,'Nao duplicar contatos em atualizacoes');
assert.match(script,/try\{installEmergencyContacts\(doc\)\}/,'A tela privada precisa carregar os contatos');
console.log('NY26 Apoio: 911, NY, Washington, Itamaraty, ligacao, copia e idempotencia: PASS');
