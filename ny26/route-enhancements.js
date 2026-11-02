/* NY26: ajustes de roteiro somente na interface; nao altera Firestore, documentos ou checklists. */
(()=>{'use strict';
const css=[
'article.step{min-width:0!important;overflow-wrap:anywhere}',
'article.step .stepcontent{min-width:0!important;max-width:100%;overflow-wrap:anywhere}',
'article.step .stepcontent>*{max-width:100%}',
'article.step .place-link{overflow-wrap:anywhere}',
'article.step .ny26-time-inline{display:table!important;position:static!important;max-width:100%!important;margin:0 0 9px!important;padding:4px 9px!important;border-radius:7px!important;background:#e9f2f8!important;color:#284d67!important;font:800 12px/1.35 system-ui,sans-serif!important;white-space:normal!important;transform:none!important}',
'article.step .ny26-original-time{display:none!important}',
'.ny26-enhance{clear:both;margin:10px 0 8px;padding:11px 12px;border:1px solid #c6d8e2;border-left:3px solid #497c97;background:#f4f9fc;border-radius:10px;color:#264458;font:500 12px/1.5 system-ui,sans-serif;max-width:100%;overflow-wrap:anywhere}',
'.ny26-enhance summary{cursor:pointer;font-weight:800}',
'.ny26-enhance p{margin:7px 0}.ny26-enhance ul{margin:7px 0 4px 17px;padding:0}.ny26-enhance li{margin:4px 0}',
'.ny26-enhance a{color:#075888;text-decoration:underline}',
'.ny26-enhance.important{border-left:3px solid #bc781d;background:#fff7e9;border-color:#e6c58c}',
'.ny26-enhance.choice{border-left:3px solid #176c8b;background:#eff8fa}',
'.ny26-choice-actions,.ny26-live-row{display:flex;gap:7px;flex-wrap:wrap;margin:9px 0}',
'.ny26-choice-actions button{padding:8px 10px;border-radius:8px;background:white;border:1px solid #8fb7cf;color:#174c6c;font:800 12px system-ui,sans-serif;cursor:pointer}',
'.ny26-choice-actions button[aria-pressed=true]{background:#12618b;color:white}',
'.ny26-live label{display:flex;flex-direction:column;gap:4px;min-width:120px;flex:1;font-weight:700}',
'.ny26-live input,.ny26-live select{width:100%;min-width:0;padding:8px;border:1px solid #a3bdcb;border-radius:8px;color:#183a50;background:white;font:500 13px system-ui,sans-serif}',
'.ny26-live-result{margin-top:11px;padding:9px;border-radius:8px;background:#fff}',
'.ny26-done-record{display:inline-block;margin:4px 8px;padding:3px 7px;background:#e7f3eb;border-radius:6px;color:#1c6139;font:700 11px/1.4 system-ui,sans-serif}.ny26-done-record[hidden]{display:none!important}',
'.ny26-confirm-overlay[hidden]{display:none!important}',
'.ny26-confirm-overlay{position:fixed;inset:0;z-index:2147483647;background:rgba(10,29,44,.76);padding:14px;display:flex;justify-content:center;align-items:center;overflow:auto;font:500 14px/1.5 system-ui,sans-serif}',
'.ny26-confirm-dialog{width:min(440px,100%);max-height:calc(100dvh - 28px);overflow-y:auto;background:white;border-radius:14px;padding:19px;box-shadow:0 14px 45px #0005;color:#183b52}',
'.ny26-confirm-dialog h2{font-size:19px;line-height:1.3;margin:0 0 10px}',
'.ny26-confirm-dialog p{margin:7px 0 12px}',
'.ny26-confirm-dialog label{font-weight:800;display:block;margin:9px 0 6px}',
'.ny26-confirm-dialog input[type=time]{width:100%;padding:12px;border:1px solid #849eae;border-radius:9px;font-size:19px;background:white;color:#15344e;min-height:46px}',
'.ny26-confirm-actions{display:flex;gap:10px;flex-wrap:wrap;margin-top:18px}',
'.ny26-confirm-actions button{flex:1;min-width:135px;min-height:44px;border-radius:9px;padding:10px;font-weight:800;border:1px solid #afc6d2;background:#edf4f7;color:#1c475e;cursor:pointer}',
'.ny26-confirm-actions button[type=submit]{background:#11688b;border-color:#11688b;color:white}',
'.ny26-confirm-error{color:#a12b1c;font-weight:700}',

'@media(max-width:520px){article.step .actions{display:flex!important;flex-wrap:wrap!important;gap:7px!important}article.step .actions>*{max-width:100%;white-space:normal!important}}'
].join('');
const trim=v=>String(v||'').replace(/\s+/g,' ').trim();
const rules=[
 [/Metr[oô]\s*1.*South Ferry|23 St.*South Ferry/i,'🚇 Linha 1 • 23 St → South Ferry',1,[
 'Entrar na estação 23 St da 7th Avenue; linha 1 sentido Downtown / South Ferry, não Uptown / Bronx.',
 'Descer na estação terminal South Ferry e seguir a pé até The Battery. A triagem da Statue City Cruises é junto à água, atrás do Castle Clinton; não é o ferry gratuito para Staten Island.',
 'Contar tempo de caminhada, catracas e inspeção. O horário do ingresso da Estátua indica acesso à fila, não partida garantida da embarcação.',
 'Conferir serviço MTA no dia, inclusive alterações de feriado.'
 ],'https://new.mta.info/'],
 [/Pier\s*11|NYC Ferry.*DUMBO/i,'⛴️ Pier 11 → DUMBO',1,[
 'Pier 11 / Wall St: acesso em South St com Gouverneur Lane. É NYC Ferry, diferente da Statue City Cruises e do Staten Island Ferry.',
 'Verificar a linha East River e o horário Pier 11 → DUMBO / Fulton Ferry no app NYC Ferry. A travessia é curta, mas há deslocamento e espera no píer.',
 'NYC Ferry exige passagem separada do OMNY do metrô; tarifa avulsa padrão informada: US$ 4,50 por passageiro (US$ 18 para quatro pagantes). Comprar no app ou nas máquinas e conferir os bilhetes.',
 'No Veterans Day (11/11), checar eventual horário especial. 14h40–15h05 é janela de planejamento, NÃO horário confirmado de saída.',
 'Decisão: só usar o ferry se a espera permitir chegar a Brooklyn Heights Promenade perto das 16h15. Caso contrário, usar o plano B via metrô.'
 ],'https://www.ferry.nyc/routes-and-schedules/east-river/'],
 [/Retirada do carro.*Avis.*JFK/i,'🚝 JFK → Avis Federal Circle',1,[
 'No terminal de chegada, seguir AirTrain → Federal Circle → Rental Cars → Avis. O trajeto interno até Federal Circle é gratuito.',
 'Confirmar as placas e a operação no dia. Se houver substituição por ônibus, seguir as instruções do aeroporto.'
 ],'https://www.jfkairport.com/to-from-airport/air-train'],
 [/Roosevelt.*Tram|bondinho.*Roosevelt|tramway/i,'🚠 Roosevelt Island Tram',0,[
 'Estação de Manhattan na 2nd Avenue, entre 59th e 60th Streets. Ida e volta são viagens distintas.',
 'Se houver fila ou interrupção, consultar a estação de metrô Roosevelt Island (linha F, conforme serviço).'
 ],'https://rioc.ny.gov/302/Tramway'],
 [/Est[aá]tua|Liberty Island|Pedestal|Statue City Cruises/i,'⚠️ Estátua: alimentos e armários',1,[
 'Na balsa e na ilha podem ser levados lanches e mochilas; dentro do pedestal, alimentos, bebidas, mochilas, carrinhos e guarda-chuvas grandes são proibidos.',
 'Para o pedestal: água em garrafa plástica transparente é permitida; demais itens vão para armário na Liberty Island, depósito de 25 centavos (moeda). Não há armários no The Battery.',
 'Não levar recipientes de vidro, objetos cortantes, sprays perigosos ou outros itens proibidos pela segurança.'
 ],'https://statuecitycruises.com/know-before-you-go/security/'],
 [/SUMMIT.*Vanderbilt/i,'⚠️ SUMMIT: proibições de entrada',1,[
 'Alimentos e bebidas externos não são aceitos. Malas, grandes volumes e mochilas de rodinhas são proibidos.',
 'Evitar saltos inadequados para o piso espelhado; levar óculos escuros e roupas confortáveis para os reflexos.',
 'Tripés ou bastões de selfie maiores que o limite permitido também são proibidos.'
 ],'https://summitov.com/prohibited-items/'],
 [/Museu.*Hist[oó]ria Natural|AMNH|American Museum of Natural History/i,'⚠️ AMNH: comida e bagagens',1,[
 'Não comer ou beber nas salas de exposição; alimentação apenas em locais designados.',
 'Bolsas/mochilas grandes acima de 11 × 17 polegadas e recipientes abertos de comida/bebida são proibidos; garrafas de água são permitidas.',
 'Estação próxima: 81 St–Museum of Natural History (B/C conforme dia e serviço).'
 ],'https://www.amnh.org/plan-your-visit/code-of-conduct'],
 [/National Air and Space|Air and Space Museum/i,'⚠️ Air and Space: triagem',1,[
 'Não entrar com comida de fora. Água engarrafada é permitida.',
 'Todos passam pela inspeção e devem ter passes com horário marcado. Levar os quatro comprovantes acessíveis.'
 ],'https://airandspace.si.edu/visit/museum-dc/visiting-tips'],
 [/Morgan Library|Morgan Museum/i,'⚠️ Morgan Library: bolsas, comida e horário',1,[
 'Mochilas e bolsas grandes precisam ficar no guarda-volumes; malas de viagem nem sequer podem entrar ou ser guardadas.',
 'Não levar alimentos ou bebidas de fora; no museu não é permitido comer ou beber. Guarda-chuva fora de bolsa compatível deve ser guardado.',
 'A entrada antes da hora do ingresso não é permitida e a entrada tardia não é garantida. Conferir os quatro ingressos gratuitos antes de sair.'
 ],'https://www.themorgan.org/visit/guidelines'],
 [/Memorial.*9\/11|9\/11.*Memorial/i,'⚠️ 9/11 Memorial: restrições',1,[
 'Não levar alimentos/bebidas externos nem vidro para o memorial; respeitar o silêncio e não colocar objetos nas piscinas.',
 'Museu é uma visita separada, com ingresso e inspeção próprios. Não depender dos banheiros internos sem entrada para o museu.'
 ],'https://www.911memorial.org/visit/about/visitor-guidelines']
];
function cleanText(v){
 return String(v||'').replace(/almo[cç]o\s+econ[oô]mico/gi,'Almoço')
 .replace(/SEM PARADA NO FORT McHENRY\/BALTIMORE\s*\(retirado do roteiro por decis[aã]o do usu[aá]rio\)\.?/gi,'')
 .replace(/\s*\(retirad[oa] do roteiro por decis[aã]o do usu[aá]rio\)/gi,'')
 .replace(/\s*\(retirad[oa] do roteiro\)/gi,'');
}
function name(step){return trim(step.querySelector('.place-link')?.textContent||step.querySelector('h3,h2')?.textContent)}
function clean(doc){
 const walker=doc.createTreeWalker(doc.body,4);const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
 for(const node of nodes){
  if(node.parentElement?.closest('script,style,textarea,option,pre,code'))continue;
  const next=cleanText(node.nodeValue);if(next!==node.nodeValue)node.nodeValue=next;
 }
 for(const el of doc.querySelectorAll('[title],[aria-label]'))for(const k of ['title','aria-label']){
  const v=el.getAttribute(k);if(v){const n=cleanText(v);if(v!==n)el.setAttribute(k,n)}
 }
 // Big Button e parada excluida, mas nao remover textos sobre outros atrativos.
 for(const step of doc.querySelectorAll('article.step')){
  if(/^big button\b|fort mchenry/i.test(name(step))){const id=step.id;step.remove();if(id)doc.getElementById('ficha-'+id)?.remove()}
 }
 for(const el of doc.querySelectorAll('article.step p,article.step .note,.sheet-text p')){
  if(el.children.length===0&&!trim(el.textContent))el.remove();
 }
}
function placeTime(doc,step){
 const content=step.querySelector('.stepcontent');if(!content||content.querySelector('.ny26-time-inline'))return;
 let old=null;
 for(const selector of ['.time','.step-time','.stepwhen','.when','.slot','time']){
  const e=step.querySelector(selector);if(e&&/^\d{1,2}:\d{2}/.test(trim(e.textContent))&&trim(e.textContent).length<56){old=e;break}
 }
 if(!old)old=[...step.querySelectorAll('span,small,div,strong')].slice(0,28).find(e=>!e.contains(content)&&e.children.length===0&&/^\d{1,2}:\d{2}\s*[–—-]/.test(trim(e.textContent))&&trim(e.textContent).length<56);
 if(!old)return;
 const span=doc.createElement('div');span.className='ny26-time-inline';span.textContent=trim(old.textContent);
 content.insertBefore(span,content.firstChild);old.classList.add('ny26-original-time');
}
function appendGuide(doc,step,rule){
 const [rx,title,important,notes,link]=rule;
 const el=doc.createElement('details');el.className='ny26-enhance'+(important?' important':'');
 const summary=doc.createElement('summary');summary.textContent=title;el.appendChild(summary);
 const ul=doc.createElement('ul');for(const line of notes){const li=doc.createElement('li');li.textContent=line;ul.appendChild(li)}el.appendChild(ul);
 const a=doc.createElement('a');a.href=link;a.target='_blank';a.rel='noopener noreferrer';a.textContent='Fonte oficial • consultar online';el.appendChild(a);
 (step.querySelector('.stepcontent')||step).appendChild(el);
}
function choice(doc,step,heading,plans){
 const box=doc.createElement('div');box.className='ny26-enhance choice';
 const strong=doc.createElement('strong');strong.textContent='🔀 PONTO DE DECISÃO • '+heading;box.appendChild(strong);
 const key='ny26-choice-v1:'+trim(step.closest('section.daypage')?.id)+':'+(step.id||name(step));
 const actions=doc.createElement('div');actions.className='ny26-choice-actions';
 const status=doc.createElement('p');status.setAttribute('aria-live','polite');
 let active='';try{active=localStorage.getItem(key)||''}catch{}
 function update(){
  status.textContent=active?'Escolhido neste aparelho: '+(plans.find(p=>p.id===active)?.title||active):'Decisão pendente: escolher quando chegar a este ponto.';
  actions.querySelectorAll('button[data-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.choice===active)));
 }
 for(const plan of plans){
  const para=doc.createElement('p');const b=doc.createElement('b');b.textContent=plan.title+': ';para.appendChild(b);para.appendChild(doc.createTextNode(plan.description));box.appendChild(para);
  const btn=doc.createElement('button');btn.type='button';btn.dataset.choice=plan.id;btn.textContent='Escolher '+plan.title;
  btn.addEventListener('click',()=>{active=plan.id;try{localStorage.setItem(key,active)}catch{}update()});actions.appendChild(btn);
 }
 const clear=doc.createElement('button');clear.type='button';clear.textContent='Desfazer';
 clear.addEventListener('click',()=>{active='';try{localStorage.removeItem(key)}catch{}update()});actions.appendChild(clear);
 box.append(actions,status);
 const caption=doc.createElement('small');caption.textContent='Escolha local neste celular; não altera reservas nem a lista Feito.';box.appendChild(caption);
 (step.querySelector('.stepcontent')||step).appendChild(box);update();
}
function addChoices(doc){
 for(const step of doc.querySelectorAll('article.step')){
  const n=name(step),day=trim(step.closest('section.daypage')?.querySelector('h1,h2')?.textContent);
  if(/Pier\s*11|NYC Ferry.*DUMBO/i.test(n)){
   choice(doc,step,'Pier 11 → DUMBO',[
    {id:'ferry',title:'Plano A — ferry',description:'Conferir saída East River e só embarcar se houver folga até Brooklyn Heights às 16h15.'},
    {id:'metro',title:'Plano B — metrô',description:'Não esperar no píer; consultar A/C para High St–Brooklyn Bridge e caminhar até DUMBO.'}
   ]);
  }else if(/Volta.*hotel|Retorno.*hotel|Retornar.*hotel/i.test(n)){
   if(/Times Square|Radio City/i.test(n)){
    choice(doc,step,'fim de passeio',[
     {id:'hotel',title:'Plano A — hotel',description:'Voltar diretamente ao The Chelsean para descansar.'},
     {id:'times',title:'Plano B — Times Square',description:'Visitar no máximo 1 ou 2 lojas. Voltar a pé ou, se cansados, conferir a linha 1 sentido Downtown de Times Sq–42 St até 23 St, seguida da caminhada curta ao The Chelsean.'}
    ]);
   }else if(/Brooklyn|DUMBO/i.test(n+' '+day)){
    choice(doc,step,'retorno do Brooklyn',[
     {id:'walk',title:'Plano A — caminhada',description:'Apenas se houver disposição e condições seguras; considerar a ponte e a caminhada adicional.'},
     {id:'metro',title:'Plano B — metrô',description:'Verificar High St (A/C) sentido Manhattan; linha C para 23 St/8th Ave quando operando.'}
    ]);
   }else{
    choice(doc,step,'retorno ao hotel',[
     {id:'walk',title:'Plano A — a pé',description:'Percurso previsto, caso o cansaço, a distância e o clima permitam.'},
     {id:'transport',title:'Plano B — transporte',description:'Conferir metrô/ônibus na MTA; táxi amarelo se for mais simples para a família.'}
    ]);
   }
  }
 }
}
// Every new Feito click stores an actual UTC instant, then renders it in New York time.
// The historical donecheck data remain untouched (the original HTML saves only booleans).
const minutes=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(s||'');return m?+m[1]*60+(+m[2]):null};
const time=n=>{n=((n%1440)+1440)%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
const nyParts=new Intl.DateTimeFormat('en-US',{timeZone:'America/New_York',
 year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',hourCycle:'h23'});
function nyTime(timestamp){
 const parts=Object.fromEntries(nyParts.formatToParts(new Date(timestamp)).map(p=>[p.type,p.value]));
 return {date:parts.year+'-'+parts.month+'-'+parts.day,
  minute:Number(parts.hour)*60+Number(parts.minute),
  label:parts.hour+':'+parts.minute};
}
function dayDate(day){
 const head=trim([day.dataset.date,day.querySelector('h1,h2,.dayheader,.daytitle,.day-title')?.textContent,day.id].filter(Boolean).join(' '));
 let m=head.match(/\b2026[-/]11[-/](0?[1-9]|1[0-9]|2[0-9]|30)\b/);
 if(m)return '2026-11-'+m[1].padStart(2,'0');
 m=head.match(/\b(0?[1-9]|1[0-9]|2[0-9]|30)[/-]11(?:[/-]2026)?\b/);
 if(m)return '2026-11-'+m[1].padStart(2,'0');
 m=head.match(/\b(0?[1-9]|1[0-9]|2[0-9]|30)\s*(?:de\s*)?(?:novembro|nov\b)/i);
 if(m)return '2026-11-'+m[1].padStart(2,'0');
 m=day.id?.match(/(?:^|[-_])(?:dia|day)[-_]?(0?[1-9]|1[0-9]|2[0-9]|30)(?:$|[-_])/i);
 if(m)return '2026-11-'+m[1].padStart(2,'0');
 return null;
}
function schedule(step){
 const t=trim(step.querySelector('.ny26-time-inline,.time,.step-time,.when,time')?.textContent||step.textContent.slice(0,120));
 const m=t.match(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/);
 return m?{a:minutes(m[1]),b:minutes(m[2]),label:m[0]}:null;
}
function fixed(step){
 return /SUMMIT|Est[aá]tua.*Liberdade|Pedestal|Air and Space|Morgan Library|Voo|check.?in|embarque/i.test(name(step))||
 /HOR[AÁ]RIO FIXO|RESERVA PAGA/i.test(trim(step.querySelector('.flag,.tag,.status')?.textContent));
}
function installCompletionClock(doc,scope){
 if(doc.__ny26CompletionClock)return doc.__ny26CompletionClock;
 const prefix='ny26-completed-v1:'+String(scope||'local')+':';
 const ephemeral=new Map(),listeners=new Set();
 let modal=null,activeInput=null,approvedInput=null,approvedTimestamp=null,restoreFocus=null;
 function id(step){
  const checkbox=step?.querySelector('input.donecheck[data-step]');
  const token=checkbox?.getAttribute('data-step')||step?.id;
  return token?prefix+token:null;
 }
 function read(step){
  const key=id(step);if(!key)return null;
  try{
   const value=JSON.parse(localStorage.getItem(key)||'null');
   if(value&&Number.isFinite(value.timestamp))return value.timestamp;
  }catch{}
  return ephemeral.get(key)||null;
 }
 function write(step,checked,timestamp){
  const key=id(step);if(!key)return;
  if(checked){
   const stamp=Number.isFinite(timestamp)?timestamp:Date.now();
   ephemeral.set(key,stamp);
   try{localStorage.setItem(key,JSON.stringify({timestamp:stamp}))}catch{}
  }else{
   ephemeral.delete(key);
   try{localStorage.removeItem(key)}catch{}
  }
 }
 function showTime(step){
  const input=step?.querySelector('input.donecheck[data-step]');if(!input)return;
  const label=input.closest('label.donecontrol,label');if(!label)return;
  let marker=step.querySelector('.ny26-done-record');
  if(!marker){
   marker=doc.createElement('small');marker.className='ny26-done-record';
   label.insertAdjacentElement('afterend',marker);
  }
  const stamp=input.checked?read(step):null;
  marker.hidden=stamp===null;
  marker.textContent=stamp!==null?'Concluído às '+nyTime(stamp).label+' (NY)':'';
 }
 function notify(step){
  showTime(step);
  listeners.forEach(cb=>{try{cb(step)}catch(e){console.warn('Roteiro dinamico:',e)}});
 }
 for(const step of doc.querySelectorAll('article.step'))showTime(step);
 function ensureDialog(){
  if(modal)return modal;
  const overlay=doc.createElement('div');
  overlay.className='ny26-confirm-overlay';overlay.hidden=true;
  overlay.setAttribute('role','presentation');
  const panel=doc.createElement('section');
  panel.className='ny26-confirm-dialog';panel.setAttribute('role','dialog');
  panel.setAttribute('aria-modal','true');panel.setAttribute('aria-labelledby','ny26-confirm-title');
  const heading=doc.createElement('h2');heading.id='ny26-confirm-title';heading.textContent='✅ Confirmar conclusão';
  const form=doc.createElement('form');form.setAttribute('novalidate','');
  const place=doc.createElement('p');place.id='ny26-confirm-place';
  const date=doc.createElement('p');date.id='ny26-confirm-date';
  const label=doc.createElement('label');label.textContent='Horário da conclusão • Nova York';
  const timeInput=doc.createElement('input');timeInput.type='time';timeInput.step='60';
  timeInput.id='ny26-confirm-time';timeInput.required=true;label.htmlFor=timeInput.id;
  const explanation=doc.createElement('p');
  explanation.textContent='Você pode corrigir o horário. A etapa só será marcada Feito depois da confirmação; as demais etapas flexíveis serão recalculadas.';
  const alert=doc.createElement('p');alert.className='ny26-confirm-error';
  alert.setAttribute('role','alert');alert.hidden=true;
  const actions=doc.createElement('div');actions.className='ny26-confirm-actions';
  const cancel=doc.createElement('button');cancel.type='button';cancel.textContent='Cancelar';
  const confirm=doc.createElement('button');confirm.type='submit';confirm.textContent='Confirmar Feito';
  actions.append(cancel,confirm);
  form.append(place,date,label,timeInput,explanation,alert,actions);
  panel.append(heading,form);overlay.append(panel);doc.body.append(overlay);
  modal={overlay,form,place,date,timeInput,alert,cancel,confirm,openedAt:null,dateNY:null,originFocus:null};
  cancel.addEventListener('click',dismiss);
  overlay.addEventListener('click',event=>{if(event.target===overlay)dismiss()});
  doc.addEventListener('keydown',event=>{
   if(!overlay.hidden&&event.key==='Escape'){event.preventDefault();dismiss()}
   if(!overlay.hidden&&event.key==='Tab'){
    const focusables=[timeInput,cancel,confirm];const i=focusables.indexOf(doc.activeElement);
    if(event.shiftKey&&i<=0){event.preventDefault();confirm.focus()}
    else if(!event.shiftKey&&i===focusables.length-1){event.preventDefault();timeInput.focus()}
   }
  },true);
  form.addEventListener('submit',event=>{
   event.preventDefault();
   if(!activeInput)return;
   const selected=minutes(timeInput.value);
   if(selected===null||selected<0||selected>=1440){
    alert.textContent='Informe um horário válido antes de confirmar.';alert.hidden=false;timeInput.focus();return;
   }
   const currentAtOpen=nyTime(modal.openedAt);
   const clickedAt=modal.openedAt;
   const sec=new Date(clickedAt).getUTCSeconds()*1000+new Date(clickedAt).getUTCMilliseconds();
   const stamp=clickedAt+(selected-currentAtOpen.minute)*60000-sec;
   const check=nyTime(stamp);
   if(check.date!==modal.dateNY||check.minute!==selected){
    alert.textContent='Não foi possível validar o horário de Nova York. Confira a data e tente novamente.';
    alert.hidden=false;return;
   }
   const target=activeInput;
   const step=target.closest('article.step');
   dismiss();
   if(!target.isConnected||!step)return;
   approvedInput=target;approvedTimestamp=stamp;
   try{
    // Native click preserves existing click/change handlers and their saveDone flow.
    if(!target.checked)target.click();
    if(!target.checked){
     // Fallback if the private HTML prevents synthetic click for any reason.
     target.checked=true;target.dispatchEvent(new doc.defaultView.Event('change',{bubbles:true}));
    }
   }finally{approvedInput=null;approvedTimestamp=null}
  });
  return modal;
 }
 function dismiss(){
  if(!modal)return;
  modal.overlay.hidden=true;
  activeInput=null;
  const prev=modal.originFocus;modal.originFocus=null;
  if(prev?.isConnected&&typeof prev.focus==='function')prev.focus();
 }
 function askConfirm(input){
  if(activeInput)return;
  const step=input.closest('article.step');if(!step)return;
  const dialog=ensureDialog(),now=Date.now(),local=nyTime(now),day=step.closest('section.daypage'),expected=day&&dayDate(day);
  activeInput=input;dialog.openedAt=now;dialog.dateNY=local.date;
  dialog.originFocus=doc.activeElement;
  dialog.place.textContent=name(step)||'Etapa do roteiro';
  dialog.date.textContent='Data atual em Nova York: '+local.date.split('-').reverse().join('/');
  if(expected&&expected!==local.date){
   dialog.date.textContent+=' • Atenção: este roteiro é de '+expected.split('-').reverse().join('/')+
    '. O Feito será registrado, mas não deslocará esse dia.';
  }
  dialog.timeInput.value=local.label;
  dialog.alert.hidden=true;dialog.alert.textContent='';
  dialog.overlay.hidden=false;dialog.timeInput.focus();
 }
 // Intercept the native click before legacy click/change listeners persist Feito.
 // Cancelling a checkbox click restores its previous unchecked state automatically.
 doc.addEventListener('click',event=>{
  const input=event.target;
  if(!input?.matches?.('input.donecheck[data-step]')||input===approvedInput||activeInput)return;
  if(input.checked){
   event.preventDefault();event.stopImmediatePropagation();
   askConfirm(input);
  }
 },true);
 // Fallback covers keyboard/programmatic check events without the corresponding click.
 // Confirmed events are allowed through to the existing private itinerary handler.
 doc.addEventListener('change',event=>{
  const input=event.target;
  if(!input?.matches?.('input.donecheck[data-step]'))return;
  const step=input.closest('article.step');if(!step)return;
  if(input.checked&&input!==approvedInput){
   event.stopImmediatePropagation();
   input.checked=false;
   askConfirm(input);
   return;
  }
  if(activeInput&&input===activeInput)return;
  write(step,input.checked,input===approvedInput?approvedTimestamp:null);
  notify(step);
 },true);
 const api={read,subscribe:cb=>{listeners.add(cb);return()=>listeners.delete(cb)}};
 doc.__ny26CompletionClock=api;return api;
}
function planners(doc,clock){
 for(const day of doc.querySelectorAll('section.daypage')){
  const data=[...day.querySelectorAll('article.step')].map(step=>({step,t:schedule(step)}))
   .filter(x=>x.t&&x.t.a!==null&&x.t.b!==null);
  if(data.length<2)continue;
  const expected=dayDate(day);
  const box=doc.createElement('details');box.className='ny26-enhance ny26-live';
  const heading=doc.createElement('summary');
  heading.textContent='⏱ Roteiro dinâmico • automático pelo Feito';box.appendChild(heading);
  const intro=doc.createElement('p');
  intro.textContent='Ao tocar em Feito, confirme o horário de Nova York (preenchido automaticamente). Depois da confirmação, as sugestões seguintes serão recalculadas; reservas mantêm seus horários.';
  box.appendChild(intro);
  const output=doc.createElement('div');output.className='ny26-live-result';
  output.setAttribute('aria-live','polite');box.appendChild(output);
  function calculate(){
   const done=data.map((x,i)=>({...x,i,checkbox:x.step.querySelector('input.donecheck[data-step]'),
    timestamp:clock.read(x.step)})).filter(x=>x.checkbox?.checked);
   const withTime=done.filter(x=>x.timestamp!==null&&Number.isFinite(x.timestamp)).sort((a,b)=>a.timestamp-b.timestamp);
   const matching=withTime.filter(x=>!expected||nyTime(x.timestamp).date===expected);
   output.replaceChildren();
   const p=doc.createElement('p');
   if(!done.length){
    heading.textContent='⏱ Roteiro dinâmico • aguardando conclusão';
    p.textContent='Marque Feito quando terminar uma etapa. O próximo horário será calculado automaticamente.';
    output.appendChild(p);return;
   }
   if(!matching.length){
    heading.textContent='⏱ Roteiro dinâmico • sem registro válido';
    const prev=withTime.at(-1),actual=prev?nyTime(prev.timestamp):null;
    p.textContent=prev&&expected?
     'Último Feito registrado em '+actual.date.split('-').reverse().join('/')+' às '+actual.label+
     ' (Nova York), fora do dia deste roteiro. As atividades não foram deslocadas.':
     'Existem etapas Feito marcadas antes desta versão, sem horário de conclusão conhecido. Na próxima conclusão, o cálculo começará automaticamente.';
    output.appendChild(p);return;
   }
   const latest=matching.at(-1),actual=nyTime(latest.timestamp),deviation=actual.minute-latest.t.b;
   heading.textContent='⏱ Último Feito '+actual.label+' (NY) • '+(deviation<0?Math.abs(deviation)+' min antes':deviation>0?deviation+' min depois':'no horário');
   p.textContent='Concluído às '+actual.label+' (Nova York): '+name(latest.step)+'. '+
    (deviation<=-20?'Adiantamento de '+Math.abs(deviation)+' min. Antecipe apenas etapas flexíveis e abertas, ou use a folga para banheiro/descanso.':
     deviation>=20?'Atraso de '+deviation+' min. Reduza paradas opcionais sem comprometer as próximas reservas.':
     'Diferença de '+Math.abs(deviation)+' min. Continue a sequência prevista.');
   output.appendChild(p);
   if(Math.abs(deviation)>360){
    const warn=doc.createElement('p');warn.textContent='O registro está muito distante do planejamento. Confira o relógio automático do aparelho e se foi marcada a etapa correta; nenhuma alteração automática foi feita.';output.appendChild(warn);return;
   }
   const next=data.slice(latest.i+1).filter(x=>!x.step.querySelector('input.donecheck[data-step]')?.checked);
   if(!next.length){
    const end=doc.createElement('p');end.textContent='Não há próximas etapas pendentes com horários reconhecidos neste dia.';output.appendChild(end);return;
   }
   const list=doc.createElement('ul');let delta=deviation;
   for(const x of next.slice(0,6)){
    const li=doc.createElement('li');
    if(fixed(x.step)){
     li.textContent=time(x.t.a)+' • '+name(x.step)+' — horário FIXO, não alterado.';
     if(x.t.a-actual.minute<45){
      li.textContent+=' Atenção: conferir imediatamente deslocamento e possibilidade de chegada.';
     }
     delta=0;
    }else{
     const estimated=Math.max(actual.minute, x.t.a+delta);
     li.textContent=time(estimated)+' (previsto '+time(x.t.a)+') • '+name(x.step);
    }
    list.appendChild(li);
   }
   output.appendChild(list);
   const notice=doc.createElement('small');
   notice.textContent='Sugestões não alteram os horários originais, ingressos, checklists ou reservas. Conferir tempo de deslocamento, filas e funcionamento.';
   output.appendChild(notice);
  }
  clock.subscribe(step=>{if(step.closest('section.daypage')===day)calculate()});
  calculate();
  const anchor=day.querySelector('.ny-day-brief,.ck-daylink,.ny26-offline-advice,.dayheader,h1,h2');
  if(anchor)anchor.insertAdjacentElement('afterend',box);else day.prepend(box);
 }
}
function install(doc,scope){
 if(!doc?.body||doc.getElementById('ny26-enhancements-css'))return 0;
 const style=doc.createElement('style');style.id='ny26-enhancements-css';style.textContent=css;doc.head.appendChild(style);
 clean(doc);let count=0;
 for(const step of doc.querySelectorAll('article.step')){
  placeTime(doc,step);const n=name(step);
  const found=rules.filter(r=>r[0].test(n));for(const rule of found){appendGuide(doc,step,rule);count++}
 }
 const completionClock=installCompletionClock(doc,scope);
 addChoices(doc);planners(doc,completionClock);return count;
}
window.NY26RouteEnhancements={install,version:'2026-11-02-confirmar-feito'};
})();