import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const start=app.indexOf('function boardingPassCardsHtml(){');
const end=app.indexOf('// Attachments are private',start);
assert.ok(start>=0&&end>start,'Gerador de cartoes ou sanitizador ausente');
const tools=vm.runInNewContext(app.slice(start,end)+';({sanitizeRouteHtml,boardingPassCardsHtml})',{renameChildren:x=>x});
const setup="try{\n document.body.classList.add('js-ready');readStatic();refreshAll();loadDone();";
const itinerary='<!doctype html><html><head></head><body><section id="documentos">'+
 '<section class="category" data-category="voos" id="doc-voos"><div class="proof-items"></div></section>'+
 '</section><script>'+setup+'</script></body></html>';
const rendered=tools.sanitizeRouteHtml(itinerary);
const slots=[...rendered.matchAll(/data-category="(bp-[^"]+)"/g)].map(x=>x[1]);
const uploads=[...rendered.matchAll(/data-upload="(bp-[^"]+)"/g)].map(x=>x[1]);
assert.equal(slots.length,16,'4 passageiros x 4 trechos = 16 cartoes individuais');
assert.deepEqual(uploads,slots,'Cada card precisa ter uma entrada exclusiva de arquivo');
assert.equal(new Set(slots).size,16,'IDs de comprovantes nao podem repetir');
assert.ok(rendered.indexOf('id="ny26-boarding-passes"')<rendered.indexOf('id="doc-voos"'));
assert.ok(rendered.includes('application/pdf,image/png,image/jpeg,image/webp'),'Aceitar PDF e imagens');
for(const person of ['Gustavo','Renata','Lia','Laís'])assert.ok(rendered.includes('🎫 '+person));
for(const leg of ['ida-1','ida-2','volta-1','volta-2'])assert.equal(slots.filter(x=>x.startsWith('bp-'+leg+'-')).length,4);
assert.ok(rendered.indexOf('window.NY26Documents=')<rendered.indexOf(setup),'Anexos devem entrar no estado persistente');
assert.equal((tools.sanitizeRouteHtml(rendered).match(/id="ny26-boarding-passes"/g)||[]).length,1,'Nao duplicar cards ao recarregar');
assert.match(app,/const DOCS_DB='ny26-private-attachments-v1'/,'Persistencia deve continuar ativa');
console.log('NY26 embarque: 16 cards, carregamento, idempotencia e armazenamento: PASS');
