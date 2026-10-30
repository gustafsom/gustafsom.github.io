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
function sanitizeRouteHtml(source){
 // Documents loaded with iframe.srcdoc inherit the *parent URL as base*.
 // Without an explicit base, links such as #mala can navigate the iframe to
 // /ny26/#mala, recursively loading this application inside itself.
 let h=renameChildren(String(source||''));
 h=h.replace(/<script>\s*\/\*\s*NY26 v7[^\n]*\n[\s\S]*?<\/script>/gi,'');
 h=h.replace(/<head([^>]*)>/i,'<head$1><base href="about:srcdoc">');
 return h;
}

function installPdfPreview(doc){
 const section=doc.getElementById('documentos');
 if(!section||doc.getElementById('ny26-pdf-preview-style'))return;
 const css=doc.createElement('style');
 css.id='ny26-pdf-preview-style';
 css.textContent=[
 '#documentos .document .docactions{margin:14px 0 0;display:flex;flex-wrap:wrap;gap:12px}',
 '#documentos .document .docactions .doc-download{display:inline-flex;align-items:center;justify-content:center;min-height:46px;padding:10px 17px;border-radius:10px;background:#146a9a;color:#fff;border:1px solid #146a9a;text-decoration:none;font-size:14px;font-weight:800;touch-action:manipulation}',
 '#documentos .document .doc-remove{display:block!important;min-height:46px;margin:22px 0 4px auto;padding:10px 15px;border:1px solid #e7ada9;border-radius:10px;background:#fff1f0;color:#9c3333;font-size:13px;font-weight:700;touch-action:manipulation}',
 '#documentos .document .doc-note{font-size:12px;line-height:1.45}',
 '#ny26-pdf-overlay[hidden]{display:none!important}',
 '#ny26-pdf-overlay{position:fixed!important;inset:0!important;z-index:2147483647!important;display:flex!important;flex-direction:column!important;background:#fff!important;color:#17324a!important;box-sizing:border-box!important}',
 '#ny26-pdf-top{display:flex;flex-wrap:wrap;align-items:center;gap:9px;padding:12px;background:#102e4a;color:#fff;font:700 14px system-ui,sans-serif}',
 '#ny26-pdf-name{flex:1;min-width:120px;overflow-wrap:anywhere}',
 '#ny26-pdf-overlay button,#ny26-pdf-overlay a{font:700 13px system-ui,sans-serif;border-radius:9px;padding:11px 14px;text-decoration:none}',
 '#ny26-pdf-overlay button{background:#f0f8fc;color:#184966;border:0;cursor:pointer}',
 '#ny26-pdf-overlay a{background:#dceeff;color:#164766}',
 '#ny26-pdf-preview{border:0;flex:1;min-height:0;width:100%;background:#f3f6fa}',
 '#ny26-pdf-status{font:12px system-ui,sans-serif;padding:7px 12px;background:#eff5f8;color:#536879}'
 ].join('\n');
 doc.head.appendChild(css);
 const overlay=doc.createElement('section');
 overlay.id='ny26-pdf-overlay';overlay.hidden=true;overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Visualizador de comprovante PDF');
 const top=doc.createElement('div');top.id='ny26-pdf-top';
 const close=doc.createElement('button');close.type='button';close.textContent='← Fechar PDF';
 const name=doc.createElement('span');name.id='ny26-pdf-name';
 const external=doc.createElement('a');external.id='ny26-pdf-newtab';external.textContent='↗ Abrir no leitor';external.target='_blank';external.rel='noopener';external.hidden=true;
 top.append(close,name,external);
 const status=doc.createElement('div');status.id='ny26-pdf-status';
 status.textContent='Visualização do documento existente, sem baixar outro arquivo.';
 const viewer=doc.createElement('iframe');
 viewer.id='ny26-pdf-preview';viewer.title='Comprovante PDF';viewer.setAttribute('loading','eager');
 overlay.append(top,status,viewer);doc.body.appendChild(overlay);
 let currentURL=null,serial=0,previousScroll='';
 function dismiss(){
  serial++;
  viewer.removeAttribute('src');
  overlay.hidden=true;external.hidden=true;external.removeAttribute('href');
  doc.body.style.overflow=previousScroll;
  if(currentURL){doc.defaultView.URL.revokeObjectURL(currentURL);currentURL=null}
 }
 close.addEventListener('click',dismiss);
 doc.addEventListener('keydown',ev=>{if(ev.key==='Escape'&&!overlay.hidden)dismiss()});
 function labelLinks(){
  section.querySelectorAll('a.doc-download').forEach(link=>{
   link.removeAttribute('download');
   link.removeAttribute('target');
   link.textContent='👁️ Visualizar PDF';
   link.setAttribute('aria-label','Visualizar PDF sem baixar');
  });
  section.querySelectorAll('button.doc-remove').forEach(button=>{
   button.textContent='🗑️ Remover comprovante';
   button.setAttribute('aria-label','Remover comprovante (necessita confirmação)');
  });
 }
 labelLinks();
 const observer=new doc.defaultView.MutationObserver(records=>{
  if(records.some(r=>r.addedNodes.length&&Array.from(r.addedNodes).some(n=>n.nodeType===1&&n.closest?.('.proof-items')))){
   labelLinks();
  }
 });
 observer.observe(section,{subtree:true,childList:true});
 doc.addEventListener('click',async ev=>{
  const link=ev.target?.closest?.('a.doc-download');
  if(!link||!section.contains(link))return;
  ev.preventDefault();ev.stopPropagation();
  const data=link.getAttribute('href')||'';
  if(!/^data:application\/pdf(?:;[^,]*)?,/i.test(data)){status.textContent='Este anexo não contém um PDF incorporado válido.';return}
  const documentBox=link.closest('.document');
  const title=documentBox?.getAttribute('data-name')||'Comprovante PDF';
  dismiss();
  const token=++serial;
  previousScroll=doc.body.style.overflow;
  doc.body.style.overflow='hidden';overlay.hidden=false;
  name.textContent=title;status.textContent='Preparando o arquivo incorporado para visualização…';
  try{
   // Converte o PDF já embutido em Blob. Não cria um novo arquivo salvo no celular.
   const response=await doc.defaultView.fetch(data);
   const blob=await response.blob();
   if(token!==serial)return;
   if(blob.type!=='application/pdf'&&blob.size===0)throw Error('Documento vazio');
   currentURL=doc.defaultView.URL.createObjectURL(new Blob([blob],{type:'application/pdf'}));
   viewer.src=currentURL+'#toolbar=1';
   external.href=currentURL;external.hidden=false;
   status.textContent='Este PDF já estava anexado. Se a prévia ficar em branco no iPhone, toque em “Abrir no leitor”. Nenhum novo download é solicitado.';
  }catch(e){
   if(token===serial){status.textContent='Não foi possível pré-visualizar este PDF. Verifique o documento original.';console.warn('PDF preview',e)}
  }
 },true);
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
  try{installPdfPreview(doc)}catch(e){console.warn('Visualizador de PDF:',e)}
  // A area Fotos do local aceita imagens; comprovantes PDF ficam em Docs.
  // Sao incorporados ao HTML local, nao sincronizados automaticamente entre contas.
  const docsSection=doc.getElementById('documentos');
  if(docsSection&&!doc.getElementById('ny26-pdf-info')){
    const help=doc.createElement('p');
    help.id='ny26-pdf-info';
    help.style.cssText='background:#fff3d7;border:1px solid #e8cb89;border-radius:9px;padding:12px;font:13px/1.45 system-ui,sans-serif;color:#5d451f;margin:12px 0';
    help.textContent='📎 PDFs: toque em “Adicionar PDF ou imagem” na categoria correspondente. Atenção: o PDF fica somente nesta cópia do roteiro; o indicador “Sincronizado” se refere às listas, não aos comprovantes. Para compartilhar, salve o HTML atualizado e importe-o novamente pelo administrador. PDFs grandes podem exceder o limite de importação; mantenha também os originais salvos no iPhone e Android.';
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
