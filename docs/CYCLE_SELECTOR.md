# Seletor de Ciclo - Dashboard de Ruptura

## Visão Geral

Sistema de seleção dinâmica de ciclo para o segundo card de ruptura, permitindo ao usuário escolher diferentes ciclos de 2025 e ver dados específicos.

## Funcionalidade

### Interface
- **Título Clicável**: "Ciclo XX ▼" onde XX é o ciclo selecionado
- **Modal de Seleção**: Grid com opções de 01 a 17
- **Feedback Visual**: Ciclo selecionado destacado em azul

### Comportamento
- **Pré-seleção Inteligente**: Maior ciclo com dados válidos é automaticamente selecionado
- **Dinâmico**: API atualiza automaticamente quando ciclo muda
- **Persistente**: Seleção mantida durante a sessão
- **Validação**: Ciclos com 0% ficam desabilitados
- **Auto-correção**: Se ciclo selecionado for inválido, muda para maior ciclo válido

## Lógica de Pré-seleção

### Critério de Seleção Automática
- **Objetivo**: Selecionar o maior ciclo com dados > 0.1%
- **Método**: Busca do ciclo 17 → 01 até encontrar dados válidos
- **Exemplo**: Se ciclos 08-17 têm 0%, seleciona ciclo 07
- **Fallback**: Se nenhum ciclo maior válido, seleciona o primeiro válido

### Algoritmo
```tsx
// Busca do maior para o menor
for (let i = historicalData.length - 1; i >= 0; i--) {
  if (historicalData[i] > 0.1) {
    highestValidCycle = i;  // Maior ciclo válido encontrado
    break;
  }
}
```

### Cenários de Aplicação
- **Carregamento Inicial**: Aplica automaticamente
- **Ciclo Inválido Selecionado**: Corrige para maior válido
- **Dados Atualizados**: Mantém seleção se ainda válida

### Exemplos Práticos

#### Cenário 1: Ciclos 08-17 com 0%
- **Dados**: Ciclos 01-07 têm valores, 08-17 são 0%
- **Resultado**: Pré-seleciona ciclo **07** (maior válido)

#### Cenário 2: Ciclos 05-17 com 0%
- **Dados**: Ciclos 01-04 têm valores, 05-17 são 0%
- **Resultado**: Pré-seleciona ciclo **04** (maior válido)

#### Cenário 3: Apenas ciclos 02, 03, 09 têm dados
- **Dados**: 01=0%, 02=2.1%, 03=1.5%, 04-08=0%, 09=3.2%, 10-17=0%
- **Resultado**: Pré-seleciona ciclo **09** (maior válido)

#### Cenário 4: Nenhum dado válido
- **Dados**: Todos os ciclos com 0%
- **Resultado**: Mantém ciclo padrão ou primeiro disponível

## Implementação Técnica

### Estados Adicionados
```tsx
const [selectedCycle, setSelectedCycle] = useState('07');
const [showCycleSelector, setShowCycleSelector] = useState(false);
```

### URL da API Dinâmica
```tsx
// Antes (fixo)
startCurrentCycle=202507&endCurrentCycle=202507

// Depois (dinâmico)
startCurrentCycle=2025${selectedCycle}&endCurrentCycle=2025${selectedCycle}
```

### Dependências do useEffect
```tsx
useEffect(() => {
  if (!loadingToken && token) {
    loadStorePerformance();
    fetchRuptureData();
    fetchCurrentCycleData(); // Recarrega quando selectedCycle muda
  }
}, [loadingToken, token, selectedCycle]);
```

## Ciclos Disponíveis

- **01** até **17**: Cobrindo todos os ciclos de 2025
- **Interface**: Grid 4 colunas com botões retangulares
- **Destaque**: Ciclo selecionado com borda azul e fundo azul claro

## Fluxo do Usuário

1. **Visualizar**: Card mostra "Ciclo 07 ▼" por padrão
2. **Clicar**: Abre modal com grid de ciclos
3. **Selecionar**: Toca no ciclo desejado
4. **Atualizar**: Modal fecha e dados são recarregados automaticamente
5. **Animar**: Porcentagens animam com novos valores

## Estilos

```tsx
// Título clicável
rupturePeriod: TouchableOpacity com seta ▼

// Modal
cycleModalContent: Modal centralizado e responsivo

// Opções
cycleOption: Botões retangulares 60x40px
selectedCycle: Destaque visual para selecionado
```

## Benefícios

✅ **Flexibilidade**: Usuário escolhe ciclo específico
✅ **Dinamismo**: Dados atualizados automaticamente  
✅ **UX Intuitiva**: Interface simples e clara
✅ **Performance**: Recarrega apenas dados necessários
✅ **Visual**: Animações mantidas nos novos dados 

## Desabilitação Inteligente

### Critério de Desabilitação
- **Threshold**: Ciclos com ruptura ≤ 0.1% ficam inativos
- **Visual**: Opacidade reduzida + cores acinzentadas
- **Funcional**: Botões não respondem a toques
- **Sincronia**: Usa dados do gráfico histórico

### Estados dos Botões
- **Ativo**: Cor normal, clicável
- **Selecionado**: Azul destacado, ativo
- **Desabilitado**: Opacidade 50%, acinzentado, não clicável

### Implementação
```tsx
const cycleData = historicalData[index] || 0;
const isDisabled = cycleData <= 0.1;

// Estilo condicional
style={[
  styles.cycleOption,
  isDisabled && styles.disabledCycle
]}

// Comportamento condicional
onPress={() => {
  if (!isDisabled) {
    setSelectedCycle(item);
  }
}}
disabled={isDisabled}
``` 