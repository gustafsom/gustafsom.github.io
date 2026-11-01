import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const html=readFileSync(new URL('../index.html',import.meta.url),'utf8');
const start=app.indexOf('function addEmergencyMenuToRouteHtml(html){');
const end=app.indexOf('function sanitizeRouteHtml(source){',start);
assert.ok(start>=0&&end>start,'Faltou a nova navegacao de emergencia');
const inject=vm.runInNewContext('('+app.slice(start,end).trim()+')');
const original=['<!doctype html><html><head></head><body>',
 '<header><nav aria-label="Escolher data" class="nav">',
 '<a class="daytab" data-view="documentos" href="#documentos">📎 Docs</a>',
 '<a class="daytab" data-view="apoio" href="#apoio">🆘 Apoio</a>',
 '</nav></header><main>',
 '<section class="page" data-view="documentos" id="documentos"><h1>Docs</h1></section>',
 '<section class="page" data-view="apoio" id="apoio"><h1>🆘 Apoio e informações úteis</h1>',
 '<div class="support"><div class="support-card"><h3>🏨 Hotel</h3><p>Reserva privada preservada</p></div></div></section>',
 '</main><script>(function(){',
 "function handleHash(){var hash=location.hash.substring(1),v='';if(hash==='documentos'||hash==='apoio'||hash==='instalacao')v=hash;}",
 '</script></body></html>'].join('');
const updated=inject(original);
assert.equal((updated.match(/id="emergencia"/g)||[]).length,1,'Uma pagina Emergencia');
assert.equal((updated.match(/data-view="emergencia" href="#emergencia"/g)||[]).length,1,'Um item no menu');
assert.ok(updated.indexOf('data-view="emergencia" href="#emergencia"')<updated.indexOf('data-view="apoio" href="#apoio"'),'Emergencia antes de Apoio');
assert.ok(updated.indexOf('id="emergencia"')<updated.indexOf('id="apoio"'),'Pagina propria antes de Apoio');
assert.match(updated,/hash==='emergencia'\|\|hash==='apoio'/,'Navegacao nao deve voltar ao roteiro do dia');
assert.match(updated,/>ℹ️ Apoio<\/a>/);
assert.match(updated,/<h1>ℹ️ Apoio e informações úteis<\/h1>/);
assert.match(updated,/Reserva privada preservada/,'Informacoes do Apoio intactas');
assert.ok(updated.includes('tel:911'),'Chamada direta de emergencia');
assert.equal(inject(updated),updated,'Reabrir ou atualizar roteiro nao deve duplicar menu');
assert.ok(html.includes('id="open-emergency"'),'Atalho no menu superior da PWA');
assert.ok(app.includes("function openEmergency(){"));
assert.ok(app.includes("$('open-emergency').onclick=openEmergency"));
assert.ok(app.includes("if(win.location.hash!==hash)win.location.hash=hash"));
assert.equal((app.match(/const page=doc.getElementById\('emergencia'\)\|\|doc.querySelector\('\[data-view="emergencia"\]'\)/g)||[]).length,2,
 'Contatos e plano de reencontro devem estar na Emergencia, nao no Apoio');
assert.match(app,/tidyLegacyEmergencySupport\(doc\)/,'Remover conteudo duplicado da tela Apoio');
const empty=inject('<html><head></head><body><p>Sem Apoio</p></body></html>');
assert.ok(!empty.includes('id="emergencia"'),'Nao injetar pagina isolada em roteiros nao compativeis');
console.log('NY26: menu Emergencia, link, aba, roteiro, contatos/reencontro e idempotencia: PASS');
