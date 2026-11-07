/* NY26 private day patch: only generic schema and merge logic are public. */
(()=>{'use strict';
const DATE='2026-11-07',SCHEMA='ny26-day-patch-v1';
const attrs=['title','time','address','status','why','look','instructions','food','bathroom','warning','source'];
function validate(p){
 if(!p||p.schema!==SCHEMA||p.version!=='1.60'||p.date!==DATE||p.after!=='Walmart Eddystone')throw Error('Pacote do dia 07/11 não corresponde à atualização v1.60.');
 if(!p.stop||!/^Royal Farms\b/i.test(p.stop.title||'')||!Array.isArray(p.sequence)||p.sequence.length<5||p.sequence.length>12)throw Error('Posto/ordem inválidos no pacote.');
 for(const attr of attrs){if(p.stop[attr]!=null&&(typeof p.stop[attr]!=='string'||p.stop[attr].length>2500))throw Error('Campo incompatível: '+attr)}
 if(!/3314 Market St/i.test(p.stop.address)||!/(Aston|Aston Township)/i.test(p.stop.address))throw Error('Endereço não confere.');
 if(typeof p.reason!=='string'||p.reason.length>1500||JSON.stringify(p).length>15000)throw Error('Conteúdo do pacote acima do limite.');
 return p;
}
function merge(base,patch){
 if(!patch)return base;
 validate(patch);
 if(!base||!Array.isArray(base.days))throw Error('Roteiro principal indisponível.');
 const target=base.days.find(d=>d.date===DATE);
 if(!target)throw Error('Dia 07/11 não encontrado no roteiro privado.');
 const next={...base,days:base.days.map(day=>{
  if(day.date!==DATE)return day;
  const field=Array.isArray(day.stops)&&day.stops.length>0?'stops':'places';
  const original=Array.isArray(day[field])?day[field]:[];
  const filtered=original.filter(x=>!/^Royal Farms\b/i.test(String(x?.title||'')));
  const after=filtered.findLastIndex(x=>/Walmart\s+Eddystone/i.test(String(x?.title||'')));
  if(after<0)throw Error('Walmart Eddystone não foi localizado; atualização não aplicada para preservar a ordem original.');
  const list=filtered.slice();list.splice(after+1,0,{...patch.stop});
  return {...day,[field]:list,revision:'1.60',revisionNote:patch.reason};
 })};
 return next;
}
window.NY26DayPatch={validate,merge,version:'1.60'};
})();