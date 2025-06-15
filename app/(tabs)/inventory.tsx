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
import { CachedImage } from '@/components/CachedImage';

const categories = [
  { id: 'all', name: 'Todos' },
  { id: 'CUIDADOS COM A PELE', name: 'CUIDADOS COM A PELE' },
  { id: 'HOME CARE', name: 'HOME CARE' },
  { id: 'DESODORANTES', name: 'DESODORANTES' },
  { id: 'MAQUIAGEM', name: 'MAQUIAGEM' },
  { id: 'GIFTS', name: 'GIFTS' },
  { id: 'OLEOS', name: 'ÓLEOS' },
  { id: 'CUIDADOS FACIAIS', name: 'CUIDADOS FACIAIS' },
  { id: 'UNHAS', name: 'UNHAS' },
  { id: 'SOLAR', name: 'SOLAR' },
  { id: 'CUIDADOS PETS', name: 'CUIDADOS PETS' },
  { id: 'SUPORTE A VENDA', name: 'SUPORTE A VENDA' },
  { id: 'CUIDADOS COM A BARBA', name: 'CUIDADOS COM A BARBA' },
  { id: 'PERFUMARIA', name: 'PERFUMARIA' },
  { id: 'INFANTIL', name: 'INFANTIL' },
  { id: 'CABELOS', name: 'CABELOS' },
  { id: 'EMBALAGENS', name: 'EMBALAGENS' },
  { id: 'SABONETE CORPO', name: 'SABONETE CORPO' },
  { id: 'ACESSORIOS', name: 'ACESSÓRIOS' }
].sort((a, b) => {
  // Mantém 'Todos' sempre no início
  if (a.id === 'all') return -1;
  if (b.id === 'all') return 1;
  // Ordena o resto por ordem alfabética
  return a.name.localeCompare(b.name);
});

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
  promotions: { description: string; discountPercent: string }[];
  launch: string;
  brandGroupCode: string;
  critico: string;
}

interface Store {
  name: string;
  code: string;
  displayName: string;
}

interface PDVResponse {
  pdvs: number[];
  total: number;
}

interface InventoryResponse {
  data: InventoryItemType[];
  total: number;
  pagina_atual: number;
  total_paginas: number;
}



const lojasMap: { [key: string]: string } = {
  "12522": "MACEIO SHOP EXPANSAO",
  "12829": "JACINTINHO",
  "20005": "LJ CANDEIAS CIMA",
  "20006": "SAO SEBASTIAO",
  "20009": "CANDEIAS BAIXO",
  "20056": "SIMOES FILHO",
  "20858": "SUPER GIRO",
  "21068": "ATAKAREJO SIMOES FILHO",
  "21624": "MIX MATEUS",
  "21647": "CARAJAS",
  "21007": "TÔ QUE TÔ",
  "12818": "GB SERRARIA",
  "12824": "GB TABULEIRO",
  "12838": "RIO LARGO",
  "20988": "HIB QUEIMADAS",
  "21000": "HIB SANTALUZ",
  "21375": "IPIRA HB",
  "21381": "CAPIM GROSSO LJ",
  "21383": "CAPIM GROSSO ER VD",
  "14668": "HIPER ANTARES",
  "20007": "MADRE DE DEUS",
  "21382": "MAIRI",
  "22548": "ER CAMPO ALEGRE",
  "12817": "SHOPPING PATIO",
  "20970": "ER SAO SEBASTIAO",
  "20993": "ER CANDEIAS",
  "20996": "ER ANTARES",
  "20997": "ER PITANGUINHA",
  "22541": "ER RIO LARGO",
  "910173": "QDB PARQUE SHOPPING",
  "910291": "QDB MACEIO SHOPPING",
  "14617": "PARQUE SHOPPING",
  "20969": "HIB MARECHAL DEODORO",
  "20986": "HIB OLINDINA",
  "20991": "HIB CAMPO ALEGRE",
  "20994": "ER SIMOES FILHO",
  "21001": "HIB RIO REAL",
  "21278": "VD SOCORRO",
  "21495": "VD BARRA DOS COQUEIROS",
  "3546": "HIPER FAROL",
  "12823": "PONTA VERDE",
  "13427": "SHOPPING CIDADE",
  "19103": "UNICOMPRA PONTA VERDE",
  "20968": "HIB ITABAIANINHA",
  "20989": "HIB ENTRE RIOS",
  "20992": "ER CONCEICAO COITE",
  "20995": "ER LAGARTO",
  "20999": "HIB ESPLANADA",
  "4560": "MACEIO SHOP TERREO",
  "12820": "MARIO DE GUSMAO",
  "12826": "ASSAI MANGABEIRAS",
  "12828": "GB STELLA MARIS",
  "12830": "LIVRAMENTO",
  "20057": "CONCEICAO DO COITE",
  "20441": "LAGARTO",
  "21277": "GBARBOSA SOCORRO",
  "21296": "SHOPPING PREMIO SOCORRO",
  "5699": "MOREIRA LIMA",
  "20998": "CD SERRARIA",
  "23665": "LJ BOULEVARD SHOPPING",
  "23712": "HIB CANDIDO SALES",
  "23705": "QUIOSQUE SHOPPING CONQUISTA",
  "23711": "ER VITORIA DA CONQUISTA",
  "23704": "ER CONDEUBA",
  "23707": "LJ BAIRRO BRASIL",
  "23702": "LJ GALERIA PANVICON",
  "23703": "ER BARRA DO CHOCA",
  "23713": "LJ RUA ZEFERINO CORREIA",
  "23708": "LJ BARRA DO CHOCA",
  "23706": "LJ ASSAI VITORIA DA CONQUIS",
  "23701": "LJ PRACA 9 DE NOVEMBRO",
  "23709": "LJ SHOPPING CONQUISTA SUL",
  "23475": "MIX MATEUS N"
};

