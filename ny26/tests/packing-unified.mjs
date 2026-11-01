import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const script=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=script.indexOf('const NY26_PACKING_UNIFIED_RENDER=');
const stop=script.indexOf('function sanitizeRouteHtml(source){',start);
assert.ok(start>=0&&stop>start,'Renderizador unificado nao encontrado');
const helper=vm.runInNewContext(script.slice(start,stop)+';unifyPackingMarkup');
const eventNeedle="if(id){var a=state.items.find(function(x){return x.id===id});if(a){a.status=Number(b.getAttribute('data-pk-value'));saveState()}}else if(ed)";
const legacy=['<html><head></head><body><section id="mala"><h1>🧳 Minha mala</h1>',
 '<p>4 pessoas · 3 malas de cabine + 4 mochilas.</p>',
 '<div>Separe os itens de cada pessoa. Toque o botão.</div>',
 '<label>Quem?<select id="pk-person"><option value="all">Todos</option><option value="Gustavo">Gustavo</option></select></label>',
 '<select id="pk-status"><option value="all">Todos</option><option selected="" value="todo">A separar</option></select>',
 '<label>Para quem<select id="pk-who"><option>Família</option><option>Gustavo</option></select></label>',
 '<div id="pk-list"></div><script>var person="all",filter="todo",category="all";',
 "function render(){var t=state.items,packed=t.length;el('pk-list').innerHTML='antigo';}",
 'function editor(id){}',
 "root.addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;var id=b.getAttribute('data-pk-stage'),ed=b.getAttribute('data-pk-edit'),del=b.getAttribute('data-pk-delete');",
 eventNeedle,'editor(ed)});',
 '</script></section></body></html>'].join('\n');
const unified=helper(legacy);
assert.notEqual(unified,legacy);
assert.match(unified,/<h1>🧳 Mala da família<\/h1>/);
assert.ok(!unified.includes('<label>Quem?<select'));
assert.ok(!unified.includes('<label>Para quem<select'));
assert.match(unified,/<option selected="" value="all">Todos<\/option>/);
assert.match(unified,/data-pk-unified/);
assert.match(unified,/function render\(\)\{\n var t=state.items,grouped=/);
assert.equal((helper(unified).match(/id="ny26-pk-unified-style"/g)||[]).length,1,'Nao duplicar estilo');
const items=[
 {id:'pk-001',title:'Meias',category:'Roupas',who:'Gustavo',qty:4,status:2,bag:'Mala 1',priority:'essencial',note:''},
 {id:'pk-002',title:'Meias',category:'Roupas',who:'Renata',qty:4,status:1,bag:'Mala 2',priority:'essencial',note:''},
 {id:'pk-003',title:'Meias',category:'Roupas',who:'Lia',qty:5,status:0,bag:'Mala 3',priority:'essencial',note:''},
 {id:'pk-004',title:'Meias',category:'Roupas',who:'Lais',qty:5,status:0,bag:'Mala 3',priority:'essencial',note:''},
 {id:'pk-005',title:'Rastreador',category:'Bagagem',who:'Família',qty:5,status:2,bag:'Mochila',priority:'essencial',note:''}
];
const map={};
const state={items:items.map(x=>({...x}))};
const ctx={state,person:'all',filter:'all',category:'all',search:'',safe:x=>String(x),el:id=>(map[id]??={textContent:'',style:{},innerHTML:''})};
const a=unified.indexOf('function render(){\n var t=state.items,');
const b=unified.indexOf('\nfunction editor(id){',a);
assert.ok(a>=0&&b>a);
vm.runInNewContext(unified.slice(a,b)+';render()',ctx);
assert.equal(map['pk-count'].textContent,2,'Cinco registros de mala -> dois itens unificados');
assert.equal(map['pk-packed'].textContent,1);
assert.equal(map['pk-prep'].textContent,0);
assert.equal(map['pk-left'].textContent,1);
assert.match(map['pk-list'].innerHTML,/Meias <em>×18<\/em>/);
assert.match(map['pk-list'].innerHTML,/1 na mala · 1 separado\(s\) · 2 a separar/);
assert.match(map['pk-list'].innerHTML,/Rastreador <em>×5<\/em>/);
const hStart=unified.indexOf("var gkey=b.getAttribute('data-pk-unified');");
const hEnd=unified.indexOf('else if(id){var a=state.items',hStart);
assert.ok(hStart>=0&&hEnd>hStart);
const handler=vm.runInNewContext('(function(b,state,saveState,confirm){'+unified.slice(hStart,hEnd).replace(/else\s*$/,'')+'})');
let writes=0;
const button=v=>({getAttribute:k=>k==='data-pk-unified'?encodeURIComponent('roupas|meias'):k==='data-pk-value'?String(v):null});
handler(button(1),state,()=>writes++,()=>true);
assert.deepEqual(state.items.slice(0,4).map(x=>x.status),[2,1,1,1],'Separado nao pode rebaixar item Na mala');
handler(button(2),state,()=>writes++,()=>true);
assert.deepEqual(state.items.slice(0,4).map(x=>x.status),[2,2,2,2],'Na mala aplica-se ao grupo inteiro');
assert.equal(state.items[4].status,2,'Outro item nao deve mudar');
assert.deepEqual(state.items.map(x=>x.id),items.map(x=>x.id),'IDs originais permanecem intactos');
assert.equal(writes,2);
console.log('NY26 mala unificada: grupos, quantidades, status parcial, clique coletivo, IDs e progresso: PASS');