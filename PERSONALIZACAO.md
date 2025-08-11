# 🎨 Sistema de Personalização de Cores e Fontes

Este documento explica como personalizar facilmente todas as cores e fontes do projeto Pesquisou.

## 📍 Localização

Todas as personalizações são feitas no arquivo: `src/app/globals.css`

## 🎯 Como Personalizar

### 1. **Cores Principais**
```css
:root {
  --primary-color: #3b82f6;          /* Cor principal (azul) */
  --primary-hover: #2563eb;          /* Cor principal no hover */
  --secondary-color: #8b5cf6;        /* Cor secundária (roxo) */
  --accent-color: #10b981;           /* Cor de destaque (verde) */
}
```

### 2. **Backgrounds**
```css
:root {
  --bg-primary: #ffffff;             /* Background principal (modo claro) */
  --bg-secondary: #f8fafc;           /* Background secundário */
  --bg-tertiary: #f1f5f9;            /* Background terciário */
  --bg-card: #ffffff;                /* Background de cards */
  --bg-overlay: rgba(0, 0, 0, 0.5); /* Overlay para modais */
}
```

### 3. **Textos**
```css
:root {
  --text-primary: #171717;           /* Texto principal */
  --text-secondary: #64748b;         /* Texto secundário */
  --text-muted: #94a3b8;             /* Texto suave */
  --text-inverse: #ffffff;           /* Texto em fundo escuro */
}
```

### 4. **Fontes**
```css
:root {
  --font-family-primary: 'Geist', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  --font-family-mono: 'Geist Mono', 'Fira Code', 'Monaco', 'Cascadia Code', monospace;
  --font-size-base: 1rem;            /* Tamanho base da fonte */
  --font-size-lg: 1.125rem;          /* Tamanho grande */
  --font-size-xl: 1.25rem;           /* Tamanho extra grande */
}
```

## 🌙 Modo Escuro

O modo escuro é configurado automaticamente baseado na preferência do sistema:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --bg-primary: #0a0a0a;           /* Background principal (modo escuro) */
    --bg-secondary: #1e293b;         /* Background secundário */
    --text-primary: #ededed;         /* Texto principal */
    /* ... outras cores do modo escuro */
  }
}
```

## 🎨 Classes Utilitárias Disponíveis

### Backgrounds
- `.bg-primary` - Background principal
- `.bg-secondary` - Background secundário
- `.bg-tertiary` - Background terciário
- `.bg-card` - Background de cards

### Textos
- `.text-primary` - Texto principal
- `.text-secondary` - Texto secundário
- `.text-muted` - Texto suave
- `.text-inverse` - Texto invertido

### Gradientes
- `.gradient-primary` - Gradiente principal
- `.gradient-secondary` - Gradiente secundário

### Sombras
- `.shadow-custom-sm` - Sombra pequena
- `.shadow-custom-md` - Sombra média
- `.shadow-custom-lg` - Sombra grande

## 🚀 Exemplos de Personalização

### Tema Azul Moderno
```css
:root {
  --primary-color: #2563eb;
  --secondary-color: #1e40af;
  --accent-color: #3b82f6;
  --bg-primary: #f8fafc;
  --bg-secondary: #e2e8f0;
}
```

### Tema Verde Natureza
```css
:root {
  --primary-color: #059669;
  --secondary-color: #047857;
  --accent-color: #10b981;
  --bg-primary: #f0fdf4;
  --bg-secondary: #dcfce7;
}
```

### Tema Roxo Elegante
```css
:root {
  --primary-color: #7c3aed;
  --secondary-color: #6d28d9;
  --accent-color: #a855f7;
  --bg-primary: #faf5ff;
  --bg-secondary: #f3e8ff;
}
```

## 📱 Responsividade

O sistema inclui ajustes automáticos para dispositivos móveis:

```css
@media (max-width: 768px) {
  :root {
    --font-size-base: 0.875rem;
    --font-size-lg: 1rem;
    --font-size-xl: 1.125rem;
  }
}
```

## ⚡ Dicas

1. **Mantenha o contraste**: Certifique-se de que o texto seja legível no background
2. **Teste no modo escuro**: Sempre verifique como ficam as cores no modo escuro
3. **Use ferramentas de cor**: Sites como Coolors ou Adobe Color ajudam a criar paletas harmoniosas
4. **Consistência**: Mantenha as cores consistentes em todo o projeto

## 🔧 Componentes Pré-configurados

O sistema inclui componentes base já estilizados:

- `.btn-primary` - Botão principal
- `.card` - Card com sombra e borda
- Transições suaves automáticas

## 📝 Notas

- Todas as mudanças são aplicadas automaticamente em todo o projeto
- O sistema é compatível com Tailwind CSS
- As transições são suaves para uma melhor experiência do usuário
- O modo escuro é detectado automaticamente pelo sistema operacional 