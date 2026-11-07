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
'.ny26-v157-inline{padding:8px 10px;margin:9px 0;background:#eef7fb;border:1px solid #b8d4e3;border-radius:9px;font-size:12px}.ny26-v157-inline summary{cursor:pointer;font-weight:800}.ny26-v157-inline p{margin:6px 0;line-height:1.4}',
'.ny26-v157-food-primary{background:#fff8e8;border:1px solid #efd8ab;border-left:3px solid #a98028;padding:9px 11px;margin:9px 0;border-radius:9px;font:500 12px/1.48 system-ui,sans-serif;overflow-wrap:anywhere}.ny26-v157-food-primary strong{display:block;margin-bottom:4px}',
'.ny26-day07-stop{display:block!important;box-sizing:border-box;max-width:100%;min-width:0;overflow-wrap:anywhere;margin:12px 0;padding:13px;border:1px solid #a8cbdd;border-left:5px solid #1d6d95;border-radius:12px;background:#f5fbff;color:#1c455c;box-shadow:0 2px 8px #1231}',
'.ny26-day07-stop .ny26-day07-time{font:800 13px/1.45 system-ui,sans-serif;color:#175a7d;display:block;margin:0 0 7px}',
'.ny26-day07-stop h3{margin:2px 0 8px;font:800 17px/1.35 system-ui,sans-serif;overflow-wrap:anywhere}',
'.ny26-day07-stop .ny26-day07-address{font:500 14px/1.5 system-ui,sans-serif;margin:5px 0 10px}',
'.ny26-day07-stop .ny26-day07-actions{display:flex;flex-wrap:wrap;gap:9px;min-width:0}',
'.ny26-day07-stop .ny26-day07-actions a{display:inline-flex;min-height:46px;align-items:center;justify-content:center;padding:10px 13px;border-radius:9px;background:#12688c;color:#fff!important;text-decoration:none!important;font:800 14px/1.3 system-ui,sans-serif;overflow-wrap:anywhere}',
'.ny26-day07-stop details{margin:10px 0 0;border-top:1px solid #c6dce5;padding:7px 0 0}',
'.ny26-day07-stop details summary{font:800 14px/1.4 system-ui,sans-serif;min-height:44px;display:flex;align-items:center;cursor:pointer}',
'.ny26-day07-stop details p{font:500 14px/1.5 system-ui,sans-serif;margin:7px 0}',
'.ny26-day07-stop .ny26-day07-note{font:500 12px/1.45 system-ui,sans-serif;color:#526d7e;margin:10px 0 0}',
'.ny26-day07-parking-priority{font:800 14px/1.5 system-ui,sans-serif;color:#1c604c;background:#edf8f3;padding:9px 10px;margin:9px 0;border-radius:8px}',
'.ny26-private-update-note{padding:8px 10px;border-radius:8px;background:#e6f1fa;color:#21526b;font:700 13px/1.5 system-ui,sans-serif}',
'@media(max-width:390px){.ny26-day07-stop{padding:10px}.ny26-day07-stop .ny26-day07-actions a{width:100%}}',
'.ny26-v157{background:#fff;border-color:#c8d9e3;box-shadow:0 2px 8px #1234}',
'.ny26-v157 h3{color:#173950}',
'.ny26-v157-essentials{margin:12px 0;padding:12px;background:#eef7fb;border-radius:11px;border:1px solid #bed8e5}',
'.ny26-v157-essentials strong{font-size:14px;display:block}',
'.ny26-v157-essentials p{margin:6px 0;font-size:13px}',
'.ny26-v157-risk{background:#fff4e5;border:1px solid #eccb99;border-left:4px solid #bb7b17;padding:10px 11px;border-radius:10px;margin:12px 0}',
'.ny26-v157-risk summary{font-weight:800;cursor:pointer;min-height:44px;display:flex;align-items:center}',
'.ny26-v157-risk li{padding:4px 0;font-size:12px;line-height:1.5}',
'.ny26-v157-risk a{font-size:12px;color:#80591a;font-weight:700}',
'.ny26-v157-program summary{font-weight:800;min-height:46px;display:flex;align-items:center;cursor:pointer}',
'.ny26-v157-step summary{padding:9px 6px;min-height:44px;display:flex;align-items:center;line-height:1.42;gap:6px}',
'.ny26-v157-step summary::before{content:\'▸\';font-size:12px;color:#4c7185;flex-shrink:0}',
'.ny26-v157-step[open] summary::before{content:\'▾\'}',
'.ny26-v157-stage{display:inline-block;font:800 10px/1.5 system-ui,sans-serif;padding:2px 7px;margin:2px 0 6px;border-radius:6px;background:#e4eff7;color:#1a4b68}',
'.ny26-v157-stage.conditional{background:#fff2d3;color:#765007}',
'.ny26-v157-stage.fixed{background:#fce6db;color:#8a371c}',
'.ny26-v157-jump{display:inline-flex;align-items:center;justify-content:center;min-height:44px;padding:9px 13px;border-radius:9px;border:1px solid #9fbacb;background:#e9f4fb;color:#17486a;font:800 12px system-ui,sans-serif;cursor:pointer;gap:5px}',
'.ny26-v157-jump:focus-visible{outline:3px solid #1267a5;outline-offset:2px}',
'.ny26-v157-tools{padding:12px;margin:12px 0;border:1px solid #b9cedb;border-radius:11px;background:#edf5fa;color:#244a61;font:500 12px/1.55 system-ui,sans-serif}',
'.ny26-v157-tools strong{display:block;font-size:14px}',
'.ny26-v157-tools .ny26-v157-jump{margin:10px 0 3px;background:#fff}',
'.ny26-v157-rest-hidden article.step{display:none!important}',
'.ny26-v157-next{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-top:9px}',
'.ny26-v157-titleline{font-size:11px;letter-spacing:.02em;font-weight:800;text-transform:uppercase;color:#365a73;margin-bottom:5px}',
'.ny26-v157-decision{border:1px solid #aad0dc;background:#effaff;padding:10px;border-radius:9px;margin:10px 0}',
'.ny26-v157-decision strong{display:block;font-size:13px;margin-bottom:7px}',
'.ny26-v157-decision-actions{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:8px;margin-top:9px}',
'.ny26-v157-decision-actions button{padding:10px;min-height:44px;border-radius:8px;background:#fff;color:#23516c;border:1px solid #85b1c6;font:750 12px system-ui;cursor:pointer}',
'.ny26-v157-decision-actions button[aria-pressed=true]{background:#155b80;color:#fff;border-color:#155b80}',
'.ny26-v157-branch[hidden]{display:none!important}',
'.ny26-v157-decision-status{font-size:12px;font-weight:700;margin:8px 0 0}',
'.ny26-v157-view .ny26-live{display:none!important}',
'.ny26-v157-rhythm{margin:10px 0;padding:11px;background:#ecf7ed;border:1px solid #b7d7c2;border-radius:10px;color:#24513b;font:500 12px/1.5 system-ui,sans-serif}',
'.ny26-v157-rhythm strong{display:block;font-size:13px;margin-bottom:4px}',
'.ny26-v157-rhythm p{margin:6px 0}',
'.ny26-v157-rhythm ul{margin:7px 0;padding-left:17px}',
'.ny26-v157-rhythm li{margin:5px 0}',
'.ny26-v157-branch-note{display:block;padding:5px 8px;background:#e9f3f9;color:#1c567b;font:800 11px system-ui;border-radius:6px;margin:5px}',
'@media(max-width:520px){.ny26-v157{margin:10px 0;padding:10px}.ny26-v157-essentials,.ny26-v157-risk{padding:9px}.ny26-v157-jump{width:100%}}',
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
function link(doc,to,source){
 const urls=[...new Set(String(source||'').split(/\s*\|\s*/).map(v=>v.trim()).filter(v=>/^https:\/\/[^\s<>]+$/i.test(v)))];
 for(const [i,url] of urls.entries()){
  const a=doc.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
  a.textContent=i===0?'Fonte de referência':'Outra fonte';
  if(i)to.appendChild(doc.createTextNode(' · '));
  to.appendChild(a);
 }
}
function line(doc,stop){
 const d=doc.createElement('details');d.className='ny26-v157-step';
 const s=doc.createElement('summary');
 s.textContent=(stop.time?trim(stop.time)+' • ':'')+trim(stop.title).replace(/almo[cç]o econ[oô]mico/gi,'Almoço').replace(/retirar as sete bagagens/gi,'Retirar todas as bagagens (7 a 8 volumes)');
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
const matchNorm=v=>trim(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()
 .replace(/[^a-z0-9]+/g,' ').trim();
const stopwords=new Set(['the','de','da','do','em','na','no','para','com','mais','aqui','foto','fotos','visita','opcional','exterior','retorno','hotel','parada','ate','day','new','york','nyc']);
function cardMatch(a,b){
 const A=matchNorm(a),B=matchNorm(b);
 if(!A||!B)return 0;
 if(A===B)return 100;
 if(Math.min(A.length,B.length)>8&&(A.includes(B)||B.includes(A)))return 9;
 const x=new Set(A.split(' ').filter(z=>z.length>=3&&!stopwords.has(z)));
 const y=new Set(B.split(' ').filter(z=>z.length>=3&&!stopwords.has(z)));
 const common=[...x].filter(z=>y.has(z));
 // Nunca casar títulos genéricos ("Almoço", "Hotel") por acidente.
 if(common.length<2)return 0;
 return common.length/Math.max(x.size,y.size)>=0.72?7:0;
}
// Consolida antigas entradas repetidas na camada v1.57, sem tocar no Firestore.
function placeKey(name){
 const n=matchNorm(name);
 if(n.includes('walmart newburgh'))return 'walmart newburgh';
 if(n.includes('walmart eddystone'))return 'walmart eddystone';
 if(n.includes('mcdonald')&&n.includes('harriman'))return 'mcdonalds harriman';
 if(n.includes('christiana')&&(n.includes('target')||n.includes('lojas')))return 'target christiana lojas';
 return n;
}
function consolidatePlaces(places,date){
 const out=new Map();
 for(const item of Array.isArray(places)?places:[]){
  if(!item||typeof item.title!=='string'||!item.title.trim())continue;
  const k=placeKey(item.title);
  if(!out.has(k)){out.set(k,{...item});continue}
  const prev=out.get(k);
  for(const [field,value] of Object.entries(item)){
   if(field==='title'||value==null||value==='')continue;
   if(field==='source'){
    const links=[String(prev.source||''),String(value)].flatMap(v=>v.split(/\s*\|\s*/)).filter(Boolean);
    prev.source=[...new Set(links)].join(' | ');
   }else if(!prev[field])prev[field]=value;
  }
 }
 const result=[...out.values()];
 if(date==='2026-11-07'){
  const order={'liberty bell':0,'independence hall':1,'rocky steps':2,'walmart eddystone':3};
  result.sort((a,b)=>(order[placeKey(a.title)]??99)-(order[placeKey(b.title)]??99));
 }
 return result;
}
function annotateExisting(doc,section,day){
 const cards=[...section.querySelectorAll('article.step')],used=new Set();
 for(const card of cards){
  const title=trim(card.querySelector('.place-link')?.textContent);
  if(!title)continue;
  let best=null,score=0,bestIndex=-1;
  (day.stops?.length?day.stops:day.places||[]).forEach((stop,i)=>{
   if(used.has(i)||!stop.why&&!stop.look&&!stop.food)return;
   const value=cardMatch(title,stop.title);
   if(value>score){best=stop;score=value;bestIndex=i}
  });
  if(!best||score<7)continue;
  used.add(bestIndex);
  card.querySelector('.ny26-v157-inline')?.remove();
  const container=card.querySelector('.stepcontent');if(!container)continue;
  const detail=doc.createElement('details');detail.className='ny26-v157-inline';
  const summary=doc.createElement('summary');summary.textContent='ℹ️ Informações adicionais • v1.57';detail.appendChild(summary);
  para(doc,detail,'Por que visitar',best.why);
  para(doc,detail,'O que observar',best.look);
  para(doc,detail,'Tipo de comida',best.food,'ny26-v157-food');
  container.appendChild(detail);
  // Alimentação deve ficar visível no card principal, não apenas no acordeão.
  // Quando o menu genérico já aparece, manter o cardápio e a fonte oficial.
  const oldFood=container.querySelector('.ny26-v157-food-primary');
  oldFood?.remove();
  if(best.food&&!container.querySelector('.ny26-menu-hint')){
   const food=doc.createElement('div');food.className='ny26-v157-food-primary';
   const head=doc.createElement('strong');head.textContent='🍽️ Tipo de comida • v1.57';food.appendChild(head);
   const contentText=doc.createElement('span');contentText.textContent=best.food;food.appendChild(contentText);
   const actions=container.querySelector('.actions');
   if(actions)container.insertBefore(food,actions);else container.appendChild(food);
  }
 }
}
// UX operacional: linha do tempo da v1.57 sem apagar os cards e anexos legados.
const nyClock=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',hour:'2-digit',minute:'2-digit',day:'2-digit',month:'2-digit',year:'numeric',hourCycle:'h23'});
function nyNow(){
 const pieces=Object.fromEntries(nyClock.formatToParts(new Date()).map(x=>[x.type,x.value]));
 return {date:pieces.year+'-'+pieces.month+'-'+pieces.day,minute:(+pieces.hour)*60+(+pieces.minute),label:pieces.hour+':'+pieces.minute};
}
function startMinute(stop){
 const raw=String(stop.time||'');
 const m=raw.match(/(?:^|[~\s])(\d{1,2})[h:](\d{2})/i);
 return m?Number(m[1])*60+Number(m[2]):null;
}
function attentionForDay(day){
 const title=(day.title||'')+' '+(day.stops||[]).map(s=>s.title).join(' ');
 const notes=[];
 function add(rx,summary,url){if(rx.test(title))notes.push({summary,url})}
 add(/air and space|air & space/i,'Air and Space: quatro passes com horário, inspeção e água engarrafada permitida; alimentos externos proibidos.','https://airandspace.si.edu/visit/museum-dc/guidelines');
 add(/estat[uú]a|liberty island|pedestal/i,'Estátua: o horário do bilhete libera a fila da segurança, não garante a saída do ferry. Mochilas e comida não entram no pedestal; armários com moeda de 25¢.','https://statuecitycruises.com/know-before-you-go/security/');
 add(/pier 11|nyc ferry.*dum(b|bo)/i,'Pier 11: desde 02/11 vale a grade de inverno; horários mudaram. Não presumir chegada a DUMBO às 15h10. Ferry avulso custa US$ 5 por pessoa pagante desde 19/10; conferir próxima saída e preferir metrô se perder a margem para o pôr do sol.','https://www.ferry.nyc/routes-and-schedules/east-river/');
 add(/american museum of natural history|amnh/i,'AMNH: entrada sujeita à triagem; mochilas grandes (>11 × 17 pol.) não permitidas, e só comer nas áreas designadas.','https://www.amnh.org/plan-your-visit/code-of-conduct');
 add(/summit.*vanderbilt|summit one vanderbilt/i,'SUMMIT: acesso pela passagem de Grand Central/Vanderbilt Avenue; a entrada NÃO é o lobby principal de One Vanderbilt. Não levar alimentos/bebidas externos e conferir quatro QR codes.','https://summitov.com/');
 add(/morgan library/i,'Morgan: entrada gratuita de sexta, 17h–20h, requer reserva e liberação uma semana antes. Confirmar quatro ingressos antes de contar com esta visita.','https://www.themorgan.org/free-friday-evenings');
 add(/jfk.*avis|federal circle/i,'JFK: locadoras ficam em Federal Circle. O AirTrain é gratuito entre terminais e Federal Circle; siga a sinalização Airport/Rental Cars.','https://www.jfkairport.com/transportation/car-rentals');
 add(/high line/i,'High Line: entradas têm escadas/elevadores diferentes, algumas sujeitas a fechamento por clima. O trajeto pela rua é plano B se houver cansaço ou piso molhado.','https://www.thehighline.org/');
 add(/roosevelt island tram/i,'Roosevelt Island: metrô F na ida e tram na volta são transportes distintos. Verificar operação da linha F e fila do bondinho no dia.','https://new.mta.info/');
 add(/high st.*retorno|brooklyn bridge.*retorno|flatiron.*carnegie|retorno principal.*metr[oô]/i,'Retorno: caminhada e metrô são planos alternativos; não tente completar os dois trajetos. Se frio ou cansaço, escolha o metrô.','https://new.mta.info/');
 add(/jfk t8|volta.*jfk|t[aá]xi amarelo.*jfk/i,'Aeroporto: confirme carro para quatro pessoas e até oito volumes. Táxi amarelo Manhattan↔JFK tem tarifa-base oficial de US$ 70, mais pedágios, taxas e gorjeta; não há cobrança por volume, mas o porta-malas precisa comportá-los.','https://www.nyc.gov/site/tlc/passengers/taxi-fare.page');
 if(day.date==='2026-11-11')notes.push({summary:'OMNY: passe o mesmo cartão quatro vezes no mesmo leitor, uma por passageiro. Na primeira utilização, o banco pode exigir pequena espera antes do segundo toque.',url:'https://omny.info/faq/detailed-information-on-omny'});
 if(day.date==='2026-11-06')notes.push({summary:'Proteja os horários das visitas programadas: almoço e banheiro são apoio curto, sem desvio que atrase o próximo compromisso.'});
 if(day.date==='2026-11-08')notes.push({summary:'Washington: não presuma estacionamento diante do National Mall. Defina vaga legal e registre endereço, placa e horário de validade antes de caminhar.'});
 if(day.date==='2026-11-09')notes.push({summary:'Devolução Avis: confira o endereço e o limite contratual, fotografe estado do carro/combustível e obtenha confirmação de encerramento.'});
 // Casos que aparecem apenas como planos condicionais na própria planilha.
 if(day.date==='2026-11-07')notes.push({summary:'Filadélfia: após a área da Liberty Bell e Independence Hall, recupere o carro para Rocky Steps; conferir vaga legal na chegada.',url:'https://www.nps.gov/inde/planyourvisit/hours.htm'});
 if(day.date==='2026-11-12')notes.push({summary:'Escolher somente um retorno do Central Park: metrô principal OU caminhada longa via fachadas/Flatiron. O roteiro não é sequencial a partir da bifurcação.',url:'https://new.mta.info/'});
 if(day.date==='2026-11-15')notes.push({summary:'JFK: bagagens variam entre 7 e 8 volumes. Conferir espaço do veículo antes de escolher táxi amarelo; plano B Penn/LIRR/AirTrain exige carregar tudo.',url:'https://www.jfkairport.com/transportation/car-rentals'});
 if(day.date==='2026-11-05'||day.date==='2026-11-15')notes.push({summary:'JFK em obras durante 2026: trânsito e acessos rodoviários podem sofrer desvios. Conferir alertas do aeroporto, adicionar margem e priorizar a rota sinalizada.',url:'https://www.jfkairport.com/alerts-advisories'});
 return notes.slice(0,5);
}
function stageFor(stop){
 if(stop.privateUpdateId)return {text:'ATUALIZAÇÃO APROVADA',kind:'conditional'};
 const txt=String(stop.title||'')+' '+String(stop.warning||'')+' '+String(stop.status||'');
 if(/n[aã]o reservado|reservar em|pendente.+reserva/i.test(txt))return {text:'RESERVA PENDENTE',kind:'conditional'};
 if(/opcional|condicional|se.+fila|se.+tempo|plano [ab]|pular se/i.test(txt))return {text:'FLEXÍVEL',kind:'conditional'};
 if(/SUMMIT|Air and Space|Warwick|Patterson|Morgan Library|Est[aá]tua.*Liberdade|Liberty Island|voo.*JFK|JFK.*voo/i.test(stop.title||''))return {text:'HORÁRIO PRIORITÁRIO',kind:'fixed'};
 if(/metr[oô]|ferry|tramway|LIRR|taxi|t[aá]xi|AirTrain/i.test(stop.title||''))return {text:'DESLOCAMENTO',kind:''};
 return null;
}
function accessibleAction(doc,label,onClick){
 const button=doc.createElement('button');
 button.type='button';button.className='ny26-v157-jump';
 button.textContent=label;button.addEventListener('click',onClick);
 return button;
}
function legacyControls(doc,section,day){
 section.__ny26LegacyCleanup?.();section.__ny26LegacyCleanup=null;
 const cards=[...section.querySelectorAll('article.step')];
 section.querySelector('.ny26-v157-tools')?.remove();
 section.classList.remove('ny26-v157-rest-hidden');
 if(!cards.length)return null;
 const toolbar=doc.createElement('div');toolbar.className='ny26-v157-tools';
 const title=doc.createElement('strong');title.textContent='✅ Controles do roteiro: Feito, GPS e anexos';toolbar.appendChild(title);
 const line=doc.createElement('div');line.setAttribute('aria-live','polite');toolbar.appendChild(line);
 const toggle=accessibleAction(doc,'Mostrar controles',()=>setOpen(!isOpen()));
 toggle.setAttribute('aria-expanded','false');
 toolbar.appendChild(toggle);
 const today=nyNow().date;
 function isOpen(){return !section.classList.contains('ny26-v157-rest-hidden')}
 function refresh(){
  const boxes=cards.map(c=>c.querySelector('input.donecheck[data-step]')).filter(Boolean);
  const done=boxes.filter(x=>x.checked).length;
  line.textContent=boxes.length?done+' de '+boxes.length+' etapas antigas marcadas Feito. Os dados seguem preservados.':'Os controles antigos continuam disponíveis, sem alterações nos anexos.';
  toggle.textContent=isOpen()?'Ocultar controles antigos':'Mostrar controles Feito / GPS / anexos';
  toggle.setAttribute('aria-expanded',String(isOpen()));
 }
 function setOpen(open){
  section.classList.toggle('ny26-v157-rest-hidden',!open);
  refresh();
 }
 const original=cards[0];original.parentElement.insertBefore(toolbar,original);
 setOpen(day.date===today);
 const changeHandler=event=>{if(event.target?.matches?.('input.donecheck[data-step]')&&cards.some(c=>c.contains(event.target)))refresh()};
 doc.addEventListener('change',changeHandler);
 // Saltos para fotos, anexos, hash ou controles também podem reabrir a seção.
 const hashHandler=()=>{
  let id='';try{id=decodeURIComponent(doc.defaultView.location.hash.slice(1)||'')}catch{return}
  const target=id?doc.getElementById(id):null;
  if(target&&cards.some(c=>c.contains(target)))setOpen(true);
 };
 doc.defaultView?.addEventListener('hashchange',hashHandler);
 section.__ny26LegacyCleanup=()=>{doc.removeEventListener('change',changeHandler);doc.defaultView?.removeEventListener('hashchange',hashHandler)};
 function openCard(card){
  setOpen(true);
  const target=card.querySelector('input.donecheck[data-step]')?.closest('label')||card;
  target.scrollIntoView?.({behavior:'smooth',block:'center'});
 }
 return {cards,openCard,refresh,setOpen};
}
function renderOperational(doc,wrapper,day,details,legacy){
 const now=nyNow();
 const overview=doc.createElement('div');overview.className='ny26-v157-essentials';
 const main=doc.createElement('strong');
 main.textContent=day.date===now.date?'📍 Roteiro de hoje • horário de Nova York '+now.label:'🧭 Execução do dia • '+day.date.split('-').reverse().join('/');
 overview.appendChild(main);
 const arr=(day.stops||[]).length?day.stops:day.places||[];
 const scheduled=arr.map((s,i)=>({s,i,min:startMinute(s)})).filter(x=>x.min!==null);
 const next=day.date===now.date?scheduled.find(x=>x.min>=now.minute):scheduled[0];
 const p=doc.createElement('p');
 p.textContent=next?'Próximo horário previsto: '+String(next.s.time||'')+' • '+next.s.title:
  'Consulte a programação; nem todas as atividades possuem horário fixo.';
 overview.appendChild(p);
 if(next){
  const row=doc.createElement('div');row.className='ny26-v157-next';
  row.appendChild(accessibleAction(doc,'Ver próxima etapa',()=>{
   details.open=true;
   const target=details.querySelectorAll('.ny26-v157-step')[next.i];
   if(target){target.open=true;target.scrollIntoView?.({behavior:'smooth',block:'center'})}
  }));
  overview.appendChild(row);
 }
 const small=doc.createElement('small');
 small.textContent='Horário planejado, não confirmação de execução. Para registrar Feito, abra os controles originais do roteiro.';
 overview.appendChild(small);wrapper.appendChild(overview);
 const alerts=attentionForDay(day);
 if(alerts.length){
  const wrap=doc.createElement('details');wrap.className='ny26-v157-risk';
  const summary=doc.createElement('summary');summary.textContent='⚠️ Cuidados e decisões importantes ('+alerts.length+')';wrap.appendChild(summary);
  const ul=doc.createElement('ul');
  for(const alert of alerts){
   const li=doc.createElement('li');li.appendChild(doc.createTextNode(alert.summary+' '));
   if(alert.url){const a=doc.createElement('a');a.href=alert.url;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Consultar fonte oficial';li.appendChild(a)}
   ul.appendChild(li);
  }
  wrap.appendChild(ul);wrapper.appendChild(wrap);
 }
 if(legacy){
  const hint=doc.createElement('p');hint.className='ny26-v157-compare';
  hint.textContent='A programação v1.57 é a referência atual. Feito, GPS, fotos e PDFs permanecem nos cards antigos, disponíveis em “Mostrar controles”.';
  wrapper.appendChild(hint);
 }
}
function addBranchChoice(doc,day,stopList,scope){
 if(day.date!=='2026-11-12')return null;
 const aIndex=stopList.findIndex(x=>/retorno principal.+metr[oô]/i.test(x.title));
 const bIndex=stopList.findIndex(x=>/carnegie hall/i.test(x.title));
 if(aIndex<0||bIndex<=aIndex)return null;
 const key='ny26-v157-return:'+String(scope||'local')+':'+day.date;
 const wrap=doc.createElement('div');wrap.className='ny26-v157-decision';
 const strong=doc.createElement('strong');strong.textContent='🔀 DECISÃO • Como voltar do Central Park?';wrap.appendChild(strong);
 const p=doc.createElement('p');p.textContent='Escolha somente UM trajeto. As etapas do outro plano serão ocultadas (sem apagar Feito ou anexos).';wrap.appendChild(p);
 const actions=doc.createElement('div');actions.className='ny26-v157-decision-actions';
 const status=doc.createElement('p');status.className='ny26-v157-decision-status';status.setAttribute('aria-live','polite');
 const choices=[
  {value:'metro',label:'Plano A • metrô',detail:'Mais rápido e menos caminhada'},
  {value:'walk',label:'Plano B • a pé',detail:'Caminhada longa, com fachadas e Flatiron'}
 ];
 let active='';try{active=localStorage.getItem(key)||''}catch{}
 const buttons=[];
 function select(val){
  active=val;
  try{if(active)localStorage.setItem(key,active);else localStorage.removeItem(key)}catch{}
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.plan===active)));
  status.textContent=active?'Escolhido neste aparelho: '+choices.find(x=>x.value===active).label:
   'Decisão pendente. Os dois planos aparecem separados, mas NÃO devem ser feitos juntos.';
  const root=wrap.closest('.ny26-v157');
  root?.querySelectorAll('[data-ny26-branch]').forEach(el=>{
   el.hidden=Boolean(active&&el.dataset.ny26Branch!==active);
  });
  root?.__ny26RhythmRefresh?.();
 }
 for(const opt of choices){
  const b=doc.createElement('button');b.type='button';b.dataset.plan=opt.value;b.textContent=opt.label;
  b.title=opt.detail;b.addEventListener('click',()=>select(opt.value));buttons.push(b);actions.appendChild(b);
 }
 const reset=doc.createElement('button');reset.type='button';reset.textContent='Sem decisão';
 reset.addEventListener('click',()=>select(''));actions.appendChild(reset);
 wrap.append(actions,status);
 return {wrap,aIndex,bIndex,activate:()=>select(active),label:index=>
  index>=aIndex&&index<bIndex?'metro':index>=bIndex?'walk':null};
}
function addStopChoice(doc,stop,day,scope,container){
 let opts=null;
 if(day.date==='2026-11-11'&&/Pier\s*11|NYC Ferry ou alternativa/i.test(stop.title)){
  opts=[['ferry','Plano A • NYC Ferry','Conferir saída e embarcar somente se houver margem até Brooklyn Heights'],
   ['metro','Plano B • metrô','Se o ferry não encaixar, usar transporte sobre trilhos até Brooklyn (confirmar serviço MTA)']];
 }else if(day.date==='2026-11-15'&&/T[aá]xi amarelo.+JFK|JFK T8/i.test(stop.title)){
  opts=[['taxi','Plano A • táxi','Antes de embarcar, confirmar que cabem quatro pessoas e todas as malas/mochilas'],
   ['lirr','Plano B • LIRR + AirTrain','Requer levar bagagens até Penn Station, transferir em Jamaica e seguir a Terminal 8']];
 }else if(day.date==='2026-11-14'&&/Volta ao hotel a p[eé]|Times Square.+opcional/i.test(stop.title)){
  opts=[['direct','Plano A • hotel','Priorizar descanso'],['times','Plano B • Times Square','Somente se todos ainda tiverem disposição']];
 }
 if(!opts)return;
 const key='ny26-v157-choice:'+String(scope||'local')+':'+day.date+':'+stop.title;
 const wrap=doc.createElement('div');wrap.className='ny26-v157-decision';
 const strong=doc.createElement('strong');strong.textContent='🔀 Decisão neste ponto';wrap.appendChild(strong);
 const row=doc.createElement('div');row.className='ny26-v157-decision-actions';
 const status=doc.createElement('p');status.className='ny26-v157-decision-status';status.setAttribute('aria-live','polite');
 let active='';try{active=localStorage.getItem(key)||''}catch{}
 const buttons=[];
 function update(value){
  active=value;
  try{if(active)localStorage.setItem(key,active);else localStorage.removeItem(key)}catch{}
  buttons.forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.value===active)));
  status.textContent=active?'Escolhido neste aparelho: '+opts.find(x=>x[0]===active)[1]:'Escolha quando estiver neste ponto.';
 }
 for(const [value,label,description] of opts){
  const b=doc.createElement('button');b.type='button';b.dataset.value=value;b.textContent=label;
  b.title=description;b.addEventListener('click',()=>update(value));buttons.push(b);row.appendChild(b);
  const note=doc.createElement('p');note.textContent=label+': '+description;wrap.appendChild(note);
 }
 wrap.append(row,status);container.appendChild(wrap);update(active);
}
function plannedEndMinute(stop){
 const parts=[...String(stop.time||'').matchAll(/\b(\d{1,2})[h:](\d{2})\b/g)];
 if(parts.length<2)return null;
 const last=parts[1],value=Number(last[1])*60+Number(last[2]);
 return value>=0&&value<1440?value:null;
}
function findLinkedCard(legacy,stop){
 if(!legacy?.cards?.length)return null;
 const matches=legacy.cards.map(card=>({card,score:cardMatch(
   trim(card.querySelector('.place-link')?.textContent),stop.title)}))
   .filter(x=>x.score>=7).sort((a,b)=>b.score-a.score);
 return matches[0]&&(!matches[1]||matches[0].score>matches[1].score)?matches[0].card:null;
}
function renderLatestRhythm(doc,wrapper,day,legacy,schedule,section){
 section.__ny26RhythmCleanup?.();
 section.__ny26RhythmCleanup=null;
 const stops=day.stops||[];
 if(stops.length<2)return;
 const root=doc.createElement('div');root.className='ny26-v157-rhythm';
 const title=doc.createElement('strong');title.textContent='⏱ Ajuste seguro do roteiro pela hora do Feito';root.appendChild(title);
 const output=doc.createElement('div');output.setAttribute('aria-live','polite');root.appendChild(output);
 wrapper.appendChild(root);
 const clock=doc.__ny26CompletionClock;
 function update(){
  output.replaceChildren();
  if(!clock||!legacy){
   const p=doc.createElement('p');p.textContent='O registro automático de Feito ainda não está disponível neste dia.';output.appendChild(p);return;
  }
  const matched=[];
  for(let i=0;i<stops.length;i++){
   const card=findLinkedCard(legacy,stops[i]);
   const time=plannedEndMinute(stops[i]);
   if(!card||time===null||!card.querySelector('input.donecheck[data-step]')?.checked)continue;
   const stamp=clock.read(card);
   if(!Number.isFinite(stamp))continue;
   const actual=nyDateTime(stamp);
   if(actual.date!==day.date)continue;
   matched.push({i,stamp,actual,planned:time,stop:stops[i]});
  }
  if(!matched.length){
   const p=doc.createElement('p');
   p.textContent='Aguardando conclusão com hora confirmada e etapa correspondente na v1.57. As marcações antigas continuam preservadas.';
   output.appendChild(p);return;
  }
  const latest=matched.sort((a,b)=>a.stamp-b.stamp).at(-1),diff=latest.actual.minute-latest.planned;
  const p=doc.createElement('p');
  p.textContent=latest.stop.title+' • Feito às '+latest.actual.label+' (NY) • '+
   (diff>0?diff+' min depois':diff<0?Math.abs(diff)+' min antes':'no horário')+
   ' do término planejado.';
  output.appendChild(p);
  if(Math.abs(diff)>180){
   const caution=doc.createElement('p');caution.textContent='Diferença muito grande: revise o registro e mantenha horários originais até confirmar.';output.appendChild(caution);return;
  }
  const notes=doc.createElement('ul');
  let delta=diff,shown=0;
  const nodeList=[...schedule.querySelectorAll('.ny26-v157-step')];
  for(let i=latest.i+1;i<stops.length&&shown<3;i++){
   if(nodeList[i]?.hidden)continue;
   const t=startMinute(stops[i]);if(t===null)continue;
   const stage=stageFor(stops[i]);
   const locked=stage?.kind==='fixed';
   const li=doc.createElement('li');
   if(locked){
    li.textContent=stops[i].time+' • '+stops[i].title+' — HORÁRIO PRIORITÁRIO, não deslocado.';
    delta=0;
   }else{
    const estimate=Math.max(latest.actual.minute,t+delta);
    const label=String(Math.floor((estimate%1440)/60)).padStart(2,'0')+':'+String(estimate%60).padStart(2,'0');
    li.textContent=label+' (original '+stops[i].time+') • '+stops[i].title;
   }
   notes.appendChild(li);shown++;
  }
  output.appendChild(notes);
  const foot=doc.createElement('small');foot.textContent='Sugestão, não previsão de transporte. Reservas, fotos e Feito não são alterados.';output.appendChild(foot);
 }
 function nyDateTime(stamp){
  const p=Object.fromEntries(new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',
   year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'})
   .formatToParts(new Date(stamp)).map(x=>[x.type,x.value]));
  return {date:p.year+'-'+p.month+'-'+p.day,minute:Number(p.hour)*60+Number(p.minute),label:p.hour+':'+p.minute};
 }
 const unsubscribe=clock?.subscribe(()=>update());
 section.__ny26RhythmCleanup=()=>{if(typeof unsubscribe==='function')unsubscribe()};
 wrapper.__ny26RhythmRefresh=update;
 update();
}
function day07MapsUrl(address){
 return 'https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(address)+'&travelmode=driving';
}
function injectDay07Stop(doc,section,day){
 // Operacional v1.60: adiciona um card visual DEPOIS do Walmart no roteiro legado.
 // Nenhuma checkbox nova, nenhum ID de Feito, nenhum ID de comprovante e nenhuma mutacao do HTML privado.
 section.querySelectorAll('[data-ny26-day07-refuel]').forEach(el=>el.remove());
 if(day.date!=='2026-11-07'||day.revision!=='1.60')return null;
 const stops=day.stops?.length?day.stops:day.places||[];
 const royal=stops.find(stop=>/^Royal Farms\b/i.test(String(stop.title||'')));
 if(!royal||!/3314 Market St/i.test(royal.address||''))return null;
 const originals=[...section.querySelectorAll('article.step:not([data-ny26-day07-refuel])')];
 const cardTitle=el=>(el.querySelector('.place-link')?.textContent||
  el.querySelector('h3,h2')?.textContent||'').trim();
 const walmart=originals.find(el=>/Walmart\s+Eddystone/i.test(cardTitle(el)));
 const falls=originals.find(el=>/Falls\s+Church/i.test(cardTitle(el)));
 const card=doc.createElement('article');
 card.className='ny26-day07-stop';
 card.dataset.ny26Day07Refuel='v1.60';
 card.setAttribute('aria-label','Parada de abastecimento Royal Farms');
 const time=doc.createElement('div');time.className='ny26-day07-time';
 time.textContent='⏱ '+String(royal.time||'Após Walmart Eddystone • horário flexível');
 card.appendChild(time);
 const heading=doc.createElement('h3');heading.textContent='⛽ '+royal.title;card.appendChild(heading);
 const addr=doc.createElement('p');addr.className='ny26-day07-address';
 addr.textContent='📍 '+royal.address;card.appendChild(addr);
 const actions=doc.createElement('div');actions.className='ny26-day07-actions';
 const maps=doc.createElement('a');maps.href=day07MapsUrl(royal.address);
 maps.target='_blank';maps.rel='noopener noreferrer';
 maps.textContent='🚗 GPS • Traçar rota no Google Maps';
 actions.appendChild(maps);card.appendChild(actions);
 const details=doc.createElement('details');
 const summary=doc.createElement('summary');summary.textContent='Informações sobre abastecimento';
 details.appendChild(summary);
 for(const [label,val] of [['Objetivo',royal.why],['Como chegar',royal.look],
  ['Orientação',royal.instructions],['Comida',royal.food],
  ['Banheiro',royal.bathroom],['Atenção',royal.warning]]){
  if(!val)continue;
  const p=doc.createElement('p');const strong=doc.createElement('strong');
  strong.textContent=label+': ';p.appendChild(strong);
  p.appendChild(doc.createTextNode(String(val)));details.appendChild(p);
 }
 card.appendChild(details);
 const note=doc.createElement('p');note.className='ny26-day07-note';
 note.textContent='Parada acrescentada ao planejamento v1.60. O horário é flexível e não modifica as marcações Feito anteriores.';
 card.appendChild(note);
 if(walmart)walmart.insertAdjacentElement('afterend',card);
 else if(falls)falls.insertAdjacentElement('beforebegin',card);
 else{
  // Se o HTML antigo não possuir essa parada, posicionar após a programação v1.57.
  const panel=section.querySelector('.ny26-v157-day');
  if(panel)panel.insertAdjacentElement('afterend',card);
  else section.appendChild(card);
 }
 return card;
}
// Show approved private updates beside the actual execution cards.
// Visual only: never manufacture a donecheck or modify photos/attachments.
function injectPrivateUpdateCards(doc,section,day){
 section.querySelectorAll('[data-ny26-secure-stop],.ny26-private-update-note,[data-ny26-private-link]').forEach(x=>x.remove());
 const items=day.stops?.length?day.stops:day.places||[];
 const original=[...section.querySelectorAll('article.step:not([data-ny26-day07-refuel])')];
 const originalTitle=el=>trim(el.querySelector('.place-link')?.textContent||el.querySelector('h3,h2')?.textContent);
 const changed=items.filter(x=>x.privateUpdateId);
 let inserted=0;
 for(const stop of changed){
  if(day.date==='2026-11-07'&&day.revision==='1.60'&&/^Royal Farms\b/i.test(stop.title||''))continue;
  const matched=original.find(x=>cardMatch(originalTitle(x),stop.title)>=7);
  if(matched){
   const content=matched.querySelector('.stepcontent')||matched;
   let note=content.querySelector('.ny26-private-update-note');
   if(note)note.remove();
   note=doc.createElement('p');note.className='ny26-private-update-note';
   note.textContent='🔄 Informações atualizadas pelo pacote '+stop.privateUpdateId;
   content.appendChild(note);
   if(stop.address){
    const a=doc.createElement('a');a.className='ny26-v157-jump';a.dataset.ny26PrivateLink='1';a.target='_blank';
    a.rel='noopener noreferrer';
    a.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(stop.address)+'&travelmode=driving';
    a.textContent='📍 Traçar rota atualizada no Maps';content.appendChild(a);
   }
   continue;
  }
  const card=doc.createElement('article');
  card.className='ny26-day07-stop ny26-private-update-card';
  card.dataset.ny26SecureStop=stop.privateUpdateId+':'+stop.title;
  const time=doc.createElement('div');time.className='ny26-day07-time';
  time.textContent='🕒 '+String(stop.time||'Horário a confirmar');
  card.appendChild(time);
  const title=doc.createElement('h3');title.textContent='📍 '+stop.title;card.appendChild(title);
  if(stop.status){const status=doc.createElement('p');status.className='ny26-day07-parking-priority';status.textContent='🅿️ '+stop.status;card.appendChild(status)}
  if(stop.address){
   const addr=doc.createElement('p');addr.className='ny26-day07-address';
   addr.textContent=stop.address;card.appendChild(addr);
   const actions=doc.createElement('div');actions.className='ny26-day07-actions';
   const link=doc.createElement('a');
   link.href='https://www.google.com/maps/dir/?api=1&destination='+encodeURIComponent(stop.address)+'&travelmode=driving';
   link.target='_blank';link.rel='noopener noreferrer';link.textContent='🚗 Traçar rota no Google Maps';
   actions.appendChild(link);card.appendChild(actions);
  }
  const more=doc.createElement('details');
  const summary=doc.createElement('summary');summary.textContent='Informações desta parada';more.appendChild(summary);
  for(const [label,value] of [['Objetivo',stop.why],['Como executar',stop.instructions],
    ['Alimentação',stop.food],['Banheiro',stop.bathroom],['Atenção',stop.warning]]){
   if(!value)continue;
   const p=doc.createElement('p');const b=doc.createElement('strong');b.textContent=label+': ';
   p.appendChild(b);p.appendChild(doc.createTextNode(String(value)));more.appendChild(p);
  }
  if(/^https:\/\//i.test(stop.source||'')){const official=doc.createElement('a');official.href=stop.source;official.target='_blank';official.rel='noopener noreferrer';official.textContent='Regras oficiais do estacionamento (online)';more.appendChild(official)}
  card.appendChild(more);
  const label=doc.createElement('p');label.className='ny26-day07-note';
  label.textContent='Atualização '+stop.privateUpdateId+' aprovada. Os registros Feito e anexos anteriores não foram alterados.';
  card.appendChild(label);
  // A etapa anterior pode ser um card suplementar (ex.: Royal Farms), não apenas artigo legado.
  const anchorCandidates=[...section.querySelectorAll('article.step,[data-ny26-day07-refuel]')];
  const anchor=anchorCandidates.find(x=>cardMatch(originalTitle(x),stop.privateAnchor)>=7);
  if(anchor)anchor.insertAdjacentElement(stop.privatePlacement==='before'?'beforebegin':'afterend',card);
  else{
   const first=section.querySelector('.ny26-v157-day');
   if(first)first.insertAdjacentElement('afterend',card);else section.appendChild(card);
  }
  inserted++;
 }
 return inserted;
}
function render(doc,section,day,scope){
 section.querySelector('.ny26-v157-day')?.remove();
 // Recria o card informativo sem tocar nas etapas reais nem duplicar a parada.
 section.querySelectorAll('[data-ny26-day07-refuel]').forEach(el=>el.remove());
 // Conservar os artigos originais com IDs/Feito/PDF; só alternar sua visibilidade.
 section.classList.add('ny26-v157-view');
 const legacy=legacyControls(doc,section,day);
 const wrapper=doc.createElement('section');wrapper.className='ny26-v157 ny26-v157-day';
 const title=doc.createElement('h3');const hasUpdate=(day.stops||[]).some(x=>x.privateUpdateId)||(day.places||[]).some(x=>x.privateUpdateId);
 title.textContent='🗽 Roteiro principal • Planejamento v'+(day.revision||'1.57')+(hasUpdate?' + atualizações':'');wrapper.appendChild(title);
 if(day.revisionNote){const notice=doc.createElement('p');notice.className='ny26-v157-risk';notice.textContent='🆕 Atualização do dia: '+day.revisionNote;wrapper.appendChild(notice)}
 para(doc,wrapper,'Objetivo',day.title);
 const schedule=doc.createElement('details');schedule.className='ny26-v157-program';
 // A informação essencial fica visível; todas as descrições longas sob demanda.
 schedule.open=false; // Evita duplicar as paradas dos cards operacionais ao abrir o dia.
 const sum=doc.createElement('summary');
 const stops=(day.stops?.length?day.stops:day.places)||[];
 // Dias de deslocamento (sem horarios detalhados na v1.57) mantem os cards operacionais visiveis.
 if(!day.stops?.length)legacy?.setOpen(true);
 const branch=addBranchChoice(doc,day,stops,scope);
 sum.textContent='📋 Ver programação completa ('+stops.length+' etapas)';
 schedule.appendChild(sum);
 for(const [index,stop] of stops.entries()){
  const item=line(doc,stop);
  if(day.date==='2026-11-07'&&day.revision==='1.60'&&/^Royal Farms\b/i.test(stop.title||''))item.open=true;
  const routeBranch=branch?.label(index);
  if(routeBranch){
   item.dataset.ny26Branch=routeBranch;item.classList.add('ny26-v157-branch');
   if(index===branch.aIndex||index===branch.bIndex){const label=doc.createElement('span');label.className='ny26-v157-branch-note';label.textContent=routeBranch==='metro'?'PLANO A — VOLTA DE METRÔ':'PLANO B — VOLTA A PÉ';item.querySelector('summary')?.insertAdjacentElement('afterend',label)}
  }
  const stage=stageFor(stop);
  if(stage){
   const tag=doc.createElement('span');tag.className='ny26-v157-stage '+stage.kind;tag.textContent=stage.text;
   item.querySelector('summary')?.insertAdjacentElement('afterend',tag);
  }
  if(legacy){
   const candidates=legacy.cards.map(card=>({card,score:cardMatch(
    trim(card.querySelector('.place-link')?.textContent),stop.title)})).filter(x=>x.score>=7).sort((a,b)=>b.score-a.score);
   if(candidates.length===1||candidates[0]?.score>candidates[1]?.score){
    if(candidates[0]){
     item.appendChild(accessibleAction(doc,'Abrir Feito / GPS deste ponto',()=>legacy.openCard(candidates[0].card)));
    }
   }
  }
  if(stop.address&&String(stop.address).length>8){
   const url='https://www.google.com/maps/search/?api=1&query='+encodeURIComponent(stop.address);
   const a=doc.createElement('a');a.href=url;a.target='_blank';a.rel='noopener noreferrer';
   a.className='ny26-v157-jump';a.textContent='📍 Abrir endereço no mapa (online)';
   item.appendChild(a);
  }
  addStopChoice(doc,stop,day,scope,item);
  schedule.appendChild(item);
 }
 renderOperational(doc,wrapper,day,schedule,legacy);
 renderLatestRhythm(doc,wrapper,day,legacy,schedule,section);
 if(branch){wrapper.appendChild(branch.wrap);branch.activate()}
 wrapper.appendChild(schedule);
 injectDay07Stop(doc,section,day);
 injectPrivateUpdateCards(doc,section,day);
 annotateExisting(doc,section,day);
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
function decorate(doc,pack,scope){
 if(!doc?.body||!pack)return {days:0,steps:0};
 validate(pack);
 try{window.NY26FoodGuide?.updateHeader(doc,'1.57')}catch(e){console.warn('Título v1.57:',e)}
 if(!doc.getElementById('ny26-v157-style')){
  const style=doc.createElement('style');style.id='ny26-v157-style';style.textContent=css;doc.head.appendChild(style);
 }
 const consolidatedDays=pack.days.map(d=>({...d,places:consolidatePlaces(d.places,d.date)}));
 const index=new Map(consolidatedDays.map(x=>[x.date,x]));
 let days=0,steps=0;
 for(const section of doc.querySelectorAll('section.daypage')){
  const d=index.get(dateOf(section));if(!d)continue;
  render(doc,section,d,scope);days++;steps+=(d.stops?.length||0)+(d.places?.length||0);
 }
 foodDirectory(doc,pack);
 return {days,steps};
}
window.NY26V157Overlay={decorate,validate,dateOf,consolidatePlaces,version:'1.57'};
})();