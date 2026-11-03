/* NY26: informações públicas sobre tipos de refeição e título exibido.
   Não contém reservas, roteiros privados, checklists nem documentos. */
(()=>{
'use strict';
const menus=[
 {rx:/gray.s?\s*papaya/i,name:"Gray's Papaya",food:"Cachorros-quentes de carne bovina com mostarda, ketchup, cebola, chucrute ou relish; bebidas tropicais de mamão (papaya), coco ou banana. Combo Recession Special: 2 hot dogs + bebida tropical média.",source:"https://grayspapaya.nyc/uptown-menu/"},
 {rx:/chipotle/i,name:"Chipotle",food:"Comida mexicana-americana: burritos, bowls de arroz com feijão e frango ou carne, tacos, saladas, guacamole e opções infantis. Quesadilla tradicional: pedido pelo app/site.",source:"https://www.chipotle.com/nutrition-calculator"},
 {rx:/chelsea market/i,name:"Chelsea Market",food:"Diversas bancas: tacos mexicanos, pizza, sanduíches, noodles chineses, frutos do mar, pães e doces. Escolher pela fila e pelos preços no balcão."},
 {rx:/market 57|pier 57.*almo[cç]o|almo[cç]o.*pier 57/i,name:"Market 57",food:"Praça gastronômica com opções de culinária indiana, japonesa, coreana, tailandesa, dim sum, wraps, hot dogs e frutos do mar. Verificar preço e disponibilidade."},
 {rx:/rony.s.*pizza/i,name:"Rony's Fresh Pizza",food:"Pizza nova-iorquina por fatia ou inteira: queijo e pepperoni são opções usuais. Confirmar sabores e preços no balcão."},
 {rx:/2\s*bros.*pizza/i,name:"2 Bros Pizza",food:"Pizza nova-iorquina por fatia, principalmente queijo e pepperoni; bebidas e combinações conforme a loja. Confirmar preço e forma de pagamento."},
 {rx:/joe.s\s*pizza/i,name:"Joe's Pizza",food:"Pizza nova-iorquina de massa fina em fatias grandes; queijo, pepperoni e variações conforme o balcão. Não presumir que custa US$ 1,50."},
 {rx:/1[.,]50\s*fresh pizza|\$1[.,]50.*pizza/i,name:"Fresh Pizza",food:"Pizza simples de queijo ou pepperoni por fatia e combos conforme o balcão; o nome não garante o preço anunciado."},
 {rx:/wendy.s/i,name:"Wendy's",food:"Hambúrgueres, cheeseburgers, sanduíches de frango, nuggets, batatas fritas e opções infantis."},
 {rx:/mcdonald.s|mcdonalds/i,name:"McDonald's",food:"Hambúrgueres, cheeseburgers, nuggets, batatas fritas e refeições infantis; o menu pode variar entre unidades."},
 {rx:/starbucks/i,name:"Starbucks",food:"Cafés e bebidas quentes/frias, pães, croissants, sanduíches, cookies e doces; seleção varia conforme a unidade."},
 {rx:/magnolia bakery/i,name:"Magnolia Bakery",food:"Doces e sobremesas: banana pudding, cupcakes, bolos e cookies. Melhor como lanche ou sobremesa, não refeição principal."},
 {rx:/trader joe.s|lidl|whole foods|westside market/i,name:"Mercado",food:"Para uma refeição rápida: sanduíches, frutas, saladas, pães, iogurtes, snacks e pratos prontos, conforme estoque. Verificar refrigeração dos perecíveis."},
 {rx:/amnh.*caf[eé]|cafe on [14]|food court/i,name:"Lanchonetes do AMNH",food:"Opções de sanduíches, paninis, sopas, saladas, frutas, doces e bebidas. Confira o café e o menu que estiverem abertos no dia."}
];
const css=[
'.ny26-menu-hint{margin:8px 0;padding:9px 11px;background:#fff8e9;border:1px solid #eed6a8;border-left:3px solid #ab7d27;border-radius:9px;color:#553d1a;font:500 12px/1.45 system-ui,sans-serif;max-width:100%;overflow-wrap:anywhere}',
'.ny26-menu-hint strong{display:block;margin-bottom:4px;font-weight:800}',
'.ny26-menu-hint p{margin:5px 0}',
'.ny26-menu-hint a{display:inline-block;color:#815400;font-weight:700;margin-top:4px}',
'.ny26-menu-hint.sheet-section{margin:13px 0}'
].join('');
const norm=v=>String(v||'').replace(/\s+/g,' ').trim();
function findMenus(title){return menus.filter(r=>r.rx.test(title)).slice(0,3)}
function make(doc,hits){
 const block=doc.createElement('div');block.className='ny26-menu-hint';
 const head=doc.createElement('strong');head.textContent='🍽️ Tipo de comida';block.appendChild(head);
 for(const hit of hits){
  const p=doc.createElement('p');const b=doc.createElement('b');b.textContent=hit.name+': ';
  p.appendChild(b);p.appendChild(doc.createTextNode(hit.food));block.appendChild(p);
  if(hit.source&&/^https:\/\//.test(hit.source)){
   const a=doc.createElement('a');a.href=hit.source;a.target='_blank';a.rel='noopener noreferrer';
   a.textContent='Cardápio oficial de '+hit.name;block.appendChild(a);
  }
 }
 return block;
}
function updateHeader(doc,version){
 if(!doc)return;
 const suffix=version==='1.57'?' — Planejamento v1.57':'';
 const nodes=doc.createTreeWalker(doc.body,4),all=[];
 while(nodes.nextNode())all.push(nodes.currentNode);
 for(const node of all){
  if(node.parentElement?.closest('script,style,textarea,pre,code'))continue;
  const v=node.nodeValue||'';
  if(v.length>140||!/roteiro\s*(?:\+|e)\s*mala/i.test(v))continue;
  const a=v.replace(/Roteiro\s*\+\s*Mala\s*v1[.,]40\b/gi,'Roteiro e Mala'+suffix);
  const b=version==='1.57'?a.replace(/Roteiro e Mala(?!\s*[—-]\s*Planejamento\s*v1[.,]57)/gi,'Roteiro e Mala — Planejamento v1.57'):a;
  if(v!==b)node.nodeValue=b;
 }
 const title=doc.title||'';
 if(/Roteiro\s*(?:\+|e)\s*Mala/i.test(title)){
  doc.title=title.replace(/Roteiro\s*\+\s*Mala\s*v1[.,]40\b/gi,'Roteiro e Mala')
    .replace(/Roteiro e Mala(?:\s*[—-]\s*Planejamento\s*v1[.,]57)?/gi,'Roteiro e Mala'+suffix);
 }
}
function decorate(doc){
 if(!doc?.body)return 0;
 if(!doc.getElementById('ny26-menu-style')){
  const st=doc.createElement('style');st.id='ny26-menu-style';st.textContent=css;doc.head.appendChild(st);
 }
 updateHeader(doc,null);
 let count=0;
 for(const step of doc.querySelectorAll('article.step')){
  const title=norm(step.querySelector('.place-link')?.textContent||step.querySelector('h3,h2')?.textContent);
  const hits=findMenus(title);if(!hits.length)continue;
  const container=step.querySelector('.stepcontent');if(!container)continue;
  container.querySelector('.ny26-menu-hint')?.remove();
  const card=make(doc,hits);
  const buttons=container.querySelector('.actions');
  if(buttons)container.insertBefore(card,buttons);else container.appendChild(card);
  const sheet=step.id?doc.getElementById('ficha-'+step.id):null;
  const sheetText=sheet?.querySelector('.sheet-text');
  if(sheetText){
   sheetText.querySelector('.ny26-menu-hint')?.remove();
   const detail=make(doc,hits);detail.classList.add('sheet-section');sheetText.prepend(detail);
  }
  count++;
 }
 return count;
}
window.NY26FoodGuide={decorate,updateHeader,findMenus,version:'2026-11-03'};
})();