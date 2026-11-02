/* NY26 place photos: private, persistent, offline-friendly, not in Firestore or public repository. */
(function(){
 'use strict';
 const DB_NAME='ny26-private-place-photos-v1',STORE='images',MAX_MB=10,MAX_PER_STEP=15;
 function openDb(){
  return new Promise((resolve,reject)=>{
   if(!('indexedDB' in window)){reject(Error('Armazenamento de fotos indisponível neste navegador.'));return}
   const req=indexedDB.open(DB_NAME,1);
   req.onupgradeneeded=()=>{
    const db=req.result;
    if(!db.objectStoreNames.contains(STORE)){
     const store=db.createObjectStore(STORE,{keyPath:'id'});
     store.createIndex('byOwner','owner',{unique:false});
    }
   };
   req.onerror=()=>reject(req.error||Error('Não foi possível abrir o armazenamento.'));
   req.onsuccess=()=>resolve(req.result);
  });
 }
 function readOwner(db,owner){
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readonly'),req=tx.objectStore(STORE).index('byOwner').getAll(owner);
   req.onsuccess=()=>resolve(req.result||[]);
   req.onerror=()=>reject(req.error||Error('Não foi possível ler as fotos salvas.'));
  });
 }
 function mutate(db,mode,record){
  return new Promise((resolve,reject)=>{
   const tx=db.transaction(STORE,'readwrite'),store=tx.objectStore(STORE);
   if(mode==='put')store.put(record);
   else store.delete(record.id);
   tx.oncomplete=()=>resolve();
   tx.onerror=()=>reject(tx.error||Error('Não foi possível gravar a foto.'));
   tx.onabort=()=>reject(tx.error||Error('Gravação da foto interrompida.'));
  });
 }
 function uid(){
  return 'img-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,12);
 }
 function validImage(blob){
  return blob&&/^image\/(png|jpeg|webp|gif)$/i.test(blob.type);
 }
 function getPhotoSection(input){
  return input.closest('.sheet-section');
 }
 async function legacyEmbeddedPhoto(doc,db,owner,step,existing){
  if(existing.length)return null;
  const cover=doc.querySelector('[data-photo-cover="'+step+'"]');
  const image=cover?.querySelector('img.photo');
  if(!image||!image.src||!image.src.startsWith('data:image/'))return null;
  try{
   const res=await doc.defaultView.fetch(image.src);
   const blob=await res.blob();
   if(!validImage(blob))return null;
   const record={id:owner+'::'+step+'::legacy',owner,step,name:'Foto recuperada da versão anterior',blob,addedAt:Date.now()};
   await mutate(db,'put',record);
   return record;
  }catch(e){console.warn('NY26: não foi possível importar foto antiga:',e);return null}
 }
 function install(doc,owner){
  if(!owner||!doc?.querySelectorAll||doc.getElementById('ny26-place-photo-style'))return;
  const win=doc.defaultView;
  const inputs=Array.from(doc.querySelectorAll('input[data-photo-upload]'));
  if(!inputs.length)return;
  const css=doc.createElement('style');css.id='ny26-place-photo-style';
  css.textContent=[
   '.ny26-photo-gallery{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin:11px 0}',
   '.ny26-photo-item{background:#f5f9fc;border:1px solid #cbdde9;padding:9px;border-radius:11px;min-width:0;display:flex;flex-direction:column;gap:8px}',
   '.ny26-photo-thumb{width:100%;border:0;border-radius:8px;background:#dceaf4;padding:0;cursor:pointer;overflow:hidden;min-height:115px;display:block}',
   '.ny26-photo-thumb img{display:block;width:100%;height:145px;object-fit:contain;background:#fff}',
   '.ny26-photo-name{font-size:12px;font-weight:700;overflow-wrap:anywhere;color:#294b61;line-height:1.3}',
   '.ny26-photo-item-actions{display:flex;gap:8px;flex-wrap:wrap}',
   '.ny26-photo-item-actions button{border-radius:9px;min-height:42px;padding:9px 11px;font:700 12px system-ui,sans-serif;cursor:pointer}',
   '.ny26-photo-view{background:#16658e!important;border:1px solid #16658e!important;color:white!important}',
   '.ny26-photo-delete{background:#fff1f0!important;border:1px solid #e7b9b5!important;color:#912d2d!important}',
   '.ny26-photo-status{font:12px/1.4 system-ui,sans-serif;color:#235b73;min-height:18px;margin:8px 0}',
   '.ny26-photo-hint{font:12px/1.5 system-ui,sans-serif;color:#527184;margin:8px 0}',
   '.ny26-photo-toplink{display:inline-flex;align-items:center;min-height:43px;margin:10px 0 4px;border:1px solid #8cbad1;background:#e9f4fa;color:#14567b;padding:10px 13px;border-radius:10px;font:700 13px system-ui,sans-serif;cursor:pointer}',
   '#ny26-place-photo-dialog{width:min(96vw,1100px);max-width:96vw;max-height:95dvh;margin:auto;padding:10px;border:0;border-radius:12px;box-shadow:0 10px 45px #0008;background:#10212d;color:#fff}',
   '#ny26-place-photo-dialog::backdrop{background:#000b}',
   '#ny26-place-photo-dialog .ny26-lightbox-bar{display:flex;align-items:center;justify-content:space-between;gap:12px;margin:0 0 8px}',
   '#ny26-place-photo-dialog .ny26-lightbox-title{font:600 13px system-ui,sans-serif;overflow-wrap:anywhere}',
   '#ny26-place-photo-dialog .ny26-lightbox-bar button{min-height:44px;padding:9px 12px;background:#e9f4fa;border:0;border-radius:9px;color:#173b53;font:700 13px system-ui,sans-serif}',
   '#ny26-place-photo-dialog .ny26-lightbox-picture{display:block;width:100%;max-height:calc(95dvh - 100px);overflow:auto;text-align:center;overscroll-behavior:contain}',
   '#ny26-place-photo-dialog img{max-width:100%;max-height:calc(95dvh - 115px);width:auto;height:auto;object-fit:contain;cursor:zoom-in;touch-action:pan-x pan-y pinch-zoom}',
   '#ny26-place-photo-dialog img.ny26-zoomed{max-width:none;max-height:none;width:auto;cursor:zoom-out}',
   '#ny26-place-photo-dialog .ny26-lightbox-bar a{color:#e7f2fd;font:700 12px system-ui,sans-serif}',
   '@media(max-width:540px){.ny26-photo-gallery{grid-template-columns:1fr}.ny26-photo-thumb img{height:180px}}'
  ].join('\n');doc.head.appendChild(css);
  const modal=doc.createElement('dialog');modal.id='ny26-place-photo-dialog';
  modal.setAttribute('aria-label','Foto ou mapa ampliado');
  const bar=doc.createElement('div');bar.className='ny26-lightbox-bar';
  const title=doc.createElement('span');title.className='ny26-lightbox-title';
  const original=doc.createElement('a');original.target='_blank';original.rel='noopener noreferrer';original.textContent='↗ Abrir original';
  const close=doc.createElement('button');close.type='button';close.textContent='✕ Fechar';
  const picture=doc.createElement('div');picture.className='ny26-lightbox-picture';
  const image=doc.createElement('img');image.alt='Foto ampliada';picture.appendChild(image);
  bar.append(title,original,close);modal.append(bar,picture);doc.body.appendChild(modal);
  close.addEventListener('click',()=>modal.close?.());
  modal.addEventListener('click',ev=>{if(ev.target===modal)modal.close?.()});
  image.addEventListener('click',()=>{image.classList.toggle('ny26-zoomed');picture.scrollTop=0;picture.scrollLeft=0});
  const saved=new Map(),urls=new Map(),sections=new Map(),statusMap=new Map(),galleryMap=new Map(),buttons=new Map(),openGallery=new Map();
  let db=null;
  function imageUrl(record){
   if(!urls.has(record.id))urls.set(record.id,win.URL.createObjectURL(record.blob));
   return urls.get(record.id);
  }
  function release(id){if(urls.has(id)){win.URL.revokeObjectURL(urls.get(id));urls.delete(id)}}
  function photosOf(step){return (saved.get(step)||[]).slice().sort((a,b)=>a.addedAt-b.addedAt)}
  function openPhoto(record){
   const url=imageUrl(record);title.textContent=record.name||'Foto do local';
   image.classList.remove('ny26-zoomed');image.src=url;image.alt=record.name||'Foto ampliada';
   original.href=url;
   if(typeof modal.showModal==='function')modal.showModal();
   else modal.setAttribute('open','');
  }
  function update(step){
   const target=galleryMap.get(step),area=statusMap.get(step),input=buttons.get(step);
   if(!target)return;
   const records=photosOf(step);
   target.replaceChildren();
   for(const record of records){
    const row=doc.createElement('div');row.className='ny26-photo-item';
    const thumb=doc.createElement('button');thumb.type='button';thumb.className='ny26-photo-thumb';
    thumb.setAttribute('aria-label','Ampliar '+record.name);
    const img=doc.createElement('img');img.src=imageUrl(record);img.loading='lazy';img.alt=record.name;
    thumb.appendChild(img);thumb.addEventListener('click',()=>openPhoto(record));
    const name=doc.createElement('span');name.className='ny26-photo-name';name.textContent='📷 '+record.name;
    const actions=doc.createElement('div');actions.className='ny26-photo-item-actions';
    const view=doc.createElement('button');view.type='button';view.className='ny26-photo-view';view.textContent='🔎 Ampliar';
    view.addEventListener('click',()=>openPhoto(record));
    const remove=doc.createElement('button');remove.type='button';remove.className='ny26-photo-delete';remove.textContent='🗑️ Remover';
    remove.addEventListener('click',async()=>{
     if(!win.confirm('Remover a foto "'+record.name+'" deste aparelho?'))return;
     if(!db){area.textContent='⚠️ O armazenamento ainda não está disponível.';return}
     remove.disabled=true;
     try{
      await mutate(db,'delete',record);
      saved.set(step,photosOf(step).filter(x=>x.id!==record.id));release(record.id);update(step);
      area.textContent='Foto removida somente deste aparelho.';
     }catch(e){area.textContent='⚠️ Não foi possível remover: '+e.message;remove.disabled=false}
    });
    actions.append(view,remove);row.append(thumb,name,actions);target.appendChild(row);
   }
   if(!records.length){
    const empty=doc.createElement('p');empty.className='ny26-photo-hint';
    empty.textContent='Nenhuma imagem anexada. Selecione uma foto ou mapa para visualizar aqui, inclusive offline.';
    target.appendChild(empty);
   }
   if(area.dataset.ny26Busy!=='1'){
    area.textContent=records.length?records.length+' imagem(ns) guardada(s) neste aparelho. Toque na miniatura para ampliar.':'Nenhuma foto salva nesta parada.';
   }
   const shortcut=openGallery.get(step);
   if(shortcut){
    shortcut.textContent=records.length?(step==='etapa-1-1'?'🗺️ Ver mapa do AirTrain ('+records.length+')':'📷 Ver fotos ('+records.length+')'):
     (step==='etapa-1-1'?'🗺️ Anexar mapa do AirTrain':'📷 Adicionar foto');
   }
   // Thumbnail on the cover is only a visual cue. The gallery below is the
   // authoritative, visible entry point to all images.
   const cover=doc.querySelector('[data-photo-cover="'+step+'"]');
   if(cover&&records.length){
    let coverImg=cover.querySelector('img.photo');
    if(!coverImg){coverImg=doc.createElement('img');coverImg.className='photo';coverImg.alt='Foto anexada nesta parada';cover.prepend(coverImg)}
    coverImg.src=imageUrl(records[0]);coverImg.classList.remove('photo-remote');
   }
   if(input)input.disabled=!db;
  }
  for(const input of inputs){
   const step=input.getAttribute('data-photo-upload'),section=getPhotoSection(input);
   if(!step||!section||sections.has(step))continue;
   sections.set(step,section);buttons.set(step,input);
   const description=section.querySelector('.sheet-photo-tools');
   if(description)description.textContent='Fotos e mapas anexados ficam disponíveis logo abaixo. Toque na miniatura para ampliar. São guardados neste aparelho, mesmo após atualizar o roteiro.';
   const gallery=doc.createElement('div');gallery.className='ny26-photo-gallery';gallery.setAttribute('data-photo-gallery',step);
   const area=doc.createElement('p');area.className='ny26-photo-status';area.setAttribute('role','status');area.setAttribute('aria-live','polite');area.textContent='Carregando fotos deste aparelho…';
   section.insertBefore(gallery,input.closest('label')||input);
   gallery.insertAdjacentElement('afterend',area);
   galleryMap.set(step,gallery);statusMap.set(step,area);
   const sheet=section.closest('.place-sheet');
   const sheetActions=sheet?.querySelector('.sheet-actions');
   if(sheetActions){
    const shortcut=doc.createElement('button');shortcut.type='button';shortcut.className='ny26-photo-toplink';
    shortcut.setAttribute('data-photo-shortcut',step);
    shortcut.textContent=step==='etapa-1-1'?'🗺️ Anexar mapa do AirTrain':'📷 Adicionar foto';
    shortcut.addEventListener('click',()=>{
     const first=photosOf(step)[0];
     if(first)openPhoto(first);
     else input.click();
    });
    sheetActions.appendChild(shortcut);openGallery.set(step,shortcut);
   }
   input.disabled=true;
  }
  function warnAll(message){for(const area of statusMap.values())area.textContent='⚠️ '+message}
  const ready=openDb().then(async database=>{
   db=database;
   const all=await readOwner(db,owner);
   for(const record of all){
    if(!record||!record.step||!validImage(record.blob))continue;
    if(!saved.has(record.step))saved.set(record.step,[]);
    saved.get(record.step).push(record);
   }
   for(const step of sections.keys()){
    const imported=await legacyEmbeddedPhoto(doc,db,owner,step,photosOf(step));
    if(imported){if(!saved.has(step))saved.set(step,[]);saved.get(step).push(imported)}
    update(step);
   }
   return db;
  }).catch(e=>{warnAll('Fotos não disponíveis: '+e.message+'. Não apague os arquivos originais.');console.warn('NY26 photos',e);throw e});
  // Capture before the legacy v1.40 handler. It only updated the cover in
  // memory and reported false success without persisting the image.
  doc.addEventListener('change',async ev=>{
   const input=ev.target?.closest?.('input[data-photo-upload]');
   if(!input)return;
   ev.stopPropagation();ev.stopImmediatePropagation();
   const step=input.getAttribute('data-photo-upload'),area=statusMap.get(step);
   const files=Array.from(input.files||[]);input.value='';
   if(!area||!files.length)return;
   area.dataset.ny26Busy='1';area.textContent='Salvando foto no aparelho…';input.disabled=true;
   try{
    await ready;
    if(photosOf(step).length>=MAX_PER_STEP)throw Error('Limite de '+MAX_PER_STEP+' imagens nesta parada.');
    for(const file of files.slice(0,MAX_PER_STEP-photosOf(step).length)){
     if(!validImage(file))throw Error('Use imagem JPG, PNG, WEBP ou GIF. Outros formatos podem não abrir no Android.');
     if(file.size>MAX_MB*1024*1024)throw Error('Imagem maior que '+MAX_MB+' MB. Use uma versão menor.');
     const record={id:owner+'::'+step+'::'+uid(),owner,step,name:String(file.name||'Foto').slice(0,180),blob:file,addedAt:Date.now()};
     // Only report success after transaction commits.
     await mutate(db,'put',record);
     if(!saved.has(step))saved.set(step,[]);
     saved.get(step).push(record);
    }
    area.dataset.ny26Busy='0';update(step);
    area.textContent='✅ Foto guardada neste aparelho! Veja a miniatura abaixo ou toque em “Ver fotos / mapa”.';
   }catch(e){area.dataset.ny26Busy='0';update(step);area.textContent='⚠️ Foto não salva: '+e.message;console.warn('NY26 photo upload',e)}
   finally{input.disabled=!db}
  },true);
  win.addEventListener('pagehide',()=>{
   for(const id of urls.keys())release(id);
   db?.close();
  },{once:true});
  return ready;
 }
 window.NY26Photos={install};
})();
