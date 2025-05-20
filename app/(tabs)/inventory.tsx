import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Image,
  ActivityIndicator,
  ScrollView,
  Pressable,
  Modal
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronDown, Filter, Search, SlidersHorizontal } from 'lucide-react-native';
import Animated, { FadeInRight } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { CommonStyles } from '@/constants/Styles';
import { InventoryItem } from '@/components/InventoryItem';
import { mockInventoryData } from '@/data/mockData';

const categories = [
  { id: 'all', name: 'Todos' },
  { id: '10040', name: 'CUIDADOS COM A PELE' },
  { id: '10090', name: 'HOME CARE' },
  { id: '10060', name: 'DESODORANTES' },
  { id: '10110', name: 'MAQUIAGEM' },
  { id: '10080', name: 'GIFTS' },
  { id: '10120', name: 'OLEOS' },
  { id: '10050', name: 'CUIDADOS FACIAIS' },
  { id: '10170', name: 'UNHAS' },
  { id: '10150', name: 'SOLAR' },
  { id: '10190', name: 'CUIDADOS PETS' },
  { id: '10160', name: 'SUPORTE A VENDA' },
  { id: '10030', name: 'CUIDADOS COM A BARBA' },
  { id: '10130', name: 'PERFUMARIA' },
  { id: '10100', name: 'INFANTIL' },
  { id: '10020', name: 'CABELOS' },
  { id: '10070', name: 'EMBALAGENS' },
  { id: '10140', name: 'SABONETE CORPO' },
  { id: '10010', name: 'ACESSORIOS' }
];

interface InventoryItemType {
  id: string;
  name: string;
  image: string;
  category: string;
  codCategory: string;
  price: string;
  quantity: number;
  status: string;
  barcode: string;
  sku: string;
  code: string;
  lastUpdate: string;
  subcategory: string;
  brand: string;
  salesCurve: string;
  coverageDays: number;
  hasCoverage: boolean;
  salles: number;
  promotions: { description: string; discountPercent: number }[];
  launch: string;
  brandGroupCode: string;
  critico: string;
}

interface Store {
  name: string;
  code: string;
}

const categoryMapping: { [key: string]: string } = {
  "10040": "CUIDADOS COM A PELE",
  "10090": "HOME CARE",
  "10060": "DESODORANTES",
  "10110": "MAQUIAGEM",
  "10080": "GIFTS",
  "10120": "OLEOS",
  "10050": "CUIDADOS FACIAIS",
  "10170": "UNHAS",
  "10150": "SOLAR",
  "10190": "CUIDADOS PETS",
  "10160": "SUPORTE A VENDA",
  "10030": "CUIDADOS COM A BARBA",
  "10130": "PERFUMARIA",
  "10100": "INFANTIL",
  "10020": "CABELOS",
  "10070": "EMBALAGENS",
  "10140": "SABONETE CORPO",
  "10010": "ACESSORIOS"
};

