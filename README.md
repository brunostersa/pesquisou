# 🚀 Pesquisou - Sistema de Feedback com QR Codes

Sistema web completo para empresários gerarem QR Codes para diferentes áreas da empresa e receberem feedbacks anônimos dos clientes em tempo real.

## ✨ Funcionalidades Implementadas

### 🔐 Para Empresários:
- **Autenticação Segura**: Login e cadastro com Firebase Auth
- **Dashboard Intuitivo**: Gerenciamento completo de áreas
- **QR Codes Automáticos**: Geração instantânea de QR Codes para cada área
- **Feedbacks em Tempo Real**: Visualização instantânea dos feedbacks recebidos
- **Interface Responsiva**: Funciona perfeitamente em desktop e mobile

### 📱 Para Clientes:
- **Feedback Anônimo**: Página pública para deixar feedbacks
- **Avaliação por Estrelas**: Sistema de rating de 1 a 5 estrelas
- **Comentários Opcionais**: Campo para feedbacks detalhados
- **Interface Amigável**: Design moderno e fácil de usar

## 🛠️ Tecnologias Utilizadas

- **Next.js 15** (App Router com Turbopack)
- **Firebase 12** (Authentication + Firestore)
- **Tailwind CSS 4** (UI moderna e responsiva)
- **qrcode.react** (Geração de QR Codes)
- **TypeScript** (Tipagem estática)
- **React 19** (Hooks e componentes funcionais)

## 🚀 Status do Projeto

✅ **COMPLETAMENTE IMPLEMENTADO E FUNCIONAL**

- ✅ Autenticação Firebase
- ✅ Dashboard de gerenciamento
- ✅ Geração de QR Codes
- ✅ Sistema de feedbacks
- ✅ Interface responsiva
- ✅ Tempo real com Firestore
- ✅ Tipagem TypeScript
- ✅ Design moderno

## 📦 Instalação e Configuração

### 1. Clone e Instale
```bash
git clone <url-do-repositorio>
cd pesquisou
npm install
```

### 2. Configure o Firebase
Siga as instruções detalhadas em [`CONFIGURACAO.md`](./CONFIGURACAO.md)

### 3. Execute o Projeto
```bash
npm run dev
```

### 4. Acesse
Abra http://localhost:3000 no seu navegador

## 🎯 Como Usar

### Para Empresários:
1. **Criar Conta**: Acesse `/login` e crie uma conta
2. **Criar Áreas**: No dashboard, crie áreas (ex: "Recepção", "Caixa")
3. **Gerar QR Codes**: Cada área gera automaticamente um QR Code
4. **Compartilhar**: Imprima ou exiba os QR Codes nas áreas
5. **Monitorar**: Visualize feedbacks em tempo real

### Para Clientes:
1. **Escanear**: Use o QR Code da área
2. **Avaliar**: Dê uma nota de 1 a 5 estrelas
3. **Comentar**: Deixe um comentário (opcional)
4. **Enviar**: Feedback anônimo enviado instantaneamente

## 📁 Estrutura do Projeto

```
src/
├── app/
│   ├── dashboard/          # Dashboard do empresário
│   ├── feedback/[areaId]/  # Página pública de feedback
│   ├── login/             # Autenticação
│   └── page.tsx           # Redirecionamento
├── components/
│   ├── QRCodeGenerator.tsx # Geração de QR Codes
│   └── FeedbackList.tsx    # Lista de feedbacks
├── lib/
│   └── firebase.ts        # Configuração Firebase
└── types/
    ├── Area.ts            # Tipo da área
    ├── Feedback.ts        # Tipo do feedback
    └── User.ts            # Tipo do usuário
```

## 🔒 Segurança e Privacidade

- **Feedbacks Anônimos**: Clientes podem enviar feedbacks sem identificação
- **Isolamento de Dados**: Empresários só veem feedbacks de suas áreas
- **Autenticação Obrigatória**: Dashboard protegido por login
- **Validação Completa**: Dados validados no frontend e backend
- **Regras Firestore**: Segurança configurada no banco de dados

## 🎨 Interface e UX

- **Design Moderno**: Gradientes, sombras e componentes elegantes
- **Responsivo**: Funciona perfeitamente em todos os dispositivos
- **Feedback Visual**: Estados de loading, sucesso e erro
- **Acessibilidade**: Contraste adequado e navegação por teclado
- **Performance**: Otimizado com Next.js 15 e Turbopack

## 🚀 Deploy em Produção

### Vercel (Recomendado)
```bash
npm run build
vercel --prod
```

### Outras Plataformas
- Netlify
- Railway
- Heroku
- AWS Amplify

## 📊 Funcionalidades Técnicas

- **Tempo Real**: Feedbacks aparecem instantaneamente
- **Offline Support**: Funciona mesmo com conexão instável
- **PWA Ready**: Pode ser instalado como app
- **SEO Otimizado**: Metadados e estrutura semântica
- **Performance**: Carregamento rápido e otimizado

## 🔧 Scripts Disponíveis

```bash
npm run dev      # Desenvolvimento com Turbopack
npm run build    # Build de produção
npm run start    # Servidor de produção
npm run lint     # Verificação de código
```

## 📈 Próximas Funcionalidades

- [ ] Exportação de relatórios
- [ ] Notificações por email
- [ ] Dashboard com gráficos
- [ ] Múltiplos idiomas
- [ ] Integração com WhatsApp
- [ ] API REST pública

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 📞 Suporte

- 📧 Email: suporte@pesquisou.com
- 📱 WhatsApp: (62) 982058386
- 🌐 Website: https://customerhub.com.br

---

**Pesquisou** - Transformando feedbacks em melhorias! 🚀
