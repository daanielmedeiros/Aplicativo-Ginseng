# Sistema de Cache de Imagens

## Visão Geral

Este sistema implementa um cache inteligente para imagens dos produtos do Boticário (URL: `https://sgi.e-boticario.com.br/Paginas/Imagens/Produtos/`) nas páginas `index.tsx` e `inventory.tsx`.

## Arquitetura

### 1. ImageCacheManager (`utils/imageCache.ts`)
- **Responsabilidade**: Gerencia o armazenamento local das imagens
- **Recursos**:
  - Cache automático com duração de 7 dias
  - Limite máximo de 100 imagens no cache
  - Limpeza automática de arquivos expirados
  - Armazenamento em diretório local usando `expo-file-system`
  - Metadados salvos em `AsyncStorage`

### 2. useImageCache Hook (`hooks/useImageCache.ts`)
- **Responsabilidade**: Hook React para uso do cache em componentes
- **Fluxo**:
  1. Verifica se a imagem está no cache
  2. Se está, retorna o caminho local
  3. Se não está, mostra a URL original e faz cache em background
  4. Atualiza automaticamente quando o cache completa

### 3. CachedImage Component (`components/CachedImage.tsx`)
- **Responsabilidade**: Componente de imagem otimizado
- **Recursos**:
  - Loading indicator automático
  - Fallback para imagem padrão em caso de erro
  - Interface compatível com `Image` do React Native
  - Uso: `<CachedImage uri="url_da_imagem" style={estilos} />`

### 4. ImageCacheProvider (`contexts/ImageCacheContext.tsx`)
- **Responsabilidade**: Contexto global para gerenciar o cache
- **Recursos**:
  - Monitoramento do tamanho do cache
  - Função para limpar todo o cache
  - Estado de inicialização

## Configuração

### Dependências Necessárias
```bash
npx expo install expo-file-system
```

### Implementação no App
```tsx
// app/_layout.tsx
import { ImageCacheProvider } from '@/contexts/ImageCacheContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ImageCacheProvider>
        <RootLayoutNav />
      </ImageCacheProvider>
    </AuthProvider>
  );
}
```

## Uso

### Substituir Image por CachedImage
```tsx
// Antes
<Image source={{ uri: imageUrl }} style={styles.image} />

// Depois
<CachedImage uri={imageUrl} style={styles.image} />
```

### Páginas Atualizadas
- ✅ `app/(tabs)/index.tsx` - Produtos mais vendidos
- ✅ `app/(tabs)/inventory.tsx` - Lista de produtos
- ✅ `components/InventoryItem.tsx` - Item individual
- ✅ `components/TopSellingProducts.tsx` - Componente de produtos

## Benefícios

1. **Performance**: Imagens carregam instantaneamente após o primeiro acesso
2. **Economia de Dados**: Reduz download repetido das mesmas imagens
3. **Experiência do Usuário**: Menos tempo de carregamento e loading spinners
4. **Gerenciamento Automático**: Cache expira automaticamente e gerencia tamanho
5. **Fallback Inteligente**: Continua funcionando mesmo se o cache falhar

## Configurações

### Personalização do Cache
```typescript
// utils/imageCache.ts
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias
const MAX_CACHE_SIZE = 100; // Máximo de imagens
```

### Propriedades do CachedImage
```typescript
interface CachedImageProps {
  uri: string;                    // URL da imagem (obrigatório)
  showLoader?: boolean;           // Mostra loading (padrão: true)
  loaderSize?: 'small' | 'large'; // Tamanho do loading
  loaderColor?: string;           // Cor do loading
  fallbackSource?: ImageSource;   // Imagem fallback para erros
  // + todas as props do Image nativo
}
```

## Monitoramento

### Verificar Tamanho do Cache
```tsx
import { useImageCacheContext } from '@/contexts/ImageCacheContext';

function CacheInfo() {
  const { cacheSize, clearCache } = useImageCacheContext();
  
  return (
    <View>
      <Text>Imagens em cache: {cacheSize.count}</Text>
      <Text>Tamanho: {cacheSize.sizeInMB.toFixed(2)} MB</Text>
      <Button title="Limpar Cache" onPress={clearCache} />
    </View>
  );
}
```

## Manutenção

O sistema é projetado para ser autônomo:
- **Limpeza automática**: A cada 10 novas imagens, remove arquivos expirados
- **Limite de tamanho**: Remove imagens mais antigas se exceder 100 itens
- **Recuperação de erros**: Continua funcionando mesmo com falhas no cache

## URLs Suportadas

O sistema foi otimizado especificamente para:
- `https://sgi.e-boticario.com.br/Paginas/Imagens/Produtos/{codigo}g.jpg`

Mas funciona com qualquer URL de imagem válida. 