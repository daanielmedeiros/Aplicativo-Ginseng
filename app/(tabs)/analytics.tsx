import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, ChevronRight, ChartBar as BarChart2, TrendingUp, Users, DollarSign, Package } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { CommonStyles } from '@/constants/Styles';
import { PerformanceMetric } from '@/components/PerformanceMetric';

const timeFrames = ['Hoje', 'Esta semana', 'Este mês', 'Este ano'];

export default function AnalyticsScreen() {
  const [selectedTimeFrame, setSelectedTimeFrame] = useState('Este mês');
  const [timeFrameDropdownOpen, setTimeFrameDropdownOpen] = useState(false);
  const [selectedStore, setSelectedStore] = useState('Todas as lojas');
  const [storeDropdownOpen, setStoreDropdownOpen] = useState(false);
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Análises</Text>
      </View>
      
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.filtersContainer}>
          <View style={styles.filterDropdown}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => {
                setTimeFrameDropdownOpen(!timeFrameDropdownOpen);
                if (storeDropdownOpen) setStoreDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownButtonText}>{selectedTimeFrame}</Text>
              <ChevronDown size={18} color={Colors.neutral[600]} />
            </TouchableOpacity>
            
            {timeFrameDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {timeFrames.map((timeFrame) => (
                  <TouchableOpacity
                    key={timeFrame}
                    style={[
                      styles.dropdownMenuItem,
                      selectedTimeFrame === timeFrame && styles.dropdownMenuItemActive
                    ]}
                    onPress={() => {
                      setSelectedTimeFrame(timeFrame);
                      setTimeFrameDropdownOpen(false);
                    }}
                  >
                    <Text 
                      style={[
                        styles.dropdownMenuItemText,
                        selectedTimeFrame === timeFrame && styles.dropdownMenuItemTextActive
                      ]}
                    >
                      {timeFrame}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
          
          <View style={styles.filterDropdown}>
            <TouchableOpacity 
              style={styles.dropdownButton}
              onPress={() => {
                setStoreDropdownOpen(!storeDropdownOpen);
                if (timeFrameDropdownOpen) setTimeFrameDropdownOpen(false);
              }}
            >
              <Text style={styles.dropdownButtonText}>{selectedStore}</Text>
              <ChevronDown size={18} color={Colors.neutral[600]} />
            </TouchableOpacity>
            
            {storeDropdownOpen && (
              <View style={styles.dropdownMenu}>
                {['Todas as lojas', 'CD - 20998', 'Pitanguinha - 20996', 'Antares - 20996'].map((store) => (
                  <TouchableOpacity
                    key={store}
                    style={[
                      styles.dropdownMenuItem,
                      selectedStore === store && styles.dropdownMenuItemActive
                    ]}
                    onPress={() => {
                      setSelectedStore(store);
                      setStoreDropdownOpen(false);
                    }}
                  >
                    <Text 
                      style={[
                        styles.dropdownMenuItemText,
                        selectedStore === store && styles.dropdownMenuItemTextActive
                      ]}
                    >
                      {store}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>
        
        <Animated.View entering={FadeIn.duration(400)} style={styles.metricsContainer}>
          <Text style={styles.sectionTitle}>Métricas de performance</Text>
          
          <View style={styles.metricsGrid}>
            <PerformanceMetric 
              title="Vendas"
              value="R$ 156.780"
              change="+12.5%"
              isPositive={true}
              icon={<DollarSign size={24} color={Colors.primary[500]} />}
              backgroundColor={Colors.primary[50]}
            />
            
            <PerformanceMetric 
              title="Base Revendedores"
              value="2.345"
              change="+5.2%"
              isPositive={true}
              icon={<Users size={24} color={Colors.accent[500]} />}
              backgroundColor={Colors.accent[50]}
            />
            
            <PerformanceMetric 
              title="Produtos vendidos"
              value="5.678"
              change="+8.1%"
              isPositive={true}
              icon={<Package size={24} color={Colors.info[500]} />}
              backgroundColor={Colors.info[50]}
            />
            
            <PerformanceMetric 
              title="Ticket médio"
              value="R$ 67,50"
              change="-2.3%"
              isPositive={false}
              icon={<TrendingUp size={24} color={Colors.warning[500]} />}
              backgroundColor={Colors.warning[50]}
            />
          </View>
        </Animated.View>
        
        <View style={styles.chartContainer}>
          <View style={styles.chartHeader}>
            <Text style={styles.sectionTitle}>Vendas comparativas</Text>
            <TouchableOpacity style={styles.periodSelector}>
              <Text style={styles.periodSelectorText}>Mensal</Text>
              <ChevronDown size={16} color={Colors.primary[500]} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.chartPlaceholder}>
            <BarChart2 size={40} color={Colors.neutral[300]} />
            <Text style={styles.chartPlaceholderText}>Gráfico comparativo de vendas</Text>
          </View>
        </View>
        
        <View style={styles.reportsContainer}>
          <Text style={styles.sectionTitle}>Relatórios</Text>
          
          <TouchableOpacity style={styles.reportCard}>
            <View style={[styles.reportIconContainer, { backgroundColor: Colors.primary[50] }]}>
              <BarChart2 size={24} color={Colors.primary[500]} />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Relatório de vendas</Text>
              <Text style={styles.reportDescription}>Análise detalhada de vendas por período</Text>
            </View>
            <ChevronRight size={20} color={Colors.neutral[400]} />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.reportCard}>
            <View style={[styles.reportIconContainer, { backgroundColor: Colors.accent[50] }]}>
              <Package size={24} color={Colors.accent[500]} />
            </View>
            <View style={styles.reportInfo}>
              <Text style={styles.reportTitle}>Relatório de estoque</Text>
              <Text style={styles.reportDescription}>Análise de rotatividade de produtos</Text>
            </View>
            <ChevronRight size={20} color={Colors.neutral[400]} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.neutral[900],
  },
  scrollContainer: {
    flex: 1,
  },
  filtersContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    zIndex: 1000,
    padding: 16,
    paddingBottom: 8,
  },
  filterDropdown: {
    width: '48%',
    zIndex: 1000,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[800],
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 8,
    marginTop: 4,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 1000,
  },
  dropdownMenuItem: {
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  dropdownMenuItemActive: {
    backgroundColor: Colors.primary[50],
  },
  dropdownMenuItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[700],
  },
  dropdownMenuItemTextActive: {
    color: Colors.primary[500],
    fontFamily: 'Inter-Medium',
  },
  metricsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
    marginBottom: 16,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chartContainer: {
    padding: 16,
    marginTop: 8,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  periodSelector: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodSelectorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary[500],
    marginRight: 4,
  },
  chartPlaceholder: {
    height: 220,
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  chartPlaceholderText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[500],
    marginTop: 8,
  },
  reportsContainer: {
    padding: 16,
  },
  reportCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  reportIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  reportInfo: {
    flex: 1,
  },
  reportTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  reportDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[500],
  },
});