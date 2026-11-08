/* NY26: módulo público do aplicativo. Roteiro e documentos NÃO são publicados neste repositório. */
(()=>{'use strict';
const $=id=>document.getElementById(id);
const TRIP='ny26',K={actions:'ny26_checklist_v5',packing:'ny26_packing_v6',route:'ny26_v9_route_cache'};
let auth,db,user=null,role='',cStop=null,sStop=null,frameReady=false,routeVer='',pending=false,fromCache=true,lastServer=0,registration=null;
let lastMaps={actions:{},packing:{}},device=localStorage.getItem('ny26_client_device');
let ny26V157Preview=null,ny26V157Backup=false,ny26V157Data=null,ny26V157BaseData=null,ny26V157Signature=null,ny26Day07Patch=null,ny26Day07Preview=null,ny26PrivatePatches=[],ny26PendingEncrypted=null;
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

const NY26_PACKING_UNIFIED_RENDER="function render(){\n var t=state.items,grouped={},groups=[];\n function keyFor(x){return String(x.category||'').trim().toLocaleLowerCase('pt-BR')+'|'+String(x.title||'').trim().toLocaleLowerCase('pt-BR')}\n t.forEach(function(x){var key=keyFor(x);if(!grouped[key]){grouped[key]={key:key,items:[],title:x.title,category:x.category};groups.push(grouped[key])}grouped[key].items.push(x)});\n function counts(g){var c=[0,0,0,0];g.items.forEach(function(x){var n=Number(x.status)||0;c[n>=0&&n<=3?n:0]++});return c}\n var packed=0,prepared=0,dispensed=0;\n groups.forEach(function(g){var c=counts(g),n=g.items.length;if(c[2]===n)packed++;else if(c[3]===n)dispensed++;else if(c[1]+c[2]===n)prepared++});\n el('pk-count').textContent=groups.length;\n el('pk-prep').textContent=prepared;\n el('pk-packed').textContent=packed;\n el('pk-left').textContent=groups.length-packed-dispensed;\n el('pk-bar').style.width=(groups.length?100*(packed+dispensed)/groups.length:0)+'%';\n groups.sort(function(a,b){return (a.items.every(function(x){return x.priority==='avaliar'}))-(b.items.every(function(x){return x.priority==='avaliar'}))||a.category.localeCompare(b.category,'pt-BR')||a.title.localeCompare(b.title,'pt-BR')});\n var visible=groups.filter(function(g){\n  var c=counts(g),n=g.items.length;\n  if(category!=='all'&&g.category!==category)return false;\n  if(search&&!g.items.some(function(x){return (x.title+' '+x.note+' '+x.bag+' '+x.category).toLowerCase().includes(search)}))return false;\n  if(filter==='todo'&&!c[0])return false;\n  if(filter==='prepared'&&!c[1])return false;\n  if(filter==='packed'&&!c[2])return false;\n  if(filter==='dispensed'&&!c[3])return false;\n  if(filter==='active'&&c[2]+c[3]===n)return false;\n  return true;\n });\n var output='<div class=\"pk-unified-head\">🧳 Checklist único da família <small>'+visible.length+' de '+groups.length+' itens</small></div><div class=\"pk-items pk-unified-items\">';\n visible.forEach(function(g){\n  var c=counts(g),n=g.items.length,q=g.items.reduce(function(v,x){return v+(Number(x.qty)||1)},0);\n  var complete=c[2]===n,allSep=c[1]+c[2]===n,allDisp=c[3]===n,allEmpty=c[0]===n;\n  var label=complete?'Na mala':allDisp?'Dispensado':allSep?'Separado':allEmpty?'A separar':'Parcial';\n  var cls=complete?'packed':allDisp?'dispensed':allSep?'prepared':'';\n  var parts=[];if(c[2])parts.push(c[2]+' na mala');if(c[1])parts.push(c[1]+' separado(s)');if(c[0])parts.push(c[0]+' a separar');if(c[3])parts.push(c[3]+' dispensado(s)');\n  var bags=g.items.map(function(x){return x.bag}).filter(function(x,i,a){return x&&a.indexOf(x)===i});\n  var notes=g.items.map(function(x){return x.note||''}).filter(Boolean).filter(function(x,i,a){return a.indexOf(x)===i});\n  var optional=g.items.every(function(x){return x.priority==='avaliar'});\n  var encoded=encodeURIComponent(g.key),data=safe(encoded);\n  output+='<div class=\"pk-line pk-unified-line\" data-pk-group=\"'+data+'\" data-stage=\"'+(complete?2:allDisp?3:allSep?1:0)+'\">'+\n   '<div class=\"pk-line-text\"><strong>'+safe(g.title)+' <em>×'+safe(q)+'</em></strong><small>'+safe(g.category)+\n   ' · '+(n>1?n+' registros reunidos':'1 registro')+\n   (bags.length?' · '+safe(bags.slice(0,3).join(' / '))+(bags.length>3?'…':''):'')+\n   '</small></div><div class=\"pk-status-chip '+cls+'\">'+label+'</div>'+\n   (n>1?'<div class=\"pk-unified-breakdown\">'+safe(parts.join(' · '))+'</div>':'')+\n   (optional?'<div class=\"pk-mini-alert\">Opcional — decida se vale o espaço</div>':'')+\n   (notes.length?'<div class=\"pk-info\">'+safe(notes[0])+(notes.length>1?' · Há orientações adicionais nos registros originais.':'')+'</div>':'')+\n   '<div class=\"pk-item-btns\">'+\n   '<button type=\"button\" class=\"pk-stage\" data-pk-unified=\"'+data+'\" data-pk-value=\"1\">✓ Separado</button>'+\n   '<button type=\"button\" class=\"pk-stage'+(complete?' pk-packed':'')+'\" data-pk-unified=\"'+data+'\" data-pk-value=\"2\">🧳 Na mala</button>'+\n   '<button type=\"button\" class=\"pk-stage\" data-pk-unified=\"'+data+'\" data-pk-value=\"3\">— Dispensar</button>'+\n   '<button type=\"button\" class=\"pk-stage\" data-pk-unified=\"'+data+'\" data-pk-value=\"0\">↶ Reabrir</button>'+\n   (n===1?'<button type=\"button\" data-pk-edit=\"'+safe(g.items[0].id)+'\">✎ Editar</button>':'')+\n   (n===1&&g.items[0].id.indexOf('custom-')===0?'<button type=\"button\" data-pk-delete=\"'+safe(g.items[0].id)+'\">Excluir</button>':'')+\n   '</div></div>';\n });\n output+='</div>';\n el('pk-list').innerHTML=visible.length?output:'<div class=\"pk-empty\">Nenhum item corresponde ao filtro. Escolha “Todos” ou adicione um novo.</div>';\n}";

function unifyPackingMarkup(source){
 // Patches only the in-memory private HTML. Retains the original checklist IDs
 // and full per-person records in Firestore/localStorage; only UI is unified.
 const begin=source.indexOf('function render(){var t=state.items,');
 const end=begin<0?-1:source.indexOf('\nfunction editor(id){',begin);
 const eventNeedle="if(id){var a=state.items.find(function(x){return x.id===id});if(a){a.status=Number(b.getAttribute('data-pk-value'));saveState()}}else if(ed)";
 if(begin<0||end<0||!source.includes(eventNeedle)||!source.includes('id="pk-person"'))return source;
 source=source.slice(0,begin)+NY26_PACKING_UNIFIED_RENDER+source.slice(end);
 const handler="var gkey=b.getAttribute('data-pk-unified');"+
  "if(gkey){var key=decodeURIComponent(gkey),value=Number(b.getAttribute('data-pk-value'));"+
  "var matches=state.items.filter(function(x){return (String(x.category||'').trim().toLocaleLowerCase('pt-BR')+'|'+String(x.title||'').trim().toLocaleLowerCase('pt-BR'))===key});"+
  "if(!matches.length)return;"+
  "if((value===0||value===3)&&matches.some(function(x){return x.status===2})&&!confirm('Esta ação altera itens já marcados Na mala. Deseja continuar?'))return;"+
  "if(value===3&&!matches.every(function(x){return x.status===0||x.status===3})&&!confirm('Dispensar todos os registros deste item?'))return;"+
  "matches.forEach(function(x){if(value===1&&x.status===2)return;x.status=value});saveState();return;}else ";
 source=source.replace(eventNeedle,handler+eventNeedle);
 source=source.replace("person='all',filter='todo',category='all'","person='all',filter='all',category='all'");
 source=source.replace(/<label>Quem\?<select id="pk-person">[\s\S]*?<\/select><\/label>/,'<label style="display:none">Quem?<select id="pk-person"><option value="all">Todos</option></select></label>');
 source=source.replace(/<option value="all">Todos<\/option><option selected="" value="todo">A separar<\/option>/,'<option selected="" value="all">Todos</option><option value="todo">A separar</option>');
 source=source.replace(/<label>Para quem<select id="pk-who">/,'<label style="display:none">Para quem<select id="pk-who">');
 source=source.replace('🧳 Minha mala','🧳 Mala da família');
 source=source.replace('Separe os itens de cada pessoa. Toque','Cada item aparece uma única vez para toda a família. Toque');
 source=source.replace('Separe os itens de cada pessoa.','Separe os itens da família.');
 source=source.replace('4 pessoas · 3 malas de cabine + 4 mochilas.','Lista única · 3 malas de cabine + 4 mochilas.');
 const extraStyle='<style id="ny26-pk-unified-style">'+
 '.pk-unified-head{display:flex;justify-content:space-between;align-items:center;gap:10px;padding:12px 14px;background:#edf4f9;border-radius:12px;margin:12px 0;font-weight:800;font-size:14px}'+
 '.pk-unified-head small{font-weight:600;font-size:12px;color:#49677d}'+
 '.pk-unified-items{display:grid;grid-template-columns:1fr;gap:10px}'+
 '.pk-unified-line{margin:0!important}'+
 '.pk-unified-breakdown{padding:6px 0;font:700 12px/1.5 system-ui,sans-serif;color:#4c6273}'+
 '.pk-unified-line .pk-item-btns{display:flex;gap:7px;flex-wrap:wrap}'+
 '@media(min-width:800px){.pk-unified-items{grid-template-columns:repeat(2,minmax(0,1fr))}}'+
 '</style>';
 source=source.replace(/<\/head>/i,extraStyle+'</head>');
 return source;
}


// Add a dedicated menu/page to the private in-memory itinerary. This does not
// replace the document in Firestore and does not change checklist/storage IDs.
function addEmergencyMenuToRouteHtml(html){
 let h=String(html||'');
 if(!/<section\b[^>]*\bdata-view=["']apoio["']/i.test(h))return h;
 if(!/<section\b[^>]*\bid=["']emergencia["']/i.test(h)){
  const page='<section class="page" id="emergencia" data-view="emergencia">'+
   '<h1>🚨 Emergência</h1>'+
   '<p class="ny26-emergency-lead">Emergências médicas, polícia, bombeiros, '+
   'consulados e plano de reencontro da família. Em perigo imediato nos EUA, ligue para '+
   '<a href="tel:911"><strong>911</strong></a>.</p>'+
   '<p class="toplink"><a href="#apoio">ℹ️ Outras informações de apoio</a></p></section>';
  h=h.replace(/<section\b[^>]*\bdata-view=["']apoio["'][^>]*>/i,page+'$&');
 }
 if(!/<a\b[^>]*\bdata-view=["']emergencia["']/i.test(h)){
  h=h.replace(/<a\b[^>]*\bdata-view=["']apoio["'][^>]*>/i,
   '<a class="daytab ny26-emergency-tab" data-view="emergencia" href="#emergencia">🚨 Emergência</a>$&');
 }
 // The original standalone HTML has an explicit allow-list for #hash routes.
 // A link without this change would fall back to the current day's itinerary.
 if(!h.includes("hash==='emergencia'||hash==='apoio'||")){
  h=h.replace("hash==='apoio'||","hash==='emergencia'||hash==='apoio'||");
 }
 h=h.replace(/(<a\b[^>]*\bdata-view=["']apoio["'][^>]*>)🆘 Apoio/i,'$1ℹ️ Apoio');
 h=h.replace('<h1>🆘 Apoio e informações úteis</h1>','<h1>ℹ️ Apoio e informações úteis</h1>');
 if(!h.includes('id="ny26-emergency-menu-style"')){
  const css='<style id="ny26-emergency-menu-style">'+
   '.nav .ny26-emergency-tab{font-weight:800;color:#a52727;background:#fff0ef;border:1px solid #e9b6b2}'+
   '.nav .ny26-emergency-tab.selected{background:#b12d2d!important;color:#fff!important;border-color:#b12d2d!important}'+
   '#emergencia>.ny26-emergency-lead{background:#fff5e9;border:1px solid #f0d9b4;border-radius:10px;padding:12px;line-height:1.55}'+
   '</style>';
  h=h.replace(/<\/head>/i,css+'</head>');
 }
 return h;
}

function sanitizeRouteHtml(source){
 // Documents loaded with iframe.srcdoc inherit the *parent URL as base*.
 // Without an explicit base, links such as #mala can navigate the iframe to
 // /ny26/#mala, recursively loading this application inside itself.
 let h=renameChildren(String(source||''));
 // O HTML antigo continua privado, mas o rótulo de versão v1.40 não é um plano de viagem atual.
 h=h.replace(/PLANO\s+OFICIAL\s*v\s*1[.,]40\b/gi,'ROTEIRO DO DIA');
 h=unifyPackingMarkup(h);
 h=addEmergencyMenuToRouteHtml(h);
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


const NY26_EMERGENCY_CONTACTS=[
 {id:'usa',name:'Emergência imediata nos EUA',region:'Polícia, bombeiros ou ambulância — qualquer cidade da viagem',
  number:'911',tel:'911',kind:'urgent'},
 {id:'ny',name:'Consulado do Brasil — Nova York',region:'Nova York, Nova Jersey e Pensilvânia (Filadélfia)',
  number:'+1 (646) 403-2676',tel:'+16464032676',kind:'consulate',
  general:'+1 (917) 943-7155',generalTel:'+19179437155'},
 {id:'dc',name:'Consulado do Brasil — Washington, DC',region:'Washington, Maryland e Delaware, entre outras áreas',
  number:'+1 (202) 714-8017',tel:'+12027148017',kind:'consulate',
  general:'+1 (202) 461-3000',generalTel:'+12024613000'},
 {id:'br',name:'Plantão do Itamaraty — Brasília',region:'Principalmente para familiares no Brasil comunicarem emergência no exterior fora do horário comercial',
  number:'+55 (61) 98260-0610',tel:'+5561982600610',kind:'consulate'}
];
function installEmergencyContacts(doc){
 // Injected into the private itinerary when its iframe loads. Nothing from
 // Firebase or personal itineraries is written to the public repository.
 const page=doc.getElementById('emergencia')||doc.querySelector('[data-view="emergencia"]')||doc.getElementById('apoio');
 if(!page||doc.getElementById('ny26-emergency-contacts'))return;
 const sheet=doc.createElement('style');
 sheet.id='ny26-emergency-contacts-css';
 sheet.textContent=[
  '#ny26-emergency-contacts{margin:12px 0 23px;padding:14px;border:1px solid #b8cfdd;border-radius:14px;background:#f4f9fc;color:#163b52}',
  '#ny26-emergency-contacts *{box-sizing:border-box}',
  '.ny26-v140-critical[hidden]{display:none!important}',
  '#ny26-emergency-contacts h2{font-size:18px;line-height:1.3;margin:0 0 7px;color:#13394f}',
  '#ny26-emergency-contacts .ny26-e-intro{font-size:13px;line-height:1.5;margin:0 0 13px;color:#426278}',
  '#ny26-emergency-contacts .ny26-e-list{display:grid;grid-template-columns:1fr;gap:10px}',
  '#ny26-emergency-contacts .ny26-e-card{background:#fff;border:1px solid #d7e4ed;border-radius:12px;padding:12px;min-width:0}',
  '#ny26-emergency-contacts .ny26-e-card[data-kind="urgent"]{border:2px solid #c84b43;background:#fff7f6}',
  '#ny26-emergency-contacts h3{font-size:15px;margin:0 0 5px;color:#173d57;line-height:1.35}',
  '#ny26-emergency-contacts .ny26-e-region{font-size:12px;color:#566e7c;line-height:1.45;margin:0 0 9px}',
  '#ny26-emergency-contacts .ny26-e-number{font-size:19px;font-weight:800;letter-spacing:.2px;margin:0 0 10px;overflow-wrap:anywhere;color:#0e476c}',
  '#ny26-emergency-contacts .ny26-e-card[data-kind="urgent"] .ny26-e-number{font-size:27px;color:#ac2424}',
  '#ny26-emergency-contacts .ny26-e-buttons{display:flex;gap:9px;flex-wrap:wrap}',
  '#ny26-emergency-contacts .ny26-e-call,#ny26-emergency-contacts .ny26-e-copy{display:inline-flex;align-items:center;justify-content:center;min-height:45px;border-radius:9px;padding:10px 14px;font:700 13px system-ui,sans-serif;text-decoration:none!important;cursor:pointer}',
  '#ny26-emergency-contacts .ny26-e-call{background:#11658c;color:#fff!important;border:1px solid #11658c}',
  '#ny26-emergency-contacts .ny26-e-card[data-kind="urgent"] .ny26-e-call{background:#af2828;border-color:#af2828}',
  '#ny26-emergency-contacts .ny26-e-copy{border:1px solid #9ab9ca;background:#fff;color:#244f64}',
  '#ny26-emergency-contacts .ny26-e-general{font-size:12px;margin:10px 0 0;line-height:1.45}',
  '#ny26-emergency-contacts .ny26-e-general a{color:#17638b;text-decoration:underline}',
  '#ny26-emergency-contacts .ny26-e-footer{font-size:12px;line-height:1.5;color:#415c6e;margin:13px 0 0}',
  '#ny26-emergency-contacts .ny26-e-sources{font-size:11px;line-height:1.6;margin:9px 0 0}',
  '#ny26-emergency-contacts .ny26-e-sources a{color:#17638b}'
 ].join('\n');
 doc.head.appendChild(sheet);
 const wrapper=doc.createElement('div');
 wrapper.id='ny26-emergency-contacts';
 wrapper.setAttribute('aria-label','Telefones úteis e emergências durante a viagem');
 const header=doc.createElement('h2');header.textContent='☎️ Telefones de emergência — Estados Unidos';
 const intro=doc.createElement('p');intro.className='ny26-e-intro';
 intro.textContent='Contatos acessíveis mesmo sem internet. Toque em Ligar para abrir o discador. O 911 é a primeira opção para emergência imediata.';
 const list=doc.createElement('div');list.className='ny26-e-list';
 for(const item of NY26_EMERGENCY_CONTACTS){
  const card=doc.createElement('div');card.className='ny26-e-card';card.setAttribute('data-kind',item.kind);
  card.setAttribute('data-contact',item.id);
  const title=doc.createElement('h3');title.textContent=item.name;
  const region=doc.createElement('p');region.className='ny26-e-region';region.textContent=item.region;
  const num=doc.createElement('p');num.className='ny26-e-number';num.textContent=item.number;
  const buttons=doc.createElement('div');buttons.className='ny26-e-buttons';
  const call=doc.createElement('a');call.className='ny26-e-call';call.href='tel:'+item.tel;
  call.textContent='📞 Ligar '+(item.id==='usa'?'911':'agora');call.setAttribute('aria-label','Ligar para '+item.name+': '+item.number);
  const copy=doc.createElement('button');copy.type='button';copy.className='ny26-e-copy';copy.textContent='Copiar número';
  copy.setAttribute('aria-label','Copiar telefone '+item.number);
  copy.addEventListener('click',async()=>{
   try{
    if(!navigator.clipboard?.writeText)throw Error('Clipboard unavailable');
    await navigator.clipboard.writeText(item.tel);
    copy.textContent='✅ Copiado';
   }catch(e){
    copy.textContent='Segure e copie o número acima';
   }
  });
  buttons.append(call,copy);
  card.append(title,region,num,buttons);
  if(item.general){
   const general=doc.createElement('p');general.className='ny26-e-general';
   general.append(doc.createTextNode('Telefone geral (expediente): '));
   const generalLink=doc.createElement('a');generalLink.href='tel:'+item.generalTel;generalLink.textContent=item.general;
   general.appendChild(generalLink);card.appendChild(general);
  }
  list.appendChild(card);
 }
 const footer=doc.createElement('p');footer.className='ny26-e-footer';
 footer.textContent='⚠️ Os plantões consulares destinam-se a casos graves, como acidentes, hospitalização, prisão, violência e desaparecimento. Não substituem a polícia e os serviços médicos locais. O número de Brasília atende especialmente pedidos de assistência feitos por familiares no Brasil.';
 const sources=doc.createElement('p');sources.className='ny26-e-sources';
 sources.append(doc.createTextNode('Fontes oficiais, verificadas em 01/11/2026: '));
 const citations=[
  ['Contatos dos consulados (Departamento de Estado dos EUA)',
   'https://travel.state.gov/content/travel/en/consularnotification/ConsularNotificationandAccess/Brazil.html'],
  ['Jurisdição consular brasileira','https://econsular.itamaraty.gov.br/'],
  ['Emergências consulares (Itamaraty)','https://www.gov.br/mre/pt-br/assuntos/portal-consular/quem-contatar/assistencia-a-brasileiros-que-se-encontram-no-exterior/assistencia-a-brasileiros-que-se-encontram-no-exterior-emergencias']
 ];
 citations.forEach(([label,url],i)=>{
  const a=doc.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';a.textContent=label;
  if(i)sources.append(doc.createTextNode(' · '));sources.appendChild(a);
 });
 wrapper.append(header,intro,list,footer,sources);
 const mainHeading=page.querySelector('h1');
 if(mainHeading)mainHeading.insertAdjacentElement('afterend',wrapper);
 else page.prepend(wrapper);
 // Avoid showing the old incomplete emergency notice twice. It stays in
 // the stored original document; the current version is runtime-only.
 const legacy=page.querySelector('.ny26-v140-critical');
 if(legacy)legacy.hidden=true;
}


function installFamilyReunionPlan(doc){
 // NY 12 family protocol. Personal telephone numbers are only stored under
 // this authenticated user's browser profile; never in public GitHub files.
 const page=doc.getElementById('emergencia')||doc.querySelector('[data-view="emergencia"]')||doc.getElementById('apoio');
 if(!page||doc.getElementById('ny26-reunion-plan')||!user?.uid)return;
 const view=doc.defaultView;
 const key='ny26-reunion-contact-v1:'+TRIP+':'+user.uid;
 let settings={phone1:'',phone2:'',liaWith:'Gustavo',laisWith:'Renata'};
 try{
  const existing=JSON.parse(localStorage.getItem(key)||'null');
  if(existing&&typeof existing==='object'&&!Array.isArray(existing)){
   for(const field of ['phone1','phone2','liaWith','laisWith']){
    if(typeof existing[field]==='string')settings[field]=existing[field].slice(0,40);
   }
  }
 }catch(e){console.warn('Contatos de reencontro nao carregados',e)}
 const style=doc.createElement('style');
 style.id='ny26-reunion-style';
 style.textContent=[
  '#ny26-reunion-plan{background:#f3f8fb;color:#193e55;border:1px solid #bbd3e2;border-radius:14px;margin:14px 0 20px;padding:16px;font:14px/1.5 system-ui,sans-serif}',
  '#ny26-reunion-plan *{box-sizing:border-box}',
  '#ny26-reunion-plan h2{font-size:19px;margin:0 0 7px;color:#174663}',
  '#ny26-reunion-plan h3{font-size:15px;margin:0 0 9px;color:#174663}',
  '#ny26-reunion-plan p{margin:6px 0 12px}',
  '#ny26-reunion-plan .ny26-r-rule{padding:12px;background:#fff6e8;border-left:4px solid #b77e25;border-radius:8px;font-weight:700;margin:12px 0}',
  '#ny26-reunion-plan .ny26-r-steps{margin:8px 0 14px;padding-left:22px}',
  '#ny26-reunion-plan .ny26-r-steps li{margin:7px 0}',
  '#ny26-reunion-plan details{border:1px solid #d4e2ea;background:white;border-radius:10px;margin:9px 0;padding:11px 13px}',
  '#ny26-reunion-plan details summary{cursor:pointer;font-weight:750;color:#155578}',
  '#ny26-reunion-plan .ny26-r-places{margin:10px 0 3px;padding-left:18px}',
  '#ny26-reunion-plan .ny26-r-places li{margin:6px 0}',
  '#ny26-reunion-plan .ny26-r-english{background:#eff6fa;border-radius:8px;padding:10px 12px;font-weight:700;font-size:13px;line-height:1.5}',
  '#ny26-reunion-plan .ny26-r-form{border-top:1px solid #c7dce7;margin-top:13px;padding-top:13px}',
  '#ny26-reunion-plan .ny26-r-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
  '#ny26-reunion-plan label{display:flex;flex-direction:column;gap:5px;font-weight:700;font-size:12px}',
  '#ny26-reunion-plan input,#ny26-reunion-plan select{font:14px system-ui,sans-serif;padding:11px;border:1px solid #a9c5d5;border-radius:8px;width:100%;min-width:0;background:white;color:#172f42}',
  '#ny26-reunion-plan button{min-height:44px;padding:10px 14px;border:1px solid #1b668d;border-radius:9px;background:#166589;color:#fff;font:700 13px system-ui,sans-serif;cursor:pointer}',
  '#ny26-reunion-plan .ny26-r-tools{display:flex;flex-wrap:wrap;gap:10px;margin:10px 0}',
  '#ny26-reunion-plan .ny26-r-note{font-size:12px;color:#566f7c}',
  '#ny26-reunion-plan .ny26-r-status{font-size:12px;font-weight:700;color:#175a79;min-height:18px}',
  '#ny26-reunion-print[hidden]{display:none!important}',
  '@media(max-width:560px){#ny26-reunion-plan .ny26-r-grid{grid-template-columns:1fr}}',
  '@media print{',
  'body > :not(#ny26-reunion-print){display:none!important}',
  '#ny26-reunion-print[hidden]{display:grid!important;grid-template-columns:1fr 1fr;gap:13mm;padding:8mm;font:12pt/1.4 Arial,sans-serif;color:#111;background:white}',
  '#ny26-reunion-print .ny26-print-card{border:2px dashed #777;border-radius:6px;padding:11mm;min-height:86mm;page-break-inside:avoid;break-inside:avoid;overflow-wrap:anywhere}',
  '#ny26-reunion-print h2{font-size:17pt;margin:0 0 8mm}',
  '#ny26-reunion-print p{margin:0 0 3mm}',
  '#ny26-reunion-print .ny26-print-phone{font-size:15pt;font-weight:700}',
  '#ny26-reunion-print .ny26-print-help{font-size:10pt;margin-top:5mm}',
  '@page{margin:9mm}',
  '}'
 ].join('\n');
 doc.head.appendChild(style);
 const root=doc.createElement('section');root.id='ny26-reunion-plan';
 root.setAttribute('aria-label','Plano familiar de reencontro NY12');
 const heading=doc.createElement('h2');heading.textContent='🧭 Plano de emergência — reencontro da família';
 const intro=doc.createElement('p');
 intro.textContent='Protocolo combinado no NY 12 para separação ou desaparecimento de Lia e Laís. Deixe os cartões preparados antes de sair do hotel.';
 const rule=doc.createElement('p');rule.className='ny26-r-rule';
 rule.textContent='Regra principal: se alguém se perder, NÃO sai procurando sozinho. Para em local seguro, procura um funcionário, segurança ou policial e mostra o cartão de contatos. Nunca acompanha desconhecidos.';
 root.append(heading,intro,rule);
 function title(text){const h=doc.createElement('h3');h.textContent=text;return h}
 function makeList(items,css='ny26-r-steps'){
  const list=doc.createElement(css==='ny26-r-steps'?'ol':'ul');
  list.className=css;
  for(const item of items){const li=doc.createElement('li');li.textContent=item;list.appendChild(li)}
  return list;
 }
 root.append(title('Se uma das meninas se perder'),
  makeList([
   'Lia ou Laís: parar em local seguro, sem correr e sem tentar encontrar os pais sozinha.',
   'Procurar funcionário identificado, segurança, balcão de informações, policial ou uma loja movimentada e pedir ajuda.',
   'Mostrar o cartão de emergência com os telefones dos responsáveis.',
   'Não sair com desconhecidos, não atravessar ruas nem trocar de estação, plataforma ou cais para procurar a família.',
   'Se houver perigo imediato ou desaparecimento sem localização segura, acionar o 911.'
  ]));
 function accordion(label,items){
  const det=doc.createElement('details');
  const sum=doc.createElement('summary');sum.textContent=label;
  det.append(sum,makeList(items,'ny26-r-places'));
  root.appendChild(det);return det;
 }
 accordion('👨‍👩‍👧‍👧 Responsabilidade dos adultos e prevenção',[
  'Antes de sair, cada adulto fica responsável por uma menina. Caminhar em formação adulto → meninas → adulto.',
  'Quem estiver com uma criança permanece com ela; não sai correndo para procurar a outra. Coordenar a busca com a equipe do local e por telefone.',
  'Fotografar as roupas das meninas todos os dias, antes do passeio.',
  'Conferir os cartões com telefones acessíveis nas roupas/mochilas e combinar a regra de pedir ajuda a funcionários.'
 ]);
 accordion('📍 Onde pedir ajuda em cada passeio',[
  'Times Square: entrar em loja movimentada e procurar funcionário ou segurança; não atravessar a multidão.',
  'SUMMIT, Museu de História Natural (AMNH) e bibliotecas: procurar recepção, balcão de informações ou segurança.',
  'Central Park: procurar funcionário ou policial próximo; não atravessar o parque à procura dos pais.',
  'DUMBO, Brooklyn Heights e Promenade: procurar estabelecimento aberto, segurança ou policial.',
  'Metrô e Roosevelt Island Tramway: procurar funcionário ou interfone Help Point; não mudar de plataforma nem embarcar em outro veículo para procurar a família.',
  'Ferry: procurar um funcionário da equipe; não trocar de cais.'
 ]);
 const english=doc.createElement('details');
 const englishSum=doc.createElement('summary');englishSum.textContent='🗣️ Frases em inglês para mostrar ou falar';
 const englishWords=doc.createElement('div');englishWords.className='ny26-r-english';
 englishWords.textContent='I am lost. Please help me find my parents. Please call my parents. I speak Portuguese.';
 english.append(englishSum,englishWords);
 root.appendChild(english);
 const danger=doc.createElement('p');danger.className='ny26-r-note';
 danger.textContent='⚠️ Perigo imediato: 911. Para desencontro sem perigo imediato, funcionários e segurança do local são a primeira referência. Evite deslocamentos improvisados em busca da criança.';
 root.appendChild(danger);
 const form=doc.createElement('div');form.className='ny26-r-form';
 form.appendChild(title('📇 Cartões de contato — 4 cópias para imprimir'));
 const explain=doc.createElement('p');explain.className='ny26-r-note';
 explain.textContent='Preencha os dois números de telefone em formato internacional (+55… ou +1…). Eles ficam somente neste navegador e não são enviados ao GitHub nem sincronizados automaticamente com o outro celular.';
 form.appendChild(explain);
 const fields=doc.createElement('div');fields.className='ny26-r-grid';
 function phoneField(label,field){
  const holder=doc.createElement('label');holder.textContent=label;
  const input=doc.createElement('input');input.type='tel';input.autocomplete='off';input.inputMode='tel';input.maxLength=40;
  input.placeholder='+55 (DDD) 9XXXX-XXXX';input.value=settings[field]||'';
  input.setAttribute('data-ny26-reunion',field);holder.appendChild(input);
  fields.appendChild(holder);return input;
 }
 const phone1=phoneField('Telefone de Gustavo', 'phone1');
 const phone2=phoneField('Telefone de Renata','phone2');
 function assignment(child,field){
  const holder=doc.createElement('label');holder.textContent='Adulto responsável por '+child;
  const select=doc.createElement('select');select.setAttribute('data-ny26-reunion',field);
  for(const name of ['Gustavo','Renata']){
   const option=doc.createElement('option');option.value=name;option.textContent=name;select.appendChild(option);
  }
  select.value=settings[field];holder.appendChild(select);fields.appendChild(holder);return select;
 }
 const liaWith=assignment('Lia','liaWith');
 const laisWith=assignment('Laís','laisWith');
 form.appendChild(fields);
 const tools=doc.createElement('div');tools.className='ny26-r-tools';
 const save=doc.createElement('button');save.type='button';save.textContent='💾 Salvar contatos neste aparelho';
 const print=doc.createElement('button');print.type='button';print.textContent='🖨️ Imprimir 4 cartões';
 const copy=doc.createElement('button');copy.type='button';copy.textContent='📋 Copiar instruções';
 tools.append(save,print,copy);form.appendChild(tools);
 const status=doc.createElement('p');status.className='ny26-r-status';status.setAttribute('role','status');
 status.textContent='Telefones não verificados neste aparelho. Preencha e salve antes de imprimir.';
 form.appendChild(status);
 root.appendChild(form);
 const printable=doc.createElement('section');
 printable.id='ny26-reunion-print';printable.hidden=true;
 doc.body.appendChild(printable);
 const values=()=>({
  phone1:phone1.value.trim().slice(0,40),phone2:phone2.value.trim().slice(0,40),
  liaWith:liaWith.value,laisWith:laisWith.value
 });
 function complete(v){
  return [v.phone1,v.phone2].every(n=>/^\+?[\d\s().-]{8,40}$/.test(n)&&n.replace(/\D/g,'').length>=9);
 }
 function persist(){
  const v=values();
  if(!complete(v)){status.textContent='⚠️ Informe os dois telefones completos, com DDI e DDD, antes de salvar.';return false}
  try{localStorage.setItem(key,JSON.stringify(v));settings=v;
   status.textContent='✅ Contatos salvos neste aparelho. Prepare também os cartões do outro celular, pois não há sincronização automática.';
   return true;
  }catch(e){status.textContent='⚠️ Não foi possível salvar neste aparelho. Use Imprimir após preencher e guarde os cartões.';return false}
 }
 function makeCard(child,number,v){
  const card=doc.createElement('article');card.className='ny26-print-card';
  const h=doc.createElement('h2');h.textContent='HELP — '+child+' · cópia '+number;
  card.appendChild(h);
  for(const value of [
   'I am lost. Please help me find my parents.',
   'I speak Portuguese. Please call my parents.',
   'Gustavo:',v.phone1,
   'Renata:',v.phone2,
   'If there is immediate danger, call 911.'
  ]){
   const p=doc.createElement('p');p.textContent=value;
   if(value===v.phone1||value===v.phone2)p.className='ny26-print-phone';
   card.appendChild(p);
  }
  const sub=doc.createElement('p');sub.className='ny26-print-help';sub.textContent='Please stay with an identified employee or a police officer. Do not leave with strangers.';
  card.appendChild(sub);return card;
 }
 save.addEventListener('click',persist);
 print.addEventListener('click',()=>{
  const v=values();
  if(!complete(v)){status.textContent='⚠️ Preencha os dois telefones antes de imprimir os cartões.';return}
  persist();printable.replaceChildren(
   makeCard('Lia',1,v),makeCard('Laís',1,v),
   makeCard('Lia',2,v),makeCard('Laís',2,v)
  );
  try{
   if(typeof view.print!=='function')throw Error('Impressão indisponível');
   view.print();
   status.textContent='Use o menu de impressão do telefone para imprimir ou salvar os quatro cartões em PDF.';
  }catch(e){status.textContent='Não foi possível abrir a impressão neste aparelho. Use Copiar instruções e imprima em outro dispositivo.'}
 });
 copy.addEventListener('click',async()=>{
  const v=values();
  const text=[
   'PLANO DE REENCONTRO DA FAMÍLIA — NY26',
   'Quem se perder: ficar em local seguro, pedir ajuda a funcionário, segurança ou policial, mostrar cartão. Não ir com estranhos.',
   'Gustavo: '+(v.phone1||'[preencher]'),
   'Renata: '+(v.phone2||'[preencher]'),
   'Lia com '+v.liaWith+'; Laís com '+v.laisWith,
   'I am lost. Please help me find my parents. Please call my parents. I speak Portuguese.',
   'Emergência imediata: 911.'
  ].join('\n');
  try{
   if(!navigator.clipboard?.writeText)throw Error('Clipboard indisponível');
   await navigator.clipboard.writeText(text);
   status.textContent='✅ Plano de reencontro copiado.';
  }catch(e){status.textContent='Não foi possível copiar automaticamente. As instruções permanecem visíveis acima.'}
 });
 const contacts=page.querySelector('#ny26-emergency-contacts');
 const headerH1=page.querySelector('h1');
 if(contacts)contacts.insertAdjacentElement('afterend',root);
 else if(headerH1)headerH1.insertAdjacentElement('afterend',root);
 else page.prepend(root);
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
  if(window.NY26Photos){window.NY26Photos.install(doc,TRIP+':'+user.uid)?.catch(e=>console.warn('Fotos de paradas:',e))}
  else console.warn('Módulo de fotos offline não carregado');
  try{installEmergencyContacts(doc)}catch(e){console.warn('Contatos de emergencia:',e)}
  try{installFamilyReunionPlan(doc)}catch(e){console.warn('Plano familiar de reencontro:',e)}
  try{tidyLegacyEmergencySupport(doc)}catch(e){console.warn('Menu exclusivo de emergencia:',e)}
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
  try{window.NY26RouteEnhancements?.install(doc,TRIP+':'+user.uid)}catch(e){console.warn('Ajustes de roteiro:',e)}
  try{window.NY26FoodGuide?.decorate(doc)}catch(e){console.warn('Informações de alimentação:',e)}
  try{if(ny26V157Data)window.NY26V157Overlay?.decorate(doc,ny26V157Data,TRIP+':'+user.uid)}catch(e){console.warn('Guia v1.57:',e)}
  try{window.NY26MobileUI?.install(doc)}catch(e){console.warn('Legibilidade mobile:',e)}
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
const v157CacheKey=()=>user?.uid?'ny26-private-v157-reference:'+user.uid:null;
function decodeV157(snap){
 const rows=snap.docs.map(d=>({id:d.id,...d.data()}));
 const manifest=rows.find(x=>x.id==='v157_manifest');
 if(!manifest||!manifest.version||!Number.isInteger(manifest.count)||manifest.count<1||manifest.count>20)return null;
 const chunks=rows.filter(x=>x.id.startsWith('v157_chunk_')&&x.version===manifest.version).sort((a,b)=>a.index-b.index);
 if(chunks.length!==manifest.count||chunks.some((x,i)=>x.index!==i))return null;
 try{return JSON.parse(chunks.map(x=>x.text||'').join(''))}catch{return null}
}
function day07CacheKey(){return user?.uid?'ny26-private-day07-v160:'+user.uid:null}
function decodeDay07(snapshot){
 const snap=snapshot.docs.find(d=>d.id==='day07_patch');if(!snap)return null;
 const raw=snap.data();if(!raw?.text||raw.text.length>15000)return null;
 try{return window.NY26DayPatch?.validate(JSON.parse(raw.text))||null}catch(e){console.warn('Dia 07 atualizado inválido:',e);return null}
}
function loadCachedDay07(){
 try{const key=day07CacheKey();if(!key)return;
  const raw=localStorage.getItem(key);if(raw)ny26Day07Patch=window.NY26DayPatch?.validate(JSON.parse(raw))||null
 }catch(e){console.warn('Cache do dia 07 indisponível:',e)}
}
function setDay07Patch(patch){
 window.NY26DayPatch?.validate(patch);
 if(JSON.stringify(ny26Day07Patch)===JSON.stringify(patch))return;
 ny26Day07Patch=patch;
 try{const key=day07CacheKey();if(key)localStorage.setItem(key,JSON.stringify(patch))}catch(e){console.warn('Dia 07: cache local indisponível:',e)}
 if(ny26V157BaseData)setV157(ny26V157BaseData);
}
function privatePatchesKey(){return user?.uid?'ny26-private-approved-v1:'+user.uid:null}
function decodeApprovedPatches(snapshot){
 const patches=[];
 for(const item of snapshot.docs){
  if(!/^private_update_[a-z0-9-]{4,63}$/.test(item.id))continue;
  const raw=item.data();
  if(typeof raw?.text!=='string'||raw.text.length>30000)continue;
  try{
   const patch=window.NY26SecureUpdates?.valid(JSON.parse(raw.text));
   if(patch&&item.id==='private_update_'+patch.id)patches.push(patch);
  }catch(e){console.warn('Atualização privada inválida:',e)}
 }
 return patches.sort((a,b)=>a.id.localeCompare(b.id));
}
function cachePrivatePatches(patches){
 const key=privatePatchesKey();
 if(!key)return;
 try{localStorage.setItem(key,JSON.stringify(patches))}catch(e){console.warn('Cache das atualizações aprovadas indisponível:',e)}
}
function restorePrivatePatches(){
 const key=privatePatchesKey();if(!key)return;
 try{
  const saved=JSON.parse(localStorage.getItem(key)||'[]');
  if(Array.isArray(saved)&&saved.length<=80)
   ny26PrivatePatches=saved.map(p=>window.NY26SecureUpdates.valid(p));
 }catch(e){console.warn('Atualizações locais indisponíveis:',e)}
}
function setPrivatePatches(patches){
 const prior=JSON.stringify(ny26PrivatePatches);
 const next=patches.slice().sort((a,b)=>a.id.localeCompare(b.id));
 if(JSON.stringify(next)===prior)return;
 ny26PrivatePatches=next;
 cachePrivatePatches(next);
 if(ny26V157BaseData)setV157(ny26V157BaseData);
}
function setV157(data){
 // Keep the canonical private master unchanged; only the on-screen view is merged.
 try{window.NY26V157Overlay?.validate(data)}catch(e){console.warn('Pacote v1.57 inválido:',e);return}
 ny26V157BaseData=data;
 let view=data;
 try{if(ny26Day07Patch)view=window.NY26DayPatch?.merge(view,ny26Day07Patch)||view}catch(e){console.warn('Ajuste 07/11 não aplicado:',e)}
 try{if(ny26PrivatePatches.length)view=window.NY26SecureUpdates.apply(view,ny26PrivatePatches)}catch(e){console.warn('Atualização privada não aplicada:',e);return}
 const signature=JSON.stringify(view);
 if(ny26V157Signature===signature)return;
 ny26V157Signature=signature;
 ny26V157Data=view;
 // Save ONLY original source, never a twice-merged view.
 try{if(v157CacheKey())localStorage.setItem(v157CacheKey(),JSON.stringify(data))}catch(e){console.warn('Cache privado v1.57 indisponível:',e)}
 if(frameReady){try{window.NY26V157Overlay?.decorate($('viewer').contentDocument,view,TRIP+':'+user.uid)}catch(e){console.warn('Exibição v1.57:',e)}}
}
function loadCachedV157(){
 if(ny26V157Data)return;
 try{const key=v157CacheKey();if(!key)return;const obj=JSON.parse(localStorage.getItem(key)||'null');if(obj)setV157(obj)}catch(e){console.warn('Cache v1.57 não disponível:',e)}
}
function subscribeContent(){cStop?.();cStop=db.collection('trips').doc(TRIP).collection('content').onSnapshot({includeMetadataChanges:true},snap=>{
 const patches=decodeApprovedPatches(snap);
 if(!snap.metadata.fromCache||patches.length)setPrivatePatches(patches);
 const p07=decodeDay07(snap);if(p07)setDay07Patch(p07);
 const refV157=decodeV157(snap);if(refV157)setV157(refV157);else loadCachedV157();
 const d=decodeContent(snap);if(d)applyRoute(d.html,d.version,snap.metadata.fromCache);
 else if(!routeVer)$msg('loading-text','A conta está ativa, mas o roteiro ainda não foi importado na área privada.');
},e=>{error('Roteiro indisponível: '+e.message);const c=cachedRoute();if(c)applyRoute(c.html,c.version,true)});
 loadCachedDay07();restorePrivatePatches();loadCachedV157();
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
function clear(){markSecurePending(false);cStop?.();sStop?.();cStop=sStop=null;frameReady=false;routeVer='';ny26V157Data=null;ny26V157BaseData=null;ny26V157Signature=null;ny26V157Preview=null;ny26Day07Patch=null;ny26Day07Preview=null;ny26PrivatePatches=[];ny26PendingEncrypted=null;window.ny26Snapshot=null}
async function logged(u){user=u;show('waiting');banner('🔒 Validando');$msg('loading-text','Verificando permissão de acesso…');
 try{const p=db.collection('trips').doc(TRIP).collection('members').doc(u.uid);
 let snap;try{snap=await p.get({source:navigator.onLine?'default':'cache'})}catch{snap=await p.get({source:'cache'})}
 if(!snap.exists)throw Error('Seu usuário ainda não foi autorizado pelo administrador.');role=snap.data().role||'viewer';
 $msg('identity',(u.email||'Usuário')+' • '+role);$('admin-import').classList.toggle('hide',role!=='admin');$('admin-review').classList.toggle('hide',role!=='admin');$('admin-v157').classList.toggle('hide',role!=='admin');$('admin-day07').classList.toggle('hide',role!=='admin');$('admin-secure-updates').classList.toggle('hide',role!=='admin');if(role==='admin')offerFirstImport();
 subscribeContent();subscribeState();
 if(role==='admin'&&navigator.onLine)checkSecureInbox({quiet:true}).catch(e=>console.warn('Atualizações:',e));
 }catch(e){error(e);$msg('loading-text',String(e?.message||e));show('waiting')}
}

// Protected checklist reconciliation: the PRIVATE JSON is selected locally by
// the administrator; no itinerary or personal details are stored in GitHub.
let reviewPlan=null,reviewBackedUp=false,reviewApplying=false;
function reviewStatus(message){$msg('checklist-review-status',message)}
function reviewValidate(p){
 if(!p||p.format!=='NY26-CHECKLIST-REVIEW-1'||p.strategy!=='merge_preserve_progress')throw Error('Arquivo de revisão incompatível.');
 const spec=[['actions',150],['packing',150],['addActions',100],['addPacking',100]];
 for(const [field,max] of spec){
  if(!Array.isArray(p[field])||p[field].length>max)throw Error('Lista '+field+' inválida ou grande demais.');
  const ids=new Set();
  for(const x of p[field]){
   if(!x||typeof x!=='object'||Array.isArray(x)||typeof x.id!=='string'||!/^[A-Za-z0-9_-]{1,65}$/.test(x.id)||ids.has(x.id))throw Error('ID inválido/duplicado em '+field);
   ids.add(x.id);
   for(const [k,v] of Object.entries(x)){
    if(!['id','title','note','due','group','priority','who','category','bag','qty','phase','done','status','confirmedComplete','reviveIfDiscardedToSeparated'].includes(k))throw Error('Campo inesperado em '+field+': '+k);
    if(typeof v==='string'&&v.length>2000)throw Error('Texto extenso demais em '+x.id);
   }
   if(Object.hasOwn(x,'due')&&x.due!==''&&!/^\d{4}-\d{2}-\d{2}$/.test(x.due))throw Error('Data inválida em '+x.id);
  }
 }
 if(p.actions.some(x=>Object.hasOwn(x,'done')||Object.hasOwn(x,'status'))||
    p.packing.some(x=>Object.hasOwn(x,'done')||Object.hasOwn(x,'status')))throw Error('A revisão não pode sobrescrever diretamente progresso existente.');
 return p;
}
function reviewDefaults(domain){
 let doc=null;try{doc=$('viewer').contentDocument}catch{}
 const tag=domain==='actions'?'ny-checklist-defaults':'pk-defaults';
 try{const x=JSON.parse(doc?.getElementById(tag)?.textContent||'[]');return x.filter(v=>v&&typeof v.id==='string')}catch{return []}
}
function reviewMergeMap(domain,remoteDocs){
 const map=new Map(reviewDefaults(domain).map(v=>[v.id,v]));
 const local=toMap(read(domain),domain);
 for(const [id,value] of Object.entries(local))map.set(id,value);
 const deleted=new Set();
 for(const rec of remoteDocs){
  const v=rec.data();
  if(v.domain!==domain||typeof v.value?.id!=='string')continue;
  const id=v.value.id;
  if(v.deleted){deleted.add(id);map.delete(id)}
  else{deleted.delete(id);map.set(id,v.value)}
 }
 return {map,deleted};
}
async function reviewServerState(){
 if(role!=='admin'||!user||!db)throw Error('É preciso entrar como administrador.');
 if(!navigator.onLine||pending)throw Error('Conecte-se e aguarde todas as alterações pendentes serem sincronizadas.');
 const c=db.collection('trips').doc(TRIP).collection('state');
 const snapshot=await c.get({source:'server'});
 return {ref:c,docs:snapshot.docs};
}
function reviewBackupDownload(state){
 const maps={actions:reviewMergeMap('actions',state.docs),packing:reviewMergeMap('packing',state.docs)};
 const payload={format:'NY26-CHECKLISTS-BACKUP-1',date:new Date().toISOString(),
  actions:[...maps.actions.map.values()],packing:[...maps.packing.map.values()],
  deletedActions:[...maps.actions.deleted],deletedPacking:[...maps.packing.deleted]};
 const file=new Blob([JSON.stringify(payload,null,2)],{type:'application/json'});
 const url=URL.createObjectURL(file),a=document.createElement('a');
 a.href=url;a.download='NY26-Backup-Acoes-Mala-'+new Date().toISOString().slice(0,10)+'.json';
 document.body.appendChild(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(url),60000);
}
function reviewEdits(p){
 return [...p.actions.map(x=>({domain:'actions',record:x,isNew:false})),
         ...p.packing.map(x=>({domain:'packing',record:x,isNew:false})),
         ...p.addActions.map(x=>({domain:'actions',record:x,isNew:true})),
         ...p.addPacking.map(x=>({domain:'packing',record:x,isNew:true}))];
}
function reviewApplyRecord(existing,edit,domain,isNew){
 if(!existing&&!isNew)return null;
 const base=existing||{id:edit.id};
 const allowed=domain==='actions'?['title','note','due','group','priority','phase']:
                                    ['title','note','who','category','bag','qty','priority'];
 const result={...base};
 for(const field of allowed)if(Object.hasOwn(edit,field))result[field]=edit[field];
 if(domain==='actions'){
  // Explicit factual confirmations from the master may close stale reminders;
  // all other existing checkmarks are preserved unchanged.
  if(edit.confirmedComplete===true)result.done=true;
  else if(isNew&&typeof result.done!=='boolean')result.done=false;
 }else{
  if(edit.reviveIfDiscardedToSeparated===true&&Number(result.status)===3)result.status=1;
  else if(isNew&&![0,1,2,3].includes(result.status))result.status=0;
 }
 return result;
}
async function reviewPreview(){
 const file=$('checklist-review-import').files?.[0];if(!file)throw Error('Escolha o arquivo JSON da revisão v1.55.');
 if(file.size>200000)throw Error('Arquivo de revisão acima de 200 KB.');
 reviewPlan=reviewValidate(JSON.parse(await file.text()));
 reviewBackedUp=false;$('checklist-review-backup').disabled=false;
 $('checklist-review-apply').disabled=true;
 const p=reviewPlan;
 reviewStatus('Revisão '+String(p.source||'privada')+': '+p.actions.length+' ações revisadas ('+
  p.actions.filter(x=>x.confirmedComplete).length+' confirmações), '+p.packing.length+
  ' itens da mala ajustados e '+p.addActions.length+' novas ações. Antes de aplicar, salve o backup.');
}
async function reviewBackup(){
 if(!reviewPlan)throw Error('Analise o arquivo de revisão primeiro.');
 const state=await reviewServerState();
 reviewBackupDownload(state);
 reviewBackedUp=true;$('checklist-review-apply').disabled=false;
 reviewStatus('Backup gerado para a pasta Downloads. Confira se o arquivo foi salvo. Em seguida, aplique a revisão: marcações e itens personalizados serão preservados.');
}
async function reviewApply(){
 if(reviewApplying)throw Error('A atualização já está em andamento.');
 if(!reviewPlan||!reviewBackedUp)throw Error('Analise a revisão e salve o backup primeiro.');
 if(!confirm('Aplicar revisão às listas Ações e Mala dos dois aparelhos? As marcações serão preservadas, exceto confirmações explicitamente indicadas na revisão. O roteiro e comprovantes não serão modificados.'))return;
 reviewApplying=true;$('checklist-review-apply').disabled=true;
 try{
  const state=await reviewServerState(),edits=reviewEdits(reviewPlan),base={
   actions:reviewMergeMap('actions',state.docs),packing:reviewMergeMap('packing',state.docs)};
  const batchSize=edits.length;
  if(batchSize>350)throw Error('Revisão acima do limite seguro.');
  // Transaction reads fresh server records BEFORE writing. If another phone
  // changes a checklist item, Firestore retries and preserves its latest state.
  const result=await db.runTransaction(async tx=>{
   const refs=edits.map(x=>state.ref.doc((x.domain==='actions'?'a_':'p_')+encodeURIComponent(x.record.id)));
   const docs=await Promise.all(refs.map(ref=>tx.get(ref)));
   const updates=[],counts={modified:0,added:0,unchanged:0,deletedPreserved:0,missing:0};
   for(let i=0;i<edits.length;i++){
    const x=edits[i],snapshot=docs[i],remote=snapshot.exists?snapshot.data():null;
    if(remote?.deleted){counts.deletedPreserved++;continue}
    const current=remote?.value||base[x.domain].map.get(x.record.id);
    const revised=reviewApplyRecord(current,x.record,x.domain,x.isNew);
    if(!revised){counts.missing++;continue}
    if(current&&same(current,revised)){counts.unchanged++;continue}
    updates.push({domain:x.domain,value:revised,ref:refs[i]});
    if(current)counts.modified++;else counts.added++;
   }
   const stamp=firebase.firestore.FieldValue.serverTimestamp();
   for(const u of updates)tx.set(u.ref,{domain:u.domain,value:u.value,deleted:false,device,updatedAt:stamp});
   return {updates,counts};
  });
  for(const domain of ['actions','packing']){
   const map=toMap(read(domain),domain);
   for(const update of result.updates.filter(x=>x.domain===domain))map[update.value.id]=update.value;
   save(domain,map);lastMaps[domain]=map;
   try{(domain==='actions'?$('viewer').contentWindow.NY26Checklist:
    $('viewer').contentWindow.NY26Packing)?.reloadFromStorage?.()}catch{}
  }
  reviewPlan=null;reviewBackedUp=false;$('checklist-review-backup').disabled=true;
  reviewStatus('✅ Revisão aplicada e salva no Firebase: '+result.counts.modified+' existentes ajustados, '+
    result.counts.added+' adicionados, '+result.counts.unchanged+' mantidos, '+
    result.counts.deletedPreserved+' exclusões anteriores preservadas. Checkmarks e mala não foram zerados.');
 }finally{reviewApplying=false}
}

function v157Message(message){$msg('v157-msg',message)}
async function previewV157(){
 if(role!=='admin')throw Error('Somente administrador pode conferir o pacote.');
 const file=$('v157-file').files?.[0];
 if(!file)throw Error('Selecione NY26_atualizacao_privada_v157.json.');
 if(file.size>400000)throw Error('Pacote acima de 400 KB.');
 const obj=JSON.parse(await file.text());
 window.NY26V157Overlay?.validate(obj);
 if(obj.source!=='NY_2026_Planejamento_Mestre_Atualizado_02-11_v157.xlsx')throw Error('Fonte não é a planilha v1.57 esperada.');
 ny26V157Preview=obj;ny26V157Backup=false;
 $('v157-backup').disabled=false;$('v157-apply').disabled=true;
 const stops=obj.days.reduce((a,d)=>a+(d.stops?.length||0),0);
 v157Message('Versão '+obj.version+': '+obj.days.length+' dias, '+stops+
   ' etapas detalhadas. Nenhum Feito, anexo, check-list ou card existente será apagado. Salve o backup antes de publicar.');
}
function privateDownload(name,content,type){
 const data=new Blob([content],{type:type||'application/octet-stream'});
 const href=URL.createObjectURL(data),a=document.createElement('a');
 a.href=href;a.download=name;document.body.append(a);a.click();a.remove();
 setTimeout(()=>URL.revokeObjectURL(href),1200);
}
function backupBeforeV157(){
 if(role!=='admin'||!ny26V157Preview)throw Error('Analise primeiro o pacote.');
 const saved=cachedRoute();
 if(!saved?.html||saved.html.length<10000)throw Error('Roteiro atual não está disponível neste aparelho: backup não gerado.');
 privateDownload('NY26_ROTEIRO_ANTES_V157_BACKUP.html',saved.html,'text/html;charset=utf-8');
 ny26V157Backup=true;$('v157-apply').disabled=false;
 v157Message('Cópia do HTML privado preparada para download. Confira o arquivo salvo. PDFs e fotos devem ser protegidos separadamente no celular; esta importação não os altera.');
}
async function applyV157(){
 if(role!=='admin'||!ny26V157Preview||!ny26V157Backup)throw Error('É necessário analisar o pacote e gerar backup primeiro.');
 if(!navigator.onLine)throw Error('Conecte o aparelho à internet para publicar.');
 const pack=window.NY26V157Overlay.validate(ny26V157Preview);
 if(!confirm('Publicar o guia v1.57 para os participantes autorizados? Roteiro anterior, Feito, mala, ações e anexos NÃO serão substituídos.'))return;
 const str=JSON.stringify(pack),chars=Array.from(str),pieces=[];
 for(let i=0;i<chars.length;i+=30000)pieces.push(chars.slice(i,i+30000).join(''));
 if(pieces.length>20)throw Error('Pacote excede limite seguro.');
 const ref=db.collection('trips').doc(TRIP).collection('content'),batch=db.batch();
 const version='v157-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,6);
 const stamp=firebase.firestore.FieldValue.serverTimestamp();
 pieces.forEach((txt,i)=>batch.set(ref.doc('v157_chunk_'+String(i).padStart(3,'0')),
  {version,index:i,text:txt,count:0,updatedAt:stamp}));
 batch.set(ref.doc('v157_manifest'),{version,index:-1,text:'',count:pieces.length,updatedAt:stamp});
 v157Message('Publicando conteúdo privado sem alterar o roteiro anterior…');
 await batch.commit();
 setV157(pack);ny26V157Preview=null;ny26V157Backup=false;
 $('v157-backup').disabled=true;$('v157-apply').disabled=true;
 v157Message('✅ Guia v1.57 publicado. Os dois celulares receberão as novas informações ao sincronizar. Marcações Feito e anexos não foram modificados.');
}
function day07Message(message){$msg('day07-status',message)}
async function previewDay07(){
 if(role!=='admin')throw Error('Somente administrador pode atualizar o dia.');
 const file=$('day07-file').files?.[0];if(!file)throw Error('Selecione o arquivo JSON do dia 07/11.');
 if(file.size>15000)throw Error('Arquivo maior que o limite.');
 const patch=window.NY26DayPatch.validate(JSON.parse(await file.text()));
 const pack=ny26V157Data;
 if(!pack)throw Error('O roteiro privado v1.57 ainda não foi carregado. Abra o roteiro com internet antes de atualizar o dia 07.');
 window.NY26DayPatch.merge(pack,patch); // verifies insertion after Walmart
 ny26Day07Preview=patch;
 $('day07-apply').disabled=false;
 day07Message('Conferido: dia 07/11 • v1.60. A parada de abastecimento será adicionada após Walmart Eddystone, sem substituir Feito, listas, comprovantes ou outros dias.');
}
async function applyDay07(){
 if(role!=='admin'||!ny26Day07Preview)throw Error('Confira o arquivo antes de publicar.');
 if(!navigator.onLine)throw Error('Conecte à internet para publicar a atualização privada.');
 const patch=window.NY26DayPatch.validate(ny26Day07Preview);
 if(!confirm('Aplicar SOMENTE o ajuste 07/11 v1.60? Nenhum outro dia, Feito, checklist ou anexo será modificado.'))return;
 const value=JSON.stringify(patch);
 if(value.length>15000)throw Error('Atualização excedeu limite seguro.');
 const version='v160-'+Date.now().toString(36);
 const docRef=db.collection('trips').doc(TRIP).collection('content').doc('day07_patch');
 $('day07-apply').disabled=true;
 day07Message('Publicando alteração isolada do dia 07/11…');
 try{
  await docRef.set({version,index:-1,count:1,text:value,updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
  setDay07Patch(patch);
  ny26Day07Preview=null;
  day07Message('✅ Dia 07/11 atualizado em privado. Abastecimento Royal Farms incluído após Walmart. Outros dias e registros Feito intactos. Reabra o roteiro para conferir.');
 }catch(e){
  $('day07-apply').disabled=false;
  throw e;
 }
}
$('day07-file').addEventListener('change',()=>{ny26Day07Preview=null;$('day07-apply').disabled=true;day07Message('Arquivo selecionado. Toque em Conferir alteração.')});
$('day07-preview').onclick=async()=>{try{await previewDay07()}catch(e){day07Message('⚠️ '+String(e?.message||e))}};
$('day07-apply').onclick=async()=>{try{await applyDay07()}catch(e){day07Message('⚠️ '+String(e?.message||e))}};
// Inbox de atualizacoes: so a chave publica pode ser compartilhada.
let secureUpdateBusy=false;
function secureStatus(v){$msg('secure-status',v)}
function markSecurePending(ready){
 const gear=$('show-settings');if(!gear)return;
 gear.classList.toggle('ny26-updates-ready',Boolean(ready));
 gear.textContent=ready?'⚙️ •':'⚙️';
 gear.setAttribute('aria-label',ready?'Conta e configurações — nova atualização pendente':'Conta e configurações');
}
function securePreview(v){
 const el=$('secure-preview');el.replaceChildren();el.classList.toggle('hide',!v);
 if(v){const p=document.createElement('p');p.style.whiteSpace='pre-wrap';p.textContent=v;el.append(p)}
}
async function secureKeyInfo(generate=false){
 if(!user||role!=='admin')throw Error('Acesso exclusivo do administrador.');
 const api=window.NY26SecureUpdates;if(!api)throw Error('Módulo seguro não carregado. Atualize o aplicativo.');
 const key=generate?await api.createKey(user.uid):await api.readKey(user.uid);
 $('secure-public').value=key?api.registration(key):'';
 $('secure-key-copy').disabled=!key;
 return key;
}
async function checkSecureInbox({quiet=false}={}){
 if(!user||role!=='admin'||secureUpdateBusy)return;
 if(!navigator.onLine){if(!quiet)secureStatus('Sem conexão. Conecte para verificar atualizações.');return}
 secureUpdateBusy=true;$('secure-check').disabled=true;
 try{
  const key=await secureKeyInfo(false);
  if(!key){secureStatus('Ative a chave neste celular uma única vez; nenhum arquivo será necessário.');return}
  const manifest=await window.NY26SecureUpdates.readInbox();
  const approved=new Set(ny26PrivatePatches.map(x=>x.id));
  const pending=manifest.entries.filter(x=>!approved.has(x.id));
  if(!pending.length){
   markSecurePending(false);
   ny26PendingEncrypted=null;$('secure-approve').disabled=true;securePreview('');
   secureStatus('✅ Sem atualizações pendentes. '+approved.size+' alteração(ões) aprovada(s).');
   return;
  }
  // Prioriza a atualização mais recente, mesmo que exista uma anterior pendente.
  const match=pending.filter(x=>x.keyId===key.keyId).at(-1);
  if(!match){
   markSecurePending(false);
   ny26PendingEncrypted=null;$('secure-approve').disabled=true;securePreview('');
   secureStatus('Há atualizações para outra chave. Informe a chave pública atual para republicação.');
   return;
  }
  const patch=await window.NY26SecureUpdates.decrypt(key,match);
  let reason='';
  if(!ny26V157BaseData)reason='Roteiro mestre ainda não carregado; abra o roteiro com internet.';
  else try{
   let base=ny26V157BaseData;if(ny26Day07Patch)base=window.NY26DayPatch.merge(base,ny26Day07Patch);
   window.NY26SecureUpdates.apply(base,[...ny26PrivatePatches,patch]);
  }catch(e){reason=String(e.message||e)}
  ny26PendingEncrypted=reason?null:patch;
  markSecurePending(true);
  $('secure-approve').disabled=Boolean(reason);
  const list=patch.changes.map(x=>{
   if(x.type==='hide_stop')return x.date+' • Retirar a parada '+x.match+' da programação visível (Feito e anexos mantidos)';
   const position=x.position==='after_washington'?'após as visitas em Washington':x.anchor+' ('+x.position+')';
   return x.date+' • '+x.stop.title+
    '\nPosição: '+position+
    (x.stop.address?'\nGPS: '+x.stop.address:'')+
    (x.stop.backupAddress?'\nGPS alternativo: '+x.stop.backupAddress:'')+
    (x.stop.status?'\nPrioridade: '+x.stop.status:'')+
    (x.stop.time?'\nHorário: '+x.stop.time:'');
  }).join('\n\n');
  securePreview('ATUALIZAÇÃO '+patch.id+'\n'+patch.summary+'\n\n'+list+(reason?'\n\n⚠️ '+reason:''));
  secureStatus(reason?'Atualização detectada, mas bloqueada para proteger o roteiro.':
   '🔔 '+pending.length+' atualização(ões) pendente(s). Exibindo a mais recente. Confira os detalhes e escolha Aprovar.');
 }catch(e){
  ny26PendingEncrypted=null;$('secure-approve').disabled=true;
  secureStatus('⚠️ '+String(e.message||e));
 }finally{secureUpdateBusy=false;$('secure-check').disabled=false}
}
async function approveSecureUpdate(){
 if(role!=='admin'||!user||!ny26PendingEncrypted)throw Error('Não há atualização pendente validada.');
 if(!navigator.onLine)throw Error('É necessário estar online para aprovar.');
 const patch=window.NY26SecureUpdates.valid(ny26PendingEncrypted);
 if(!ny26V157BaseData)throw Error('Roteiro não carregado.');
 let base=ny26V157BaseData;
 if(ny26Day07Patch)base=window.NY26DayPatch.merge(base,ny26Day07Patch);
 window.NY26SecureUpdates.apply(base,[...ny26PrivatePatches,patch]);
 if(!confirm('Publicar no Firebase privado?\n\n'+patch.summary+
  '\n\nFeito, mala, ações e arquivos não serão substituídos.'))return;
 $('secure-approve').disabled=true;secureStatus('Enviando atualização para o Firebase privado…');
 const ref=db.collection('trips').doc(TRIP).collection('content').doc('private_update_'+patch.id);
 try{
  const existing=await ref.get({source:'server'});
  if(existing.exists)throw Error('Atualização já aplicada. Atualize o app.');
  const txt=JSON.stringify(patch);if(txt.length>=30000)throw Error('Arquivo de atualização muito grande.');
  await ref.set({version:patch.id,index:-1,count:1,text:txt,
   updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
  setPrivatePatches([...ny26PrivatePatches,patch]);ny26PendingEncrypted=null;markSecurePending(false);securePreview('');
  secureStatus('✅ Aplicada e sincronizada no Firebase privado. Sem substituir o roteiro-base ou anexos.');
 }catch(e){$('secure-approve').disabled=false;throw e}
}
$('secure-key-create').onclick=async()=>{
 $('secure-key-create').disabled=true;secureStatus('Ativando criptografia neste celular…');
 try{
  const key=await secureKeyInfo(true);
  secureStatus('✅ Chave pública pronta ('+key.keyId+'). Copie e envie uma única vez neste chat. Não compartilhe sua chave privada.');
 }catch(e){secureStatus('⚠️ '+String(e.message||e))}
 finally{$('secure-key-create').disabled=false}
};
$('secure-key-copy').onclick=async()=>{
 const raw=$('secure-public').value;if(!raw)return;
 try{await navigator.clipboard.writeText(raw);secureStatus('Chave pública copiada! Cole-a na conversa com o ChatGPT.')}
 catch{
  const field=$('secure-public');field.focus();field.select();
  try{document.execCommand('copy');secureStatus('Chave pública selecionada/copiada. Cole-a no chat.')}
  catch{secureStatus('Selecione e copie a chave pública manualmente.')}
 }
};
$('secure-check').onclick=()=>checkSecureInbox();
$('secure-approve').onclick=async()=>{try{await approveSecureUpdate()}catch(e){secureStatus('⚠️ '+String(e.message||e))}};
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
function refreshReadingLabel(message){
 const ui=window.NY26MobileUI,scale=ui?.currentScale?.()||1.1;
 $('font-current').textContent=Math.round(scale*100)+'%';
 $('font-smaller').disabled=scale<=0.901;
 $('font-larger').disabled=scale>=1.399;
 // Confirmacao visual enquanto a tela de configuracoes cobre o roteiro.
 const preview=$('font-preview');
 if(preview)preview.style.fontSize=(16*scale).toFixed(1)+'px';
 if(message)$msg('font-feedback',message);
}
function changeReadingScale(direction){
 const ui=window.NY26MobileUI;
 if(!ui){$msg('font-feedback','Atualize o NY26 para ativar o ajuste de fonte.');return}
 const before=ui.currentScale();
 const next=ui.fontValue(before+direction*0.1);
 if(next===before){refreshReadingLabel('Tamanho mínimo ou máximo atingido.');return}
 // Grava apenas a preferencia visual; nunca altera o conteudo privado.
 ui.setScale(document,next,true);
 const doc=$('viewer')?.contentDocument;
 let active=false;
 if(doc?.documentElement){
  try{ui.install(doc);ui.setScale(doc,next,false);active=true}
  catch(e){console.warn('Fonte do roteiro:',e)}
 }
 refreshReadingLabel('Fonte em '+Math.round(next*100)+'%.'+
  (active?' Alteração aplicada ao roteiro.':' A alteração será aplicada ao abrir o roteiro.'));
}
$('font-smaller').onclick=()=>changeReadingScale(-1);
$('font-larger').onclick=()=>changeReadingScale(1);
function settings(){show('settings');refreshReadingLabel();refresh();if(role==='admin')checkSecureInbox({quiet:true}).catch(e=>console.warn('Atualizações:',e))}
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
function tidyLegacyEmergencySupport(doc){
 if(!doc.getElementById('emergencia'))return;
 const apoio=doc.getElementById('apoio');
 if(!apoio)return;
 // Remove only legacy duplicate instructions; preserve hotels, maps, transport,
 // travel insurance and other support content.
 apoio.querySelector('.ny26-v140-critical')?.remove();
 apoio.querySelectorAll('.support-card').forEach(card=>{
  const head=card.querySelector('h3');
  if(!head||!/^🆘\s*Emergência/.test(head.textContent.trim()))return;
  head.textContent='🚨 Contatos e plano de emergência';
  const link=doc.createElement('a');link.href='#emergencia';
  link.textContent='Abrir Emergência: 911, consulados e plano de reencontro';
  for(const el of Array.from(card.children))if(el!==head)el.remove();
  card.appendChild(link);
 });
}
function openEmergency(){
 if(!user){show('setup');return}
 const frame=$('viewer'),doc=frame.contentDocument;
 if(!frameReady||!doc?.getElementById('emergencia')){
  $msg('settings-msg','A página de emergência ainda não está disponível. Abra o roteiro primeiro.');
  show('waiting');return;
 }
 document.body.classList.add('running');
 const win=frame.contentWindow,hash='#emergencia';
 if(win.location.hash!==hash)win.location.hash=hash;
 else win.dispatchEvent(new win.Event('hashchange'));
}
$('open-emergency').onclick=openEmergency;

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
$('v157-file').addEventListener('change',()=>{ny26V157Preview=null;ny26V157Backup=false;
 $('v157-backup').disabled=true;$('v157-apply').disabled=true;v157Message('Arquivo selecionado. Toque em Conferir pacote.');});
$('v157-preview').onclick=async()=>{try{await previewV157()}catch(e){v157Message('⚠️ '+String(e.message||e))}};
$('v157-backup').onclick=()=>{try{backupBeforeV157()}catch(e){v157Message('⚠️ '+String(e.message||e))}};
$('v157-apply').onclick=async()=>{try{await applyV157()}catch(e){v157Message('⚠️ '+String(e.message||e))}};
$('checklist-review-import').addEventListener('change',()=>{reviewPlan=null;reviewBackedUp=false;$('checklist-review-backup').disabled=true;$('checklist-review-apply').disabled=true;reviewStatus('Arquivo selecionado. Toque em Analisar revisão.');});
$('checklist-review-preview').onclick=async()=>{try{await reviewPreview()}catch(e){reviewStatus('⚠️ '+(e.message||e))}};
$('checklist-review-backup').onclick=async()=>{try{await reviewBackup()}catch(e){reviewStatus('⚠️ '+(e.message||e))}};
$('checklist-review-apply').onclick=async()=>{try{await reviewApply()}catch(e){reviewStatus('⚠️ '+(e.message||e));$('checklist-review-apply').disabled=false}};
$('publish-route').onclick=async()=>{try{await importRoute()}catch(e){error(e)}};
$('route-import').addEventListener('change',async()=>{if(!$('route-import').files?.length)return;try{await importRoute()}catch(e){error(e)}});
$('try-sync').onclick=()=>{if(user){subscribeContent();subscribeState()}refresh()};
$('check-update').onclick=async()=>{if(!registration){$msg('settings-msg','A instalação offline exige HTTPS.');return}try{await registration.update();$msg('settings-msg',registration.waiting?'Atualização pronta.':'Verificação concluída.')}catch(e){$msg('settings-msg','Não foi possível consultar o servidor.') }};
async function verifyLocalData(){
 if(!user){$msg('integrity-msg','Faça login antes de verificar dados.');return}
 const button=$('check-integrity');
 button.disabled=true;
 $msg('integrity-msg','Conferindo dados neste aparelho, sem modificar o armazenamento…');
 try{
  const doc=$('viewer').contentDocument;
  const boxes=[...(doc?.querySelectorAll('input.donecheck[data-step]')||[])];
  const complete=boxes.filter(x=>x.checked).length;
  let actions=0,packing=0;
  try{const a=JSON.parse(localStorage.getItem(K.actions)||'null');actions=Array.isArray(a?.tasks)?a.tasks.length:0}catch{}
  try{const p=JSON.parse(localStorage.getItem(K.packing)||'null');packing=Array.isArray(p?.items)?p.items.length:0}catch{}
  let docsLabel='Não verificado';
  try{
   // Consultar a existência sem criar um banco novo durante a conferência.
   if(typeof indexedDB.databases!=='function')docsLabel='Verificação de arquivos não suportada neste navegador';
   else{
    const names=await indexedDB.databases();
    if(!names.some(d=>d.name===DOCS_DB))docsLabel='nenhum banco privado de comprovantes encontrado';
    else{
     const handle=await openDocsDB();
     try{
      const record=await docsTransaction(handle,'readonly',TRIP+':'+user.uid);
      const counts=Object.values(record?.docs||{}).filter(Array.isArray).map(x=>x.length);
      docsLabel=counts.reduce((total,count)=>total+count,0)+' arquivos no banco local';
     }finally{handle.close()}
    }
   }
  }catch(e){docsLabel='Armazenamento local indisponível ('+(e?.name||'erro')+')'}
  const cached=Boolean(cachedRoute()?.html?.length>10000);
  const v157Key=v157CacheKey();
  const v157Cached=Boolean(v157Key&&localStorage.getItem(v157Key));
  $msg('integrity-msg','Conferência neste aparelho: '+complete+'/'+boxes.length+
    ' etapas marcadas Feito; '+actions+' Ações; '+packing+' itens de Mala; '+
    docsLabel+'; '+(cached?'roteiro base em cache':'roteiro base não localizado no cache')+'; '+
    (v157Cached?'guia v1.57 disponível offline':'guia v1.57 ainda não confirmado offline')+
    '. Isto não comprova que os PDFs abrem ou que as fotos estão completas: abra Comprovantes, verifique os QR codes e salve o backup no próprio celular.');
 }catch(e){
  $msg('integrity-msg','Não foi possível concluir a conferência: '+String(e.message||e)+'. Nenhum dado foi modificado.');
 }finally{button.disabled=false}
}
$('check-integrity').onclick=()=>verifyLocalData();
$('test-offline').onclick=async()=>{const c=cachedRoute();const names=await caches.keys().catch(()=>[]);const messages=[c?.html?.length>10000?'✓ Roteiro salvo':'✗ Roteiro ainda não armazenado',names.some(name=>name.startsWith('ny26-shell-gh-v'))?'✓ Estrutura em cache':'✗ App ainda não está em cache',user?'✓ Sessão ativa':'✗ Sem login'];
 $msg('settings-msg',messages.join(' · ')+' — faça também o teste real em modo avião nos dois aparelhos.');};
window.addEventListener('offline',refresh);window.addEventListener('online',()=>{refresh();registration?.update().catch(()=>{});if(role==='admin')checkSecureInbox({quiet:true}).catch(e=>console.warn('Atualizações:',e))});
boot();
})();
