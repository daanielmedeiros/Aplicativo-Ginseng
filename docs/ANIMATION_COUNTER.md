# Sistema de Animação de Contador

## Visão Geral

Sistema de animação para porcentagens de ruptura que cria um efeito visual de contagem crescente do 0% até o valor final.

## Arquitetura

### Hook useCountAnimation (`hooks/useCountAnimation.ts`)

- **Responsabilidade**: Animar valores numéricos de 0 até o valor alvo
- **Configurações**:
  - `duration`: Duração da animação (padrão: 2000ms)
  - `delay`: Delay antes de iniciar (padrão: 0ms)
- **Retorna**: `{ value, isAnimating }`

### Implementação

```tsx
// Uso básico
const { value } = useCountAnimation(25.5, { duration: 1500, delay: 200 });

// No componente
<Text>{value.toString().replace('.', ',')}%</Text>
```

## Componente AnimatedPercentage

- **Localização**: `app/(tabs)/index.tsx` (componente interno)
- **Props**:
  - `value`: Porcentagem como string (ex: "25.5")
  - `delay`: Delay para escalonar animações
- **Recursos**:
  - Converte string para número
  - Trata valores undefined (fallback para 0,0%)
  - Formata resultado com vírgula brasileira

## Sequência de Animação

### Primeiro Bloco (Período 2025)
- **Ruptura Total**: delay 0ms
- **Causa Franqueado**: delay 200ms  
- **Causa Industria**: delay 400ms

### Segundo Bloco (Ciclo 2025/07)
- **Ruptura Total**: delay 600ms
- **Causa Franqueado**: delay 800ms
- **Causa Industria**: delay 1000ms

## Características

✅ **Animação suave**: 60fps usando setInterval de 16ms
✅ **Efeito escalonado**: Delays diferentes criam sequência visual
✅ **Tratamento de erros**: Fallback para valores undefined
✅ **Formato brasileiro**: Vírgula como separador decimal
✅ **Performance otimizada**: Cleanup automático de timers

## Personalização

```tsx
// Animação mais rápida
const { value } = useCountAnimation(targetValue, { duration: 1000 });

// Com delay personalizado
const { value } = useCountAnimation(targetValue, { delay: 500 });

// Verificar se está animando
const { value, isAnimating } = useCountAnimation(targetValue);
``` 