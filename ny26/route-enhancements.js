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
 'NYC Ferry requer passagem própria, separada do OMNY do metrô. É possível comprar no app NYC Ferry ou nas máquinas de venda; conferir quatro bilhetes antes de embarcar.',
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
  if(/^big button\b/i.test(name(step))){const id=step.id;step.remove();if(id)doc.getElementById('ficha-'+id)?.remove()}
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
     {id:'times',title:'Plano B — Times Square',description:'Visitar no máximo 1 ou 2 lojas, se houver disposição, e então voltar ao hotel.'}
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
const minutes=s=>{const m=/^(\d{1,2}):(\d{2})$/.exec(s||'');return m?+m[1]*60+(+m[2]):null};
const time=n=>{n=((n%1440)+1440)%1440;return String(Math.floor(n/60)).padStart(2,'0')+':'+String(n%60).padStart(2,'0')};
function schedule(step){
 const t=trim(step.querySelector('.ny26-time-inline,.time,.step-time,.when,time')?.textContent||step.textContent.slice(0,90));
 const m=t.match(/(\d{1,2}:\d{2})\s*[–—-]\s*(\d{1,2}:\d{2})/);
 return m?{a:minutes(m[1]),b:minutes(m[2]),label:m[0]}:null;
}
function fixed(step){return /SUMMIT|Est[aá]tua.*Liberdade|Pedestal|Air and Space|Morgan Library|Voo|check.?in|embarque/i.test(name(step))||/HOR[AÁ]RIO FIXO|RESERVA PAGA/i.test(trim(step.querySelector('.flag,.tag,.status')?.textContent))}
function planners(doc){
 for(const day of doc.querySelectorAll('section.daypage')){
  const data=[...day.querySelectorAll('article.step')].map(step=>({step,t:schedule(step)})).filter(x=>x.t&&x.t.a!==null&&x.t.b!==null);
  if(data.length<2)continue;
  const box=doc.createElement('details');box.className='ny26-enhance ny26-live';
  const heading=doc.createElement('summary');heading.textContent='⏱ Roteiro dinâmico • antecipar ou ajustar etapas';box.appendChild(heading);
  const intro=doc.createElement('p');intro.textContent='Escolha o ponto concluído e informe a hora real em Nova York. Sugestões não modificam horários fixos ou marcações Feito.';box.appendChild(intro);
  const row=doc.createElement('div');row.className='ny26-live-row';
  const select=doc.createElement('select');data.forEach((x,i)=>{const opt=doc.createElement('option');opt.value=String(i);opt.textContent=x.t.label+' · '+name(x.step).slice(0,62);select.appendChild(opt)});
  const input=doc.createElement('input');input.type='time';input.value=time(data[0].t.b);
  const sLabel=doc.createElement('label');sLabel.textContent='Ponto concluído';sLabel.appendChild(select);
  const tLabel=doc.createElement('label');tLabel.textContent='Término real (hora NY)';tLabel.appendChild(input);
  row.append(sLabel,tLabel);box.appendChild(row);
  const output=doc.createElement('div');output.className='ny26-live-result';output.setAttribute('aria-live','polite');box.appendChild(output);
  function calculate(){
   const i=+select.value,done=minutes(input.value);if(done===null)return;
   let d=done-data[i].t.b;if(Math.abs(d)>360){output.textContent='Diferença superior a seis horas: revise a hora digitada.';return}
   output.replaceChildren();
   const p=doc.createElement('p');
   p.textContent=d<=-20?'Adiantamento de '+Math.abs(d)+' minutos. Use a folga para antecipar locais abertos, banheiro ou descanso.':
    d>=20?'Atraso de '+d+' minutos. Corte paradas opcionais antes da próxima reserva.':
    'Diferença de '+Math.abs(d)+' minutos. Mantenha a sequência prevista.';
   output.appendChild(p);const ul=doc.createElement('ul');
   for(const x of data.slice(i+1,i+6)){
    const li=doc.createElement('li');
    if(fixed(x.step)){li.textContent=time(x.t.a)+' • '+name(x.step)+' — FIXO, não antecipar nem atrasar.';d=0}
    else li.textContent=time(x.t.a+d)+' (original '+time(x.t.a)+') • '+name(x.step);
    ul.appendChild(li);
   }
   output.appendChild(ul);
   const note=doc.createElement('small');note.textContent='Simulação, não remarcação. Conferir funcionamento, caminhada, transporte e filas no dia.';output.appendChild(note);
  }
  select.addEventListener('change',()=>{input.value=time(data[+select.value].t.b);calculate()});
  input.addEventListener('input',calculate);calculate();
  const anchor=day.querySelector('.ny-day-brief,.ck-daylink,.ny26-offline-advice,.dayheader,h1,h2');
  if(anchor)anchor.insertAdjacentElement('afterend',box);else day.prepend(box);
 }
}
function install(doc){
 if(!doc?.body||doc.getElementById('ny26-enhancements-css'))return 0;
 const style=doc.createElement('style');style.id='ny26-enhancements-css';style.textContent=css;doc.head.appendChild(style);
 clean(doc);let count=0;
 for(const step of doc.querySelectorAll('article.step')){
  placeTime(doc,step);const n=name(step);
  const found=rules.filter(r=>r[0].test(n));for(const rule of found){appendGuide(doc,step,rule);count++}
 }
 addChoices(doc);planners(doc);return count;
}
window.NY26RouteEnhancements={install,version:'2026-11-02'};
})();