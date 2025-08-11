# 💳 Cartões de Teste Stripe

## 🎯 Cartões Principais

### ✅ Cartão de Sucesso
```
Número: 4242 4242 4242 4242
Validade: 12/25 (ou qualquer data futura)
CVC: 123 (ou qualquer 3 dígitos)
CEP: 12345-678 (ou qualquer CEP válido)
Nome: João Silva (ou qualquer nome)
Email: teste@exemplo.com (ou qualquer email válido)
```

### ❌ Cartão de Falha
```
Número: 4000 0000 0000 0002
Validade: 12/25
CVC: 123
CEP: 12345-678
Nome: João Silva
Email: teste@exemplo.com
```

### 🔒 Cartão 3D Secure
```
Número: 4000 0025 0000 3155
Validade: 12/25
CVC: 123
CEP: 12345-678
Nome: João Silva
Email: teste@exemplo.com
```

## 🧪 Outros Cenários de Teste

### Cartões com Problemas Específicos
- **CVC incorreto**: `4000 0000 0000 0127`
- **Cartão expirado**: `4000 0000 0000 0069`
- **CEP incorreto**: `4000 0000 0000 0027`
- **Saldo insuficiente**: `4000 0000 0000 9995`
- **Cartão recusado**: `4000 0000 0000 0002`

## 📝 Dados Padrão para Teste

### Informações Pessoais
- **Nome**: João Silva
- **Email**: teste@exemplo.com
- **Telefone**: 11999999999
- **CPF**: 123.456.789-00

### Endereço
- **CEP**: 12345-678
- **Endereço**: Rua das Flores, 123
- **Bairro**: Centro
- **Cidade**: São Paulo
- **Estado**: SP

## 🎯 Como Usar

1. **Acesse**: http://localhost:3000/pricing
2. **Selecione um plano** (Starter ou Professional)
3. **Preencha os dados** do cartão de teste
4. **Complete o pagamento**

## ⚠️ Importante

- **Apenas para testes**: Estes cartões só funcionam em ambiente de teste
- **Não use dados reais**: Nunca use cartões reais em ambiente de desenvolvimento
- **Webhook**: Configure o Stripe CLI para testar webhooks localmente

---

**🚀 Pronto para testar!** 💳