export default function InventoryScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState('Selecione um PDV');
  const [inventoryData, setInventoryData] = useState<InventoryItemType[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [showBrandSelector, setShowBrandSelector] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('Todas as Marcas');
  const [selectedCritical, setSelectedCritical] = useState('Todos os Itens');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState('');

  // Função para carregar os produtos do PDV selecionado
  const loadInventoryData = async (pdvCode: string) => {
    try {
      setLoading(true);
      const response = await fetch(`https://api-final-s3hq.onrender.com/files/${pdvCode}`);
      const responseData = await response.json();
      
      // Extrai o ciclo atual
      const cycle = responseData.data?.currentCycle || '';
      setCurrentCycle(cycle);
      
      // Acessando o array de produtos dentro do objeto data
      const products = responseData.data?.products || [];
      
      const mappedData = products.map((item: any) => {
        // Formata a data do savedAt
        const savedAt = responseData.data?.savedAt || '';
        const formattedDate = savedAt ? savedAt.split(' ')[0].split('-').reverse().join('/') : '';
        
        // Filtra as promoções do ciclo atual
        const currentPromotions = item.promotions?.filter((promo: any) => 
          promo.cycle === responseData.data?.currentCycle
        ) || [];
        
        return {
          id: item.code || '',
          name: item.description || '',
          image: `https://vdchatbotapi-resources.grupoboticario.com.br/products/${item.code}.png`,
          category: categoryMapping[item.codCategory] || 'OUTROS',
          codCategory: item.codCategory || '',
          price: `R$ ${Number(item.pricesellin || 0).toFixed(2)}`,
          quantity: Number(item.stock.actual || 0),
          status: Number(item.stock.actual || 0) > 0 ? 'Em Estoque' : 'Sem Estoque',
          salles: Number(item.sales.currentCycleSales || 0),
          inTransit: Number(item.stock.inTransit || 0),
          barcode: item.code || '',
          sku: item.code || '',
          critico: item.criticalItem.dtProvidedRegularization || '',
          code: item.code || '',
          lastUpdate: formattedDate,
          daysWithoutSales: item.daysWithoutSales || 0,
          coverage: item.coverageDays || '',
          subcategory: item.codsubcategory || '',
          brand: item.brandgroupcode || '',
          salesCurve: item.salescurve || '',
          coverageDays: item.coveragedays || 0,
          hasCoverage: item.hascoverage || false,
          launch: item.launch || '',
          promotions: currentPromotions.map((promo: any) => ({
            description: promo.description,
            discountPercent: promo.discountPercent
          })),
          brandGroupCode: item.brandGroupCode || ''
        };
      });

      setInventoryData(mappedData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setInventoryData([]);
      setCurrentCycle('');
    } finally {
      setLoading(false);
    }
  };

  // Carregar lista de PDVs
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('https://api-final-s3hq.onrender.com/files/');
        const data = await response.json();
        
        const storeList = data
          .filter((file: any) => file.name.endsWith('.json'))
          .map((file: any) => ({
            name: file.name,
            code: file.name.replace('.json', '')
          }));
        
        setStores(storeList);
      } catch (error) {
        console.error('Erro ao buscar lojas:', error);
      }
    };

    fetchStores();
  }, []);

  // Carregar produtos quando um PDV for selecionado
  useEffect(() => {
    if (storeFilter !== 'Selecione um PDV') {
      loadInventoryData(storeFilter);
    }
  }, [storeFilter]);

  // Filter data based on search query, category and brand
  const filteredData = inventoryData
    .filter(item => {
      const searchTerm = searchQuery.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm) || 
        item.code.toLowerCase().includes(searchTerm);
      const matchesCategory = selectedCategory === 'all' || item.codCategory === selectedCategory;
      const matchesBrand = selectedBrand === 'Todas as Marcas' || item.brandGroupCode === selectedBrand;
      const matchesCritical = selectedCritical === 'Todos os Itens' || 
        (selectedCritical === 'Itens Críticos' && item.critico) ||
        (selectedCritical === 'Itens Normais' && !item.critico);
      return matchesSearch && matchesCategory && matchesBrand && matchesCritical;
    })
    .sort((a, b) => b.salles - a.salles);

  const handleItemPress = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Estoque</Text>
        <TouchableOpacity 
          style={styles.filterButton}
          onPress={() => setShowBrandSelector(true)}
        >
          <SlidersHorizontal size={20} color={Colors.neutral[700]} />
        </TouchableOpacity>
      </View>

      <View style={styles.storeSelector}>
        <View style={styles.storeSelectorRow}>
          <TouchableOpacity 
            style={styles.storeSelectorButton}
            onPress={() => setShowStoreSelector(!showStoreSelector)}
          >
            <Text style={styles.storeSelectorText}>{storeFilter}</Text>
            <ChevronDown size={18} color={Colors.neutral[700]} />
          </TouchableOpacity>
          
          {currentCycle && (
            <View style={styles.cycleContainer}>
              <Text style={styles.cycleText}>Ciclo Atual: {currentCycle}</Text>
            </View>
          )}
        </View>
        
        <Modal
          visible={showStoreSelector}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowStoreSelector(false)}
        >
          <Pressable 
            style={styles.modalOverlay}
            onPress={() => setShowStoreSelector(false)}
          >
            <View style={styles.storeList}>
              <ScrollView 
                style={styles.storeScrollView}
                showsVerticalScrollIndicator={true}
                bounces={false}
              >
                {stores.map((store) => (
                  <TouchableOpacity 
                    key={store.code}
                    style={styles.storeItem}
                    onPress={() => {
                      setStoreFilter(store.code);
                      setShowStoreSelector(false);
                    }}
                  >
                    <Text style={styles.storeItemText}>{store.code}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </Pressable>
        </Modal>
      </View>

      <View style={styles.searchContainer}>
        <Search size={20} color={Colors.neutral[500]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar produtos..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      <View style={styles.categoriesContainer}>
        <FlatList
          horizontal
          data={categories}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryButton,
                selectedCategory === item.id && styles.categoryButtonActive
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text 
                style={[
                  styles.categoryButtonText,
                  selectedCategory === item.id && styles.categoryButtonTextActive
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        />
      </View>

      {storeFilter === 'Selecione um PDV' ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Selecione um PDV</Text>
        </View>
      ) : loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Carregando Produtos...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
          keyExtractor={item => item.id}
          renderItem={({ item, index }) => (
            <Animated.View 
              entering={FadeInRight.duration(300).delay(index * 50)}
            >
              <InventoryItem 
                item={item} 
                expanded={expandedItemId === item.id}
                onPress={() => handleItemPress(item.id)}
              />
            </Animated.View>
          )}
          contentContainerStyle={styles.inventoryList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Image
                source={{ uri: 'https://images.pexels.com/photos/4439425/pexels-photo-4439425.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200' }}
                style={styles.emptyImage}
              />
              <Text style={styles.emptyTitle}>Nenhum produto encontrado</Text>
              <Text style={styles.emptyText}>
                Tente ajustar seus filtros ou buscar por outro termo
              </Text>
            </View>
          }
        />
      )}

      <Modal
        visible={showBrandSelector}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowBrandSelector(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowBrandSelector(false)}
        >
          <View style={styles.storeList}>
            <Text style={styles.modalTitle}>Filtros</Text>
            <ScrollView 
              style={styles.storeScrollView}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              <Text style={styles.filterSectionTitle}>Marca</Text>
              <TouchableOpacity 
                style={styles.storeItem}
                onPress={() => {
                  setSelectedBrand('Todas as Marcas');
                  setShowBrandSelector(false);
                }}
              >
                <Text style={[
                  styles.storeItemText,
                  selectedBrand === 'Todas as Marcas' && styles.selectedItemText
                ]}>Todas as Marcas</Text>
              </TouchableOpacity>
              {Array.from(new Set(inventoryData.map(item => item.brandGroupCode))).map((brand) => (
                <TouchableOpacity 
                  key={brand}
                  style={styles.storeItem}
                  onPress={() => {
                    setSelectedBrand(brand);
                    setShowBrandSelector(false);
                  }}
                >
                  <Text style={[
                    styles.storeItemText,
                    selectedBrand === brand && styles.selectedItemText
                  ]}>{brand}</Text>
                </TouchableOpacity>
              ))}

              <View style={styles.filterDivider} />

              <Text style={styles.filterSectionTitle}>Status do Item</Text>
              <TouchableOpacity 
                style={styles.storeItem}
                onPress={() => {
                  setSelectedCritical('Todos os Itens');
                  setShowBrandSelector(false);
                }}
              >
                <Text style={[
                  styles.storeItemText,
                  selectedCritical === 'Todos os Itens' && styles.selectedItemText
                ]}>Todos os Itens</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.storeItem}
                onPress={() => {
                  setSelectedCritical('Itens Críticos');
                  setShowBrandSelector(false);
                }}
              >
                <Text style={[
                  styles.storeItemText,
                  selectedCritical === 'Itens Críticos' && styles.selectedItemText
                ]}>Itens Críticos</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.storeItem}
                onPress={() => {
                  setSelectedCritical('Itens Normais');
                  setShowBrandSelector(false);
                }}
              >
                <Text style={[
                  styles.storeItemText,
                  selectedCritical === 'Itens Normais' && styles.selectedItemText
                ]}>Itens Normais</Text>
              </TouchableOpacity>
            </ScrollView>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.neutral[900],
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  storeSelector: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  storeSelectorRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  storeSelectorButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storeSelectorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 15,
    color: Colors.neutral[700],
    marginRight: 4,
  },
  cycleContainer: {
    backgroundColor: Colors.primary[50],
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cycleText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary[700],
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: Colors.neutral[500],
  },
  categoriesContainer: {
    marginTop: 16,
  },
  categoriesList: {
    paddingHorizontal: 16,
  },
  categoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.neutral[100],
    borderRadius: 20,
    marginRight: 8,
  },
  categoryButtonActive: {
    backgroundColor: Colors.primary[500],
  },
  categoryButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[700],
  },
  categoryButtonTextActive: {
    color: Colors.white,
  },
  inventoryList: {
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.neutral[700],
    marginTop: 16,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.neutral[800],
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  storeList: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '90%',
    marginTop: 50,
    maxHeight: 600,
  },
  storeScrollView: {
    maxHeight: 600,
  },
  storeItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  storeItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[700],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  filterSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.neutral[700],
    padding: 16,
    paddingBottom: 8,
  },
  filterDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: 8,
  },
  selectedItemText: {
    color: Colors.primary[700],
    fontFamily: 'Inter-SemiBold',
  },
});