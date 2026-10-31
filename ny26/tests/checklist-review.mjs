import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const code=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8');
const first=code.indexOf('function reviewValidate(p){'),last=code.indexOf('async function reviewPreview(){',first);
assert.ok(first>=0&&last>first,'Funcoes de revisao ausentes');
const helpers=code.slice(first,last);
const ctx={Object,Set,Map,Array,Number,String,Error,RegExp};
const named=vm.runInNewContext(helpers+';({reviewValidate,reviewApplyRecord,reviewEdits})',ctx);
const plan={format:'NY26-CHECKLIST-REVIEW-1',strategy:'merge_preserve_progress',
 actions:[{id:'orig-001',title:'Revisado',due:'',confirmedComplete:true},
          {id:'orig-002',title:'Corrigido',due:'2026-11-03'}],
 packing:[{id:'pk-001',title:'Novo titulo'},
          {id:'pk-108',title:'Rastreador',reviveIfDiscardedToSeparated:true}],
 addActions:[{id:'review155-001',title:'Novo',group:'Embarque',due:'2026-11-02',phase:'antes',priority:'alta',done:false}],
 addPacking:[]};
named.reviewValidate(plan);
const a=named.reviewApplyRecord({id:'orig-002',title:'Antigo',done:true,note:'Antiga',due:'2026-10-27'},
  plan.actions[1],'actions',false);
assert.equal(a.done,true,'Checkmark concluido jamais pode ser zerado');
assert.equal(a.due,'2026-11-03');
assert.equal(a.title,'Corrigido');
const confirm=named.reviewApplyRecord({id:'orig-001',done:false,title:'Antigo'},plan.actions[0],'actions',false);
assert.equal(confirm.done,true,'Confirmacao explicita precisa fechar a pendencia');
const bag=named.reviewApplyRecord({id:'pk-001',title:'Antigo',status:2},plan.packing[0],'packing',false);
assert.equal(bag.status,2,'Estado Na mala deve ser preservado');
const tracker=named.reviewApplyRecord({id:'pk-108',title:'Cancelado',status:3},plan.packing[1],'packing',false);
assert.equal(tracker.status,1,'Rastreador comprado e configurado: mudar de dispensado para separado');
const trackerPacked=named.reviewApplyRecord({id:'pk-108',status:2},plan.packing[1],'packing',false);
assert.equal(trackerPacked.status,2,'Rastreador ja colocado na mala nao deve ser rebaixado');
assert.equal(named.reviewApplyRecord(null,plan.actions[1],'actions',false),null,'Nao recriar tarefas apagadas');
const newTask=named.reviewApplyRecord(null,plan.addActions[0],'actions',true);
assert.equal(newTask.done,false);
assert.equal(named.reviewEdits(plan).length,5);
assert.throws(()=>named.reviewValidate({...plan,actions:[{id:'orig-001',done:false}]}));
assert.match(code,/db\.runTransaction\(async tx=>/,'Atualizacao precisa de transacao');
assert.match(code,/const docs=await Promise\.all\(refs\.map\(ref=>tx\.get\(ref\)\)\)/,'Ler registros antes de gravar');
assert.match(code,/if\(remote\?\.deleted\)/,'Respeitar exclusoes dos usuarios');
assert.match(code,/reviewBackupDownload\(state\)/,'Backup obrigatorio');
assert.match(code,/lastMaps\[domain\]=map/,'Sincronizar mapa local');
console.log('NY26 revisao: conclusoes, prazos, estados, exclusoes, backup e transacao: PASS');
