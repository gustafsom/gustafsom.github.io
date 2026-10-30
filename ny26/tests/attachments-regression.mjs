import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
const worker=readFileSync(new URL('../sw.js',import.meta.url),'utf8');
const start=app.indexOf('function sanitizeRouteHtml(source){');
const end=app.indexOf('// Attachments are private',start);
assert.ok(start>=0&&end>start,'Sanitizacao do HTML nao encontrada');
const sanitize=vm.runInNewContext('('+app.slice(start,end).trim()+')',{renameChildren:x=>x});
const marker="try{\n document.body.classList.add('js-ready');readStatic();refreshAll();loadDone();";
const basic='<html><head></head><body><script>(function(){var docs={voos:[],hospedagem:[]};function refreshAll(){}'+marker+'</script><div id="documentos"></div></body></html>';
const sanitized=sanitize(basic);
assert.match(sanitized,/window\.NY26Documents=\{snapshot:/,'API privada nao foi criada');
assert.ok(sanitized.indexOf('window.NY26Documents=')<sanitized.indexOf(marker),'API deve ser criada antes da inicializacao');

const m=sanitized.match(/window\.NY26Documents=\{[\s\S]*?\};\n/);
assert.ok(m,'API injetada malformada');
const model={voos:[{name:'a.pdf',data:'data:application/pdf;base64,JVBERi0xLjQ='}],hospedagem:[]};
let refreshes=0;
const scope={window:{},docs:model,refreshAll:()=>{refreshes++}};
vm.runInNewContext(m[0],scope);
assert.equal(scope.window.NY26Documents.snapshot().voos.length,1);
scope.window.NY26Documents.restore({voos:[{name:'outro.pdf'}]});
assert.equal(model.voos[0].name,'outro.pdf');
assert.equal(refreshes,1);

const s=app.indexOf('function safeDocs(sets){'),e=app.indexOf('async function installPdfAttachments(doc){',s);
assert.ok(s>=0&&e>s,'Validador de comprovantes nao encontrado');
const safe=vm.runInNewContext('('+app.slice(s,e).trim()+')');
const valid=safe({voos:[
 {name:'Reserva.pdf',type:'application/pdf',size:100,data:'data:application/pdf;base64,JVBERi0xLjQ='},
 {name:'script',data:'javascript:alert(1)'}]});
assert.equal(valid.voos.length,1,'Apenas documentos incorporados validos devem ser aceitos');
assert.equal(valid.voos[0].name,'Reserva.pdf');

assert.match(app,/const DOCS_DB='ny26-private-attachments-v1'/);
assert.match(app,/const record=await docsTransaction\(db,'readonly',key\)/);
assert.match(app,/api\.restore\(stored\)/);
assert.match(app,/tx\.oncomplete=.*readwrite/);
assert.match(app,/orphanDocs/);

assert.match(app,/r\.type==='childList'&&r\.target\?\.classList\?\.contains\('proof-items'\)/,
 'O observador deve reagir somente a insercoes/remocoes diretas; observar descendentes trava Android');
assert.ok(!app.includes("r.target?.closest?.('.proof-items')"),
 'Observacao recursiva dos descendentes causa loop infinito');
const lazyStart=app.indexOf('function applyLinks(){');
const lazyEnd=app.indexOf("let db,ready=false",lazyStart);
assert.ok(lazyStart>=0&&lazyEnd>lazyStart);
const sectionCode=app.slice(lazyStart,lazyEnd);
assert.ok(!sectionCode.slice(0,sectionCode.indexOf("doc.addEventListener('click'")).includes('blobUrlFromData('),
 'Criar Blob para cada comprovante no render provoca consumo excessivo de memoria');
assert.ok(sectionCode.slice(sectionCode.indexOf("doc.addEventListener('click'")).includes('blobUrlFromData(file.data)'),
 'O PDF deve ser convertido em Blob apenas quando o usuario clicar');
assert.match(sectionCode,/del\.textContent!=='🗑️ Remover comprovante'/,
 'Evitar reescrever botao de remover para que nao gere mutacoes em ciclo');

assert.match(app,/link\.setAttribute\('target','_blank'\)/);
assert.match(app,/link\.removeAttribute\('download'\)/);
assert.match(app,/a\.href=entry\.data/,'Exportacao HTML deve preservar o PDF incorporado');
assert.match(app,/new docWindow\.DOMParser\(\)/,'Restauracao de HTML antigo necessaria');
assert.ok(!app.includes('installPdfPreview'),'Visualizador intermediario antigo precisa ser removido');
assert.ok(!worker.includes('pdf.js'),'Nao depender do renderizador com caracteres distorcidos');
console.log('NY26: documentos persistentes, recuperacao de backups e abertura direta: PASS');
