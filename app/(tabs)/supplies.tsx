import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Modal,
  Pressable,
  Dimensions,
  Platform,
  ActivityIndicator,
  FlatList
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import Animated, { FadeInDown } from 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import ProgressBar from '@/components/ProgressBar';

interface TokenResponse {
  data: {
    TRIAL312: null;
    created_at: string;
    id: number;
    token: string;
    updated_at: string;
  }[];
  total: number;
  pagina_atual: number;
  total_paginas: number;
}

interface RuptureData {
  totalDisruptionPercentage: string;
  franchiseDisruptionPercentage: string;
  industryDisruptionPercentage: string;
}

interface CachedRuptureData {
  data: RuptureData;
  currentCycleData: RuptureData;
  historicalData: number[];
  timestamp: number;
  selectedCycle: string;
}

export default function SuppliesScreen() {
  const colorScheme = useColorScheme();

  // Função para obter horário de Brasília
  const getBrasiliaTime = () => {
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const brasiliaTime = new Date(utc + (-3 * 3600000)); // UTC-3
    return brasiliaTime;
  };

  // Função para verificar se deve carregar da API
  const shouldLoadFromAPI = (lastLoadTimestamp?: number) => {
    const brasiliaTime = getBrasiliaTime();
    const currentHour = brasiliaTime.getHours();
    const currentMinute = brasiliaTime.getMinutes();
    
    // Horários de carregamento: 8:30 e 12:00
    const isLoadTime = (currentHour === 8 && currentMinute >= 30) || currentHour >= 12;
    
    if (!lastLoadTimestamp) {
      return isLoadTime;
    }
    
    const lastLoadDate = new Date(lastLoadTimestamp);
    const lastLoadBrasilia = new Date(lastLoadDate.getTime() + (lastLoadDate.getTimezoneOffset() * 60000) + (-3 * 3600000));
    const lastLoadHour = lastLoadBrasilia.getHours();
    const lastLoadMinute = lastLoadBrasilia.getMinutes();
    
    // Se o último carregamento foi antes de 8:30 e agora é 8:30 ou depois
    if ((lastLoadHour < 8 || (lastLoadHour === 8 && lastLoadMinute < 30)) && 
        (currentHour === 8 && currentMinute >= 30)) {
      return true;
    }
    
    // Se o último carregamento foi antes de 12:00 e agora é 12:00 ou depois
    if (lastLoadHour < 12 && currentHour >= 12) {
      return true;
    }
    
    // Se é um novo dia
    const lastLoadDay = lastLoadBrasilia.getDate();
    const currentDay = brasiliaTime.getDate();
    if (lastLoadDay !== currentDay && isLoadTime) {
      return true;
    }
    
    return false;
  };

  // Funções de cache
  const saveCacheData = async (data: CachedRuptureData) => {
    try {
      await AsyncStorage.setItem('rupture_cache', JSON.stringify(data));
    } catch (error) {
      console.error('Erro ao salvar cache:', error);
    }
  };

  const loadCacheData = async (): Promise<CachedRuptureData | null> => {
    try {
      const cachedData = await AsyncStorage.getItem('rupture_cache');
      return cachedData ? JSON.parse(cachedData) : null;
    } catch (error) {
      console.error('Erro ao carregar cache:', error);
      return null;
    }
  };
  
  // Estados para dados de ruptura
  const [ruptureData, setRuptureData] = useState<RuptureData | null>(null);
  const [currentCycleData, setCurrentCycleData] = useState<RuptureData | null>(null);
  const [historicalData, setHistoricalData] = useState<number[]>([]);
  const [loadingRupture, setLoadingRupture] = useState(true);
  const [loadingCurrentCycle, setLoadingCurrentCycle] = useState(true);
  const [loadingHistorical, setLoadingHistorical] = useState(true);
  const [historicalProgress, setHistoricalProgress] = useState(0);
  const [selectedCycle, setSelectedCycle] = useState('07');
  const [showCycleSelector, setShowCycleSelector] = useState(false);
  const [bearerToken, setBearerToken] = useState<string>('');
  const [loadingToken, setLoadingToken] = useState(true);
  const [token, setToken] = useState<string | null>(null);
  const [dataSource, setDataSource] = useState<'cache' | 'api' | null>(null);

  const cycles = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];

  const fetchBearerToken = async () => {
    try {
      setLoadingToken(true);
      const response = await fetch('https://api.grupoginseng.com.br/tokens');
      const data: TokenResponse = await response.json();
      
      if (data.data && data.data.length > 0) {
        const token = data.data[0].token;
        setToken(token);
        setBearerToken(token);
      }
    } catch (error) {
      console.error('Erro ao carregar token:', error);
    } finally {
      setLoadingToken(false);
    }
  };

  // Função principal para carregar dados de ruptura (com cache)
  const loadRuptureData = async () => {
    try {
      // Primeiro tenta carregar do cache
      const cachedData = await loadCacheData();
      
      if (cachedData && !shouldLoadFromAPI(cachedData.timestamp)) {
        console.log('Carregando dados do cache...');
        setRuptureData(cachedData.data);
        setCurrentCycleData(cachedData.currentCycleData);
        setHistoricalData(cachedData.historicalData);
        setSelectedCycle(cachedData.selectedCycle);
        setLoadingRupture(false);
        setLoadingCurrentCycle(false);
        setLoadingHistorical(false);
        setDataSource('cache');
        return;
      }

      // Se deve carregar da API
      console.log('Carregando dados da API...');
      const [ruptureResult, currentCycleResult, historicalResult] = await Promise.all([
        fetchRuptureData(),
        fetchCurrentCycleData(),
        fetchHistoricalData()
      ]);

      // Salvar no cache se todos os dados foram carregados com sucesso
      if (ruptureResult && currentCycleResult && historicalResult) {
        const cacheData: CachedRuptureData = {
          data: ruptureResult,
          currentCycleData: currentCycleResult,
          historicalData: historicalResult,
          timestamp: Date.now(),
          selectedCycle: selectedCycle
        };
        await saveCacheData(cacheData);
        console.log('Dados salvos no cache com sucesso!');
        setDataSource('api');
      }

    } catch (error) {
      console.error('Erro ao carregar dados de ruptura:', error);
    }
  };

  const fetchRuptureData = async () => {
    try {
      setLoadingRupture(true);
      
      const response = await fetch('https://backend-dashboards.prd.franqueado.grupoboticario.digital/disruption-by-period?years=2025&pillars=Todos&startCurrentCycle=202501&endCurrentCycle=202517&startPreviousCycle=202401&endPreviousCycle=202407&startCurrentDate=2024-12-26&endCurrentDate=2025-05-25&startPreviousDate=2023-12-26&endPreviousDate=2024-05-26&calendarType=cycle&previousPeriodCycleType=retail-year&previousPeriodCalendarType=retail-year&hour=00:00+-+23:00&separationType=businessDays', {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'authorization': bearerToken,
          'content-security-policy': 'default-src https:',
          'cp-code': '10269',
          'dash-view-name': 'direct-sales-rupture',
          'origin': 'https://extranet.grupoboticario.com.br',
          'priority': 'u=1, i',
          'referer': 'https://extranet.grupoboticario.com.br/',
          'revenue-type': 'gross-revenue',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
          'x-api-key': '8V5pUI1u1y3dFASezqZYY6iZvkUXDHZO6Ol66ja5'
        }
      });
      const data = await response.json();
      setRuptureData(data.data);
      return data.data;
    } catch (error) {
      console.error('Erro ao buscar dados de ruptura:', error);
      return null;
    } finally {
      setLoadingRupture(false);
    }
  };

  const fetchCurrentCycleData = async () => {
    try {
      setLoadingCurrentCycle(true);
      
      const response = await fetch(`https://backend-dashboards.prd.franqueado.grupoboticario.digital/disruption-by-period?years=2025&pillars=Todos&startCurrentCycle=2025${selectedCycle}&endCurrentCycle=2025${selectedCycle}&startPreviousCycle=202407&endPreviousCycle=202407&startCurrentDate=2025-05-12&endCurrentDate=2025-05-25&startPreviousDate=2024-05-13&endPreviousDate=2024-05-26&calendarType=cycle&previousPeriodCycleType=retail-year&previousPeriodCalendarType=retail-year&hour=00:00+-+23:00&separationType=businessDays`, {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
          'authorization': bearerToken,
          'content-security-policy': 'default-src https:',
          'cp-code': '10269',
          'dash-view-name': 'direct-sales-rupture',
          'origin': 'https://extranet.grupoboticario.com.br',
          'priority': 'u=1, i',
          'referer': 'https://extranet.grupoboticario.com.br/',
          'revenue-type': 'gross-revenue',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
          'x-api-key': '8V5pUI1u1y3dFASezqZYY6iZvkUXDHZO6Ol66ja5'
        }
      });
      const data = await response.json();
      setCurrentCycleData(data.data);
      return data.data;
    } catch (error) {
      console.error('Erro ao buscar dados do ciclo atual:', error);
      return null;
    } finally {
      setLoadingCurrentCycle(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      setLoadingHistorical(true);
      setHistoricalProgress(0);
      
      const cycles = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];
      const results: number[] = [];
      const totalCycles = cycles.length;

      setHistoricalProgress(5);

      for (let i = 0; i < cycles.length; i++) {
        const cycle = cycles[i];
        try {
          const progressBefore = 5 + (i / totalCycles) * 85;
          setHistoricalProgress(progressBefore);

          const response = await fetch(`https://backend-dashboards.prd.franqueado.grupoboticario.digital/disruption-by-period?years=2025&pillars=Todos&startCurrentCycle=2025${cycle}&endCurrentCycle=2025${cycle}&startPreviousCycle=202407&endPreviousCycle=202407&startCurrentDate=2025-05-12&endCurrentDate=2025-05-25&startPreviousDate=2024-05-13&endPreviousDate=2024-05-26&calendarType=cycle&previousPeriodCycleType=retail-year&previousPeriodCalendarType=retail-year&hour=00:00+-+23:00&separationType=businessDays`, {
            headers: {
              'accept': 'application/json, text/plain, */*',
              'accept-language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
              'authorization': bearerToken,
              'content-security-policy': 'default-src https:',
              'cp-code': '10269',
              'dash-view-name': 'direct-sales-rupture',
              'origin': 'https://extranet.grupoboticario.com.br',
              'priority': 'u=1, i',
              'referer': 'https://extranet.grupoboticario.com.br/',
              'revenue-type': 'gross-revenue',
              'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
              'x-api-key': '8V5pUI1u1y3dFASezqZYY6iZvkUXDHZO6Ol66ja5'
            }
          });
          
          const data = await response.json();
          const franchisePercentage = parseFloat(data.data?.franchiseDisruptionPercentage?.replace(',', '.') || '0');
          results.push(franchisePercentage);
          
          const progressAfter = 5 + ((i + 1) / totalCycles) * 85;
          setHistoricalProgress(progressAfter);
          
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`Erro ao buscar dados do ciclo ${cycle}:`, error);
          results.push(0);
          
          const progressAfter = 5 + ((i + 1) / totalCycles) * 85;
          setHistoricalProgress(progressAfter);
        }
      }

      setHistoricalProgress(95);
      setHistoricalData(results);
      setHistoricalProgress(100);
      
      await new Promise(resolve => setTimeout(resolve, 500));
      return results;
      
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      setHistoricalProgress(100);
      return [];
    } finally {
      setLoadingHistorical(false);
    }
  };

  useEffect(() => {
    fetchBearerToken();
  }, []);

  useEffect(() => {
    if (!loadingToken && token) {
      loadRuptureData();
    }
  }, [loadingToken, token]);

  // UseEffect separado para atualizar apenas os dados do ciclo específico
  useEffect(() => {
    if (!loadingToken && token) {
      fetchCurrentCycleData();
    }
  }, [selectedCycle]);

  // Verificar se o ciclo selecionado está válido após carregar dados históricos
  useEffect(() => {
    if (historicalData.length > 0) {
      // Encontrar o maior ciclo com dados válidos (> 0.1%)
      let highestValidCycle = -1;
      
      for (let i = historicalData.length - 1; i >= 0; i--) {
        if (historicalData[i] > 0.1) {
          highestValidCycle = i;
          break;
        }
      }
      
      if (highestValidCycle !== -1) {
        const validCycle = String(highestValidCycle + 1).padStart(2, '0');
        
        // Apenas atualiza se o ciclo atual está inválido ou se é o carregamento inicial
        const currentCycleIndex = parseInt(selectedCycle) - 1;
        const currentCycleData = historicalData[currentCycleIndex] || 0;
        
        if (currentCycleData <= 0.1 || selectedCycle === '07') {
          setSelectedCycle(validCycle);
        }
      } else {
        // Se nenhum ciclo tem dados válidos, manter o padrão ou primeiro disponível
        const firstValidIndex = historicalData.findIndex(data => data > 0.1);
        if (firstValidIndex !== -1) {
          const validCycle = String(firstValidIndex + 1).padStart(2, '0');
          setSelectedCycle(validCycle);
        }
      }
    }
  }, [historicalData]);

  // Componente para mostrar porcentagens
  const StaticPercentage = ({ value }: { value: string | undefined }) => {
    if (!value) {
      return (
        <Text style={[styles.ruptureValueNumber, styles.highlightedText]}>
          -
        </Text>
      );
    }
    
    return (
      <Text style={[styles.ruptureValueNumber, styles.highlightedText]}>
        {value}%
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Suprimentos</Text>
        {dataSource && (
          <View style={styles.dataSourceIndicator}>
            <Text style={styles.dataSourceText}>
              {dataSource === 'cache' ? '📱' : '🌐'}
            </Text>
          </View>
        )}
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Gráfico Histórico */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={styles.sectionTitle}>Histórico Ruptura - Causa Franqueado</Text>
          <View style={styles.chartContainer}>
            {loadingHistorical ? (
              <View style={styles.chartLoadingContainer}>
                <ProgressBar 
                  progress={historicalProgress}
                  loadingText="Carregando Histórico de Ruptura..."
                />
              </View>
            ) : (() => {
              // Filtrar apenas dados válidos (> 0.1%)
              const cycles = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];
              const filteredData: number[] = [];
              const filteredLabels: string[] = [];
              
              historicalData.forEach((value, index) => {
                if (value > 0.1) {
                  filteredData.push(value);
                  filteredLabels.push(cycles[index]);
                }
              });

              // Se não há dados válidos, mostrar mensagem
              if (filteredData.length === 0) {
                return (
                  <View style={styles.chartLoadingContainer}>
                    <Text style={styles.chartLoadingText}>Nenhum dado de ruptura disponível</Text>
                  </View>
                );
              }

              return (
                <LineChart
                  data={{
                    labels: filteredLabels,
                    datasets: [
                      {
                        data: filteredData,
                        color: (opacity = 1) => `rgba(4, 80, 107, ${opacity})`,
                        strokeWidth: 3,
                      },
                    ],
                    legend: ['% Ruptura Causa Franqueado'],
                  }}
                  width={Dimensions.get('window').width * 0.8}
                  height={200}
                  yAxisSuffix="%"
                  yAxisInterval={1}
                  chartConfig={{
                    backgroundColor: Colors.white,
                    backgroundGradientFrom: Colors.white,
                    backgroundGradientTo: Colors.white,
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(4, 80, 107, ${opacity})`,
                    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                    style: {
                      borderRadius: 16,
                    },
                    propsForDots: {
                      r: '6',
                      strokeWidth: '2',
                      stroke: '#04506B',
                      fill: '#04506B',
                    },
                    propsForBackgroundLines: {
                      strokeDasharray: '',
                      stroke: Colors.neutral[200],
                    },
                  }}
                  bezier
                  style={styles.chart}
                />
              );
            })()}
          </View>
        </Animated.View>

        {/* Resumo Ruptura */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.sectionTitle}>Resumo Ruptura</Text>
          <View style={styles.cardsContainer}>
            <View style={[styles.ruptureContainer, { backgroundColor: Colors.neutral[50] }]}>
              <View style={styles.ruptureHeader}>
                <Text style={styles.ruptureTitle}>% Ruptura Causa Franqueado (IAF)</Text>
                <View style={[styles.rupturePeriod, { backgroundColor: Colors.neutral[100] }]}>
                  <Text style={[styles.rupturePeriodText, { color: Colors.neutral[700] }]}>Período 2025</Text>
                </View>
              </View>
              <View style={styles.ruptureValues}>
                {loadingRupture ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary[500]} />
                    <Text style={styles.ruptureValue}>Carregando...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.ruptureValueRow}>
                      <Text style={styles.ruptureValueLabel}>Ruptura Total:</Text>
                      <StaticPercentage value={ruptureData?.totalDisruptionPercentage} />
                    </View>
                    <View style={[styles.ruptureValueRow, styles.highlightedRow]}>
                      <Text style={[styles.ruptureValueLabel, styles.highlightedText]}>Causa Franqueado:</Text>
                      <StaticPercentage value={ruptureData?.franchiseDisruptionPercentage} />
                    </View>
                    <View style={styles.ruptureValueRow}>
                      <Text style={styles.ruptureValueLabel}>Causa Industria:</Text>
                      <StaticPercentage value={ruptureData?.industryDisruptionPercentage} />
                    </View>
                  </>
                )}
              </View>
            </View>

            <View style={[styles.ruptureContainer, { backgroundColor: Colors.neutral[50] }]}>
              <View style={styles.ruptureHeader}>
                <Text style={styles.ruptureTitle}>% Ruptura Causa Franqueado (IAF)</Text>
                <TouchableOpacity 
                  style={[styles.rupturePeriod, { backgroundColor: Colors.neutral[100] }]}
                  onPress={() => setShowCycleSelector(true)}
                >
                  <Text style={[styles.rupturePeriodText, { color: Colors.neutral[700] }]}>
                    Ciclo {selectedCycle} ▼
                  </Text>
                </TouchableOpacity>
              </View>
              <View style={styles.ruptureValues}>
                {loadingCurrentCycle ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color={Colors.primary[500]} />
                    <Text style={styles.ruptureValue}>Carregando...</Text>
                  </View>
                ) : (
                  <>
                    <View style={styles.ruptureValueRow}>
                      <Text style={styles.ruptureValueLabel}>Ruptura Total:</Text>
                      <StaticPercentage value={currentCycleData?.totalDisruptionPercentage} />
                    </View>
                    <View style={[styles.ruptureValueRow, styles.highlightedRow]}>
                      <Text style={[styles.ruptureValueLabel, styles.highlightedText]}>Causa Franqueado:</Text>
                      <StaticPercentage value={currentCycleData?.franchiseDisruptionPercentage} />
                    </View>
                    <View style={styles.ruptureValueRow}>
                      <Text style={styles.ruptureValueLabel}>Causa Industria:</Text>
                      <StaticPercentage value={currentCycleData?.industryDisruptionPercentage} />
                    </View>
                  </>
                )}
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Modal de Seleção de Ciclo */}
      <Modal
        visible={showCycleSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCycleSelector(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowCycleSelector(false)}
        >
          <View style={styles.cycleModalContent}>
            <View style={styles.cycleModalHeader}>
              <Text style={styles.cycleModalTitle}>Selecionar Ciclo</Text>
              <TouchableOpacity 
                onPress={() => setShowCycleSelector(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={cycles}
              numColumns={4}
              renderItem={({ item, index }) => {
                const cycleData = historicalData[index] || 0;
                const isDisabled = cycleData <= 0.1;
                
                return (
                  <TouchableOpacity
                    style={[
                      styles.cycleOption,
                      selectedCycle === item && styles.selectedCycle,
                      isDisabled && styles.disabledCycle
                    ]}
                    onPress={() => {
                      if (!isDisabled) {
                        setSelectedCycle(item);
                        setShowCycleSelector(false);
                      }
                    }}
                    disabled={isDisabled}
                  >
                    <Text style={[
                      styles.cycleOptionText,
                      selectedCycle === item && styles.selectedCycleText,
                      isDisabled && styles.disabledCycleText
                    ]}>
                      {item}
                    </Text>
                  </TouchableOpacity>
                );
              }}
              keyExtractor={(item) => item}
              contentContainerStyle={styles.cycleGrid}
            />
          </View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#04506B',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.white,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
    marginBottom: 16,
    marginTop: 8,
  },
  chartContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  chartLoadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartLoadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[600],
    marginTop: 8,
  },
  chart: {
    borderRadius: 16,
  },
  cardsContainer: {
    gap: 16,
  },
  ruptureContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: Platform.OS === 'android' ? 4 : 0,
  },
  ruptureHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  ruptureTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.neutral[900],
    flex: 1,
  },
  rupturePeriod: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rupturePeriodText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
  },
  ruptureValues: {
    gap: 12,
  },
  ruptureValueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  ruptureValueLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[600],
  },
  ruptureValueNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.neutral[900],
  },
  ruptureValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[900],
  },
  highlightedRow: {
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    padding: 12,
    marginVertical: 4,
  },
  highlightedText: {
    color: Colors.neutral[900],
    fontWeight: 'bold',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cycleModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  cycleModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  cycleModalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.neutral[900],
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.neutral[600],
  },
  cycleOption: {
    width: 60,
    height: 40,
    margin: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedCycle: {
    borderColor: Colors.primary[500],
    backgroundColor: Colors.primary[50],
  },
  cycleOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  selectedCycleText: {
    color: Colors.primary[500],
    fontFamily: 'Inter-SemiBold',
  },
  cycleGrid: {
    padding: 10,
  },
  disabledCycle: {
    backgroundColor: Colors.neutral[50],
    borderColor: Colors.neutral[300],
    opacity: 0.5,
  },
  disabledCycleText: {
    color: Colors.neutral[400],
  },
  dataSourceIndicator: {
    marginLeft: 8,
  },
  dataSourceText: {
    fontSize: 16,
  },
}); 