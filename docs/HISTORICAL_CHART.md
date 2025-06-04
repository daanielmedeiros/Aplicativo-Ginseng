# Gráfico Histórico de Ruptura

## Visão Geral

Sistema de visualização histórica que mostra a evolução da ruptura por causa franqueado através dos ciclos 01 até 17 de 2025.

## Funcionalidades

### Visualização
- **Tipo**: Gráfico de linha com curva suave (bezier)
- **Dados**: % Ruptura Causa Franqueado por ciclo
- **Período**: Ciclos 01-17 de 2025 (apenas com dados > 0.1%)
- **Responsivo**: Ajusta-se à largura da tela
- **Filtragem**: Exibe apenas ciclos com ruptura significativa

### Interface
- **Título**: "Histórico Ruptura - Causa Franqueado"
- **Eixo X**: Apenas ciclos com dados válidos (> 0.1%)
- **Eixo Y**: Porcentagem com sufixo "%"
- **Pontos**: Destacados em azul (#04506B)
- **Linha**: Espessura 3px, cor azul
- **Fallback**: Mensagem se nenhum dado disponível

## Implementação Técnica

### Dependências
```bash
npm install react-native-chart-kit
npx expo install react-native-svg
```

### Estados
```tsx
const [historicalData, setHistoricalData] = useState<number[]>([]);
const [loadingHistorical, setLoadingHistorical] = useState(true);
```

### Função de Busca
```tsx
const fetchHistoricalData = async () => {
  // Busca dados para ciclos 01-17
  // Extrai franchiseDisruptionPercentage de cada
  // Adiciona delay de 100ms entre requisições
};
```

## Configuração do Gráfico

### Dados
```tsx
data={{
  labels: ['01', '02', '03'...], // Ciclos
  datasets: [{
    data: historicalData,        // Porcentagens
    color: (opacity = 1) => `rgba(4, 80, 107, ${opacity})`,
    strokeWidth: 3,
  }],
}}
```

### Configuração Visual
```tsx
chartConfig={{
  backgroundColor: Colors.white,
  decimalPlaces: 1,              // Uma casa decimal
  color: (opacity = 1) => `rgba(4, 80, 107, ${opacity})`,
  propsForDots: {
    r: '6',                      // Raio dos pontos
    stroke: '#04506B',           // Borda dos pontos
    fill: '#04506B',             // Preenchimento
  },
}}
```

## Características

✅ **Performance**: Busca paralela com delay anti-spam
✅ **Fallback**: Exibe 0% se API falhar
✅ **Loading**: Indicador durante carregamento
✅ **Responsivo**: Ajusta largura automaticamente
✅ **Animação**: FadeIn com delay coordenado
✅ **Curva suave**: Bezier para melhor visualização

## Lógica de Filtragem

### Critério de Exibição
- **Threshold**: Apenas ciclos com ruptura > 0.1%
- **Filtros Sincronizados**: Labels e dados mantidos em sincronia
- **Fallback**: Mensagem se nenhum ciclo válido

### Implementação
```tsx
const filteredData: number[] = [];
const filteredLabels: string[] = [];

historicalData.forEach((value, index) => {
  if (value > 0.1) {
    filteredData.push(value);
    filteredLabels.push(cycles[index]);
  }
});
```

### Estados Possíveis
- **Dados Válidos**: Gráfico com ciclos filtrados
- **Sem Dados**: "Nenhum dado de ruptura disponível"
- **Loading**: "Carregando histórico..."

## Estados de Loading

### Durante Carregamento
- ⏳ ActivityIndicator centralizado
- 📝 Texto "Carregando histórico..."
- 📏 Container com altura fixa (200px)

### Dados Carregados
- 📊 Gráfico completo renderizado
- 🎯 Pontos interativos
- 📱 Scroll horizontal se necessário

## Tratamento de Erros

```tsx
// Por ciclo individual
catch (error) {
  console.warn(`Erro ao buscar dados do ciclo ${cycle}:`, error);
  results.push(0); // Fallback para 0%
}

// Geral
catch (error) {
  console.error('Erro ao buscar dados históricos:', error);
}
```

## Integração com Dashboard

- **Posição**: Após segundo card de ruptura
- **Animação**: FadeInDown com delay 250ms
- **Estilo**: Consistente com outros cards
- **Margem**: 24px bottom para espaçamento

## Personalização

### Cores
- **Linha**: #04506B (azul corporativo)
- **Pontos**: #04506B com borda
- **Fundo**: Branco limpo
- **Grid**: Cinza claro (#Colors.neutral[200])

### Dimensões
- **Largura**: 80% da largura da tela (centralizado)
- **Altura**: 180px fixo (compacto)
- **Pontos**: Raio 6px
- **Linha**: 3px de espessura
- **Posicionamento**: Centralizado horizontalmente 