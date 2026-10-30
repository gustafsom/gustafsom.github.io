/* Somente a estrutura é pública; dados privados ficam em Firebase/armazenamento local. */
const CACHE='ny26-shell-gh-v10';
const SHELL=['./','./index.html','./app.js','./config.js','./manifest.webmanifest','./icon.svg'];
const LIBS=['https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js','https://www.gstatic.com/firebasejs/10.14.1/firebase-auth-compat.js','https://www.gstatic.com/firebasejs/10.14.1/firebase-firestore-compat.js'];
self.addEventListener('install',ev=>ev.waitUntil((async()=>{
 const c=await caches.open(CACHE);await c.addAll(SHELL);
 // SDK terceirizado: guarda resposta opaque; se alguma biblioteca falhar,
 // não apresenta a PWA como totalmente offline.
 for(const url of LIBS){try{const r=await fetch(url,{mode:'no-cors'});await c.put(url,r)}catch(e){console.warn('SDK nao armazenado para offline',url,e)}}
})()));
self.addEventListener('activate',ev=>ev.waitUntil((async()=>{
 for(const k of await caches.keys())if(k.startsWith('ny26-shell-gh-')&&k!==CACHE)await caches.delete(k);
 await self.clients.claim();
})()));
self.addEventListener('fetch',ev=>{
 if(ev.request.method!=='GET')return;
 const u=new URL(ev.request.url);
 const ours=u.origin===self.location.origin&&u.pathname.startsWith('/ny26/');
 if(!ours&&!LIBS.includes(u.href))return;
 ev.respondWith((async()=>{
  const c=await caches.open(CACHE);
  // Arquivos proprios: online-first para atualizar automaticamente.
  // Sem rede, usar o ultimo recurso preservado no aparelho.
  if(ours){
   try{const r=await fetch(ev.request,{cache:'no-store'});if(r.ok){await c.put(ev.request,r.clone());return r}}catch{}
  }
  const old=await c.match(ev.request,{ignoreSearch:true});if(old)return old;
  try{const r=await fetch(ev.request);if(r.ok||r.type==='opaque')await c.put(ev.request,r.clone());return r}
  catch{return ours&&ev.request.mode==='navigate'?await c.match('./index.html')||Response.error():Response.error()}
 })());
});
self.addEventListener('message',ev=>{if(ev.data?.type==='SKIP_WAITING')self.skipWaiting()});
