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
function read(domain){try{const o=JSON.parse(localStorage.getItem(K[domain])||'null');return o&&Array.isArray(o[domain==='actions'?'tasks':'items'])?o:null}catch{return null}}
function toMap(o,d){return Object.fromEntries((o?.[d==='actions'?'tasks':'items']||[]).filter(x=>x&&typeof x.id==='string').map(x=>[x.id,x]))}
function save(domain,map){const key=domain==='actions'?'tasks':'items';localStorage.setItem(K[domain],JSON.stringify({[key]:Object.values(map),updated:Date.now()}))}
function same(a,b){return JSON.stringify(a)===JSON.stringify(b)}
function cachedRoute(){try{return JSON.parse(localStorage.getItem(K.route)||'null')}catch{return null}}
function refresh(){let s,t='wait';if(!navigator.onLine)s='📵 Offline';else if(pending)s='⏳ Enviando';else if(fromCache)s='🟡 Cache local';else if(lastServer){s='✅ Sincronizado';t='good'}else s='☁️ Conectando';banner(s,t);
 $msg('sync-explanation',(lastServer?'Último retorno confirmado do servidor: '+new Date(lastServer).toLocaleString('pt-BR')+'. ':'Ainda sem confirmação do servidor. ')+(pending?'Há alterações aguardando envio. ':'')+'Alterações entre celulares exigem internet.');
}
function openFrame(html){const frame=$('viewer');frameReady=false;frame.onload=()=>{frameReady=true;for(const d of ['actions','packing'])lastMaps[d]=toMap(read(d),d);
 try{frame.contentDocument.addEventListener('ny26:data-change',e=>localChanged(e.detail?.domain));
 if(role==='viewer'){const style=frame.contentDocument.createElement('style');style.textContent='#ck-add,#pk-add,#ck-editor,#pk-editor,[data-ck-edit],[data-ck-remove],[data-pk-edit],[data-pk-delete],[data-pk-stage]{pointer-events:none!important;opacity:.5}';frame.contentDocument.head.appendChild(style)}
 }catch(e){console.warn('Inicialização da ficha:',e)}
 if(window.ny26Snapshot)applySnapshot(window.ny26Snapshot);
};frame.srcdoc=html;document.body.classList.add('running');refresh();
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
 for(const d of snap.docs){const v=d.data();if(remote[v.domain]&&v.value&&typeof v.value.id==='string')remote[v.domain][v.value.id]=v}
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
 db.collection('trips').doc(TRIP).collection('state').doc(doc).set({domain,value,deleted,device,updatedAt:firebase.firestore.FieldValue.serverTimestamp()})
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
async function boot(){serviceWorker();const cfg=window.NY26_FIREBASE_CONFIG;
 if(!cfg||!cfg.apiKey||!cfg.projectId||!cfg.appId||!window.firebase?.initializeApp){$('config-missing').classList.remove('hide');banner('⚙️ Ativação pendente','wait');return}
 try{firebase.initializeApp(cfg);auth=firebase.auth();await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);db=firebase.firestore();
 try{await db.enablePersistence({synchronizeTabs:true})}catch(e){console.warn('Persistência local falhou',e);$msg('message','Aviso: o armazenamento offline deste navegador não pôde ser ativado.')}
 $('login').classList.remove('hide');auth.onAuthStateChanged(async u=>{clear();if(u)await logged(u);else{user=null;role='';show('setup');banner('🔒 Entrar','wait')}},error);
 }catch(e){error(e)}
}
$('login-form').onsubmit=async ev=>{ev.preventDefault();try{$msg('message','');await auth.signInWithEmailAndPassword($('email').value.trim(),$('password').value)}catch(e){error('Login: '+e.message)}};
$('show-settings').onclick=()=>user?settings():show('setup');$('open-settings').onclick=settings;
$('home').onclick=()=>{$('viewer').srcdoc?document.body.classList.add('running'):show('waiting')};
$('logout').onclick=async()=>{if(!confirm('Sair da conta neste aparelho?'))return;clear();await auth.signOut();show('setup')};
$('publish-route').onclick=async()=>{try{await importRoute()}catch(e){error(e)}};
$('route-import').addEventListener('change',async()=>{if(!$('route-import').files?.length)return;try{await importRoute()}catch(e){error(e)}});
$('try-sync').onclick=()=>{if(user){subscribeContent();subscribeState()}refresh()};
$('check-update').onclick=async()=>{if(!registration){$msg('settings-msg','A instalação offline exige HTTPS.');return}try{await registration.update();$msg('settings-msg',registration.waiting?'Atualização pronta.':'Verificação concluída.')}catch(e){$msg('settings-msg','Não foi possível consultar o servidor.') }};
$('test-offline').onclick=async()=>{const c=cachedRoute();const names=await caches.keys().catch(()=>[]);const messages=[c?.html?.length>10000?'✓ Roteiro salvo':'✗ Roteiro ainda não armazenado',names.includes('ny26-shell-gh-v1')?'✓ Estrutura em cache':'✗ App ainda não está em cache',user?'✓ Sessão ativa':'✗ Sem login'];
 $msg('settings-msg',messages.join(' · ')+' — faça também o teste real em modo avião nos dois aparelhos.');};
window.addEventListener('offline',refresh);window.addEventListener('online',()=>{refresh();registration?.update().catch(()=>{})});
boot();
})();
