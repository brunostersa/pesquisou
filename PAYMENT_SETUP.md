# 🚀 Configuração do Sistema de Pagamento

## 📋 Pré-requisitos

1. **Conta Stripe**: Crie uma conta em [stripe.com](https://stripe.com)
2. **Firebase**: Projeto configurado com Firestore
3. **Variáveis de Ambiente**: Configure as chaves necessárias
4. **Stripe CLI** (para desenvolvimento local): [Instalar Stripe CLI](https://stripe.com/docs/stripe-cli)

## 🔧 Configuração do Stripe

### 1. Obter Chaves do Stripe

1. Acesse o [Dashboard do Stripe](https://dashboard.stripe.com)
2. Vá em **Developers > API keys**
3. Copie as chaves:
   - **Publishable key** (pública)
   - **Secret key** (privada)

### 2. Configurar Webhook

#### Para Desenvolvimento Local (Recomendado)

1. **Instale o Stripe CLI**:
   ```bash
   # macOS (usando Homebrew)
   brew install stripe/stripe-cli/stripe
   
   # Ou baixe de: https://github.com/stripe/stripe-cli/releases
   ```

2. **Faça login no Stripe CLI**:
   ```bash
   stripe login
   ```

3. **Inicie o listener para webhooks**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhook
   ```

4. **Copie o webhook secret** que aparece no terminal (algo como `whsec_1234567890abcdef...`)

#### Para Produção

1. No Dashboard do Stripe, vá em **Developers > Webhooks**
2. Clique em **Add endpoint**
3. URL: `https://seu-dominio.com/api/webhook` (deve ser publicamente acessível)
4. Eventos a escutar:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copie o **Webhook signing secret**

### 3. Variáveis de Ambiente

Crie um arquivo `.env.local` na raiz do projeto:

```env
# Stripe Configuration
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_sua_chave_publica
STRIPE_SECRET_KEY=sk_test_sua_chave_secreta
STRIPE_WEBHOOK_SECRET=whsec_seu_webhook_secret

# Application Configuration
NEXT_PUBLIC_BASE_URL=http://localhost:3000
```

## 💳 Planos Configurados

### Plano Starter
- **Preço**: R$ 29,00/mês
- **Features**: 5 áreas, 200 feedbacks/mês, QR personalizados

### Plano Professional
- **Preço**: R$ 79,00/mês
- **Features**: Ilimitado, IA completa, suporte 24/7

## 🔄 Fluxo de Pagamento

1. **Usuário seleciona plano** na página `/planos`
2. **Sistema cria sessão** via `/api/create-checkout-session`
3. **Stripe processa pagamento** e redireciona para sucesso
4. **Webhook atualiza plano** do usuário no Firestore
5. **Usuário acessa funcionalidades** do plano contratado
6. **Gerenciar assinatura** na página `/assinatura`

## 🛡️ Segurança

- ✅ Chaves secretas nunca expostas no cliente
- ✅ Webhook verificado com assinatura
- ✅ Dados sensíveis apenas no servidor
- ✅ Validação de permissões por plano

## 🧪 Teste

### Cartões de Teste Stripe (Dados Completos)

#### ✅ Cartão de Sucesso
- **Número**: `4242 4242 4242 4242`
- **Validade**: Qualquer data futura (ex: `12/25`)
- **CVC**: Qualquer 3 dígitos (ex: `123`)
- **CEP**: Qualquer CEP válido (ex: `12345-678`)

#### ❌ Cartão de Falha
- **Número**: `4000 0000 0000 0002`
- **Validade**: Qualquer data futura (ex: `12/25`)
- **CVC**: Qualquer 3 dígitos (ex: `123`)
- **CEP**: Qualquer CEP válido (ex: `12345-678`)

#### 🔒 Cartão 3D Secure
- **Número**: `4000 0025 0000 3155`
- **Validade**: Qualquer data futura (ex: `12/25`)
- **CVC**: Qualquer 3 dígitos (ex: `123`)
- **CEP**: Qualquer CEP válido (ex: `12345-678`)

#### 💳 Outros Cartões de Teste
- **Cartão que requer autenticação**: `4000 0025 0000 3155`
- **Cartão com CVC incorreto**: `4000 0000 0000 0127`
- **Cartão expirado**: `4000 0000 0000 0069`
- **Cartão com CEP incorreto**: `4000 0000 0000 0027`

### 📝 Dados de Teste Adicionais
- **Nome**: Qualquer nome (ex: `João Silva`)
- **Email**: Qualquer email válido (ex: `teste@exemplo.com`)
- **Telefone**: Qualquer telefone (ex: `11999999999`)

### Testando Webhooks

1. Use o [Stripe CLI](https://stripe.com/docs/stripe-cli)
2. Execute: `stripe listen --forward-to localhost:3000/api/webhook`
3. Copie o webhook secret gerado

## 🚀 Deploy

1. Configure as variáveis no seu provedor (Vercel, Netlify, etc.)
2. Atualize a URL do webhook no Stripe
3. Teste o fluxo completo em produção

## 📞 Suporte

- **Stripe**: [docs.stripe.com](https://docs.stripe.com)
- **Pesquisou**: suporte@pesquisou.com

---

**🎉 Sistema pronto para voar!** 🚀 