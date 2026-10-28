/* NY26: orientacoes publicas para deslocamentos; dados da viagem permanecem privados.
   Evidencias oficiais verificadas em 2026-10-28. Nada aqui representa horario garantido.
   As regras se aplicam dinamicamente aos titulos presentes no roteiro autenticado. */
(()=>{
'use strict';
const rules=[
{rx:/conex[aã]o internacional.*GIG/i,t:"Conexão internacional",a:1,notes:["No GIG, siga a sinalização para conexões internacionais e confirme no painel o portão e o horário do próximo voo.","Confira no balcão/cartão de bagagem se as malas foram despachadas até o JFK ou exigem retirada e novo despacho. Separe passaportes e documentos acessíveis."]},
{rx:/chegada ao JFK/i,t:"Chegada e imigração",a:1,notes:["Após imigração e alfândega, mantenha a família reunida e confirme o terminal onde vocês desembarcaram.","A retirada das locadoras é em Federal Circle: use a sinalização do AirTrain; o trajeto interno até Federal Circle é gratuito."]},
{rx:/retirada do carro.*Avis.*JFK/i,t:"Como chegar à locadora",a:1,notes:["No terminal, siga as placas AirTrain → Federal Circle → Rental Cars → Avis. Não procure balcão de locação dentro do terminal.","O AirTrain entre terminais e Federal Circle é gratuito. Antes de sair, fotografe todo o veículo, combustível, acessórios e confira assentos infantis adequados para cada estado do percurso."]},
{rx:/Sloatsburg.*(Service|Travel)/i,t:"Parada rodoviária correta",a:1,notes:["A Sloatsburg Service Area está na I-87 / NYS Thruway, sentido NORTE, na milha 33, entre as saídas 15A e 16.","Programe a parada como área de serviço da rodovia, não como um endereço urbano em Sloatsburg. Se o GPS propor sair da rodovia e perder tempo, confira a rota antes."]},
{rx:/Woodbury Common/i,t:"Parada que pode ser cortada",notes:["Verifique no relógio quanto tempo resta antes de qualquer compromisso com horário reservado; compras são prioridade secundária.","Se o trânsito estiver lento, siga diretamente para a próxima visita. Não transforme um almoço curto em desvio prolongado."]},
{rx:/Liberty Bell/i,t:"Acesso à Liberty Bell",notes:["Na Old City, vá a pé a partir de uma vaga de estacionamento legal. Confira a fila e a entrada de segurança indicada no local.","Esta parada é flexível: se houver fila excessiva, preserve a visita exterior à Independence Hall e a sequência do dia."]},
{rx:/Independence Hall/i,t:"Interior exige planejamento",notes:["O interior tem programação e controle de entrada próprios. A partir de 1º de novembro, a visitação das 9h às 10h30 é em formato aberto; tours a partir de 10h40 exigem ingresso.","O roteiro prevê principalmente o exterior. Não entre numa fila que comprometa as demais etapas. Entrada oficial de segurança pelo lado sul, acesso na 5th Street entre Chestnut e Walnut."]},
{rx:/Rocky Steps|est[aá]tua.*Rocky/i,t:"Estacionamento e acesso",notes:["As escadarias ficam na entrada do Philadelphia Museum of Art, no fim da Benjamin Franklin Parkway. Procure estacionamento legal; não pare em via de emergência.","Separe um tempo para as escadas e a estátua, que fica na área externa próxima. Evite ingressar no museu se a agenda for apenas fotografias."]},
{rx:/Capit[oó]lio/i,t:"Washington: caminhar e estacionar",notes:["As vias ao redor do Capitólio e do National Mall têm restrições frequentes. Não conte com estacionar diante das atrações.","Escolha onde deixar o carro legalmente antes da primeira parada; o deslocamento entre Capitol, Air and Space, Lincoln e Casa Branca envolve caminhada extensa ou corridas pontuais de táxi."]},
{rx:/Air and Space Museum|National Air and Space/i,t:"Entrada oficial e passes",a:1,notes:["Entre pelo lado da Jefferson Drive SW, endereço 650 Jefferson Dr SW. A instituição não oferece estacionamento próprio.","Os passes gratuitos com horário marcado são exigidos para todos os visitantes, inclusive crianças. Separe os quatro códigos e reserve margem para inspeção de segurança."]},
{rx:/Fort McHenry/i,t:"Alerta de horário — parada opcional",a:1,notes:["O parque fecha às 17h; a última entrada é às 16h45, e as áreas internas fecham antes. Chegar no fim da tarde pode tornar a visita inviável.","Não faça o desvio a Baltimore se o GPS prever chegada depois da última entrada ou se isso comprometer o hotel. Antes de entrar, observe o tempo disponível para sair antes do fechamento."]},
{rx:/Devolu[cç][aã]o Avis|Avis W76/i,t:"Devolver carro sem surpresa",a:1,notes:["A unidade de devolução confirmada pela Avis fica em 216 W 76th St, junto à Broadway. Use essa referência na navegação, não apenas o nome do bairro.","Respeite o horário limite do contrato, mesmo que a agência funcione até mais tarde. Fotografe exterior, painel e nível do tanque, guarde recibo e confirme que a locação foi encerrada."]},
{rx:/Columbus Circle/i,t:"Acesso de metrô",notes:["A estação 59 St–Columbus Circle atende várias linhas. Para Times Square, uma opção direta é a linha 1 sentido downtown até Times Sq–42 St.","Confira sempre o sentido Uptown/Downtown antes de passar a catraca. Mudanças de serviço podem ocorrer, principalmente nos fins de semana."]},
{rx:/High Line/i,t:"Entrada correta da caminhada",notes:["Para caminhar em direção ao Hudson Yards, entre pelo trecho sul perto da Gansevoort Street e siga ao norte. O acesso depende de portões e condições meteorológicas.","Elevadores e entradas podem fechar ou mudar de operação; mantenha a rua como alternativa acessível em caso de chuva forte, gelo ou cansaço."]},
{rx:/The Battery|Battery Park|Statue City Cruises|Hor[aá]rio de embarque no comprovante/i,t:"Balsa: triagem ≠ partida",a:1,notes:["O ponto oficial de segurança para a Statue City Cruises fica na margem d'água, atrás do Castle Clinton, em The Battery. Ignore vendedores informais de ingresso.","O horário impresso no bilhete corresponde à entrada na fila da triagem, NÃO à partida garantida da balsa. Chegue com antecedência e confira a diferença entre os horários mostrados no roteiro e no comprovante."]},
{rx:/Est[aá]tua.*pedestal|Reserva Pedestal|Liberty Island/i,t:"Pedestal: armário e moeda",a:1,notes:["Para entrar no pedestal, mochilas, comidas e bebidas devem ser guardadas nos armários próximos à segunda inspeção, na Liberty Island. Tenha moeda de US$ 0,25.","Não há armários para malas no Battery Park. Evite carregar objetos volumosos. O bilhete de embarque não garante horário específico para pisar na ilha nem para entrar no pedestal."]},
{rx:/Memorial 9\/11/i,t:"Memorial externo ou museu?",notes:["O Memorial 9/11 ao ar livre é uma visita distinta do museu, que tem entrada e bilhetes próprios. Evite se dirigir à fila do museu se a intenção for apenas o memorial.","Preserve silêncio e respeito no entorno das piscinas memoriais; combine um ponto de encontro caso alguém se afaste."]},
{rx:/Brooklyn Bridge.*travessia/i,t:"Início correto da travessia",a:1,notes:["Partindo de Manhattan, procure o acesso ao passeio de pedestres na região do City Hall Park/Centre Street. Não use o acesso exclusivo a bicicletas.","A travessia termina em Brooklyn, mas DUMBO ainda exige caminhada adicional; reserve margem para escadas, fotografias, vento e cansaço.","Plano B: se a família estiver cansada ou escurecer, use o metrô em direção a High St (A/C) ou York St (F) e caminhe até DUMBO. Verifique a operação das linhas."]},
{rx:/DUMBO|Brooklyn Bridge Park/i,t:"Fotos e retorno seguro",notes:["Para a foto clássica da Manhattan Bridge, use a região de Washington Street com Water Street. Cuidado com veículos e outras pessoas; não fique no meio da rua.","No início de novembro o entardecer acontece cedo. Separe tempo para fotografias sem depender de iluminação natural após o pôr do sol; escolha o metrô de volta antes de todos estarem cansados."]},
{rx:/Museu de Hist[oó]ria Natural|Chegada ao AMNH/i,t:"AMNH: entrada e metrô",a:1,notes:["O AMNH abre às 10h. A estação 81 St–Museum of Natural History (linhas B/C conforme serviço) fica próxima ao complexo.","Entradas abertas ao público incluem 200 Central Park West (79th St), Rose Center na W 81st St e Gilder Center na Columbus Avenue/79th St. Confira a sinalização no dia e possíveis galerias temporariamente fechadas.","Evite mochila grande e alimentos no interior. Priorize dinossauros e baleia-azul, verificando o mapa do museu antes de começar."]},
{rx:/Belvedere Castle|Bethesda Terrace|Bow Bridge/i,t:"Central Park: navegação por caminhos",notes:["Dentro do Central Park, os percursos são por trilhas e caminhos, nem sempre seguindo as ruas externas. Salve um mapa do parque no aparelho.","Com chuva ou vento, encurte o circuito. Combine paradas para banheiro e não caminhe pelo parque no escuro apenas para completar a lista."]},
{rx:/Central Park Carousel/i,t:"Carrossel depende do clima",notes:["O carrossel fica no meio do parque, perto da 65th Street, e normalmente funciona das 10h até o anoitecer, se o tempo permitir.","Trate-o como opcional: mesmo em dia sem chuva pode haver fechamento operacional."]},
{rx:/SUMMIT One Vanderbilt/i,t:"SUMMIT: três acessos e reflexos",a:1,notes:["Entradas indicadas oficialmente: esquina Vanderbilt Ave / E 43rd St, 45 E 42nd St ou pelo Grand Central Terminal. Siga a indicação da equipe para o seu horário.","Leve os QR codes acessíveis e óculos escuros. Pisos espelhados favorecem calças/shorts/meias-calças; evite saltos agulha e calçados inadequados. Não conte com o elevador Ascent se ele não faz parte do ingresso."]},
{rx:/Grand Central Terminal/i,t:"Grand Central e Holiday Fair",notes:["A Grand Central Holiday Fair 2026 está anunciada para 09/11 a 24/12, no Vanderbilt Hall. Em dias úteis, normalmente abre às 10h.","Após o SUMMIT, passe pelo salão principal, confira se o mercado está aberto e evite deslocamento desnecessário se houver restrição de acesso."]},
{rx:/NYPL SNFL|Biblioteca.*terra[cç]o/i,t:"Terraço sujeito a liberação",notes:["O terraço gratuito da Stavros Niarchos Foundation Library depende do expediente e de condições do dia. Ele não fica no edifício monumental da biblioteca principal.","Se o terraço estiver fechado por tempo ou evento, mantenha apenas a visita ao salão do edifício principal e Bryant Park."]},
{rx:/Roosevelt.*Tram/i,t:"Estação e retorno pelo teleférico",a:1,notes:["A estação do Tram em Manhattan fica na região da 2nd Avenue com East 60th Street (entre 59th e 60th). Use OMNY para pagar o deslocamento.","A ida e a volta são viagens separadas; confira os dois embarques. Aos sábados a fila pode ser longa. Se houver interrupção, consulte o metrô da Roosevelt Island como alternativa."]},
{rx:/Sa[ií]da para JFK|Chegada ao JFK.*T8|JFK.*Terminal 8/i,t:"JFK T8: dois planos de acesso",a:1,notes:["Plano ferroviário: a partir da Penn Station, tome o LIRR até Jamaica e siga as placas AirTrain JFK → Terminal 8. LIRR e AirTrain são bilhetes/tarifas separados. Confirme a plataforma e o destino na estação.","Plano rodoviário: táxi/veículo pré-reservado para Terminal 8; confirme antecipadamente se cabem todos os passageiros e as bagagens. As obras do JFK podem causar desvios e congestionamento.","Se viajar com muitas malas, considere o tempo de deslocamento hotel → Penn Station, catracas, plataformas, elevadores e transferência em Jamaica. Não reduza a margem de chegada ao aeroporto."]},
{rx:/Retirar.*volumes|organizar bagagens|check-out do/i,t:"Última conferência antes de sair",notes:["Conte todos os volumes e confira a identificação de cada um. Documentos, dinheiro, medicamentos essenciais e eletrônicos devem permanecer em mochila pessoal.","Defina o transporte de retorno antes de recolher a bagagem; não presuma que um carro comum acomodará todas as pessoas e malas."]},
{rx:/Voo JFK.*Brasil/i,t:"Embarque internacional",notes:["No Terminal 8, confirme o balcão da companhia aérea, os limites de bagagem e os documentos dos quatro viajantes. Veja o painel do aeroporto: portões podem mudar.","Mantenha cartões de embarque e comprovantes salvos offline. O acesso ao AirTrain é separado da inspeção de segurança e dos portões do terminal."]}
];
const css='.ny26-guide-card{margin:9px 0;padding:9px 11px;background:#eaf4fa;border:1px solid #b7d9e8;border-left:3px solid #3177a3;border-radius:9px;font:500 12px/1.45 system-ui,sans-serif;color:#234457}.ny26-guide-card.critical{background:#fff3df;border-color:#ebcd93;border-left-color:#b0771a;color:#704816}.ny26-guide-card summary{cursor:pointer;font-weight:800}.ny26-guide-card ul{margin:8px 0 0 18px;padding:0}.ny26-guide-card li{margin-bottom:5px}.ny26-sheet-extra{margin-top:15px;padding:12px;border-radius:10px;background:#eaf4fa;border:1px solid #b8d7e7}.ny26-sheet-extra h3{font-size:15px;margin:0 0 8px}.ny26-sheet-extra li{line-height:1.48;margin-bottom:7px}';
function norm(x){return (x||'').replace(/\s+/g,' ').trim()}
function decorate(doc){
 if(!doc||doc.getElementById('ny26-guide-style'))return 0;
 const style=doc.createElement('style');style.id='ny26-guide-style';style.textContent=css;doc.head.appendChild(style);
 let total=0;
 for(const step of doc.querySelectorAll('article.step')){
  const name=norm(step.querySelector('.place-link')?.textContent);
  if(!name)continue;
  const hits=rules.filter(r=>r.rx.test(name));
  if(!hits.length)continue;
  const content=step.querySelector('.stepcontent');if(!content)continue;
  const wrap=doc.createElement('details');wrap.className='ny26-guide-card'+(hits.some(x=>x.a)?' critical':'');
  const summary=doc.createElement('summary');summary.textContent='🧭 Acesso, dicas e alertas ('+hits.length+')';wrap.appendChild(summary);
  const ul=doc.createElement('ul');
  for(const r of hits)for(const note of r.notes){const li=doc.createElement('li');li.textContent=note;ul.appendChild(li)}
  wrap.appendChild(ul);
  const actions=content.querySelector('.actions');
  if(actions)content.insertBefore(wrap,actions);else content.appendChild(wrap);
  const sheet=doc.getElementById('ficha-'+step.id);
  const sheetText=sheet?.querySelector('.sheet-text');
  if(sheetText){
   const more=doc.createElement('div');more.className='ny26-sheet-extra sheet-section';
   const h=doc.createElement('h3');h.textContent='🧭 Como chegar • dicas práticas • alertas';more.appendChild(h);
   const list=ul.cloneNode(true);more.appendChild(list);
   const rem=sheetText.querySelector('.ny-reminders');
   rem?rem.insertAdjacentElement('afterend',more):sheetText.prepend(more);
  }
  total++;
 }
 for(const day of doc.querySelectorAll('section.daypage')){
  if(day.querySelector('.ny26-offline-advice'))continue;
  const gpsCount=day.querySelectorAll('a.gps').length;
  if(gpsCount<2)continue;
  const p=doc.createElement('details');p.className='ny26-offline-advice ny26-guide-card';
  const sm=doc.createElement('summary');sm.textContent='📵 Navegação offline: plano B';p.appendChild(sm);
  const para=doc.createElement('p');para.textContent='Os botões GPS abrem serviços externos e podem precisar de internet. Baixe previamente os mapas das regiões em que ficará, salve os comprovantes em arquivos locais e consulte os alertas de transporte quando houver conexão. Mapas baixados não garantem rotas atualizadas de transporte público.';
  p.appendChild(para);
  const target=day.querySelector('.ny-day-brief')||day.querySelector('.ck-daylink');
  if(target)target.insertAdjacentElement('afterend',p);
 }
 return total;
}
window.NY26RouteAdvice={decorate,version:'2026-10-28'};
})();