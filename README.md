# Casa Cris — Servidor Mercado Pago

Servidor simples que gera links de pagamento (Checkout Pro) do Mercado Pago para a loja virtual da Casa Cris.

## O que ele faz

Recebe o carrinho de compras vindo do site, monta uma "preferência" de pagamento no Mercado Pago usando o Access Token (guardado com segurança como variável de ambiente) e devolve um link de pagamento para o qual o cliente é redirecionado.

## Configuração

Defina a variável de ambiente `MP_ACCESS_TOKEN` com o Access Token de produção da conta Mercado Pago da Casa Cris (Painel de Desenvolvedores → Credenciais de produção).

Opcionalmente, defina `STORE_URL` com o link da loja — por padrão já aponta para a loja publicada da Casa Cris.

## Rodando localmente

```
npm install
MP_ACCESS_TOKEN=seu_token npm start
```

## Deploy no Render

1. Suba este repositório no GitHub.
2. Em render.com, crie um "Web Service" a partir deste repositório.
3. Build Command: `npm install` — Start Command: `npm start`.
4. Em "Environment", adicione a variável `MP_ACCESS_TOKEN` com o Access Token de produção.
5. Depois do deploy, copie a URL gerada (ex.: `https://casacris-mercadopago-backend.onrender.com`) e configure `mercadoPagoEndpoint` no site da loja apontando para `<sua-url>/create-preference`.
