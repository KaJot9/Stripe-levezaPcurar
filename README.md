# Sistema de Assinaturas Stripe com Liberação Automática de Grupos

Sistema completo em Node.js + Express + Stripe + Supabase que vende assinaturas
recorrentes via Stripe Checkout e libera automaticamente o link do grupo
correspondente ao plano assim que o pagamento é confirmado (via webhook).

---

## 1. Estrutura do projeto

```
/project
  /config        -> conexões (env, stripe, supabase)
  /routes        -> definição das rotas (Express Router)
  /controllers   -> recebem a requisição e chamam os services
  /services      -> regras de negócio (Stripe, planos, clientes, entrega de link)
  /models        -> acesso direto ao Supabase (queries)
  /database      -> schema.sql (script de criação das tabelas)
  /views         -> páginas EJS do painel admin
  /public        -> landing page, CSS, JS do frontend e do admin
  /utils         -> helpers (logger, validators, asyncHandler)
  /middlewares   -> autenticação admin e tratamento de erros
  .env.example
  package.json
  server.js
```

---

## 2. Passo a passo de instalação

### 2.1. Pré-requisitos
- Node.js 18+
- Uma conta no [Stripe](https://dashboard.stripe.com)
- Uma conta no [Supabase](https://supabase.com)
- (Opcional) uma conta SMTP para envio de e-mail (ex: SendGrid, Amazon SES, Gmail com senha de app)

### 2.2. Instalar dependências

```bash
cd project
npm install
```

### 2.3. Criar o banco de dados no Supabase

1. Crie um novo projeto no Supabase.
2. Vá em **SQL Editor** e cole o conteúdo de `database/schema.sql`.
3. Execute o script. Isso cria as tabelas `planos`, `clientes` e `eventos_webhook`,
   além de inserir os 2 planos iniciais (Básico e Premium) com Price IDs de exemplo
   — você vai substituí-los no passo 2.5.
4. Em **Project Settings > API**, copie:
   - `Project URL` → `SUPABASE_URL`
   - `service_role key` (não a `anon key`!) → `SUPABASE_SERVICE_ROLE_KEY`

> ⚠️ A `service_role key` tem acesso total ao banco e **nunca** deve ser exposta
> no frontend. Ela só é usada no backend (arquivo `config/supabase.js`).

### 2.4. Criar os produtos e preços no Stripe

1. No [Dashboard do Stripe](https://dashboard.stripe.com/products), crie um produto
   "Plano Básico" com um preço recorrente mensal de R$ 49,00.
2. Copie o **Price ID** gerado (formato `price_xxxxxxxxxxxxx`).
3. Repita para o "Plano Premium" (R$ 97,00).
4. Em **Developers > API keys**, copie:
   - `Publishable key` → `STRIPE_PUBLISHABLE_KEY`
   - `Secret key` → `STRIPE_SECRET_KEY`

### 2.5. Configurar o `.env`

```bash
cp .env.example .env
```

Preencha com os valores obtidos nos passos anteriores. Para gerar o hash da senha
do admin:

```bash
node utils/generateAdminHash.js "suaSenhaForte123"
```

Copie o resultado para `ADMIN_PASSWORD_HASH` no `.env`.

### 2.6. Atualizar os planos no banco com os Price IDs reais

Você pode fazer isso de duas formas:

**Opção A — pelo painel admin (recomendado):**
Rode o servidor (`npm run dev`), acesse `/admin/login`, entre e edite os planos
em `/admin/planos`, colando o Price ID real de cada um.

**Opção B — direto no Supabase (SQL Editor):**
```sql
update planos set price_id = 'price_REAL_DO_BASICO' where nome = 'Plano Básico';
update planos set price_id = 'price_REAL_DO_PREMIUM' where nome = 'Plano Premium';
```

### 2.7. Rodar o servidor localmente

```bash
npm run dev
```

Acesse:
- Landing page: `http://localhost:3000`
- Painel admin: `http://localhost:3000/admin/login`

### 2.8. Configurar o Webhook do Stripe

O webhook é o coração do sistema — é ele quem libera o acesso automaticamente.

**Em desenvolvimento (local), use a Stripe CLI:**
```bash
stripe login
stripe listen --forward-to localhost:3000/webhook/stripe
```
A CLI vai te dar um `whsec_...` — coloque em `STRIPE_WEBHOOK_SECRET` no `.env`
e reinicie o servidor.

**Em produção:**
1. Acesse **Developers > Webhooks > Add endpoint** no Dashboard do Stripe.
2. URL do endpoint: `https://seudominio.com/webhook/stripe`
3. Selecione os eventos:
   - `checkout.session.completed`
   - `invoice.paid`
   - `invoice.payment_failed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copie o **Signing secret** gerado e coloque em `STRIPE_WEBHOOK_SECRET` no
   ambiente de produção.

### 2.9. Testar o fluxo completo

1. Acesse a landing page, escolha um plano, informe um e-mail e conclua o
   pagamento usando um [cartão de teste do Stripe](https://stripe.com/docs/testing)
   (ex: `4242 4242 4242 4242`, qualquer data futura e CVC).
2. Verifique no terminal (ou no seu provedor SMTP) se o e-mail com o link do
   grupo foi enviado.
3. Confira em `/admin/clientes` se o registro apareceu com status `ativa`.
4. Confira em `/admin/dashboard` se as estatísticas foram atualizadas.

---

## 3. Como adicionar um novo plano (sem alterar código)

1. Crie o produto/preço no Stripe e copie o Price ID.
2. Acesse `/admin/planos` → **+ Novo plano**.
3. Preencha nome, Price ID, valor (apenas exibição), link do grupo e ordem.
4. Salve. O plano já aparece automaticamente na landing page.

Nenhuma linha de código precisa ser alterada — é exatamente esse o objetivo do
requisito de escalabilidade.

---

## 4. Como funciona a liberação automática (resumo técnico)

1. Cliente clica em "Assinar" → frontend chama `POST /api/checkout/create-session`
   com o `priceId` do plano.
2. Backend cria uma sessão no Stripe Checkout (`services/stripe.service.js`) e
   redireciona o cliente para a página de pagamento do Stripe.
3. Ao concluir o pagamento, o Stripe dispara o evento `checkout.session.completed`
   para `POST /webhook/stripe`.
4. `controllers/webhook.controller.js`:
   - valida a assinatura do webhook (`stripe-signature`);
   - verifica idempotência (evita processar o mesmo evento 2x);
   - identifica o **Price ID** da sessão;
   - busca o plano correspondente (`plans.service.obterPlanoPorPriceId`) —
     **nunca por valor**;
   - registra a assinatura do cliente (`customers.service.registrarAssinatura`);
   - envia o link do grupo (`delivery.service.entregarAcesso`, hoje via e-mail).
5. Eventos seguintes (`invoice.paid`, `invoice.payment_failed`,
   `customer.subscription.updated`, `customer.subscription.deleted`) mantêm o
   status da assinatura sempre sincronizado com o Stripe.
6. Após `customer.subscription.deleted`, o sistema **nunca** reenvia o link —
   essa regra está explícita e isolada em `tratarAssinaturaCancelada`.

---

## 5. Extensão futura para WhatsApp / Telegram / Discord

Toda a lógica de entrega de acesso está isolada em `services/delivery.service.js`.
Para adicionar um novo canal:

```js
// services/whatsapp.service.js
async function enviarMensagem({ telefone, linkGrupo }) { ... }
module.exports = { enviarMensagem };

// services/delivery.service.js
const canais = {
  email: ...,
  whatsapp: async ({ telefone, linkGrupo }) =>
    require('./whatsapp.service').enviarMensagem({ telefone, linkGrupo }),
};
```

Nenhum outro arquivo do sistema (webhook, controllers, models) precisa mudar.

---

## 6. Segurança implementada

- Validação obrigatória da assinatura do webhook (`stripe.webhooks.constructEvent`).
- Tabela `eventos_webhook` garante idempotência (Stripe pode reenviar eventos).
- `STRIPE_SECRET_KEY` e `SUPABASE_SERVICE_ROLE_KEY` só existem no backend.
- Painel admin protegido por sessão (`express-session`) + senha com hash bcrypt.
- Rate limiting no endpoint público de criação de checkout.
- `helmet` para cabeçalhos HTTP seguros.
- Validação de entradas em todos os endpoints (`utils/validators.js`).
- Tratamento de erros centralizado, sem vazar stack trace em produção.

---

## 7. Deploy em produção — checklist rápido

- [ ] `NODE_ENV=production` no `.env`
- [ ] Domínio com HTTPS configurado (obrigatório para o Stripe Checkout e webhooks)
- [ ] Webhook do Stripe apontando para a URL de produção
- [ ] `SESSION_SECRET` forte e único
- [ ] Variáveis de ambiente configuradas no provedor de hospedagem (nunca commitar `.env`)
- [ ] SMTP configurado para envio real de e-mails
- [ ] Backup automático do Supabase habilitado

> **Nota sobre sessões em produção:** por padrão, `express-session` guarda as
> sessões em memória (`MemoryStore`), o que é suficiente para uma única
> instância do servidor. Se você escalar horizontalmente (mais de uma
> instância/processo do Node rodando ao mesmo tempo atrás de um load balancer),
> troque por um store persistente e compartilhado, como `connect-pg-simple`
> (usando o próprio Postgres do Supabase) ou Redis, para que o login do admin
> funcione de forma consistente entre as instâncias.
