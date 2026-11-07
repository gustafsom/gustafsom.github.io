# NY26: atualizações privadas sem arquivos manuais

O site é público, mas o roteiro e os dados da família são privados. Por isso, **nunca** incluir roteiro, horários personalizados, hotéis, comprovantes, estado `Feito` ou credenciais em arquivos de texto puro no GitHub.

## Uso pelo administrador (uma única configuração)

1. Atualizar o PWA do NY26 e entrar como administrador.
2. ⚙️ → **Atualizações do ChatGPT • sem baixar arquivos** → **Ativar chave neste celular**.
3. Copiar **somente a chave pública** e enviá-la ao ChatGPT para preparar a primeira atualização. É um JSON com `schema: ny26-public-encryption-key-v1`, `keyId` e `jwk`. O par RSA-OAEP 3072 é gerado no navegador; a chave privada não extraível fica no IndexedDB do próprio aparelho.
4. O ChatGPT publica a chave *pública* em `secure-updates/public-key.json`, cifra os patches aprovados com AES-256-GCM e protege a chave AES com RSA-OAEP SHA-256. O GitHub recebe somente o envelope **criptografado** em `secure-updates/packets/<id>.json`, e a referência no `secure-updates/manifest.json`.
5. Ao abrir o NY26 ou as configurações com internet, a caixa de entrada encontra e descriptografa pacotes no aparelho do administrador. A alteração aparece em prévia; **somente após Aprovar** é gravada no Firestore privado no documento `trips/ny26/content/private_update_<id>`.
6. Os aparelhos autorizados recebem as mudanças pelo listener Firebase, com cache offline. Sem novos arquivos JSON para baixar ou importar.

## Formato privado do patch (nunca publicar em texto puro)

```json
{
  "schema": "ny26-private-patch-v1",
  "id": "2026-11-10-exemplo-01",
  "summary": "Resumo objetivo da mudança",
  "changes": [
    {
      "type": "upsert_stop",
      "date": "2026-11-10",
      "anchor": "Local anterior",
      "position": "after",
      "stop": {
        "title": "Exemplo",
        "time": "Após o Walmart • horário flexível",
        "address": "Endereço completo",
        "why": "Motivo da parada"
      }
    }
  ]
}
```

As únicas mudanças permitidas inicialmente são a inclusão ou atualização de informações **na camada complementar do roteiro**, nunca nos IDs dos cards antigos, marcações `Feito`, mala, ações, fotos ou PDFs. Os arquivos usados nos testes devem ser sintéticos. Um patch só é aprovado quando todas as referências existem e a mesclagem íntegra passa.

## Envelope no GitHub (cifrado)

```json
{
  "schema": "ny26-encrypted-update-v1",
  "id": "2026-11-10-exemplo-01",
  "keyId": "<fingerprint de 24 dígitos hexadecimais>",
  "iv": "<base64, nonce AES-GCM de 12 bytes>",
  "wrappedKey": "<base64, chave AES protegida por RSA-OAEP SHA-256>",
  "ciphertext": "<base64, JSON privado cifrado AES-256-GCM com AAD = id>"
}
```

Manifesto público: `{"schema":"ny26-encrypted-update-index-v1","entries":[{"id":"...","keyId":"...","file":"secure-updates/packets/....json"}]}`.

A chave pública é RSA JWK `kty/n/e`; a impressão digital `keyId` corresponde aos 12 primeiros bytes de SHA-256 do texto ASCII `jwk.n`, codificados em hexadecimal. Nunca publicar o segredo AES, a chave privada RSA ou o patch em claro.

## Segurança e recuperação

- **Não limpar os dados do navegador nem reinstalar o PWA** sem backup dos anexos. A chave privada é local; se o armazenamento for apagado, será necessário criar uma nova chave e republicar os pacotes pendentes com a nova chave pública. As alterações já aprovadas continuam no Firebase privado.
- Verificar a legitimidade do domínio e o resumo das alterações antes de Aprovar; qualquer pessoa com a chave pública pode cifrar conteúdo, portanto a autorização é feita pelo usuário autenticado em cada publicação.
- Não há acesso administrativo direto do ChatGPT ao Firebase. O aplicativo usa a autenticação já existente e as regras atuais do Firestore (`isAdmin()`) para gravar apenas após aprovação.
- Mantenha o painel de importação manual como contingência. Ele não é necessário no fluxo normal após a configuração única.
- Por segurança, o manifesto público começa vazio até o primeiro cadastro de chave e a preparação do primeiro pacote cifrado.
