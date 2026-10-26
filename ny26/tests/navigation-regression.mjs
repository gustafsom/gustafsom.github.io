import { readFileSync } from 'node:fs';
import { strict as assert } from 'node:assert';
import vm from 'node:vm';

const source=readFileSync(new URL('../app.js', import.meta.url),'utf8');
const match=source.match(/function sanitizeRouteHtml\(source\)\{[\s\S]*?\n\}/);
assert.ok(match,'Sanitizador do iframe nao encontrado');
const sanitize=vm.runInNewContext('('+match[0]+')');
const sample='<!doctype html><html><head><title>NY26 V8</title></head><body><a href="#mala">Mala</a><script>\n/* NY26 v7 — sincronização antiga.\n...navigator.serviceWorker.register("./sw.js")\n</script><div id="mala"></div></body></html>';
const output=sanitize(sample);
assert.ok(output.includes('<base href="about:srcdoc">'),'O iframe precisa de base independente do URL pai');
assert.ok(output.includes('href="#mala"'),'O link de mala deve ser preservado');
assert.ok(!output.includes('serviceWorker.register'),'A sincronizacao antiga deve ser desativada');
assert.ok(source.includes("doc.addEventListener('click'"),'Falta capturar cliques de hash');
assert.ok(source.includes('ev.preventDefault()'),'Links internos nao devem navegar ao app pai');
assert.ok(source.includes("if(++repairs<=1)"),'Falta recuperacao da navegacao recursiva');
console.log('Regressao estatica dos links internos: OK');
