/* NY26 secure update transport, v1.0.
   GitHub hosts ONLY RSA/AES-encrypted update envelopes.
   Plaintext is decoded exclusively in an authorized browser and approved into private Firestore.
   This module never touches checklists, Feito, photos or PDF storage. */
(()=>{'use strict';
const FORMAT='ny26-private-patch-v1', ENVELOPE='ny26-encrypted-update-v1';
const DB='ny26-secure-update-keys-v1',STORE='user-keys';
const enc=new TextEncoder(),dec=new TextDecoder();
const idRx=/^[a-z0-9][a-z0-9-]{3,62}$/;
const fields=new Set(['title','time','address','backupAddress','status','why','look','instructions','food','bathroom','warning','source']);
function plain(s){return String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim()}
function valid(p){
 if(!p||p.schema!==FORMAT||!idRx.test(p.id||'')||!Array.isArray(p.changes)||!p.changes.length||p.changes.length>12)throw Error('Atualização incompatível.');
 if(typeof p.summary!=='string'||!p.summary.trim()||p.summary.length>240)throw Error('Resumo inválido.');
 if(JSON.stringify(p).length>30000)throw Error('Atualização muito grande.');
 for(const change of p.changes){
  if(!/^2026-11-(?:0[4-9]|1[0-8])$/.test(change.date||''))throw Error('Data fora da viagem.');
  if(change.type==='hide_stop'){
   // A retirada é visual: não apaga a etapa original, Feito ou anexos.
   // Autorização deliberadamente restrita à retirada de Wawa de 08/11.
   if(change.date!=='2026-11-08'||plain(change.match)!=='wawa')throw Error('Somente a parada Wawa de 08/11 pode ser ocultada nesta revisão.');
   continue;
  }
  if(change.type!=='upsert_stop')throw Error('Operação não autorizada nesta versão: '+change.type);
  if(!['after','before','after_washington'].includes(change.position))throw Error('Posicionamento inválido.');
  if(change.position==='after_washington'&&change.date!=='2026-11-08')throw Error('Saída de Washington só se aplica a 08/11.');
  if(change.position!=='after_washington'&&(typeof change.anchor!=='string'||!change.anchor.trim()||change.anchor.length>120))throw Error('Local de referência inválido.');
  if(change.fallbackAnchor!==undefined&&(typeof change.fallbackAnchor!=='string'||!change.fallbackAnchor.trim()||change.fallbackAnchor.length>120))throw Error('Referência alternativa inválida.');
  if(!change.stop||typeof change.stop.title!=='string'||!change.stop.title.trim()||change.stop.title.length>140)throw Error('Etapa inválida.');
  for(const [key,value] of Object.entries(change.stop)){
   if(!fields.has(key)||typeof value!=='string'||value.length>2000||
    (key==='backupAddress'&&value.length>250))throw Error('Campo não autorizado: '+key);
  }
 }
 return p;
}
function apply(base,patches){
 if(!base||!Array.isArray(base.days))throw Error('Planejamento não disponível.');
 if(!Array.isArray(patches)||patches.length>80)throw Error('Quantidade inválida.');
 let days=base.days.map(day=>({...day,stops:Array.isArray(day.stops)?day.stops.map(x=>({...x})):[],
  places:Array.isArray(day.places)?day.places.map(x=>({...x})):[]}));
 const applied=[];
 for(const patch of patches){
  valid(patch);
  const working=days.map(day=>({...day,stops:day.stops.map(x=>({...x})),places:day.places.map(x=>({...x}))}));
  for(const op of patch.changes){
   const day=working.find(d=>d.date===op.date);
   if(!day)throw Error('Dia '+op.date+' indisponível; nenhuma alteração aplicada.');
   if(op.type==='hide_stop'){
    const term=plain(op.match);
    day.hiddenStopTitles=[...new Set([...(day.hiddenStopTitles||[]),term])];
    for(const name of ['stops','places'])day[name]=day[name].filter(x=>!plain(x.title).includes(term));
    continue;
   }
   // A planilha de 10/11 pode ter paradas tanto em stops quanto em places;
   // procurar o local-âncora nas DUAS listas para não descartar lojas novas.
   let field=day.stops.length?'stops':'places',list=day[field];
   let anchorIndex=-1,matchedAnchor='',position=op.position;
   if(op.date==='2026-11-10'&&position!=='after_washington'){
    const candidates=[op.anchor,...(op.fallbackAnchor?[op.fallbackAnchor]:[])];
    for(const candidate of candidates){
     const normalized=plain(candidate);
     for(const key of ['stops','places']){
      const found=day[key].findIndex(x=>plain(x.title)===normalized||plain(x.title).includes(normalized));
      if(found>=0){field=key;list=day[key];anchorIndex=found;matchedAnchor=candidate;break}
     }
     if(anchorIndex>=0)break;
    }
   }else if(op.position==='after_washington'){
    const de=/\b(christiana|delaware|newark|wawa|quality inn|target|dollar tree|lojas de christiana)\b/i;
    const dc=/\b(capitol|white house|lincoln memorial|air and space|washington monument|world war|national mall|museu do ar)\b/i;
    const deIdx=list.findIndex(x=>de.test(plain(x.title)));
    if(deIdx>=0){anchorIndex=deIdx;matchedAnchor=list[deIdx].title;position='before'}
    else{
     for(let i=0;i<list.length;i++)if(dc.test(plain(list[i].title)))anchorIndex=i;
     if(anchorIndex>=0){matchedAnchor=list[anchorIndex].title;position='after'}
    }
   }else{
    const candidates=[op.anchor,...(op.fallbackAnchor?[op.fallbackAnchor]:[])];
    for(const candidate of candidates){
     const normalized=plain(candidate);
     const i=list.findIndex(x=>plain(x.title)===normalized||plain(x.title).includes(normalized));
     if(i>=0){anchorIndex=i;matchedAnchor=candidate;break}
    }
   }
   if(anchorIndex<0)throw Error('Transição de rota não encontrada em '+op.date+'; atualização não aplicada.');
   const next={...op.stop,privateUpdateId:patch.id,privateAnchor:matchedAnchor,privatePlacement:position};
   const current=list.findIndex(x=>plain(x.title)===plain(next.title));
   if(current>=0)list[current]={...list[current],...next};
   else list.splice(anchorIndex+(position==='after'?1:0),0,next);
  }
  days=working;applied.push(patch.id);
 }
 return {...base,days,appliedPrivateUpdates:applied};
}
function bytesToB64(buf){
 const arr=new Uint8Array(buf);let out='';
 for(let i=0;i<arr.length;i+=0x8000)out+=String.fromCharCode(...arr.subarray(i,i+0x8000));
 return btoa(out);
}
function b64ToBytes(str){
 if(typeof str!=='string'||str.length>80000||!/^[A-Za-z0-9+/]*={0,2}$/.test(str))throw Error('Envelope inválido.');
 const raw=atob(str);const a=new Uint8Array(raw.length);for(let i=0;i<raw.length;i++)a[i]=raw.charCodeAt(i);return a;
}
function openKeys(){
 return new Promise((resolve,reject)=>{
  if(typeof indexedDB==='undefined') return reject(Error('Armazenamento seguro indisponível.'));
  const request=indexedDB.open(DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(STORE))request.result.createObjectStore(STORE)};
  request.onerror=()=>reject(request.error||Error('Não foi possível abrir chaves.'));
  request.onsuccess=()=>resolve(request.result);
 });
}
async function readKey(uid){
 if(!uid)return null;
 const db=await openKeys();
 try{return await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).get(uid);
  req.onsuccess=()=>resolve(req.result||null);req.onerror=()=>reject(req.error);
 })}finally{db.close()}
}
async function createKey(uid){
 if(!uid)throw Error('É preciso estar autenticado.');
 const existing=await readKey(uid);if(existing)return existing;
 if(!globalThis.crypto?.subtle)throw Error('Este navegador não suporta criptografia segura.');
 const pair=await crypto.subtle.generateKey({name:'RSA-OAEP',modulusLength:3072,publicExponent:new Uint8Array([1,0,1]),hash:'SHA-256'},false,['encrypt','decrypt']);
 const jwk=await crypto.subtle.exportKey('jwk',pair.publicKey);
 const digest=await crypto.subtle.digest('SHA-256',enc.encode(jwk.n));
 const fingerprint=[...new Uint8Array(digest)].slice(0,12).map(n=>n.toString(16).padStart(2,'0')).join('');
 const record={uid,keyId:fingerprint,publicJwk:{kty:'RSA',n:jwk.n,e:jwk.e,alg:'RSA-OAEP-256',ext:true},
  publicKey:pair.publicKey,privateKey:pair.privateKey,createdAt:new Date().toISOString()};
 const db=await openKeys();
 try{await new Promise((resolve,reject)=>{
  const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(record,uid);
  tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);
 })}finally{db.close()}
 return record;
}
function registration(record){
 return JSON.stringify({schema:'ny26-public-encryption-key-v1',keyId:record.keyId,jwk:record.publicJwk});
}
function manifestValid(manifest){
 if(manifest?.schema!=='ny26-encrypted-update-index-v1'||!Array.isArray(manifest.entries)||manifest.entries.length>100)throw Error('Índice de atualizações inválido.');
 for(const e of manifest.entries){
  if(!idRx.test(e.id||'')||!idRx.test(e.keyId||'')||typeof e.file!=='string'||
   !/^secure-updates\/packets\/[a-z0-9-]{4,63}\.json$/.test(e.file))throw Error('Entrada inválida no índice.');
 }
 return manifest;
}
async function readInbox(){
 const res=await fetch('./secure-updates/manifest.json',{cache:'no-store'});
 if(!res.ok)throw Error('Não foi possível consultar atualizações (HTTP '+res.status+').');
 return manifestValid(await res.json());
}
async function decrypt(record,entry){
 if(!record||entry.keyId!==record.keyId)throw Error('Atualização criptografada para outra chave; solicite republicação.');
 const res=await fetch('./'+entry.file,{cache:'no-store'});
 if(!res.ok)throw Error('Atualização não encontrada (HTTP '+res.status+').');
 const raw=await res.text();
 if(raw.length>90000)throw Error('Envelope acima do limite.');
 const env=JSON.parse(raw);
 if(env.schema!==ENVELOPE||env.id!==entry.id||env.keyId!==record.keyId)throw Error('Envelope não corresponde ao índice.');
 const iv=b64ToBytes(env.iv),key=b64ToBytes(env.wrappedKey),data=b64ToBytes(env.ciphertext);
 if(iv.length!==12||key.length!==384||data.length<17)throw Error('Tamanho inválido do envelope.');
 const aesRaw=await crypto.subtle.decrypt({name:'RSA-OAEP'},record.privateKey,key);
 const aes=await crypto.subtle.importKey('raw',aesRaw,{name:'AES-GCM'},false,['decrypt']);
 const plainBytes=await crypto.subtle.decrypt({name:'AES-GCM',iv,additionalData:enc.encode(env.id)},aes,data);
 const patch=valid(JSON.parse(dec.decode(plainBytes)));
 if(patch.id!==env.id)throw Error('Identificador do conteúdo não confere.');
 return patch;
}
window.NY26SecureUpdates={valid,apply,createKey,readKey,registration,readInbox,decrypt,
 manifestValid,version:'1.0'};
})();