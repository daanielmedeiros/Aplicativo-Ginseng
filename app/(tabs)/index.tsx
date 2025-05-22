import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator 
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart2, LogOut, Search, TrendingUp, TrendingDown, Package, Archive, Truck, ChevronRight, Store } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { CommonStyles } from '@/constants/Styles';
import { DashboardCard } from '@/components/DashboardCard';
import { TopSellingProducts } from '@/components/TopSellingProducts';
import { router } from 'expo-router';

interface TopSellingProduct {
  code: string;
  name: string;
  image: string;
  totalSales: number;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [loading, setLoading] = useState(true);
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  const [stores, setStores] = useState<string[]>([]);

  const getFormattedDate = () => {
    const date = new Date();
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const diaSemana = diasSemana[date.getDay()];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    
    return `${diaSemana}, ${dia} de ${mes}`;
  };

  const handleLogout = () => {
    // Aqui você pode adicionar lógica adicional de logout se necessário
    router.replace('/(auth)/login');
  };

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        await loadStores();
      } catch (error) {
        console.error('Erro ao inicializar a tela:', error);
        // Aqui você pode adicionar um estado para mostrar uma mensagem de erro na UI
      }
    };

    initializeScreen();
  }, []);

  const loadStores = async () => {
    try {
      const specificStores = ['20998', '20997', '20996'];
      setStores(specificStores);
      await loadTopSellingProducts(specificStores);
    } catch (error) {
      console.error('Erro ao buscar lojas:', error);
      throw error; // Propaga o erro para ser tratado no nível superior
    }
  };

  const loadTopSellingProducts = async (storeList: string[]) => {
    try {
      setLoading(true);
      const salesMap = new Map<string, { name: string; image: string; totalSales: number }>();

      // Carregar dados dos 3 PDVs específicos
      for (const store of storeList) {
        const response = await fetch(`https://api-final-s3hq.onrender.com/files/${store}`);
        const data = await response.json();
        const products = data.data?.products || [];

        // Somar as vendas para cada produto
        products.forEach((product: any) => {
          const code = product.code;
          const currentSales = Number(product.sales?.currentCycleSales || 0);
          
          if (salesMap.has(code)) {
            const existing = salesMap.get(code)!;
            salesMap.set(code, {
              ...existing,
              totalSales: existing.totalSales + currentSales
            });
          } else {
            salesMap.set(code, {
              name: product.description || '',
              image: `https://vdchatbotapi-resources.grupoboticario.com.br/products/${code}.png`,
              totalSales: currentSales
            });
          }
        });
      }

      // Converter para array e ordenar por vendas
      const sortedProducts = Array.from(salesMap.entries())
        .map(([code, data]) => ({
          code,
          ...data
        }))
        .sort((a, b) => b.totalSales - a.totalSales)
        .slice(0, 10);

      setTopSellingProducts(sortedProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos mais vendidos:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarContainer}>
            <Image
              source={require('@/assets/images/eu.jpg')}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>Olá, Daniel</Text>
            <Text style={styles.date}>{getFormattedDate()}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconButton}>
            <Search size={22} color={Colors.neutral[700]} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <LogOut size={22} color={Colors.neutral[700]} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <Text style={styles.sectionTitle}>Resumo geral</Text>
          <View style={styles.cardsContainer}>
            <DashboardCard 
              title="Vendas hoje"
              value="R$ 24.532"
              change="+12.5%"
              isPositive={true}
              icon={<TrendingUp size={20} color={Colors.success[500]} />}
              backgroundColor={Colors.success[50]}
            />
            <DashboardCard 
              title="% Ruptura Causa Franqueado (IAF)"
              value="3,64%"
              change="+0,86%"
              isPositive={true}
              icon={<TrendingUp size={20} color={Colors.success[500]} />}
              backgroundColor={Colors.success[50]}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.sectionTitle}>Atividades recentes</Text>
          <View style={styles.activitiesContainer}>
            <TouchableOpacity style={styles.activityCard}>
              <View style={[styles.activityIconContainer, { backgroundColor: Colors.primary[50] }]}>
                <Package size={20} color={Colors.primary[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Novo estoque</Text>
                <Text style={styles.activityDescription}>84 produtos adicionados</Text>
              </View>
              <Text style={styles.activityTime}>13:45</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.activityCard}>
              <View style={[styles.activityIconContainer, { backgroundColor: Colors.accent[50] }]}>
                <Archive size={20} color={Colors.accent[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Inventário atualizado</Text>
                <Text style={styles.activityDescription}>Loja Flamboyant #23</Text>
              </View>
              <Text style={styles.activityTime}>11:20</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.activityCard}>
              <View style={[styles.activityIconContainer, { backgroundColor: Colors.info[50] }]}>
                <Truck size={20} color={Colors.info[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Pedido enviado</Text>
                <Text style={styles.activityDescription}>Perfumes linha Make B.</Text>
              </View>
              <Text style={styles.activityTime}>09:30</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <View style={styles.topSellingHeader}>
            <Text style={styles.sectionTitle}>Mais vendidos</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/inventory')}>
              <Text style={styles.viewAllText}>Ver todos</Text>
            </TouchableOpacity>
          </View>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={Colors.primary[500]} />
            </View>
          ) : (
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.topSellingContainer}
            >
              {topSellingProducts.map((product, index) => (
                <TouchableOpacity 
                  key={product.code}
                  style={styles.topSellingItem}
                  onPress={() => router.push({
                    pathname: '/(tabs)/inventory',
                    params: { selectedProduct: product.code }
                  })}
                >
                  <Image 
                    source={{ uri: product.image }} 
                    style={styles.topSellingImage}
                  />
                  <Text style={styles.topSellingName} numberOfLines={2}>
                    {product.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>
        
        <Animated.View entering={FadeInDown.duration(400).delay(400)} style={styles.statsContainer}>
          <View style={styles.statsHeader}>
            <Text style={styles.sectionTitle}>Desempenho da loja</Text>
            <View style={styles.statsActions}>
              <TouchableOpacity style={styles.statsPeriodButton}>
                <Text style={styles.statsPeriodButtonText}>Hoje</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.statsPeriodButton, styles.statsPeriodButtonActive]}>
                <Text style={[styles.statsPeriodButtonText, styles.statsPeriodButtonTextActive]}>Semana</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.statsPeriodButton}>
                <Text style={styles.statsPeriodButtonText}>Mês</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.chartPlaceholder}>
            <BarChart2 size={40} color={Colors.neutral[300]} />
            <Text style={styles.chartPlaceholderText}>Gráfico de desempenho semanal</Text>
          </View>
        </Animated.View>
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.neutral[900],
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[500],
    marginTop: 4,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
    backgroundColor: Colors.neutral[100],
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: Colors.primary[500],
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.neutral[900],
    marginTop: 24,
    marginBottom: 16,
  },
  cardsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  activitiesContainer: {
    marginBottom: 8,
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  activityDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[500],
    marginTop: 4,
  },
  activityTime: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[500],
  },
  topSellingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  viewAllText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary[500],
  },
  statsContainer: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    marginBottom: 24,
  },
  statsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  statsActions: {
    flexDirection: 'row',
    backgroundColor: Colors.neutral[200],
    borderRadius: 8,
    padding: 4,
  },
  statsPeriodButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  statsPeriodButtonActive: {
    backgroundColor: Colors.white,
  },
  statsPeriodButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[600],
  },
  statsPeriodButtonTextActive: {
    color: Colors.primary[500],
  },
  chartPlaceholder: {
    height: 200,
    backgroundColor: Colors.white,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chartPlaceholderText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[500],
    marginTop: 8,
  },
  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSellingContainer: {
    paddingRight: 16,
  },
  topSellingItem: {
    width: 160,
    marginRight: 16,
  },
  topSellingImage: {
    width: 160,
    height: 160,
    borderRadius: 8,
    marginBottom: 8,
  },
  topSellingName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[900],
    marginTop: 8,
  },
});