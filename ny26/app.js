/* NY26: módulo público do aplicativo. Roteiro e documentos NÃO são publicados neste repositório. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const TRIP='ny26',K={actions:'ny26_checklist_v5',packing:'ny26_packing_v6',route:'ny26_v9_route_cache'};
let auth,db,user=null,role='',cStop=null,sStop=null,frameReady=false,routeVer='',pending=false,fromCache=true,lastServer=0,registration=null;
let lastMaps={actions:{},packing:{}},device=localStorage.getItem('ny26_client_device');
if(!device){device='d'+Date.now().toString(36)+Math.random().toString(36).slice(2);localStorage.setItem('ny26_client_device',device)}
const $msg=(id,v)=>$(id).textContent=v||'';
function banner(s,type='wait'){$('status').textContent=s;$('status').className='status '+type;$msg('app-message',s)}
function show(id){for(const part of ['setup','waiting','settings'])$(part).classList.toggle('hide',part!==id);document.body.classList.remove('running')}
function error(e){const msg=String(e?.message||e);$msg('message',msg);$msg('settings-msg',msg);banner('⚠ Atenção','bad')}
// Normalização retrocompatível dos nomes, inclusive nos dados já salvos no celular.
function renameChildren(value){
 if(typeof value==='string')return value.replace(/Menina 1/g,'Lia').replace(/Menina 2/g,'Lais');
 if(Array.isArray(value))return value.map(renameChildren);
 if(value&&typeof value==='object'){
  const next={};
  for(const [key,item] of Object.entries(value))next[key]=renameChildren(item);
  return next;
 }
 return value;
}
function read(domain){
 try{
  const raw=JSON.parse(localStorage.getItem(K[domain])||'null');
  if(!raw)return null;
  const o=renameChildren(raw);
  if(JSON.stringify(o)!==JSON.stringify(raw))localStorage.setItem(K[domain],JSON.stringify(o));
  return Array.isArray(o[domain==='actions'?'tasks':'items'])?o:null;
 }catch{return null}
}
function toMap(o,d){return Object.fromEntries((o?.[d==='actions'?'tasks':'items']||[]).filter(x=>x&&typeof x.id==='string').map(x=>[x.id,x]))}
function save(domain,map){const key=domain==='actions'?'tasks':'items';localStorage.setItem(K[domain],JSON.stringify({[key]:Object.values(map),updated:Date.now()}))}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function cachedRoute(){try{return JSON.parse(localStorage.getItem(K.route)||'null')}catch{return null}}
function refresh(){let s,t='wait';if(!navigator.onLine)s='📵 Offline';else if(pending)s='⏳ Enviando';else if(fromCache)s='🟡 Cache local';else if(lastServer){s='✅ Sincronizado';t='good'}else s='☁️ Conectando';banner(s,t);
 $msg('sync-explanation',(lastServer?'Último retorno confirmado do servidor: '+new Date(lastServer).toLocaleString('pt-BR')+'. ':'Ainda sem confirmação do servidor. ')+(pending?'Há alterações aguardando envio. ':'')+'Alterações entre celulares exigem internet.');
}

function boardingPassCardsHtml(){
 const people=[['gustavo','Gustavo'],['renata','Renata'],['lia','Lia'],['lais','Laís']];
 const legs=[['ida-1','Ida · 1º voo'],['ida-2','Ida · 2º voo'],['volta-1','Volta · 1º voo'],['volta-2','Volta · 2º voo']];
 const groups=legs.map(([code,label],index)=>{
  const cards=people.map(([person,name])=>{
   const slot='bp-'+code+'-'+person;
   return '<section class="category ny26-bp-card" id="doc-'+slot+'" data-category="'+slot+'">'+
    '<div class="category-head"><div><h3>🎫 '+name+'</h3><p>Cartão individual · '+label+'</p></div>'+
    '<span class="doc-badge" data-badge="'+slot+'">Sem arquivo</span></div>'+
    '<div class="proof-items" data-proof-items="'+slot+'"><p class="no-doc">Aguardando check-in.</p></div>'+
    '<label class="filebutton requires-js" for="upload-'+slot+'">＋ Anexar PDF ou imagem</label>'+
    '<input type="file" class="fileinput requires-js" id="upload-'+slot+'" data-upload="'+slot+
    '" accept=".pdf,.png,.jpg,.jpeg,.webp,application/pdf,image/png,image/jpeg,image/webp" multiple></section>';
  }).join('');
  return '<details class="ny26-bp-leg"'+(index===0?' open':'')+'><summary>'+label+
   ' · 4 passageiros</summary><div class="ny26-bp-grid">'+cards+'</div></details>';
 }).join('');
 return '<div id="ny26-boarding-passes"><h2>🛫 Cartões de embarque</h2>'+
  '<p class="ny26-bp-intro">Anexe o cartão de cada pessoa para cada trecho. Os cartões só são emitidos no check-in. '+
  'PDFs e imagens são aceitos; guarde os QR codes também fora do aplicativo por segurança.</p>'+
  groups+'</div>';
}
const boardingPassCss=
 '#ny26-boarding-passes{padding:12px 0 20px;border-bottom:2px solid #dceaf2;margin:12px 0 18px}'+
 '#ny26-boarding-passes h2{font-size:20px}'+
 '.ny26-bp-intro{font-size:13px;color:#4d677f;line-height:1.5}'+
 '.ny26-bp-leg{border:1px solid #d5e4ed;border-radius:12px;background:#f6fbff;margin:10px 0;overflow:hidden}'+
 '.ny26-bp-leg>summary{font-size:14px;font-weight:800;padding:13px;color:#16567c;cursor:pointer}'+
 '.ny26-bp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;padding:10px}'+
 '.ny26-bp-card{margin:0!important;min-width:0;padding:12px!important}'+
 '.ny26-bp-card h3{font-size:15px!important}'+
 '@media(max-width:580px){.ny26-bp-grid{grid-template-columns:1fr}}';

function sanitizeRouteHtml(source){
 // Documents loaded with iframe.srcdoc inherit the *parent URL as base*.
 // Without an explicit base, links such as #mala can navigate the iframe to
 // /ny26/#mala, recursively loading this application inside itself.
 let h=renameChildren(String(source||''));
 h=h.replace(/<script>\s*\/\*\s*NY26 v7[^\n]*\n[\s\S]*?<\/script>/gi,'');
 // Atualiza orientacoes legadas de exportacao manual que nao se aplicam a PWA.
 h=h.replace(/Sem comprovante incorporado\. Abra o guia no computador, adicione o arquivo nesta categoria e exporte uma nova cópia\./g,'Nenhum comprovante anexado nesta categoria. Use o botão de adicionar.');
 h=h.replace(/Ainda não há comprovante incorporado\. No computador, use o botão abaixo, depois exporte o guia atualizado\./g,'Nenhum comprovante anexado. Use Adicionar PDF ou imagem.');
 // Expose the v1.40 document model to its authenticated host, without putting
 // personal files into the public code or Firestore's itinerary collection.
 // Textos legados pediam exportar HTML; a PWA agora grava os anexos no aparelho.
 h=h.replace(/Clique em "Salvar HTML atualizado" e transfira o novo arquivo para os celulares\./g,'O comprovante será salvo neste aparelho.');
 // Adicionar antes da inicializacao da lista do roteiro privado.
 if(!h.includes('id="ny26-boarding-passes"')&&/id=["']doc-voos["']/i.test(h)){
  h=h.replace(/<section\b[^>]*\bid=["']doc-voos["'][^>]*>/i,boardingPassCardsHtml()+'$&');
  h=h.replace(/<\/head>/i,'<style id="ny26-boarding-css">'+boardingPassCss+'</style></head>');
 }
 const marker="try{\n document.body.classList.add('js-ready');readStatic();refreshAll();loadDone();";
 if(h.includes(marker)&&!h.includes('window.NY26Documents=')){
  const api="window.NY26Documents={snapshot:function(){return docs;},restore:function(saved){Object.keys(docs).forEach(function(slot){if(Array.isArray(saved[slot]))docs[slot]=saved[slot];});refreshAll();}};\n";
  h=h.replace(marker,api+marker);
 }
 h=h.replace(/<head([^>]*)>/i,'<head$1><base href="about:srcdoc">');
 return h;
}


// Attachments are private to the authenticated user's browser. This IndexedDB
// record is independent from the remotely replaced itinerary HTML.
const DOCS_DB='ny26-private-attachments-v1',DOCS_STORE='snapshots';
function openDocsDB(){
 return new Promise((resolve,reject)=>{
  if(!window.indexedDB){reject(Error('IndexedDB indisponível'));return}
  const request=indexedDB.open(DOCS_DB,1);
  request.onupgradeneeded=()=>{if(!request.result.objectStoreNames.contains(DOCS_STORE))request.result.createObjectStore(DOCS_STORE)};
  request.onsuccess=()=>resolve(request.result);
  request.onerror=()=>reject(request.error||Error('Falha no armazenamento privado'));
 });
}
function docsTransaction(db,mode,key,value){
 return new Promise((resolve,reject)=>{
  const tx=db.transaction(DOCS_STORE,mode),store=tx.objectStore(DOCS_STORE);
  const request=mode==='readonly'?store.get(key):store.put(value,key);
  request.onsuccess=()=>{if(mode==='readonly')resolve(request.result)};
  request.onerror=()=>reject(request.error||Error('Falha na gravação de documentos'));
  // Confirmar apenas apos o commit da transacao, nao ao concluir o put.
  tx.oncomplete=()=>{if(mode==='readwrite')resolve(true)};
  tx.onerror=()=>reject(tx.error||Error('Falha na transação'));
  tx.onabort=()=>reject(tx.error||Error('Gravação interrompida'));
 });
}
function safeDocs(sets){
 const out={};
 if(!sets||typeof sets!=='object'||Array.isArray(sets))return out;
 for(const [slot,items] of Object.entries(sets)){
  if(!/^[a-z0-9_-]{1,90}$/i.test(slot)||!Array.isArray(items))continue;
  out[slot]=items.filter(it=>it&&typeof it==='object'&&typeof it.name==='string'&&typeof it.data==='string'
   &&/^(data:application\/pdf;base64,|data:image\/(?:png|jpeg|webp);base64,)/i.test(it.data)
   &&it.data.length<=12*1024*1024).slice(0,30)
   .map(it=>({name:it.name.slice(0,200),type:String(it.type||'application/pdf').slice(0,60),
    size:Number(it.size)||0,data:it.data}));
 }
 return out;
}
async function installPdfAttachments(doc){
 const section=doc.getElementById('documentos'),api=doc.defaultView?.NY26Documents;
 if(!section||!api||typeof api.snapshot!=='function'||typeof api.restore!=='function')return;
 const docWindow=doc.defaultView,key=TRIP+':'+user.uid;
 const bannerArea=doc.createElement('div');
 bannerArea.id='ny26-docs-persistence';
 bannerArea.style.cssText='margin:12px 0;padding:12px;border:1px solid #b7d4e4;border-radius:10px;background:#eaf5fa;font:12px/1.5 system-ui,sans-serif;color:#20465d';
 const msg=doc.createElement('p');msg.style.margin='0 0 8px';
 msg.textContent='📎 Comprovantes privados: carregando armazenamento do aparelho…';
 const buttons=doc.createElement('div');buttons.style.cssText='display:flex;gap:10px;flex-wrap:wrap;align-items:center';
 const backup=doc.createElement('button');backup.type='button';backup.textContent='Salvar backup dos comprovantes';backup.style.cssText='padding:9px;border:1px solid #9cbfd3;border-radius:9px;background:#fff;color:#20526b;cursor:pointer';
 const restore=doc.createElement('button');restore.type='button';restore.textContent='Restaurar backup (JSON ou HTML)';restore.style.cssText=backup.style.cssText;
 const input=doc.createElement('input');input.type='file';input.accept='.json,.html,text/html,application/json';input.hidden=true;
 buttons.append(backup,restore,input);bannerArea.append(msg,buttons);
 const intro=section.querySelector('.intro');
 if(intro)intro.insertAdjacentElement('afterend',bannerArea);else section.prepend(bannerArea);
 const style=doc.createElement('style');style.id='ny26-pdf-direct-style';
 style.textContent='#documentos .document .docactions{display:flex;flex-wrap:wrap;gap:12px;margin:12px 0}'+
 '#documentos a.doc-download{display:inline-flex;align-items:center;justify-content:center;min-height:46px;border-radius:10px;padding:10px 16px;background:#126c96;color:#fff!important;text-decoration:none;font-weight:800;font-size:14px;touch-action:manipulation}'+
 '#documentos .document .doc-remove{display:block!important;min-height:46px;margin:22px 0 4px auto;padding:11px 16px;background:#fff2f1;border:1px solid #e7a9a5;border-radius:10px;color:#933333;font-weight:750;font-size:13px;touch-action:manipulation}';
 doc.head.appendChild(style);
 const pdfUrls=new Map();
 function blobUrlFromData(data){
  if(pdfUrls.has(data))return pdfUrls.get(data);
  const comma=data.indexOf(',');
  if(comma<0)throw Error('PDF sem dados');
  const encoded=data.slice(comma+1),bin=docWindow.atob(encoded);
  const bytes=new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++)bytes[i]=bin.charCodeAt(i);
  const url=docWindow.URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
  pdfUrls.set(data,url);return url;
 }
 function applyLinks(){
  const state=api.snapshot();
  section.querySelectorAll('.category[data-category]').forEach(cat=>{
   const slot=cat.getAttribute('data-category'),files=state[slot]||[];
   cat.querySelectorAll('.document[data-proof-file]').forEach((item,i)=>{
    const link=item.querySelector('a.doc-download'),file=files[i];
    if(link&&file&&/^data:application\/pdf;base64,/i.test(file.data)){
     // Nao decodificar o PDF ao desenhar a lista. PDFs grandes provocavam
     // consumo de memoria e travamentos no Android antes de abrir o arquivo.
     if(!link.hasAttribute('data-ny26-direct')){
      link.setAttribute('href','#documentos');
      link.setAttribute('data-ny26-direct','1');
     }
     if(link.getAttribute('target')!=='_blank')link.setAttribute('target','_blank');
     link.setAttribute('rel','noopener noreferrer');
     link.removeAttribute('download');
     if(link.textContent!=='↗ Abrir PDF')link.textContent='↗ Abrir PDF';
    }
    const del=item.querySelector('button.doc-remove');
    if(del){
     // Atribuir textContent somente quando muda: alterações repetidas
     // causavam loop do MutationObserver e congelavam o celular.
     if(del.textContent!=='🗑️ Remover comprovante')del.textContent='🗑️ Remover comprovante';
     del.setAttribute('aria-label','Remover comprovante após confirmação');
    }
   });
  });
 }
 // O Blob somente e criado no clique, dentro da acao do usuario.
 // A navegacao para o leitor nativo continua sendo a acao padrao do link.
 doc.addEventListener('click',ev=>{
  const link=ev.target?.closest?.('a.doc-download');
  if(!link||!section.contains(link))return;
  const item=link.closest('.document[data-proof-file]');
  const cat=item?.closest('.category[data-category]');
  if(!item||!cat)return;
  const nodes=Array.from(cat.querySelectorAll('.document[data-proof-file]'));
  const file=api.snapshot()[cat.getAttribute('data-category')]?.[nodes.indexOf(item)];
  if(!file||!/^data:application\/pdf;base64,/i.test(file.data)){
   ev.preventDefault();
   msg.textContent='⚠️ O arquivo não está disponível. Restaure o backup ou anexe o PDF novamente.';
   return;
  }
  try{
   link.href=blobUrlFromData(file.data);
  }catch(e){
   ev.preventDefault();
   msg.textContent='⚠️ Não foi possível abrir este PDF. O original continua preservado.';
   console.warn('NY26 abrir PDF',e);
  }
 },true);
 let db,ready=false,writeQueue=Promise.resolve(),saveTimer=0,orphanDocs={};
 function persist(){
  if(!ready||!db)return;
  const snapshot={...orphanDocs,...safeDocs(api.snapshot())};
  writeQueue=writeQueue.catch(()=>{}).then(()=>docsTransaction(db,'readwrite',key,{version:1,docs:snapshot,updatedAt:Date.now()}))
   .then(()=>{msg.textContent='✅ Comprovantes guardados neste aparelho. Permanecem após atualizar o roteiro. Não são sincronizados com outros aparelhos.'})
   .catch(e=>{msg.textContent='⚠️ Não foi possível salvar os comprovantes neste aparelho. Faça um backup antes de fechar o NY26.';console.warn('NY26 documents',e)});
 }
 function schedulePersist(){
  if(!ready)return;
  docWindow.clearTimeout(saveTimer);
  saveTimer=docWindow.setTimeout(()=>{applyLinks();persist()},120);
 }
 function countDocs(sets){return Object.values(sets).reduce((n,items)=>n+items.length,0)}
 backup.addEventListener('click',()=>{
  const docs={...orphanDocs,...safeDocs(api.snapshot())};
  const archive=JSON.stringify({format:'NY26-DOCS-BACKUP-1',exportedAt:new Date().toISOString(),docs});
  const url=docWindow.URL.createObjectURL(new Blob([archive],{type:'application/json'}));
  const a=doc.createElement('a');a.href=url;a.download='NY26-Comprovantes-Backup.json';doc.body.appendChild(a);a.click();a.remove();
  docWindow.setTimeout(()=>docWindow.URL.revokeObjectURL(url),60000);
 });
 restore.addEventListener('click',()=>input.click());
 input.addEventListener('change',async()=>{
  const file=input.files?.[0];input.value='';
  if(!file)return;
  if(file.size>45*1024*1024){msg.textContent='Backup maior que o limite de 45 MB.';return}
  try{
   const text=await file.text();
   let raw;
   if(/\.html?$/i.test(file.name)){
    // Recupera comprovantes incorporados em versões antigas exportadas.
    // DOMParser não executa os scripts do HTML importado.
    const parsed=new docWindow.DOMParser().parseFromString(text,'text/html');
    raw={};
    parsed.querySelectorAll('.category[data-category]').forEach(cat=>{
     const slot=cat.getAttribute('data-category'),items=[];
     cat.querySelectorAll('.document[data-proof-file]').forEach(node=>{
      const original=node.querySelector('img[src^="data:"],a.doc-download[href^="data:"]');
      if(original)items.push({
       name:node.getAttribute('data-name')||'Comprovante',
       type:node.getAttribute('data-type')||'application/pdf',
       size:Number(node.getAttribute('data-size'))||0,
       data:original.tagName.toLowerCase()==='img'?original.getAttribute('src'):original.getAttribute('href')
      });
     });
     raw[slot]=items;
    });
   }else{
    const json=JSON.parse(text);
    if(json.format!=='NY26-DOCS-BACKUP-1')throw Error('Formato inválido');
    raw=json.docs;
   }
   const incoming=safeDocs(raw);
   if(!countDocs(incoming))throw Error('Backup sem anexos compatíveis');
   if(!docWindow.confirm('Restaurar '+countDocs(incoming)+' comprovantes deste backup? Os anexos atuais também serão preservados.'))return;
   const current=safeDocs(api.snapshot());
   for(const [slot,items] of Object.entries(incoming)){
    const previous=current[slot]||[];
    for(const item of items){
     if(!previous.some(x=>x.data===item.data&&x.name===item.name))previous.push(item);
    }
    current[slot]=previous;
   }
   // Categorias que nao existem mais na versao atual ficam guardadas.
   const known=new Set(Object.keys(api.snapshot()));
   for(const [slot,items] of Object.entries(current))if(!known.has(slot))orphanDocs[slot]=items;
   api.restore(current);applyLinks();persist();
   msg.textContent='✅ Backup restaurado e aguardando gravação local.';
  }catch(e){msg.textContent='Falha ao restaurar o backup: '+e.message}
 });
 // The native HTML exporter clones the DOM. Reinstate the original base64
 // references temporarily so the exported file is self-contained.
 const saveButton=doc.getElementById('save');
 saveButton?.addEventListener('click',()=>{
  const sets=api.snapshot();
  section.querySelectorAll('.category').forEach(cat=>{
   const slot=cat.getAttribute('data-category');
   cat.querySelectorAll('.document[data-proof-file]').forEach((item,i)=>{
    const a=item.querySelector('a.doc-download'),entry=sets[slot]?.[i];
    if(a&&entry){a.href=entry.data;a.setAttribute('download',entry.name||'comprovante.pdf')}
   });
  });
  docWindow.setTimeout(applyLinks,0);
 },true);
 // Ativar abertura nativa imediatamente, mesmo antes do IndexedDB carregar.
 applyLinks();
 // A escolha de arquivo pode ocorrer enquanto o IndexedDB abre. Salvar a
 // fotografia inicial evita perder uploads feitos durante a inicializacao.
 const docsAtStart=safeDocs(api.snapshot());
 let uploadedDuringOpen=false;
 try{
  db=await openDocsDB();
  if($('viewer').contentDocument!==doc)return;
  const record=await docsTransaction(db,'readonly',key);
  if($('viewer').contentDocument!==doc)return;
  if(record?.docs){
   const stored=safeDocs(record.docs),current=safeDocs(api.snapshot());
   // Estado persistido e autoritativo, mas sem sobrescrever PDFs selecionados
   // enquanto o banco inicializava: mesclar os anexos que surgiram nesse intervalo.
   for(const [slot,items] of Object.entries(current)){
    if(!Object.hasOwn(stored,slot))stored[slot]=items;
    const initial=docsAtStart[slot]||[];
    for(const item of items){
     if(!initial.some(x=>x.data===item.data&&x.name===item.name)
       &&!stored[slot].some(x=>x.data===item.data&&x.name===item.name)){
      stored[slot].push(item);uploadedDuringOpen=true;
     }
    }
   }
   for(const [slot,items] of Object.entries(stored))if(!Object.hasOwn(current,slot))orphanDocs[slot]=items;
   api.restore(stored);
  }else{
   await docsTransaction(db,'readwrite',key,{version:1,docs:safeDocs(api.snapshot()),updatedAt:Date.now()});
  }
  applyLinks();ready=true;
  if(uploadedDuringOpen)persist();
  const count=countDocs(api.snapshot());
  msg.textContent='✅ '+count+' comprovante(s) preservado(s) no armazenamento privado deste aparelho, mesmo após novas versões. Para outro celular, use Backup/Restaurar.';
  const observer=new docWindow.MutationObserver(records=>{
   // Apenas insercao/remocao REAL de comprovantes. Ignora alteracoes
   // nos rotulos e botoes para impedir recursao infinita no Android.
   if(records.some(r=>r.type==='childList'&&r.target?.classList?.contains('proof-items'))){
    applyLinks();schedulePersist();
   }
  });
  observer.observe(section,{childList:true,subtree:true});
  docWindow.addEventListener('pagehide',()=>{
   docWindow.clearTimeout(saveTimer);
   // Iniciar uma ultima gravacao ao trocar de aba/atualizar; nao fechar
   // o banco nem revogar o Blob pois o leitor iOS ainda pode consumir o PDF.
   persist();
  });
 }catch(e){
  msg.textContent='⚠️ Armazenamento persistente indisponível neste aparelho. Exporte um backup antes de atualizar o NY26.';
  console.warn('NY26 document storage',e);
  applyLinks();
 }
}

function openFrame(html){
 for(const domain of ['actions','packing'])read(domain);
 const frame=$('viewer'),safe=sanitizeRouteHtml(html);
 let repairs=0;
 frameReady=false;
 frame.onload=()=>{
  let doc;
  try{doc=frame.contentDocument}catch(e){doc=null}
  if(!doc?.getElementById('mala')||!doc?.getElementById('checklist')){
   // Defensive recovery: if a browser follows a fragment to the parent
   // NY26 URL, restore the actual private document instead of nesting apps.
   if(++repairs<=1){frame.srcdoc=safe;return}
   frameReady=false;error('Falha ao abrir o roteiro. Volte a Roteiro e recarregue a página.');
   return;
  }
  frameReady=true;
  installPdfAttachments(doc).catch(e=>console.warn('Comprovantes:',e));
  // A area Fotos do local aceita imagens; comprovantes PDF ficam em Docs.
  // Sao incorporados ao HTML local, nao sincronizados automaticamente entre contas.
  const docsSection=doc.getElementById('documentos');
  if(docsSection&&!doc.getElementById('ny26-pdf-info')){
    const help=doc.createElement('p');
    help.id='ny26-pdf-info';
    help.style.cssText='background:#fff3d7;border:1px solid #e8cb89;border-radius:9px;padding:12px;font:13px/1.45 system-ui,sans-serif;color:#5d451f;margin:12px 0';
    help.textContent='📎 PDF: toque em “Adicionar PDF ou imagem” e depois em “Abrir PDF” para usar o leitor do celular. Os comprovantes ficam salvos neste aparelho, independentemente das atualizações do roteiro. Eles ainda não são sincronizados automaticamente com outro celular. Use Salvar backup/Restaurar backup e conserve os originais no aplicativo Arquivos.';
    const header=docsSection.querySelector('.intro');
    if(header)header.insertAdjacentElement('afterend',help);
    else docsSection.prepend(help);
  }
  for(const d of ['actions','packing'])lastMaps[d]=toMap(read(d),d);
  try{
   // Capture all internal links before srcdoc resolves them against the
   // parent page. Keep hashchange/:target semantics for modals and day tabs.
   doc.addEventListener('click',ev=>{
    const link=ev.target?.closest?.('a[href^="#"]');
    if(!link)return;
    const hash=link.getAttribute('href');
    if(!hash||hash==='#')return;
    let id;try{id=decodeURIComponent(hash.slice(1))}catch{return}
    if(!doc.getElementById(id))return;
    ev.preventDefault();
    const inner=frame.contentWindow;
    if(inner.location.hash!==hash)inner.location.hash=hash;
    else inner.dispatchEvent(new inner.Event('hashchange'));
   },true);
   doc.querySelectorAll('a[href="#sincronizacao"],a[data-view="sincronizacao"]').forEach(el=>el.remove());
   doc.getElementById('sincronizacao')?.remove();
   doc.addEventListener('ny26:data-change',e=>localChanged(e.detail?.domain));
   if(role==='viewer'){
    const style=doc.createElement('style');
    style.textContent='#ck-add,#pk-add,#ck-editor,#pk-editor,[data-ck-edit],[data-ck-remove],[data-pk-edit],[data-pk-delete],[data-pk-stage]{pointer-events:none!important;opacity:.5}';
    doc.head.appendChild(style);
   }
  }catch(e){console.warn('Inicialização da ficha:',e)}
  try{window.NY26RouteAdvice?.decorate(doc)}catch(e){console.warn('Guia de orientacoes:',e)}
  if(window.ny26Snapshot)applySnapshot(window.ny26Snapshot);
 };
 frame.srcdoc=safe;
 document.body.classList.add('running');
 refresh();
}
function applyRoute(html,version,local){if(typeof html!=='string'||html.length<10000)return;fromCache=local;if(routeVer===version&&frameReady){refresh();return}routeVer=version;
 try{localStorage.setItem(K.route,JSON.stringify({html,version,updated:Date.now()}))}catch(e){console.warn('Cache do roteiro cheio:',e)}
 openFrame(html);
}
function decodeContent(snapshot){const docs=snapshot.docs.map(d=>({id:d.id,...d.data()}));const m=docs.find(d=>d.id==='manifest');
 if(!m||!m.version||!Number.isInteger(m.count)||m.count<1||m.count>90)return null;
 const chunks=docs.filter(x=>x.id.startsWith('chunk_')&&x.version===m.version).sort((a,b)=>a.index-b.index);
 if(chunks.length!==m.count||chunks.some((x,i)=>x.index!==i))return null;
 return {version:m.version,html:chunks.map(x=>x.text||'').join('')};
}
function subscribeContent(){cStop?.();cStop=db.collection('trips').doc(TRIP).collection('content').onSnapshot({includeMetadataChanges:true},snap=>{
 const d=decodeContent(snap);if(d)applyRoute(d.html,d.version,snap.metadata.fromCache);
 else if(!routeVer)$msg('loading-text','A conta está ativa, mas o roteiro ainda não foi importado na área privada.');
},e=>{error('Roteiro indisponível: '+e.message);const c=cachedRoute();if(c)applyRoute(c.html,c.version,true)});
 const c=cachedRoute();if(c&&!routeVer)applyRoute(c.html,c.version,true);
}
function applySnapshot(snap){window.ny26Snapshot=snap;pending=snap.metadata.hasPendingWrites;fromCache=snap.metadata.fromCache;if(!pending&&!fromCache)lastServer=Date.now();
 if(!frameReady){refresh();return}
 const remote={actions:{},packing:{}};
 for(const d of snap.docs){const v=d.data();if(remote[v.domain]&&v.value&&typeof v.value.id==='string')remote[v.domain][v.value.id]={...v,value:renameChildren(v.value)}}
 for(const domain of ['actions','packing']){
  const map=toMap(read(domain),domain);let changed=false;
  for(const [id,rec] of Object.entries(remote[domain])){
   if(rec.deleted){if(map[id]){delete map[id];changed=true}}
   else if(!same(map[id],rec.value)){map[id]=rec.value;changed=true}
  }
  if(changed){try{save(domain,map);const frame=$('viewer').contentWindow;
   (domain==='actions'?frame.NY26Checklist:frame.NY26Packing)?.reloadFromStorage?.();
  }catch(e){console.warn('Não foi possível aplicar a lista remota:',e)}}
  lastMaps[domain]=toMap(read(domain),domain);
 }
 refresh();
}
function subscribeState(){sStop?.();sStop=db.collection('trips').doc(TRIP).collection('state').onSnapshot({includeMetadataChanges:true},applySnapshot,e=>error('Erro ao sincronizar tarefas: '+e.message))}
function saveItem(domain,id,value,deleted){if(!db||!user)return;
 const doc=(domain==='actions'?'a_':'p_')+encodeURIComponent(id);
 db.collection('trips').doc(TRIP).collection('state').doc(doc).set({domain,value:renameChildren(value),deleted,device,updatedAt:firebase.firestore.FieldValue.serverTimestamp()})
 .catch(e=>error('Alteração ainda não sincronizada: '+e.message+'. Gere um backup antes de fechar o app.'));
}
function localChanged(domain){if(!['actions','packing'].includes(domain)||role==='viewer')return;
 const now=toMap(read(domain),domain),before=lastMaps[domain]||{};
 for(const [id,value] of Object.entries(now))if(!same(value,before[id]))saveItem(domain,id,value,false);
 for(const id of Object.keys(before))if(!now[id])saveItem(domain,id,{id},true);
 lastMaps[domain]=now;pending=true;refresh();
}
function offerFirstImport(){
 if(role!=='admin')return;
 const parent=$('waiting');
 if($('quick-route-import'))return;
 const box=document.createElement('div');box.id='quick-route-import';
 box.style.cssText='margin-top:16px;padding:14px;border:1px solid #c3dbe7;border-radius:12px;background:#eaf4fa';
 const heading=document.createElement('strong');heading.textContent='Falta importar o roteiro privado (uma vez)';
 const description=document.createElement('p');description.className='muted';description.textContent='Selecione o arquivo NY_2026_Roteiro_V8_Offline.html. A importação ficará protegida no Firestore; não será publicada no GitHub.';
 const b=document.createElement('button');b.className='primary';b.textContent='📂 Selecionar roteiro V8 e importar';b.onclick=()=>{
   show('settings');$('admin-import').classList.remove('hide');$('admin-import').open=true;
   $('route-import').click();
 };
 box.append(heading,description,b);parent.appendChild(box);
}
function clear(){cStop?.();sStop?.();cStop=sStop=null;frameReady=false;routeVer='';window.ny26Snapshot=null}
async function logged(u){user=u;show('waiting');banner('🔒 Validando');$msg('loading-text','Verificando permissão de acesso…');
 try{const p=db.collection('trips').doc(TRIP).collection('members').doc(u.uid);
 let snap;try{snap=await p.get({source:navigator.onLine?'default':'cache'})}catch{snap=await p.get({source:'cache'})}
 if(!snap.exists)throw Error('Seu usuário ainda não foi autorizado pelo administrador.');role=snap.data().role||'viewer';
 $msg('identity',(u.email||'Usuário')+' • '+role);$('admin-import').classList.toggle('hide',role!=='admin');if(role==='admin')offerFirstImport();
 subscribeContent();subscribeState();
 }catch(e){error(e);$msg('loading-text',String(e?.message||e));show('waiting')}
}
async function importRoute(){if(role!=='admin')throw Error('Somente administrador pode importar o roteiro.');
 if(!navigator.onLine)throw Error('Conecte-se à internet para publicar o roteiro.');
 const f=$('route-import').files[0];if(!f)throw Error('Selecione o arquivo HTML privado.');
 let html=await f.text();
 // Desativa o sincronizador antigo (Supabase V7) do roteiro importado. A PWA usa somente Firebase.
 html=html.replace(/<script>\s*\/\* NY26 v7[^\n]*\n[\s\S]*?<\/script>/,'');
 if(html.length<20000||html.length>3000000||!html.includes('id="mala"')||!html.includes('ny26:data-change'))throw Error('Este HTML não corresponde ao roteiro esperado.');
 if(!confirm('Publicar nova versão do roteiro para os participantes autorizados?'))return;
 const pts=Array.from(html),pieces=[];for(let i=0;i<pts.length;i+=32000)pieces.push(pts.slice(i,i+32000).join(''));
 if(pieces.length>85)throw Error('Arquivo acima do limite previsto.');
 const version=Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
 const ref=db.collection('trips').doc(TRIP).collection('content'),batch=db.batch();
 pieces.forEach((text,i)=>batch.set(ref.doc('chunk_'+String(i).padStart(3,'0')),{version,index:i,text,count:0,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}));
 batch.set(ref.doc('manifest'),{version,index:-1,text:'',count:pieces.length,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
 $msg('settings-msg','Enviando '+pieces.length+' partes protegidas…');await batch.commit();
 $msg('settings-msg','Roteiro privado atualizado. Os aparelhos serão atualizados ao reconectar.');
}
function serviceWorker(){if(!('serviceWorker' in navigator)||!location.protocol.startsWith('http'))return;
 navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).then(reg=>{
 registration=reg;if(reg.waiting)updateReady(reg);
 reg.addEventListener('updatefound',()=>{const w=reg.installing;w?.addEventListener('statechange',()=>{if(w.state==='installed'&&navigator.serviceWorker.controller)updateReady(reg)})});
 if(navigator.onLine)reg.update().catch(()=>{});
 }).catch(e=>console.warn('Instalação offline não disponível:',e));
 navigator.serviceWorker.addEventListener('controllerchange',()=>location.reload());
}
function updateReady(reg){$('notice').style.display='block';$('update-now').onclick=()=>reg.waiting?.postMessage({type:'SKIP_WAITING'})}
function settings(){show('settings');refresh()}
function returnFromSettings(){
  if(!user){show('setup');return}
  if($('viewer').srcdoc){
    // Oculta as configuracoes antes de restaurar o visor; caso contrario
    // a engrenagem pensa que a tela ainda esta aberta no proximo toque.
    show('waiting');
    document.body.classList.add('running');
    refresh();
  }else{
    show('waiting');
  }
}
async function boot(){serviceWorker();const cfg=window.NY26_FIREBASE_CONFIG;
 if(!cfg||!cfg.apiKey||!cfg.projectId||!cfg.appId||!window.firebase?.initializeApp){$('config-missing').classList.remove('hide');banner('⚙️ Ativação pendente','wait');return}
 try{firebase.initializeApp(cfg);auth=firebase.auth();await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);db=firebase.firestore();
 try{await db.enablePersistence({synchronizeTabs:true})}catch(e){console.warn('Persistência local falhou',e);$msg('message','Aviso: o armazenamento offline deste navegador não pôde ser ativado.')}
 $('login').classList.remove('hide');auth.onAuthStateChanged(async u=>{clear();if(u)await logged(u);else{user=null;role='';show('setup');banner('🔒 Entrar','wait')}},error);
 }catch(e){error(e)}
}
$('login-form').onsubmit=async ev=>{ev.preventDefault();try{$msg('message','');await auth.signInWithEmailAndPassword($('email').value.trim(),$('password').value)}catch(e){error('Login: '+e.message)}};
$('reset-password').onclick=async()=>{
  const email=$('email').value.trim();
  if(!email){$msg('message','Digite primeiro seu e-mail no campo acima.');$('email').focus();return}
  if(!navigator.onLine){$msg('message','A recuperação de senha precisa de internet.');return}
  const button=$('reset-password');
  button.disabled=true;
  try{
    await auth.sendPasswordResetEmail(email);
    $msg('message','Se o e-mail estiver cadastrado, você receberá uma mensagem do Firebase com o link para definir uma nova senha. Confira também o lixo eletrônico.');
  }catch(e){
    if(e.code==='auth/user-not-found'){
      $msg('message','Se o e-mail estiver cadastrado, você receberá uma mensagem de recuperação.');
    }else{
      $msg('message','Não foi possível solicitar a recuperação. Verifique o e-mail e a conexão e tente novamente. '+(e.code||''));
    }
  }finally{button.disabled=false}
};

$('show-settings').onclick=()=>!$('settings').classList.contains('hide')?returnFromSettings():user?settings():show('setup');
$('open-settings').onclick=settings;
$('back-settings').onclick=returnFromSettings;
function openDocuments(){
  if(!user){show('setup');return}
  const frame=$('viewer');
  const doc=frame.contentDocument;
  if(!frameReady||!doc?.getElementById('documentos')){
    $msg('settings-msg','Ainda não foi possível abrir os comprovantes. Abra o roteiro primeiro.');
    show('waiting');return;
  }
  // Mantem o mesmo iframe aberto: evita perder a posicao e os itens carregados.
  document.body.classList.add('running');
  const win=frame.contentWindow,hash='#documentos';
  if(win.location.hash!==hash)win.location.hash=hash;
  else win.dispatchEvent(new win.Event('hashchange'));
}
$('open-documents').onclick=openDocuments;
$('home').onclick=returnFromSettings;
$('logout').onclick=async()=>{if(!confirm('Sair da conta neste aparelho?'))return;clear();await auth.signOut();show('setup')};
$('publish-route').onclick=async()=>{try{await importRoute()}catch(e){error(e)}};
$('route-import').addEventListener('change',async()=>{if(!$('route-import').files?.length)return;try{await importRoute()}catch(e){error(e)}});
$('try-sync').onclick=()=>{if(user){subscribeContent();subscribeState()}refresh()};
$('check-update').onclick=async()=>{if(!registration){$msg('settings-msg','A instalação offline exige HTTPS.');return}try{await registration.update();$msg('settings-msg',registration.waiting?'Atualização pronta.':'Verificação concluída.')}catch(e){$msg('settings-msg','Não foi possível consultar o servidor.') }};
$('test-offline').onclick=async()=>{const c=cachedRoute();const names=await caches.keys().catch(()=>[]);const messages=[c?.html?.length>10000?'✓ Roteiro salvo':'✗ Roteiro ainda não armazenado',names.some(name=>name.startsWith('ny26-shell-gh-v'))?'✓ Estrutura em cache':'✗ App ainda não está em cache',user?'✓ Sessão ativa':'✗ Sem login'];
 $msg('settings-msg',messages.join(' · ')+' — faça também o teste real em modo avião nos dois aparelhos.');};
window.addEventListener('offline',refresh);window.addEventListener('online',()=>{refresh();registration?.update().catch(()=>{})});
boot();
})();
