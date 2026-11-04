/* NY26: readability + legacy label normalization. Presentation only.
   Never changes Firestore, itinerary IDs, Feito, photos, or attachments. */
(()=>{'use strict';
const KEY='ny26_readability_scale_v1';
const MIN=1,MAX=1.2,STEP=0.1;
const CSS=[
/* Safe defaults; do not reset the private itinerary's existing layout. */
'*{box-sizing:border-box}',
'img,video,canvas,svg{max-width:100%;height:auto}',
'.page,.daypage,article.step,article.step .stepcontent,.ny26-v157{min-width:0;max-width:100%}',
'body .stepcontent,body .sheet-text{overflow-wrap:break-word}',
':where(button,a,input,select,textarea,summary):focus-visible{outline:3px solid #1680b7!important;outline-offset:2px}',
'@media(max-width:768px){',
'html{-webkit-text-size-adjust:100%;text-size-adjust:100%}',
'body{font-size:calc(16px * var(--ny26-read-scale,1));line-height:1.55}',
'article.step .stepcontent{font-size:calc(16px * var(--ny26-read-scale,1))!important;line-height:1.55!important}',
'article.step .stepcontent p,article.step .stepcontent li,article.step .stepcontent .note,article.step .stepcontent .desc{font-size:calc(15.5px * var(--ny26-read-scale,1))!important;line-height:1.55!important}',
'article.step .place-link,article.step h3,article.step h2{font-size:calc(17px * var(--ny26-read-scale,1))!important;line-height:1.38!important;overflow-wrap:anywhere}',
'article.step .stepcontent .ny26-time-inline{font-size:calc(13.5px * var(--ny26-read-scale,1))!important;line-height:1.4!important}',
'article.step .actions,article.step .stepcontent .actions{display:flex;flex-wrap:wrap;gap:8px}',
'article.step .actions :is(a,button),article.step .stepcontent .actions :is(a,button){font-size:calc(14px * var(--ny26-read-scale,1))!important;min-height:44px!important;line-height:1.35!important;white-space:normal!important;overflow-wrap:anywhere;padding:10px 12px!important}',
'.ny26-v157{font-size:calc(15.5px * var(--ny26-read-scale,1))!important;line-height:1.55!important}',
'.ny26-v157 h3{font-size:calc(18px * var(--ny26-read-scale,1))!important;line-height:1.4!important}',
'.ny26-v157 :is(p,li,.ny26-v157-essentials p,.ny26-v157-risk li,.ny26-v157-step p,.ny26-v157-decision p,.ny26-v157-rhythm p,.ny26-v157-compare,.ny26-v157-inline p){font-size:calc(15px * var(--ny26-read-scale,1))!important;line-height:1.55!important}',
'.ny26-v157 :is(.ny26-v157-step summary,.ny26-v157-program>summary,.ny26-v157-risk>summary){font-size:calc(16px * var(--ny26-read-scale,1))!important;line-height:1.45!important;min-height:44px!important}',
'.ny26-v157 :is(.ny26-v157-essentials strong,.ny26-v157-tools strong,.ny26-v157-rhythm strong){font-size:calc(16px * var(--ny26-read-scale,1))!important}',
'.ny26-v157 :is(.ny26-v157-tools,.ny26-v157-food,.ny26-v157-food-primary,.ny26-v157-stage,.ny26-v157-decision-status){font-size:calc(14px * var(--ny26-read-scale,1))!important;line-height:1.5!important}',
'.ny26-v157 :is(.ny26-v157-jump,.ny26-v157-decision-actions button){font-size:calc(14.5px * var(--ny26-read-scale,1))!important;min-height:44px!important;line-height:1.4!important;white-space:normal!important;max-width:100%}',
'.ny26-v157 .ny26-v157-step,.ny26-v157 .ny26-v157-essentials,.ny26-v157 .ny26-v157-risk{min-width:0;overflow-wrap:anywhere}',
'.ny26-enhance,.ny26-menu-hint,.ny26-v157-inline{font-size:calc(14.5px * var(--ny26-read-scale,1))!important;line-height:1.55!important}',
'.ny26-enhance :is(p,li,summary),.ny26-menu-hint p{font-size:calc(14px * var(--ny26-read-scale,1))!important;line-height:1.55!important}',
'.ny26-enhance button,.ny26-live button,.ny26-choice-actions button{min-height:44px!important;font-size:calc(14px * var(--ny26-read-scale,1))!important}',
'.sheet-text,.sheet-text p,.sheet-text li,.sheet-content p,.sheet-content li{font-size:calc(15.5px * var(--ny26-read-scale,1))!important;line-height:1.55!important}',
'.sheet,.modal,.popup,.detail-modal{max-width:100%;overflow-wrap:anywhere}',
'.sheet :is(button,a),.modal :is(button,a),.popup :is(button,a),.document .docactions :is(button,a),.filebutton{min-height:44px}',
':is(input[type="text"],input[type="time"],input[type="search"],input[type="email"],input[type="number"],select,textarea){font-size:16px!important;max-width:100%;min-width:0}',
'.ny26-confirm-dialog{width:min(440px,100%);max-width:100%;padding:clamp(12px,3vw,19px)!important}',
'.ny26-confirm-dialog p,.ny26-confirm-dialog label{font-size:calc(15.5px * var(--ny26-read-scale,1))!important;line-height:1.5!important}',
'.ny26-confirm-actions button{font-size:calc(15px * var(--ny26-read-scale,1))!important;min-height:46px!important}',
'.nav,.daytabs,.tabs{max-width:100%;min-width:0}',
'.nav :is(a,button),.daytabs :is(a,button),.tabs :is(a,button){min-height:44px;font-size:calc(14px * var(--ny26-read-scale,1))!important}',
'}',
'@media(max-width:390px){',
'.ny26-v157{padding:10px!important}',
'.ny26-v157 :is(.ny26-v157-jump,.ny26-v157-decision-actions button){width:100%}',
'.ny26-v157-decision-actions{grid-template-columns:minmax(0,1fr)!important}',
'.ny26-confirm-actions{display:grid!important;grid-template-columns:1fr!important}',
'.ny26-confirm-actions button{width:100%;min-width:0}',
'}',
'@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;transition-duration:0.001ms!important}}'
].join('\n');
const legacy=/PLANO\s+OFICIAL\s*v\s*1[.,]40\b/gi;
const oldTitle=/ROTEIRO\s*\+\s*MALA\s*v\s*1[.,]40\b/gi;
function replacement(v){
 return String(v||'').replace(legacy,'ROTEIRO DO DIA').replace(oldTitle,'ROTEIRO E MALA');
}
function fontValue(raw){
 const n=Number(raw);
 if(!Number.isFinite(n))return 1;
 return Math.min(MAX,Math.max(MIN,Math.round(n*10)/10));
}
function currentScale(){
 try{return fontValue(localStorage.getItem(KEY)||1)}catch{return 1}
}
function setScale(doc,val,persist){
 const value=fontValue(val);
 if(doc?.documentElement)doc.documentElement.style.setProperty('--ny26-read-scale',String(value));
 if(persist){try{localStorage.setItem(KEY,String(value))}catch{}}
 return value;
}
function relabel(doc){
 if(!doc?.body)return 0;
 let changed=0;
 const walker=doc.createTreeWalker(doc.body,4);
 while(walker.nextNode()){
  const n=walker.currentNode;
  if(n.parentElement?.closest('script,style,textarea,code,pre'))continue;
  const next=replacement(n.nodeValue);
  if(next!==n.nodeValue){n.nodeValue=next;changed++}
 }
 for(const el of doc.querySelectorAll('[title],[aria-label]')){
  for(const attr of ['title','aria-label']){
   const current=el.getAttribute(attr);
   if(current===null)continue;
   const next=replacement(current);
   if(next!==current){el.setAttribute(attr,next);changed++}
  }
 }
 if(doc.title!==replacement(doc.title)){doc.title=replacement(doc.title);changed++}
 return changed;
}
function install(doc){
 if(!doc?.body)return 0;
 setScale(doc,currentScale(),false);
 if(!doc.getElementById('ny26-mobile-readability-css')){
  const style=doc.createElement('style');style.id='ny26-mobile-readability-css';
  style.textContent=CSS;doc.head.appendChild(style);
 }
 let changes=relabel(doc);
 if(!doc.__ny26LegacyLabelObserver&&typeof doc.defaultView?.MutationObserver==='function'){
  const observer=new doc.defaultView.MutationObserver(mutations=>{
   for(const mutation of mutations){
    if(mutation.type==='characterData'){
     const n=mutation.target;
     if(n.parentElement?.closest?.('script,style,textarea,code,pre'))continue;
     const next=replacement(n.nodeValue);
     if(next!==n.nodeValue)n.nodeValue=next;
    }else{
     for(const el of mutation.addedNodes||[]){
      if(el.nodeType===3){
       const next=replacement(el.nodeValue);if(next!==el.nodeValue)el.nodeValue=next;
      }else if(el.nodeType===1&&!(el.matches?.('script,style,textarea,code,pre'))){
       if(el.textContent?.length>0&&el.textContent.length<300&&/PLANO\s+OFICIAL\s*v\s*1[.,]40\b/i.test(el.textContent)){
        const walker=doc.createTreeWalker(el,4);
        while(walker.nextNode()){
         const n=walker.currentNode;
         if(n.parentElement?.closest?.('script,style,textarea,code,pre'))continue;
         const next=replacement(n.nodeValue);if(next!==n.nodeValue)n.nodeValue=next;
        }
       }
      }
     }
    }
   }
  });
  observer.observe(doc.body,{subtree:true,childList:true,characterData:true});
  doc.__ny26LegacyLabelObserver=observer;
 }
 return changes;
}
window.NY26MobileUI={install,relabel,setScale,currentScale,fontValue,replacement,version:'2026-11-04'};
})();