# NY26 — atualização direta pelo GitHub
Este diretório é o **aplicativo público**, sem dados pessoais e sem comprovantes. Não colocar a V8/V9 do roteiro, PDFs, QR codes ou planilhas aqui. O código do NY26 pode ser revisado e atualizado diretamente via GitHub; não é necessário baixar ou enviar ZIP.

## Endereço previsto
Quando GitHub Pages da conta estiver publicado a partir de main: https://gustafsom.github.io/ny26/

## Situação
- O shell, os ícones SVG, o service worker, o login e o módulo Firestore estão no GitHub.
- A CI verifica JavaScript, manifesto e vazamento acidental de termos de reservas.
- `config.js` ainda é nulo. O usuário precisa conectar um projeto Firebase via plugin ou uma configuração inicial no console.
- O site público deve mostrar "Ativação pendente" até que regras, contas e dados sejam inicializados. Não está apto para uso na viagem.

## Inicialização privada (uma vez)
1. Criar ou conectar um projeto Firebase Spark, Authentication Email/Password, Cloud Firestore.
2. Aplicar regras restritivas do pacote V9, com papel admin/editor/viewer na coleção `trips/ny26/members/{uid}`.
3. Cadastrar as contas individuais e conferir os UIDs.
4. Preencher exclusivamente os campos públicos Firebase em `config.js`; não inserir senhas/chaves privadas. Autorizar `gustafsom.github.io` no Authentication.
5. Importar o roteiro V8 **pela interface autenticada de administrador**, jamais por GitHub Pages.
6. Confirmar publicação HTTPS, sincronização entre os dois logins e teste em modo avião em cada celular.
7. Manter PDF/HTML completo e comprovantes offline como contingência independente.

## Deploy
As alterações na pasta `ny26/` feitas em main serão atendidas pela configuração atual do GitHub Pages, se esse repositório estiver publicando o conteúdo de `main`. O workflow `ny26-check.yml` valida o código após pushes/PRs; não supre as etapas Firebase. O cache do service worker tem versão `ny26-shell-gh-v1`: incrementar a cada publicação do código que exija limpar arquivos antigos.

## Segurança
Site PWA **público** é normal: somente o código fica público. Itens pessoais devem existir apenas no Firestore protegido e nos celulares autenticados. Roteiro carregado via login ainda é armazenado localmente para uso offline; utilizar apenas aparelhos confiáveis.

## Limites conhecidos
Firebase Offline no navegador requer configuração explícita e cache pode ser limpo. Não há sincronização instantânea sem internet. Se dois usuários alteram simultaneamente o mesmo item, o último registro prevalece. Autenticação depende de uma conta criada previamente. Não divulgar o serviço como pronto antes dos testes físicos nos dois aparelhos.
