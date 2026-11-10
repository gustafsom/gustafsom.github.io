/* Uses the latest authenticated route HTML, never a public copy of the itinerary. */
(()=>{'use strict';
const DAY='2026-11-10',norm=x=>String(x||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,' ').trim(),trim=x=>String(x||'').replace(/\s+/g,' ').trim();
const timeRe=/(?:^|[^\d])((?:[01]?\d|2[0-3]))[:h]([0-5]\d)(?=[^\d]|$)/i;
function minute(value){const m=timeRe.exec(trim(value));return m?+m[1]*60+(+m[2]):null}
function title(card){return trim(card.querySelector('.place-link')?.textContent||card.querySelector('h3,h2,.stepname,.place-name')?.textContent||card.dataset?.title)}
function originalTime(card){
 for(const css of ['.ny26-time-inline','.time','.step-time','.stepwhen','.when','.slot','time']){
  const s=trim(card.querySelector(css)?.textContent);if(minute(s)!==null)return s.slice(0,85)
 }
 return '';
}
function match(a,b){
 const A=norm(a),B=norm(b);if(!A||!B)return 0;if(A===B)return 100;
 if(Math.min(A.length,B.length)>9&&(A.includes(B)||B.includes(A)))return 9;
 const bad=new Set(['the','for','new','york','de','da','do','dos','com','para','opcional','exterior','fotos','foto','parada','hotel']);
 const x=new Set(A.split(' ').filter(w=>w.length>=3&&!bad.has(w)));
 const y=new Set(B.split(' ').filter(w=>w.length>=3&&!bad.has(w)));
 const common=[...x].filter(z=>y.has(z)).length;
 return common>=2&&common/Math.max(x.size,y.size)>=.7?7:0;
}
function referenceStops(pack){
 const d=pack?.days?.find(d=>d.date===DAY);if(!d)return [];
 const output=[],seen=new Set();
 for(const p of [...(d.stops||[]),...(d.places||[])]){
  const k=norm(p?.title);if(k&&!seen.has(k)){output.push(p);seen.add(k)}
 }
 return output;
}
function findRef(t,records,used){
 let found=null,score=0;
 for(const rec of records){if(used.has(rec))continue;
  const n=match(t,rec.title);if(n>score){found=rec;score=n}}
 if(score<7)return null;used.add(found);return found;
}
function fallbackMinute(name,index,total){
 const venue=window.NY26NYCPlaces?.lookup(name);
 if(Number.isFinite(venue?.minutes))return venue.minutes;
 const t=norm(name);
 if(/the chelsean|springhill suites|volta.*hotel|retorno.*hotel/.test(t))return index===0?510:1100;
 if(/almoco|lunch/.test(t))return 790;
 if(/starbucks|cafe/.test(t))return 665;
 if(/supermercado|lidl|five below|target/.test(t))return 1050;
 if(/retorno|voltar|metro.*hotel/.test(t))return 1100;
 return null;
}
function sortedEntries(items){
 const a=items.map((e,i)=>{
  const clock=minute(e.originalTime)??minute(e.reference?.time);
  const guessed=fallbackMinute(e.title,i,items.length);
  return {...e,origin:i,exactMinute:clock,sortMinute:clock??guessed};
 });
 for(let i=0;i<a.length;i++)if(a[i].sortMinute===null){
  let left=-1,right=a.length;
  for(let j=i-1;j>=0;j--)if(a[j].sortMinute!==null){left=j;break}
  for(let j=i+1;j<a.length;j++)if(a[j].sortMinute!==null){right=j;break}
  if(left>=0&&right<a.length)a[i].sortMinute=a[left].sortMinute+(a[right].sortMinute-a[left].sortMinute)*(i-left)/(right-left);
  else if(left>=0)a[i].sortMinute=a[left].sortMinute+3*(i-left);
  else if(right<a.length)a[i].sortMinute=a[right].sortMinute-3*(right-i);
  else a[i].sortMinute=540+10*i;
 }
 // Compras de retorno: manter a sequência logística aprovada, não horários
 // desatualizados do HTML antigo (que ainda colocam Lidl antes das novas lojas).
 const phase=name=>{
  const n=norm(name);
  if(/burlington|marshalls|tj maxx|t j maxx|t j maxx/.test(n))return 1;
  if(/five below/.test(n))return 2;
  if(/lidl/.test(n))return 3;
  if(/the chelsean.*retorno|retorno.*the chelsean/.test(n))return 4;
  return 0;
 };
 const cluster=a.filter(x=>phase(x.title)>0);
 if(cluster.some(x=>phase(x.title)===1||phase(x.title)===2)){
  const anchor=a.find(x=>/madison square garden|\bmsg\b/i.test(norm(x.title)))||
   a.find(x=>/moynihan|train hall/i.test(norm(x.title)))||
   a.find(x=>/hudson yards/i.test(norm(x.title)));
  const anchorTime=anchor?.sortMinute??1035;
  for(const entry of cluster){
   const p=phase(entry.title);
   entry.sortMinute=anchorTime+p*.15;
   if(p===3)entry.displayTime='Após as lojas da Sixth Avenue • flexível';
   if(p===4)entry.displayTime='Depois das compras • flexível';
  }
 }
 return a.sort((x,y)=>x.sortMinute-y.sortMinute||x.origin-y.origin);
}
function description(item){
 const ref=item.reference||{},v=window.NY26NYCPlaces?.lookup(item.title);
 // Prefer the user's freshly updated PRIVATE HTML description over older references.
 const root=item.card?.querySelector('.stepcontent');
 const suggestions=root?[...root.querySelectorAll('.what-to-do,.step-description,.place-description,.description,.desc,p,.note')]:[];
 const existing=suggestions.map(el=>trim(el.textContent)).find(value=>value.length>=28&&
  !/^(?:feito|gps|comprovante|foto|abra no maps|abrir mapa|clique aqui|adicionar pdf)/i.test(value));
 if(existing)return existing.slice(0,420);
 const own=trim(ref.instructions||ref.look||ref.why);
 if(own)return own.slice(0,420);
 if(v?.do)return v.do;
 const n=norm(item.title);
 if(/cafe|starbucks/.test(n))return 'Parar rapidamente para café, se não houver fila; confira os preços.';
 if(/pizza|almoco|lanche|jantar/.test(n))return 'Escolher uma refeição simples e econômica, conferindo os preços e evitando filas.';
 if(/loja|mercado|lidl|five below|target|compras/.test(n))return 'Entrar somente se conveniente, procurar itens úteis e evitar desvio longo.';
 if(/hotel|retorno/.test(n))return 'Retornar ao hotel, descansar e guardar as compras.';
 return 'Conhecer o local e tirar fotos. Consulte também a descrição já presente neste card.';
}
function gps(doc,item){
 const prior=item.card?.querySelector('a[href*="google.com/maps"],a[href*="maps.app.goo.gl"],a[href*="maps.apple.com"]');
 const v=window.NY26NYCPlaces?.lookup(item.title);
 const address=trim(item.reference?.address||v?.address);
 // Explicitly approved private change outranks an older link from the original HTML.
 let href=item.reference?.privateUpdateId&&item.reference?.address?'':prior?.href||'',text='📍 GPS • Google Maps';
 if(!href&&address)href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(address)+'&travelmode=walking';
 if(!href){href='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(item.title+', New York, NY');text='🔎 Procurar no Maps'}
 if(!/^https:\/\//.test(href))return null;
 const a=doc.createElement('a');a.className='ny26-day10-link';a.href=href;a.target='_blank';a.rel='noopener noreferrer';a.textContent=text;return a;
}
function decorateCard(doc,item,index){
 const card=item.card;
 const heading=doc.createElement('div');heading.className='ny26-day10-clock';heading.dataset.ny26Day10Ui='1';
 const display=trim(item.displayTime||item.reference?.privateUpdateId&&item.reference?.time||item.originalTime||item.reference?.time);
 heading.textContent=String(index+1).padStart(2,'0')+' • '+(display?'🕒 '+display:'🕒 Sem horário fixo');
 card.insertBefore(heading,card.firstChild);
 const p=doc.createElement('p');p.className='ny26-day10-what';p.dataset.ny26Day10Ui='1';
 p.textContent='O que fazer: '+description(item);
 const body=card.querySelector('.stepcontent')||card;
 // A descrição principal deve aparecer sem abrir os detalhes do local.
 if(body!==card)card.insertBefore(p,body);else card.appendChild(p);
 const actions=doc.createElement('div');actions.className='ny26-day10-actions';actions.dataset.ny26Day10Ui='1';
 const go=gps(doc,item);if(go)actions.appendChild(go);
 if(doc.getElementById('documentos')){
  const a=doc.createElement('a');a.href='#documentos';a.className='ny26-day10-link ny26-day10-docs';
  a.textContent='📎 Comprovantes';actions.appendChild(a);
 }
 card.appendChild(actions);
 const extra=[['Como fazer',item.reference?.instructions],['Atenção',item.reference?.warning],
 ['Banheiro',item.reference?.bathroom],['Alimentação',item.reference?.food]].filter(x=>trim(x[1]));
 if(extra.length){
  const details=doc.createElement('details');details.className='ny26-day10-more';details.dataset.ny26Day10Ui='1';
  const s=doc.createElement('summary');s.textContent='Detalhes deste local';details.appendChild(s);
  for(const [label,value] of extra){const line=doc.createElement('p'),strong=doc.createElement('strong');
   strong.textContent=label+': ';line.appendChild(strong);line.appendChild(doc.createTextNode(trim(value)));details.appendChild(line)}
  body.appendChild(details);
 }
}
function moveCards(doc,section,ordered){
 const originals=[...section.querySelectorAll('article.step')];
 const parent=originals[0]?.parentElement||section;
 const first=[...parent.children].find(node=>node.matches?.('article.step,.ny26-day10-newcard'))||null;
 const marker=doc.createComment('ny26-day10-anchor');parent.insertBefore(marker,first);
 const seen=new Set();
 for(const c of ordered){if(!c||seen.has(c))continue;seen.add(c);parent.insertBefore(c,marker)}
 for(const c of originals)if(!seen.has(c))parent.insertBefore(c,marker);
 marker.remove();
 const now=[...parent.children].filter(c=>c.matches?.('article.step,.ny26-day10-newcard'));
 return ordered.every((c,i)=>now[i]===c);
}
function installStyle(doc){
 if(doc.getElementById('ny26-day10-style'))return;
 const css=[
 '.ny26-day10-mode article.step,.ny26-day10-newcard{display:block!important;min-width:0;max-width:100%;box-sizing:border-box}',
 '.ny26-day10-mode .ny26-v157-day,.ny26-day10-mode .ny26-v157-tools{display:none!important}',
 '.ny26-day10-mode .ny26-time-inline{display:none!important}',
 '.ny26-day10-intro{border:1px solid #b9d6e6;border-left:5px solid #19719d;background:#eef7fc;border-radius:11px;padding:12px;margin:12px 0;color:#20536a;font:500 14px/1.5 system-ui,sans-serif}',
 '.ny26-day10-intro strong{font:800 17px/1.4 system-ui,sans-serif}',
 '.ny26-day10-intro p{margin:6px 0}',
 '.ny26-day10-clock{display:block!important;border-left:4px solid #1a6f99;border-radius:7px;background:#e8f3fa;color:#174e6e;font:800 15px/1.45 system-ui,sans-serif;padding:9px 10px;margin:10px 0}',
 '.ny26-day10-what{font:600 15px/1.55 system-ui,sans-serif!important;margin:10px 0!important;color:#25465b!important}',
 '.ny26-day10-actions{display:flex;flex-wrap:wrap;gap:8px;margin:10px 0}',
 '.ny26-day10-link{display:inline-flex;box-sizing:border-box;min-height:48px;max-width:100%;align-items:center;justify-content:center;border-radius:9px;border:1px solid #8db3c9;background:#16698f!important;color:#fff!important;text-decoration:none!important;padding:10px 13px;font:800 14px/1.45 system-ui,sans-serif;text-align:center}',
 '.ny26-day10-docs{background:#e8f4fa!important;color:#155377!important}',
 '.ny26-day10-more{margin:10px 0;border-top:1px solid #c5dbe7;padding-top:8px}',
 '.ny26-day10-more summary{min-height:44px;display:flex;align-items:center;cursor:pointer;font:800 14px/1.4 system-ui,sans-serif}',
 '.ny26-day10-more p{font:500 14px/1.5 system-ui,sans-serif;margin:6px 0}',
 '.ny26-day10-newcard{border:1px solid #b5d4e4;border-left:4px solid #1976a1;border-radius:11px;padding:12px;margin:10px 0;background:#fbfdff}',
 '.ny26-day10-newcard h3{font:800 17px/1.45 system-ui,sans-serif;margin:5px 0}',
 '@media(max-width:430px){.ny26-day10-actions .ny26-day10-link{width:100%}}'
 ].join('');
 const el=doc.createElement('style');el.id='ny26-day10-style';el.textContent=css;doc.head.appendChild(el);
}
function decorate(doc,pack){
 if(!doc?.querySelectorAll)return {found:false};
 const find=window.NY26V157Overlay?.dateOf;
 const section=[...doc.querySelectorAll('section.daypage')].find(s=>find?.(s)===DAY||/^(?:dia|day)[-_ ]?10$/i.test(s.id||''));
 if(!section)return {found:false};
 installStyle(doc);
 section.querySelector('.ny26-v157-day')?.remove();
 section.querySelector('.ny26-v157-tools')?.remove();
 section.querySelectorAll('[data-ny26-day10-ui],.ny26-day10-intro,[data-ny26-day10-generated]').forEach(n=>n.remove());
 section.classList.remove('ny26-v157-view','ny26-v157-rest-hidden');section.classList.add('ny26-day10-mode');
 const originals=[...section.querySelectorAll('article.step')],refs=referenceStops(pack),used=new Set();
 const items=originals.map(card=>({title:title(card)||'Parada do roteiro',card,originalTime:originalTime(card),reference:findRef(title(card),refs,used)}));
 // Do not resurrect outdated reference stops. Only explicitly approved NEW private stops may be added.
 for(const r of refs)if(r.privateUpdateId&&!used.has(r))items.push({title:r.title,card:null,originalTime:'',reference:r});
 const order=sortedEntries(items);
 for(const [i,item] of order.entries()){
  if(!item.card){const c=doc.createElement('article');c.className='ny26-day10-newcard';c.dataset.ny26Day10Generated='1';
   const heading=doc.createElement('h3');heading.textContent=item.title;c.appendChild(heading);item.card=c}
  decorateCard(doc,item,i);
 }
 const aligned=moveCards(doc,section,order.map(x=>x.card));
 const header=doc.createElement('div');header.className='ny26-day10-intro';
 const h=doc.createElement('strong');h.textContent='📍 10/11 • roteiro por local';header.appendChild(h);
 const p=doc.createElement('p');p.textContent='Siga os cards numerados: horário do roteiro atualizado, GPS e o que fazer em cada local. Feito, fotos e comprovantes originais foram preservados.';header.appendChild(p);
 if(order[0]?.card)order[0].card.insertAdjacentElement('beforebegin',header);else section.prepend(header);
 if(!aligned)console.warn('NY26: ordem 10/11 necessita conferência; dados originais preservados.');
 return {found:true,count:order.length,original:originals.length,aligned,withTime:order.filter(x=>x.exactMinute!==null).length};
}
window.NY26Day10UI={decorate,sortedEntries,minute,match,referenceStops,fallbackMinute,version:'1.0'};
})();