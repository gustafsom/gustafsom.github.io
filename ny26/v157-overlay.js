/* NY26: reference v1.57 is private Firestore data, not published in this JS. */
(()=>{
'use strict';
const css=[
'.ny26-v157{margin:12px 0 18px;padding:12px;border:1px solid #aacad9;border-left:4px solid #23729b;background:#f6fbfd;border-radius:12px;font:500 13px/1.5 system-ui,sans-serif;color:#233f51;overflow-wrap:anywhere}',
'.ny26-v157 h3{font-size:17px;line-height:1.3;margin:0 0 6px}',
'.ny26-v157 p{margin:7px 0}.ny26-v157 small{font-size:11px}',
'.ny26-v157 details{margin:5px 0}.ny26-v157-step{border-top:1px solid #d1e0e8;padding:8px 0}',
'.ny26-v157-step summary{cursor:pointer;font-weight:800}.ny26-v157-step p{font-size:12px;line-height:1.45}',
'.ny26-v157-food{background:#fff6e1;border-left:3px solid #ac8128;padding:8px;border-radius:6px}',
'.ny26-v157-why{background:#e7f1f7;padding:7px;border-radius:6px}',
'.ny26-v157-alert{background:#fff0e4;padding:7px;border-radius:6px}',
'.ny26-v157-compare{background:#ebf0f3;padding:8px;border-radius:6px;font-size:12px}',
'.ny26-v157-step a{color:#095c87}',
'@media(max-width:480px){.ny26-v157{padding:9px;font-size:12px}.ny26-v157 h3{font-size:15px}}'
].join('');
const trim=v=>String(v||'').replace(/\s+/g,' ').trim();
function dateOf(section){
 const a=[section.id,section.dataset.date,section.dataset.day,section.querySelector('h1,h2,h3,.dayheader,.daytitle')?.textContent].filter(Boolean).join(' ');
 let m=a.match(/\b2026[-/]11[-/](0?[4-9]|1[0-6])\b/);
 if(!m)m=a.match(/\b(0?[4-9]|1[0-6])[-/]11\b/);
 if(!m)m=a.match(/\b(?:day|dia|d)[-_ ]?(0?[4-9]|1[0-6])\b/i);
 if(!m)m=a.match(/\b(0?[4-9]|1[0-6])\s*(?:de\s*)?(?:novembro|nov)\b/i);
 return m?'2026-11-'+m[1].padStart(2,'0'):null;
}
function para(doc,to,label,value,cls){
 if(!trim(value))return;
 const p=doc.createElement('p');if(cls)p.className=cls;
 if(label){const b=doc.createElement('b');b.textContent=label+': ';p.appendChild(b)}
 p.appendChild(doc.createTextNode(trim(value)));to.appendChild(p);
}
function link(doc,to,url){
 if(!/^https:\/\/[^\s<>]+$/i.test(String(url||'')))return;
 const a=doc.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
 a.textContent='Fonte de referência';to.appendChild(a);
}
function line(doc,stop){
 const d=doc.createElement('details');d.className='ny26-v157-step';
 const s=doc.createElement('summary');
 s.textContent=(stop.time?trim(stop.time)+' • ':'')+trim(stop.title).replace(/almo[cç]o econ[oô]mico/gi,'Almoço');
 d.appendChild(s);
 para(doc,d,'Situação',stop.status);
 para(doc,d,'Endereço',stop.address);
 para(doc,d,'Por que visitar',stop.why,'ny26-v157-why');
 para(doc,d,'O que observar',stop.look,'ny26-v157-why');
 para(doc,d,'Como executar',stop.instructions);
 para(doc,d,'Tipo de comida',stop.food,'ny26-v157-food');
 para(doc,d,'Banheiro',stop.bathroom);
 para(doc,d,'Atenção',stop.warning,'ny26-v157-alert');
 link(doc,d,stop.source||stop.foodSource);
 return d;
}
function validate(p){
 if(p?.schema!=='ny26-reference-overlay-v1'||p.version!=='1.57'||!Array.isArray(p.days)||p.days.length<7||p.days.length>20)throw Error('Pacote privado v1.57 inválido');
 for(const day of p.days)if(!/^2026-11-(?:0[4-9]|1[0-6])$/.test(day.date)||!Array.isArray(day.stops)||day.stops.length>60)throw Error('Data/etapas inválidas no pacote');
 return p;
}
function render(doc,section,day){
 section.querySelector('.ny26-v157-day')?.remove();
 const wrapper=doc.createElement('section');wrapper.className='ny26-v157 ny26-v157-day';
 const title=doc.createElement('h3');title.textContent='🗽 Roteiro atualizado • versão 1.57';wrapper.appendChild(title);
 para(doc,wrapper,'Plano',day.title);
 para(doc,wrapper,'Prioridade',day.priority);
 const notice=doc.createElement('p');notice.className='ny26-v157-compare';
 notice.textContent='Os cards anteriores, Feito, fotos e comprovantes foram preservados. Em caso de divergência de horários/atividades, consulte esta programação mais recente.';
 wrapper.appendChild(notice);
 const details=doc.createElement('details');details.open=true;
 const sum=doc.createElement('summary');sum.textContent='Ver programação e informações ('+((day.stops||[]).length||(day.places||[]).length)+')';
 details.appendChild(sum);
 for(const stop of day.stops||[])details.appendChild(line(doc,stop));
 for(const place of day.places||[])details.appendChild(line(doc,place));
 wrapper.appendChild(details);
 const anchor=section.querySelector('.ny-day-brief,.ck-daylink,.ny26-live,.ny26-offline-advice,.dayheader,h1,h2,h3');
 if(anchor)anchor.insertAdjacentElement('afterend',wrapper);else section.prepend(wrapper);
}
function foodDirectory(doc,pack){
 const page=doc.getElementById('apoio');if(!page)return;
 page.querySelector('.ny26-v157-fooddir')?.remove();
 const card=doc.createElement('section');card.className='ny26-v157 ny26-v157-fooddir';
 const h=doc.createElement('h3');h.textContent='🍕 Refeições rápidas • tipos de comida';card.appendChild(h);
 para(doc,card,'Critério','Confirmar cardápio, preço, forma de pagamento e fila antes de escolher. Nada aqui é reserva.');
 for(const item of pack.quickFood||[]){
  const d=line(doc,{title:item.title,address:item.address,food:item.food,warning:item.notes,source:item.source});
  para(doc,d,'Quando compensa',item.when);
  card.appendChild(d);
 }
 page.appendChild(card);
}
function decorate(doc,pack){
 if(!doc?.body||!pack)return {days:0,steps:0};
 validate(pack);
 if(!doc.getElementById('ny26-v157-style')){
  const style=doc.createElement('style');style.id='ny26-v157-style';style.textContent=css;doc.head.appendChild(style);
 }
 const index=new Map(pack.days.map(x=>[x.date,x]));
 let days=0,steps=0;
 for(const section of doc.querySelectorAll('section.daypage')){
  const d=index.get(dateOf(section));if(!d)continue;
  render(doc,section,d);days++;steps+=d.stops.length;
 }
 foodDirectory(doc,pack);
 return {days,steps};
}
window.NY26V157Overlay={decorate,validate,dateOf,version:'1.57'};
})();