export default function InventoryScreen() {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [storeFilter, setStoreFilter] = useState('Selecione um PDV');
  const [storeFilterDisplay, setStoreFilterDisplay] = useState('Selecione um PDV');
  const [inventoryData, setInventoryData] = useState<InventoryItemType[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [showStoreSelector, setShowStoreSelector] = useState(false);
  const [storeSearchQuery, setStoreSearchQuery] = useState('');
  const [showBrandSelector, setShowBrandSelector] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState('Todas as Marcas');
  const [selectedCritical, setSelectedCritical] = useState('Todos os Itens');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [currentCycle, setCurrentCycle] = useState('');
  const [selectedLaunch, setSelectedLaunch] = useState('Todos os Lançamentos');

  // Função para processar descontos que podem vir com múltiplos valores
  const processDiscountPercent = (discountValue: any): string => {
    if (!discountValue) return '0%';
    
    // Converter para string para processar
    const discountStr = String(discountValue).trim();
    
    // Se contém "|", é múltiplos valores
    if (discountStr.includes('|')) {
      const values = discountStr
        .split('|')
        .map(val => Number(val.trim()))
        .filter(val => !isNaN(val) && val > 0);
      
      // Retornar todos os valores formatados como "18%, 17%"
      return values.length > 0 
        ? values.map(val => `${val}%`).join(', ')
        : '0%';
    }
    
    // Se é um valor único, converter e formatar
    const singleValue = Number(discountStr);
    return !isNaN(singleValue) ? `${singleValue}%` : '0%';
  };

  // Função para carregar os produtos do PDV selecionado
  const loadInventoryData = async (pdvCode: string) => {
    try {
      setLoading(true);
      let allProducts: InventoryItemType[] = [];
      let currentPage = 1;
      let totalPages = 1;

      // Primeira requisição para obter o total de páginas
      console.log(`🔍 Iniciando carregamento para PDV: ${pdvCode}`);
      const initialResponse = await fetch(`https://api.grupoginseng.com.br/tabela/draft/${pdvCode}?pagina=1`);
      const initialData: InventoryResponse = await initialResponse.json();
      totalPages = initialData.total_paginas;
      
      console.log(`📄 Total de páginas encontradas: ${totalPages}`);
      console.log(`📦 Produtos na primeira página: ${initialData.data.length}`);

      // Adiciona os produtos da primeira página
      allProducts = [...initialData.data];

      // Carrega as páginas restantes
      for (let page = 2; page <= totalPages; page++) {
        try {
          console.log(`⏳ Carregando página ${page} de ${totalPages}...`);
          const response = await fetch(`https://api.grupoginseng.com.br/tabela/draft/${pdvCode}?pagina=${page}`);
          
          if (!response.ok) {
            console.warn(`⚠️ Erro HTTP na página ${page}: ${response.status}`);
            continue;
          }
          
          const data: InventoryResponse = await response.json();
          console.log(`📦 Produtos na página ${page}: ${data.data.length}`);
          
          if (data.data && data.data.length > 0) {
            allProducts = [...allProducts, ...data.data];
          } else {
            console.warn(`⚠️ Página ${page} retornou vazia ou sem dados`);
          }
          
          // Pequeno delay para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (error) {
          console.error(`❌ Erro ao carregar página ${page}:`, error);
          // Continua para a próxima página mesmo se uma falhar
          continue;
        }
      }
      
      console.log(`✅ Carregamento completo! Total de produtos coletados: ${allProducts.length}`);
      
      // Verificação adicional: se temos o total esperado da primeira página
      if (initialData.total && allProducts.length < initialData.total * 0.8) {
        console.warn(`⚠️ ATENÇÃO: Produtos coletados (${allProducts.length}) parecem estar abaixo do esperado. Total reportado: ${initialData.total}`);
      }
      
      // Remove duplicatas baseado no código do produto
      const uniqueProducts = Array.from(new Map(allProducts.map(item => [item.code, item])).values());
      console.log(`🔄 Após remoção de duplicatas: ${uniqueProducts.length} produtos únicos`);
      
      const mappedData = uniqueProducts.map((item: any) => {
        return {
          id: `${item.code}_${item.loja_id}`, // Garante ID único combinando código e loja
          name: item.description || '',
          image: `https://sgi.e-boticario.com.br/Paginas/Imagens/Produtos/${item.code}g.jpg`,
          category: item.codcategory || 'OUTROS',
          codCategory: item.codcategory || '',
          price: `R$ ${Number(item.pricesellin || 0).toFixed(2)}`,
          quantity: Number(item.stock_actual || 0),
          status: Number(item.stock_actual || 0) > 0 ? 'Em Estoque' : 'Sem Estoque',
          salles: Number(item.currentcyclesales || 0),
          inTransit: Number(item.stock_intransit || 0),
          barcode: item.code || '',
          sku: item.code || '',
          critico: item.criticalitem_dtprovidedregularization || '',
          code: item.code || '',
          lastUpdate: new Date().toLocaleDateString('pt-BR'),
          daysWithoutSales: item.dayswithoutsales || 0,
          coverage: item.coveragedays || '',
          subcategory: item.codsubcategory || '',
          brand: item.brandgroupcode || '',
          salesCurve: item.salescurve || '',
          coverageDays: item.coveragedays || 0,
          hasCoverage: item.hascoverage || false,
          launch: item.launch && `Lançamento ${item.launch}` || '',
          promotions: item.promotions_description ? [{
            description: item.promotions_description,
            discountPercent: processDiscountPercent(item.promotions_discountpercent)
          }] : [],
          brandGroupCode: item.brandgroupcode || ''
        };
      });

      setInventoryData(mappedData);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
      setInventoryData([]);
    } finally {
      setLoading(false);
    }
  };

  // Carregar lista de PDVs
  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('https://api.grupoginseng.com.br/pdvs');
        const data: PDVResponse = await response.json();
        
        const storeList = data.pdvs.map((pdvCode) => {
          const code = pdvCode.toString();
          const storeName = lojasMap[code];
          return {
            name: `${code}.json`,
            code: code,
            displayName: storeName ? `${code} - ${storeName}` : code
          };
        });
        
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

  // Filter data based on search query, category, brand and launch
  const filteredData = inventoryData
    .filter(item => {
      const searchTerm = searchQuery.toLowerCase();
      const matchesSearch = 
        item.name.toLowerCase().includes(searchTerm) || 
        item.code.toLowerCase().includes(searchTerm);
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      const matchesBrand = selectedBrand === 'Todas as Marcas' || item.brandGroupCode === selectedBrand;
      const matchesCritical = selectedCritical === 'Todos os Itens' || 
        (selectedCritical === 'Itens Críticos' && item.critico) ||
        (selectedCritical === 'Itens Normais' && !item.critico);
      const matchesLaunch = selectedLaunch === 'Todos os Lançamentos' || 
        (item.launch && item.launch === selectedLaunch);
      return matchesSearch && matchesCategory && matchesBrand && matchesCritical && matchesLaunch;
    })
    .sort((a, b) => b.salles - a.salles);

  // Filter stores based on search query
  const filteredStores = stores
    .filter(store => {
      const searchTerm = storeSearchQuery.toLowerCase();
      const storeCode = store.code.toLowerCase();
      const storeName = lojasMap[store.code]?.toLowerCase() || '';
      return storeCode.includes(searchTerm) || storeName.includes(searchTerm);
    })
    .sort((a, b) => {
      // Extrai os números dos códigos dos PDVs
      const numA = parseInt(a.code.replace(/\D/g, ''));
      const numB = parseInt(b.code.replace(/\D/g, ''));
      return numA - numB;
    });

  const handleItemPress = (itemId: string) => {
    setExpandedItemId(expandedItemId === itemId ? null : itemId);
  };

  // Função para obter lançamentos únicos
  const getUniqueLaunches = () => {
    const launches = new Set<string>();
    inventoryData.forEach(item => {
      if (item.launch) {
        launches.add(item.launch);
      }
    });
    return Array.from(launches).sort();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Estoque</Text>
        <TouchableOpacity 
          style={[
            styles.filterButton,
            (selectedBrand !== 'Todas as Marcas' || 
             selectedCritical !== 'Todos os Itens' || 
             selectedLaunch !== 'Todos os Lançamentos') && styles.filterButtonActive
          ]}
          onPress={() => setShowBrandSelector(true)}
        >
          <SlidersHorizontal 
            size={20} 
            color={(selectedBrand !== 'Todas as Marcas' || 
                   selectedCritical !== 'Todos os Itens' || 
                   selectedLaunch !== 'Todos os Lançamentos') 
              ? Colors.white 
              : Colors.white} 
          />
        </TouchableOpacity>
      </View>

      <View style={styles.storeSelector}>
        <View style={styles.storeSelectorRow}>
          <TouchableOpacity 
            style={styles.storeSelectorButton}
            onPress={() => setShowStoreSelector(!showStoreSelector)}
          >
            <Text style={styles.storeSelectorText}>{storeFilterDisplay}</Text>
            <ChevronDown size={18} color={Colors.neutral[700]} />
          </TouchableOpacity>
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
              <View style={styles.storeSearchContainer}>
                <Search size={20} color={Colors.neutral[500]} style={styles.searchIcon} />
                <TextInput
                  style={styles.storeSearchInput}
                  placeholder="Digite aqui código ou descrição"
                  placeholderTextColor={Colors.neutral[400]}
                  value={storeSearchQuery}
                  onChangeText={setStoreSearchQuery}
                />
                {storeSearchQuery ? (
                  <TouchableOpacity 
                    style={styles.clearButton} 
                    onPress={() => setStoreSearchQuery('')}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </TouchableOpacity>
                ) : null}
              </View>
              <ScrollView 
                style={styles.storeScrollView}
                showsVerticalScrollIndicator={true}
                bounces={false}
              >
                {filteredStores.map((store, index) => (
                  <TouchableOpacity 
                    key={store.code}
                    style={[
                      styles.storeItem,
                      index === filteredStores.length - 1 && styles.lastStoreItem
                    ]}
                    onPress={() => {
                      setStoreFilter(store.code);
                      setStoreFilterDisplay(store.displayName);
                      setShowStoreSelector(false);
                      setStoreSearchQuery('');
                    }}
                  >
                    <Text style={styles.storeItemText}>{store.displayName}</Text>
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
          placeholder="Digite aqui código ou descrição"
          placeholderTextColor={Colors.neutral[400]}
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
          <View style={styles.filterModal}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filtros</Text>
              <TouchableOpacity 
                onPress={() => setShowBrandSelector(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.filterScrollView}
              showsVerticalScrollIndicator={true}
              bounces={false}
            >
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Status do Item</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption,
                      selectedCritical === 'Todos os Itens' && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setSelectedCritical('Todos os Itens');
                      setShowBrandSelector(false);
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedCritical === 'Todos os Itens' && styles.filterOptionTextActive
                    ]}>Todos os Itens</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption,
                      selectedCritical === 'Itens Críticos' && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setSelectedCritical('Itens Críticos');
                      setShowBrandSelector(false);
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedCritical === 'Itens Críticos' && styles.filterOptionTextActive
                    ]}>Itens Críticos Indústria</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption,
                      selectedCritical === 'Itens Normais' && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setSelectedCritical('Itens Normais');
                      setShowBrandSelector(false);
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedCritical === 'Itens Normais' && styles.filterOptionTextActive
                    ]}>Itens Disponíveis</Text>
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.filterDivider} />

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Marca</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption,
                      selectedBrand === 'Todas as Marcas' && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setSelectedBrand('Todas as Marcas');
                      setShowBrandSelector(false);
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedBrand === 'Todas as Marcas' && styles.filterOptionTextActive
                    ]}>Todas as Marcas</Text>
                  </TouchableOpacity>
                  {Array.from(new Set(inventoryData.map(item => item.brandGroupCode))).map((brand) => (
                    <TouchableOpacity 
                      key={brand}
                      style={[
                        styles.filterOption,
                        selectedBrand === brand && styles.filterOptionActive
                      ]}
                      onPress={() => {
                        setSelectedBrand(brand);
                        setShowBrandSelector(false);
                      }}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedBrand === brand && styles.filterOptionTextActive
                      ]}>{brand}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={styles.filterDivider} />

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Lançamentos</Text>
                <View style={styles.filterOptions}>
                  <TouchableOpacity 
                    style={[
                      styles.filterOption,
                      selectedLaunch === 'Todos os Lançamentos' && styles.filterOptionActive
                    ]}
                    onPress={() => {
                      setSelectedLaunch('Todos os Lançamentos');
                      setShowBrandSelector(false);
                    }}
                  >
                    <Text style={[
                      styles.filterOptionText,
                      selectedLaunch === 'Todos os Lançamentos' && styles.filterOptionTextActive
                    ]}>Todos os Lançamentos</Text>
                  </TouchableOpacity>
                  {getUniqueLaunches().map((launch) => (
                    <TouchableOpacity 
                      key={launch}
                      style={[
                        styles.filterOption,
                        selectedLaunch === launch && styles.filterOptionActive
                      ]}
                      onPress={() => {
                        setSelectedLaunch(launch);
                        setShowBrandSelector(false);
                      }}
                    >
                      <Text style={[
                        styles.filterOptionText,
                        selectedLaunch === launch && styles.filterOptionTextActive
                      ]}>{launch}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
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
    backgroundColor: '#04506B',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.white,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: Colors.white,
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
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    flex: 1,
  },
  storeSelectorText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[700],
    marginRight: 8,
    flex: 1,
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
    fontSize: 12,
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
    fontSize: 10,
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
    fontSize: 12,
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
    fontSize: 15,
    color: Colors.neutral[800],
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: 24,
  },
  storeList: {
    backgroundColor: Colors.white,
    borderRadius: 12,
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
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  lastStoreItem: {
    borderBottomWidth: 0,
  },
  storeItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[700],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: 80,
  },
  filterModal: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '90%',
    marginTop: 50,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  filterTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 15,
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
    fontSize: 16,
    color: Colors.neutral[700],
  },
  filterScrollView: {
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.neutral[800],
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.neutral[100],
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  filterOptionActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[700],
  },
  filterOptionTextActive: {
    color: Colors.white,
  },
  filterDivider: {
    height: 1,
    backgroundColor: Colors.neutral[100],
    marginVertical: 16,
  },
  storeSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  storeSearchInput: {
    flex: 1,
    height: 40,
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[900],
  },
});