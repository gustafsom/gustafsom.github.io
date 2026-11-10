/* Public NYC place directory: addresses and general visitor tips only.
   No private trip plan, hotel booking, family data, dates or itinerary is stored here. */
(()=>{'use strict';
const entries=[
 {key:'chelsea-market',test:/chelsea market/,address:'75 9th Ave, New York, NY 10011, USA',rank:20,minutes:590,do:'Percorrer o corredor principal, apreciar a arquitetura industrial, visitar as lojas e usar o banheiro antes de seguir para o rio. Evitar filas e refeições caras.'},
 {key:'google-store-chelsea',test:/google store|loja google/,address:'76 9th Ave, New York, NY 10011, USA',rank:30,minutes:650,do:'Conhecer a loja e testar os aparelhos em exposição. Parada curta e opcional; não comprar por impulso.'},
 {key:'hotel-chelsea',test:/hotel chelsea|chelsea hotel(?!s)|chelsea historical hotel/,address:'222 W 23rd St, New York, NY 10011, USA',rank:10,minutes:555,do:'Fotografar a fachada histórica e continuar o passeio, sem precisar entrar no hotel.'},
 {key:'chelsean',test:/the chelsean|chelsean hotel/,address:'160 W 25th St, New York, NY 10001, USA',rank:220,minutes:1120,do:'Chegada ao hotel, guardar compras e descansar.'},
 {key:'pier-54',test:/pier 54|pier54|titanic arch|arco do titanic/,address:'Hudson River Park at W 13th St, New York, NY 10014, USA',rank:50,minutes:700,do:'Ver e fotografar o arco de entrada do antigo Pier 54, ligado à história do Titanic. Parada externa rápida.'},
 {key:'little-island',test:/little island|pier 55|pier55/,address:'Little Island, Pier 55, New York, NY 10014, USA',rank:60,minutes:720,do:'Entrar na ilha gratuita, tirar fotos das estruturas em formato de tulipa e observar o Hudson. Escolher um mirante acessível e evitar subir toda a ilha se houver cansaço.'},
 {key:'pier-57',test:/pier 57|pier57|market 57|rooftop park 57/,address:'25 11th Ave, New York, NY 10011, USA',rank:70,minutes:765,do:'Subir de elevador ao terraço gratuito para fotografar Little Island e o Hudson. Verificar banheiro e Market 57, cujo horário geral começa às 11h; almoçar somente se houver opção rápida e econômica.'},
 {key:'high-line',test:/high line|highline/,address:'High Line at W 14th St and 10th Ave, New York, NY 10014, USA',rank:90,minutes:825,do:'Entrar pela 14th Street e seguir no sentido norte, observando os jardins, arte urbana e a vista elevada das ruas. Usar as saídas intermediárias para reduzir a caminhada se necessário.'},
 {key:'hudson-yards',test:/hudson yards|hudson yard/,address:'20 Hudson Yards, New York, NY 10001, USA',rank:100,minutes:915,do:'Conhecer a praça, fotografar os edifícios e a escultura Vessel pelo lado de fora. Escolher poucos pontos para evitar caminhada excessiva.'},
 {key:'vessel',test:/\bvessel\b/,address:'20 Hudson Yards, New York, NY 10001, USA',rank:110,minutes:925,do:'Fotografar o Vessel externamente, sem comprar ingresso, e seguir para The Shops se precisar de banheiro ou descansar.'},
 {key:'shops-hudson',test:/the shops|shops.*hudson|lojas.*hudson/,address:'20 Hudson Yards, New York, NY 10001, USA',rank:120,minutes:940,do:'Entrar no centro comercial para conhecer as lojas e usar banheiro; visita curta, sem obrigação de comprar.'},
 {key:'edge-exterior',test:/\bedge\b|observatorio edge|mirante edge/,address:'30 Hudson Yards, New York, NY 10001, USA',rank:130,minutes:960,do:'Ver o edifício do Edge a partir do solo e tirar fotos externas. Não há ingresso reservado para subir ao observatório.'},
 {key:'moynihan',test:/moynihan|train hall|penn station(?!.*garden)/,address:'351 W 31st St, New York, NY 10001, USA',rank:150,minutes:1020,do:'Passar pelo saguão iluminado do Moynihan Train Hall, tirar fotos da arquitetura e seguir sem desvio longo.'},

 {key:'sixth-avenue-discounts',test:/burlington|marshalls|t\s*\.?\s*j\s*\.?\s*maxx|tj maxx|620.*6th|620.*sixth/,address:'620 6th Ave, New York, NY 10011, USA',rank:170,minutes:1060,do:'Comparar rapidamente preços e promoções nas três lojas do mesmo prédio: Burlington (incluindo malas), Marshalls (roupas e calçados) e T.J. Maxx (marcas com desconto). Definir um limite curto de tempo e sair se houver fila longa.'},
 {key:'five-below-chelsea',test:/five below.*chelsea|five below|607.*6th/,address:'607 6th Ave, New York, NY 10011, USA',rank:180,minutes:1090,do:'Procurar acessórios baratos, lembranças, brinquedos e pequenos eletrônicos. Conferir o preço porque alguns itens custam mais de US$ 5.'},
 {key:'lidl-chelsea',test:/lidl/,address:'335 8th Ave, New York, NY 10001, USA',rank:190,minutes:1115,do:'Comprar apenas água e lanches necessários para o hotel e os dias seguintes, evitando carregar compras desnecessárias durante o passeio.'},
 {key:'madison-square-garden',test:/madison square garden|\bmsg\b/,address:'4 Pennsylvania Plaza, New York, NY 10001, USA',rank:160,minutes:1035,do:'Fotografar a fachada externa e a região da Penn Station. Não é necessário entrar nem comprar tour.'},
 {key:'pier-57-lunch',test:/almoco.*pier|mercado 57.*almoco/,address:'25 11th Ave, New York, NY 10011, USA',rank:80,minutes:790,do:'Procurar algo simples e barato no Market 57 ou optar por um lanche já comprado. Evitar filas e verificar o preço antes de pedir.'}
];
const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function lookup(title){
 const name=normalize(title);
 if(!name)return null;
 // Most specific first: Edge, Vessel and The Shops have distinct visitor actions.
 const special=[
  entries.find(x=>x.key==='edge-exterior'),entries.find(x=>x.key==='vessel'),
  entries.find(x=>x.key==='shops-hudson'),entries.find(x=>x.key==='madison-square-garden'),
  entries.find(x=>x.key==='sixth-avenue-discounts'),entries.find(x=>x.key==='five-below-chelsea'),
  entries.find(x=>x.key==='lidl-chelsea'),
  entries.find(x=>x.key==='pier-57-lunch')
 ];
 return [...special,...entries.filter(x=>!special.includes(x))].find(x=>x&&x.test.test(name))||null;
}
window.NY26NYCPlaces={lookup,normalize,version:'1.0'};
})();