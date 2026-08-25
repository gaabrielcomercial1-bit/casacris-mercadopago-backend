// Servidor da Casa Cris para gerar links de pagamento do Mercado Pago (Checkout Pro).
//
// O que ele faz: recebe o carrinho do site (nome, quantidade e preço de cada item,
// mais o frete), monta uma "preferência" de pagamento no Mercado Pago usando o seu
// Access Token (que fica só aqui no servidor, nunca no site) e devolve um link
// (init_point) para o qual o cliente é enviado para pagar com Pix, cartão ou boleto.
//
// Depois de pagar, o Mercado Pago manda o cliente de volta para a loja.

const express = require('express');
const cors = require('cors');
const { MercadoPagoConfig, Preference } = require('mercadopago');

const app = express();
app.use(cors());              // permite que o site (em outro endereço) chame este servidor
app.use(express.json());

// ------------------------------------------------------------------
// CONFIGURAÇÃO — normalmente definida como variável de ambiente no
// serviço de hospedagem (Render, Railway, etc.), nunca escrita direto
// no código quando o projeto for para produção de verdade.
// ------------------------------------------------------------------
const MP_ACCESS_TOKEN = process.env.MP_ACCESS_TOKEN;

// Link da loja (o Artifact publicado). O cliente volta para cá depois de pagar.
const STORE_URL = process.env.STORE_URL || 'https://claude.ai/code/artifact/053ead9f-4da6-4146-bd10-afbaacfa7cab';

if (!MP_ACCESS_TOKEN) {
  console.warn('[AVISO] A variável de ambiente MP_ACCESS_TOKEN não foi definida. ' +
    'O servidor vai subir, mas toda tentativa de pagamento vai falhar até você configurá-la.');
}

const client = new MercadoPagoConfig({ accessToken: MP_ACCESS_TOKEN || 'CONFIGURE_MP_ACCESS_TOKEN' });

app.get('/', (req, res) => {
  res.json({ ok: true, service: 'casacris-mercadopago-backend' });
});

app.post('/create-preference', async (req, res) => {
  try {
    const { items, shipping, customer } = req.body || {};

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Carrinho vazio ou inválido.' });
    }

    // Monta a lista de itens no formato que o Mercado Pago espera.
    const mpItems = items.map((line) => ({
      title: [line.name, line.size, line.color].filter(Boolean).join(' - ').slice(0, 250),
      quantity: Number(line.qty) || 1,
      unit_price: Number(line.price) || 0,
      currency_id: 'BRL',
    }));

    // Se tiver frete, ele entra como mais um item na mesma preferência.
    if (shipping && Number(shipping) > 0) {
      mpItems.push({
        title: 'Frete',
        quantity: 1,
        unit_price: Number(shipping),
        currency_id: 'BRL',
      });
    }

    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: mpItems,
        payer: customer && customer.name ? { name: customer.name } : undefined,
        back_urls: {
          success: STORE_URL,
          failure: STORE_URL,
          pending: STORE_URL,
        },
        auto_return: 'approved',
        statement_descriptor: 'CASA CRIS',
      },
    });

    // init_point = link de pagamento em produção
    // sandbox_init_point = link de teste (só funciona com credenciais de teste)
    return res.json({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
      preference_id: result.id,
    });
  } catch (err) {
    console.error('Erro ao criar preferência no Mercado Pago:', err);
    return res.status(500).json({ error: 'Não foi possível gerar o link de pagamento.' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor da Casa Cris rodando na porta ${PORT}`);
});
