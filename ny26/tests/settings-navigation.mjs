import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const show=source.match(/function show\(id\)\{[^\n]+\}/)?.[0];
const settings=source.match(/function settings\(\)\{[^\n]+\}/)?.[0];
const start=source.indexOf('function returnFromSettings(){');
const end=source.indexOf('\nasync function boot()',start);
assert.ok(show && settings && start>=0 && end>start,'Funcoes de navegacao nao encontradas');
const back=source.slice(start,end);
const classes=()=>{const values=new Set(['hide']);return {contains:x=>values.has(x),add:x=>values.add(x),remove:x=>values.delete(x),toggle:(x,set)=>set?values.add(x):values.delete(x)}};
const controls=Object.fromEntries(['setup','waiting','settings','viewer'].map(x=>[x,{classList:classes(),srcdoc:x==='viewer'?'<html>roteiro</html>':''}]));
const body={classList:classes()};
const context={document:{getElementById:x=>controls[x],body},user:{uid:'test'},refresh:()=>{}};
vm.createContext(context);
vm.runInContext('const $=id=>document.getElementById(id);'+show+'\n'+settings+'\n'+back+'\nthis.nav={show,settings,returnFromSettings};',context);
const {nav}=context;
nav.show('waiting');body.classList.add('running');
for(let i=0;i<4;i++){
 nav.settings();
 assert.equal(body.classList.contains('running'),false,'Settings should hide itinerary');
 assert.equal(controls.settings.classList.contains('hide'),false,'Settings should become visible');
 nav.returnFromSettings();
 assert.equal(body.classList.contains('running'),true,'Return should restore itinerary');
 assert.equal(controls.settings.classList.contains('hide'),true,'Return must hide settings state');
}
controls.viewer.srcdoc='';
nav.settings();nav.returnFromSettings();
assert.equal(body.classList.contains('running'),false,'No route must show waiting, not blank iframe');
assert.equal(controls.waiting.classList.contains('hide'),false,'No route must show waiting');
assert.ok(source.includes("$('home').onclick=returnFromSettings;"),'Toolbar home should use same navigation');
console.log('NY26: navegacao engrenagem ↔ roteiro e sem roteiro: OK');