# 🔧 Configuração do Pesquisou

## 📋 Pré-requisitos

- Node.js 18+ instalado
- Conta no Google Firebase
- Navegador moderno

## 🚀 Configuração Rápida

### 1. Configurar Firebase

1. **Acesse o Firebase Console**
   - Vá para https://console.firebase.google.com/
   - Faça login com sua conta Google

2. **Criar Novo Projeto**
   - Clique em "Criar projeto"
   - Digite um nome (ex: "pesquisou-app")
   - Desative o Google Analytics (opcional)
   - Clique em "Criar projeto"

3. **Ativar Authentication**
   - No menu lateral, clique em "Authentication"
   - Clique em "Começar"
   - Vá em "Sign-in method"
   - Ative "Email/Senha"
   - Clique em "Salvar"

4. **Criar Banco Firestore**
   - No menu lateral, clique em "Firestore Database"
   - Clique em "Criar banco de dados"
   - Escolha "Iniciar no modo de teste" (para desenvolvimento)
   - Escolha uma localização (ex: us-central1)
   - Clique em "Próximo" e depois "Ativar"

5. **Configurar Regras de Segurança**
   - No Firestore, vá em "Regras"
   - Substitua as regras existentes por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Usuários: usuários podem ler/escrever apenas seus próprios dados
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Áreas: usuários podem ler/escrever apenas suas próprias áreas
    match /areas/{areaId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.userId;
    }
    
    // Feedbacks: qualquer pessoa pode escrever, usuários podem ler feedbacks de suas áreas
    match /feedbacks/{feedbackId} {
      allow write: if true;
      allow read: if request.auth != null && 
        exists(/databases/$(database)/documents/areas/$(resource.data.areaId)) &&
        get(/databases/$(database)/documents/areas/$(resource.data.areaId)).data.userId == request.auth.uid;
    }
  }
}
```

6. **Obter Credenciais**
   - Vá em "Configurações do Projeto" (ícone de engrenagem)
   - Clique em "Geral"
   - Role até "Seus aplicativos"
   - Clique em "Adicionar app" > "Web"
   - Digite um nome (ex: "pesquisou-web")
   - Clique em "Registrar app"
   - Copie as configurações fornecidas

### 2. Configurar o Projeto

1. **Editar arquivo de configuração**
   - Abra `src/lib/firebase.ts`
   - Substitua as configurações mockadas pelas suas credenciais reais

2. **Instalar dependências**
   ```bash
   npm install
   ```

3. **Executar o projeto**
   ```bash
   npm run dev
   ```

4. **Acessar o sistema**
   - Abra http://localhost:3000
   - Crie uma conta ou faça login
   - Comece a usar o sistema!

## 🧪 Testando o Sistema

### Para Empresários:
1. Acesse http://localhost:3000
2. Crie uma conta com email e senha
3. No dashboard, crie áreas (ex: "Recepção", "Caixa")
4. Para cada área, um QR Code será gerado automaticamente
5. Clique em "Ver Feedbacks" para ver os feedbacks recebidos

### Para Clientes:
1. Escaneie um QR Code gerado
2. Ou acesse diretamente: http://localhost:3000/feedback/[ID_DA_AREA]
3. Preencha o formulário de feedback
4. Envie o feedback anonimamente

## 🔒 Segurança

- Feedbacks são completamente anônimos
- Empresários só podem ver feedbacks de suas próprias áreas
- Autenticação obrigatória para acesso ao dashboard
- Validação de dados no frontend e backend

## 🚀 Deploy

Para fazer deploy em produção:

1. Configure as variáveis de ambiente do Firebase
2. Execute o build:
   ```bash
   npm run build
   ```
3. Deploy na plataforma de sua preferência (Vercel, Netlify, etc.)

## ❗ Solução de Problemas

### Erro de configuração do Firebase
- Verifique se as credenciais estão corretas
- Certifique-se de que o projeto Firebase está ativo
- Verifique se Authentication e Firestore estão habilitados

### Erro de permissão
- Verifique se as regras do Firestore estão configuradas corretamente
- Certifique-se de que o modo de teste está ativo para desenvolvimento

### QR Code não funciona
- Verifique se a URL base está correta
- Teste acessando diretamente a URL do feedback

## 📞 Suporte

Se encontrar problemas:
1. Verifique os logs do console do navegador
2. Verifique os logs do Firebase Console
3. Certifique-se de que todas as configurações estão corretas 