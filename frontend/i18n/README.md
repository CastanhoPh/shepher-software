# Sistema de Internacionalização (i18n)

Este projeto suporta múltiplos idiomas: **Português (pt)**, **Espanhol (es)** e **Inglês (en)**.

## 📁 Estrutura

```
i18n/
├── index.ts      # Exporta todas as traduções
├── pt.ts         # Traduções em Português (idioma padrão)
├── es.ts         # Traduções em Espanhol
└── en.ts         # Traduções em Inglês
```

## 🚀 Como Usar

### 1. Importar o Hook
```tsx
import { useLanguage } from './contexts/LanguageContext';
```

### 2. Usar no Componente
```tsx
function MeuComponente() {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <div>
      <h1>{t.login.title}</h1>
      <p>{t.login.subtitle}</p>
      
      <button onClick={() => setLanguage('es')}>
        Cambiar a Español
      </button>
    </div>
  );
}
```

### 3. Acessar Traduções
As traduções são organizadas em categorias:

```tsx
// Login
t.login.title
t.login.subtitle
t.login.email
t.login.password
t.login.button

// Menu
t.menu.dashboard
t.menu.users
t.menu.disciples
t.menu.study
t.menu.logout

// Dashboard
t.dashboard.title
t.dashboard.statistics
t.dashboard.totalUsers

// Users
t.users.title
t.users.add
t.users.name
t.users.email

// Roles
t.roles.PASTOR
t.roles.LIDER
t.roles.DISCIPULO

// Common
t.common.loading
t.common.error
t.common.success
```

## 🔄 Trocar Idioma

### Botão Simples
```tsx
<button onClick={() => setLanguage('en')}>
  English
</button>
```

### Rotação Entre Idiomas
```tsx
<button onClick={() => {
  const langs = ['pt', 'es', 'en'] as const;
  const currentIndex = langs.indexOf(language);
  const nextLang = langs[(currentIndex + 1) % langs.length];
  setLanguage(nextLang);
}}>
  {language === 'pt' && 'Português'}
  {language === 'es' && 'Español'}
  {language === 'en' && 'English'}
</button>
```

## ➕ Adicionar Novas Traduções

### 1. Adicionar em `pt.ts` (Base)
```typescript
export const pt = {
  // ... traduções existentes
  
  myNewSection: {
    title: 'Meu Título',
    description: 'Minha Descrição',
  },
};
```

### 2. Adicionar em `es.ts`
```typescript
export const es: Translation = {
  // ... traduções existentes
  
  myNewSection: {
    title: 'Mi Título',
    description: 'Mi Descripción',
  },
};
```

### 3. Adicionar em `en.ts`
```typescript
export const en: Translation = {
  // ... traduções existentes
  
  myNewSection: {
    title: 'My Title',
    description: 'My Description',
  },
};
```

### 4. Usar no Código
```tsx
<h1>{t.myNewSection.title}</h1>
<p>{t.myNewSection.description}</p>
```

## 💾 Persistência

O idioma selecionado é salvo automaticamente no `localStorage` e restaurado ao recarregar a página.

```typescript
// Salvo automaticamente
localStorage.setItem('language', 'pt');

// Restaurado automaticamente ao iniciar
const saved = localStorage.getItem('language');
```

## 🎨 Interface

### Seletor na Tela de Login
- Posicionado no canto superior direito
- Mostra a sigla do idioma atual (PT/ES/EN)
- Clique rotaciona entre os idiomas

### Seletor no Menu Lateral
- Localizado acima do botão de tema escuro/claro
- Mostra o nome completo do idioma
- Ícone de `Languages` da biblioteca lucide-react

## 📋 Exemplo Completo

```tsx
import { useLanguage } from './contexts/LanguageContext';
import { Languages } from 'lucide-react';

function LoginPage() {
  const { language, setLanguage, t } = useLanguage();
  
  const cycleLanguage = () => {
    const langs = ['pt', 'es', 'en'] as const;
    const currentIndex = langs.indexOf(language);
    const nextLang = langs[(currentIndex + 1) % langs.length];
    setLanguage(nextLang);
  };
  
  return (
    <div>
      <button onClick={cycleLanguage}>
        <Languages size={18} />
        {language === 'pt' && 'PT'}
        {language === 'es' && 'ES'}
        {language === 'en' && 'EN'}
      </button>
      
      <h1>{t.login.title}</h1>
      <p>{t.login.subtitle}</p>
      
      <input 
        type="email" 
        placeholder={t.login.email}
      />
      
      <button>{t.login.button}</button>
    </div>
  );
}
```

## 🔍 TypeScript

O sistema possui tipagem completa:

```typescript
// Tipo inferido automaticamente
const { t } = useLanguage();

// t.login.title ✅
// t.login.invalidKey ❌ Erro de compilação
```

A tipagem é baseada no arquivo `pt.ts`, garantindo que todas as traduções tenham as mesmas chaves.

## 🌍 Idiomas Disponíveis

| Código | Idioma     | Nome Nativo |
|--------|------------|-------------|
| `pt`   | Português  | Português   |
| `es`   | Espanhol   | Español     |
| `en`   | Inglês     | English     |

## 📝 Notas

- O português é o idioma padrão
- Todas as traduções são carregadas em tempo de compilação (não há lazy loading)
- O TypeScript garante que todos os idiomas tenham as mesmas chaves
- As traduções são imutáveis em runtime
