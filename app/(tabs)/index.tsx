import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  ActivityIndicator,
  Linking,
  Modal,
  Pressable,
  FlatList,
  Dimensions,
  Alert,
  Platform,
  Animated as RNAnimated
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart2, LogOut, Search, TrendingUp, TrendingDown, Package, Archive, Truck, ChevronRight, Store, User, Bell, MessageSquare, UserCircle, ChevronLeft, Settings, ShieldAlert } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { LineChart } from 'react-native-chart-kit';
import Colors from '@/constants/Colors';
import { CommonStyles } from '@/constants/Styles';
import { DashboardCard } from '@/components/DashboardCard';
import { TopSellingProducts } from '@/components/TopSellingProducts';
import { CachedImage } from '@/components/CachedImage';
import { useCountAnimation } from '@/hooks/useCountAnimation';
import { router } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/contexts/AuthContext';
import ProgressBar from '@/components/ProgressBar';
import ConstellationBackground from '@/components/ConstellationBackground';
import { useFocusEffect } from '@react-navigation/native';

interface TopSellingProduct {
  code: string;
  description: string;
  image: string;
  totalSales: number;
  position: number;
  promotions: { description: string; discountPercent: string }[];
  storePromotions: { description: string; discountPercent: string }[];
  launch: string;
}

interface StorePerformance {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  id: number;
}

interface BulletinItem {
  id: number;
  title: string;
  brands: number[];
  isRead: boolean;
  publishDate: string;
}

interface BulletinResponse {
  pagination: {
    currentPage: number;
    itemsPerPage: number;
    totalPages: number;
    totalItems: number;
  };
  items: BulletinItem[];
}

interface NotaFiscal {
  chave: string;
  cnf: string;
  cnpj_destinatario: string;
  cnpj_emissor: string;
  data_emissao: string;
  nome_emissor: string;
  numero_fatura: string;
  serie: string;
  situacao: string;
  valor_liquido: string;
  valor_total_produtos: string;
}

interface NotasFiscaisResponse {
  data: NotaFiscal[];
  total: number;
  pagina_atual: number;
  total_paginas: number;
}

interface RecentActivity {
  id: string;
  cnpj: string;
  dataEmissao: string;
  previsaoEntrega: string;
  numeroFatura: string;
  lojaInfo: string; // Código e nome da loja
}

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

type AvatarKey = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

const avatarImages: Record<AvatarKey, any> = {
  1: require('@/assets/images/avatar/avatar1.png'),
  2: require('@/assets/images/avatar/avatar2.png'),
  3: require('@/assets/images/avatar/avatar3.png'),
  4: require('@/assets/images/avatar/avatar4.png'),
  5: require('@/assets/images/avatar/avatar5.png'),
  6: require('@/assets/images/avatar/avatar6.png'),
  7: require('@/assets/images/avatar/avatar7.png'),
  8: require('@/assets/images/avatar/avatar8.png'),
  9: require('@/assets/images/avatar/avatar9.png'),
};

const defaultAvatar = require('@/assets/images/avatar/padrao.png');

interface BestSellerResponse {
  bestsellers: {
    code: string;
    descricao: string;
    vendas: number;
  }[];
}

interface InventoryItemType {
  code: string;
  description: string;
  promotions_description?: string;
  promotions_discountpercent?: any;
  launch?: string;
}

// Mapeamento de CNPJs para informações das lojas
const cnpjToLojaMap: Record<string, string> = {
  '08489643000352': '4494 - ESCRITÓRIO MATRIZ',
  '08489643000314': '3546 - LJ BIG BOMPREÇO GRUTA',
  '08489643000403': '4560 - LJ MACEIÓ SHOPPING TERREO',
  '08489643000586': '5699 - LJ MOREIRA LIMA',
  '08489643001639': '12522 - LJ MACEIÓ SHOPPING EXPANSÃO',
  '08489643002015': '12817 - LJ SHOPPING PÁTIO',
  '08489643003097': '12818 - LJ GBARBOSA SERRARIA',
  '08489643002449': '12820 - LJ ATACADÃO TABULEIRO',
  '08489643002287': '12823 - LJ PONTA VERDE',
  '08489643002104': '12824 - QUIOSQUE GBARBOSA TABULEIRO',
  '08489643002872': '12826 - LJ ASSAÍ MANGABEIRAS',
  '08489643001710': '12828 - LJ GBARBOSA S.MARIS',
  '08489643002953': '12829 - LJ JACINTINHO',
  '08489643002520': '12830 - LJ LIVRAMENTO',
  '08489643001809': '12838 - LJ RIO LARGO',
  '08489643003178': '13427 - LJ SHOPPING CIDADE',
  '08489643003410': '14617 - LJ PARQUE SHOPPING',
  '08489643003682': '14668 - LJ HIPER ANTARES (LOJA BLOQUEADA)',
  '08489643002791': '19103 - LJ UNICOMPRA PONTA VERDE',
  '08489643004140': '20005 - LJ CANDEIAS CIMA',
  '08489643003844': '20006 - LJ SÃO SEBASTIÃO',
  '08489643004069': '20009 - LJ CANDEIAS BAIXO',
  '08489643004220': '20056 - LJ SIMÕES FILHO',
  '08489643004301': '20057 - LJ CONCEIÇÃO COITÉ',
  '08489643004492': '20441 - LJ LAGARTO',
  '08489643007750': '23156 - LJ SHOPPING LAGARTO',
  '08489643002368': '20858 - QUIOSQUE SUPER GIRO',
  '08489643005979': '20968 - HIB ITABAIANINHA',
  '08489643005464': '20969 - HIB MARECHAL DEODORO',
  '08489643005030': '20970 - VD SÃO SEBASTIÃO',
  '08489643005545': '20986 - HIB OLINDINA',
  '08489643005111': '20988 - HIB QUEIMADAS',
  '08489643005626': '20989 - HIB ENTRE RIOS',
  '08489643006193': '20991 - HIB CAMPO ALEGRE',
  '08489643004573': '20992 - ER CONCEIÇÃO COITÉ',
  '08489643004654': '20993 - ER CANDEIAS',
  '08489643004735': '20994 - ER SIMÕES FILHO',
  '08489643006002': '20995 - ER LAGARTO',
  '08489643005707': '20996 - ER ANTARES',
  '08489643005898': '20997 - ER PITANGUINHA',
  '08489643006274': '20998 - CD TABULEIRO',
  '08489643007670': 'AMG - AMG',
  '08489643005383': '20999 - HIB ESPLANADA',
  '08489643005200': '21000 - HIB SANTALUZ',
  '08489643004905': '21001 - HIB RIO REAL',
  '08489643004816': '21007 - TÔ QUE TÔ MACEIÓ CENTRO',
  '08489643006355': '21068 - LJ ATAKAREJO SIMÕES FILHO',
  '08489643006517': '21277 - LJ GBARBOSA SOCORRO',
  '08489643006606': '21278 - ER SOCORRO',
  '08489643006436': '21296 - LJ SHOPPING PRÊMIO SOCORRO',
  '08489643007165': '21375 - HIB IPIRÁ',
  '08489643006940': '21381 - LJ CAPIM GROSSO',
  '08489643007084': '21383 - ER CAPIM GROSSO',
  '08489643006789': '21495 - HIB BARRA DOS COQUEIROS',
  '08489643007246': '21624 - MIX MATEUS TRAPICHE',
  '08489643001981': '21647 - QUIOSQUE CARAJÁS MANGABEIRAS',
  '08489643007327': '22448 - ER CAMPO ALEGRE',
  '08489643007599': '22541 - ER RIO LARGO',
  '20318877000132': '910173 - QDB PARQUE SHOPPING',
  '20318877000213': '910291 - QDB MACEIO SHOPPING',
  '08489643007408': 'XXXXX - ER MARECHAL DEODORO',
  '14378160001821': '23701 - PRAÇA 9 DE NOVEMBRO',
  '14378160001740': '23702 - GALERIA PANVICON',
  '14378160001660': '23703 - BARRA DO CHOCA',
  '14378160001589': '23704 - CONDEUBA',
  '14378160001317': '23705 - QUISQUE SHOPPING CONQUISTA',
  '14378160001236': '23706 - ASSAI VITORIA DA CONQUISTA',
  '14378160001155': '23707 - BAIRRO BRASIL',
  '14378160001074': '23708 - BARRA DO CHOCA',
  '14378160000930': '23709 - SHOPPING CONQUISTA SUL',
  '14378160000850': '23710 - VITORIA DA CONQUISTA',
  '14378160000507': '23711 - VITORIA DA CONQUISTA',
  '14378160000698': '23712 - CANDIDO SALES',
  '14378160000183': '23713 - RUA ZEFERINO CORREIA, 17',
  '14378160002127': '23665 - BOULEVARD SHOPPING',
  '08489643009532': '24253 - Matriz Centro',
  '08489643008994': '24254 - Loja João Dourado',
  '08489643009451': '24255 - VD Irecê',
  '08489643009370': '24258 - Atacado',
  '08489643008803': '24257 - Miguel Calmon',
  '08489643009702': '24268 - Centro',
  '08489643009613': '24269 - ER Jacobina',
  '08489643009966': '20442 - Morro do Chapéu'
};

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const { user, signOut } = useAuth();
  const [loading, setLoading] = useState(true);
  const [loadingCommunications, setLoadingCommunications] = useState(true);
  const [topSellingProducts, setTopSellingProducts] = useState<TopSellingProduct[]>([]);
  const [storePerformance, setStorePerformance] = useState<StorePerformance[]>([]);
  const [bearerToken, setBearerToken] = useState<string>('');
  const [loadingToken, setLoadingToken] = useState(true);
  const [ruptureData, setRuptureData] = useState<{
    totalDisruptionPercentage: string;
    franchiseDisruptionPercentage: string;
    industryDisruptionPercentage: string;
  } | null>(null);
  const [loadingRupture, setLoadingRupture] = useState(true);
  const [currentCycleData, setCurrentCycleData] = useState<{
    totalDisruptionPercentage: string;
    franchiseDisruptionPercentage: string;
    industryDisruptionPercentage: string;
  } | null>(null);
  const [loadingCurrentCycle, setLoadingCurrentCycle] = useState(true);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pdvCode, setPdvCode] = useState<string | null>(null);
  const [pdvName, setPdvName] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [selectedCycle, setSelectedCycle] = useState('07');
  const [showCycleSelector, setShowCycleSelector] = useState(false);
  const [historicalData, setHistoricalData] = useState<number[]>([]);
  const [loadingHistorical, setLoadingHistorical] = useState(true);
  const [historicalProgress, setHistoricalProgress] = useState(0);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [loadingActivities, setLoadingActivities] = useState(true);
  const [currentActivityPage, setCurrentActivityPage] = useState(1);
  const activitiesPerPage = 4;
  const [pageTransition] = useState(new RNAnimated.Value(0));
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const productScrollRef = useRef<ScrollView>(null);
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<TopSellingProduct | null>(null);


  const avatars: AvatarKey[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

  const getFormattedDate = () => {
    const date = new Date();
    const diasSemana = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    
    const diaSemana = diasSemana[date.getDay()];
    const dia = date.getDate();
    const mes = meses[date.getMonth()];
    
    return `${diaSemana}, ${dia} de ${mes}`;
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // A navegação será feita automaticamente pelo contexto
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const handleOpenReportChannel = async () => {
    try {
      const url = 'https://www.contatoseguro.com.br/grupoginseng';
      const supported = await Linking.canOpenURL(url);
      
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Erro', 'Não foi possível abrir o canal de denúncias. Verifique se você tem um navegador instalado.');
      }
    } catch (error) {
      console.error('Erro ao abrir canal de denúncias:', error);
      Alert.alert('Erro', 'Não foi possível abrir o canal de denúncias.');
    }
  };



  const fetchBearerToken = async () => {
    try {
      setLoadingToken(true);
      const response = await fetch('https://api.grupoginseng.com.br/tokens');
      const data: TokenResponse = await response.json();
      
      if (data.data && data.data.length > 0) {
        const token = data.data[0].token;
        setToken(token);
        setBearerToken(token);
      } else {
        setError('Nenhum token encontrado');
      }
    } catch (error) {
      setError('Erro ao carregar token');
      console.error('Erro ao carregar token:', error);
    } finally {
      setLoadingToken(false);
    }
  };

  useEffect(() => {
    fetchBearerToken();
  }, []);

  useEffect(() => {
    if (!loadingToken && token) {
      loadStorePerformance();
      fetchRuptureData();
      fetchCurrentCycleData();
      fetchHistoricalData();
      fetchRecentActivities();
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

  const loadStorePerformance = async () => {
    if (!bearerToken) return;
    
    try {
      setLoadingCommunications(true);
      const response = await fetch('https://ms-bulletin-v2.prd.franqueado.grupoboticario.digital/latest-bulletin?perPage=6&currentPage=1', {
        headers: {
          'accept': 'application/json, text/plain, */*',
          'accesstoken': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwZXJzb25JZCI6MTYzMTY1LCJwb3NpdGlvbklkIjo1NSwicGVyc29uQ3JlYXRpb25EYXRlIjoiMjAyMy0wNC0xMlQxMjoxOToxOS4zNjZaIiwiYnJhbmRzIjpbNDMsNDQsNDUsNDYsNDcsNTUsNTZdLCJzZWdtZW50c1dpdGhUeXBlcyI6W3sidCI6MSwicyI6OTIsImUiOiI0NDk0In0seyJ0IjoxLCJzIjo1NTYsImUiOiIzNTQ2In0seyJ0IjoxLCJzIjo4NDksImUiOiI0NTYwIn0seyJ0IjoxLCJzIjoxMzQ4LCJlIjoiNTY5OSJ9LHsidCI6MSwicyI6NDA5NywiZSI6IjEyNTIyIn0seyJ0IjoxLCJzIjo0MzQxLCJlIjoiMTI4MTcifSx7InQiOjEsInMiOjQzNDIsImUiOiIxMjgxOCJ9LHsidCI6MSwicyI6NDM0NCwiZSI6IjEyODIwIn0seyJ0IjoxLCJzIjo0MzQ3LCJlIjoiMTI4MjMifSx7InQiOjEsInMiOjQzNDgsImUiOiIxMjgyNCJ9LHsidCI6MSwicyI6NDM1MCwiZSI6IjEyODI2In0seyJ0IjoxLCJzIjo0MzUyLCJlIjoiMTI4MjgifSx7InQiOjEsInMiOjQzNTMsImUiOiIxMjgyOSJ9LHsidCI6MSwicyI6NDM1NCwiZSI6IjEyODMwIn0seyJ0IjoxLCJzIjo0MzYxLCJlIjoiMTI4MzgifSx7InQiOjEsInMiOjQ4MjYsImUiOiIxMzQyNyJ9LHsidCI6MSwicyI6NTc4MywiZSI6IjE0NjE3In0seyJ0IjoxLCJzIjo1ODIwLCJlIjoiMTQ2NjgifSx7InQiOjEsInMiOjY3NzYsImUiOiIxOTEwMyJ9LHsidCI6MSwicyI6NzQ1OSwiZSI6IjIwMDA1In0seyJ0IjoxLCJzIjo3NDYwLCJlIjoiMjAwMDYifSx7InQiOjEsInMiOjc0NjMsImUiOiIyMDAwOSJ9LHsidCI6MSwicyI6NzQ5MywiZSI6IjIwMDU2In0seyJ0IjoxLCJzIjo3NDk0LCJlIjoiMjAwNTcifSx7InQiOjEsInMiOjc3NDUsImUiOiIyMDQ0MSJ9LHsidCI6MSwicyI6Nzk2MSwiZSI6IjkxMDE3MyJ9LHsidCI6MSwicyI6ODAxOSwiZSI6IjkxMDI5MSJ9LHsidCI6MSwicyI6OTg4NCwiZSI6IjIwNjgzIn0seyJ0IjoxLCJzIjo5ODkyLCJlIjoiMjA3MTIifSx7InQiOjEsInMiOjEwNTczLCJlIjoiMjA4NTgifSx7InQiOjEsInMiOjEwNjE5LCJlIjoiMjA5NjgifSx7InQiOjEsInMiOjEwNjIwLCJlIjoiMjA5NjkifSx7InQiOjEsInMiOjEwNjIxLCJlIjoiMjA5NzAifSx7InQiOjEsInMiOjEwNjIyLCJlIjoiMjA5ODYifSx7InQiOjEsInMiOjEwNjIzLCJlIjoiMjA5ODgifSx7InQiOjEsInMiOjEwNjI0LCJlIjoiMjA5ODkifSx7InQiOjEsInMiOjEwNjI1LCJlIjoiMjA5OTEifSx7InQiOjEsInMiOjEwNjI2LCJlIjoiMjA5OTIifSx7InQiOjEsInMiOjEwNjI3LCJlIjoiMjA5OTMifSx7InQiOjEsInMiOjEwNjI4LCJlIjoiMjA5OTQifSx7InQiOjEsInMiOjEwNjI5LCJlIjoiMjA5OTUifSx7InQiOjEsInMiOjEwNjMwLCJlIjoiMjA5OTYifSx7InQiOjEsInMiOjEwNjMxLCJlIjoiMjA5OTcifSx7InQiOjEsInMiOjEwNjMyLCJlIjoiMjA5OTgifSx7InQiOjEsInMiOjEwNjMzLCJlIjoiMjA5OTkifSx7InQiOjEsInMiOjEwNjM0LCJlIjoiMjEwMDAifSx7InQiOjEsInMiOjEwNjM1LCJlIjoiMjEwMDEifSx7InQiOjEsInMiOjEwNjUwLCJlIjoiMjEwMDcifSx7InQiOjEsInMiOjEwNjU3LCJlIjoiMjA5NzkifSx7InQiOjEsInMiOjEwNjU4LCJlIjoiOTExNDg2In0seyJ0IjoxLCJzIjoxMDY1OSwiZSI6IjkxMTUxOSJ9LHsidCI6MSwicyI6MTA3NTIsImUiOiI5MTE1MDkifSx7InQiOjEsInMiOjEwODczLCJlIjoiOTExNDg3In0seyJ0IjoxLCJzIjoxMDg3NCwiZSI6IjkxMTQ4OCJ9LHsidCI6MSwicyI6MTA4NzUsImUiOiI5MTE0ODkifSx7InQiOjEsInMiOjEwODc2LCJlIjoiOTExNDkwIn0seyJ0IjoxLCJzIjoxMDg3NywiZSI6IjkxMTQ5MSJ9LHsidCI6MSwicyI6MTA4NzgsImUiOiI5MTE0OTIifSx7InQiOjEsInMiOjEwODc5LCJlIjoiOTExNTEwIn0seyJ0IjoxLCJzIjoxMDg4MCwiZSI6IjkxMTUxMSJ9LHsidCI6MSwicyI6MTA4ODEsImUiOiI5MTE1MTIifSx7InQiOjEsInMiOjEwODgyLCJlIjoiOTExNTEzIn0seyJ0IjoxLCJzIjoxMDg4MywiZSI6IjkxMTUxNCJ9LHsidCI6MSwicyI6MTA4ODQsImUiOiI5MTE1MTUifSx7InQiOjEsInMiOjEwODg1LCJlIjoiOTExNTE2In0seyJ0IjoxLCJzIjoxMTA2OSwiZSI6IjkxMTUxNyJ9LHsidCI6MSwicyI6MTEwNzAsImUiOiI5MTE1MTgifSx7InQiOjEsInMiOjExMTk0LCJlIjoiMjEwNjgifSx7InQiOjEsInMiOjExMzk3LCJlIjoiMjEyNzcifSx7InQiOjEsInMiOjExMzk4LCJlIjoiMjEyOTYifSx7InQiOjEsInMiOjExMzk5LCJlIjoiMjEyNzgifSx7InQiOjEsInMiOjExNjI4LCJlIjoiMjEzNzUifSx7InQiOjEsInMiOjExNjM3LCJlIjoiOTExNzY2In0seyJ0IjoxLCJzIjoxMTY1MCwiZSI6IjIxMzgxIn0seyJ0IjoxLCJzIjoxMTY1MiwiZSI6IjIxMzgzIn0seyJ0IjoxLCJzIjoxMTY2NiwiZSI6IjkxMTc2MiJ9LHsidCI6MSwicyI6MTI0MTUsImUiOiIyMTY0NyJ9LHsidCI6MSwicyI6MTI0ODUsImUiOiIyMTQ5NSJ9LHsidCI6MSwicyI6MTI0OTAsImUiOiI5MTIxMjQifSx7InQiOjEsInMiOjEyNDkyLCJlIjoiMjE2MjQifSx7InQiOjEsInMiOjEyNTI3LCJlIjoiOTExOTQwIn0seyJ0IjoxLCJzIjoxMzA2NCwiZSI6IjkxMjI0MiJ9LHsidCI6MSwicyI6MTMwNjUsImUiOiIyMjQ0OCJ9LHsidCI6MSwicyI6MTMxMTcsImUiOiIyMjU0MSJ9LHsidCI6MSwicyI6MTMxMTgsImUiOiI5MTIyNzMifSx7InQiOjEsInMiOjEzNzk2LCJlIjoiMjMxNTYifSx7InQiOjEsInMiOjE0MjA2LCJlIjoiMjM0NzUifSx7InQiOjEsInMiOjE0MzExLCJlIjoiMjM3MTEifSx7InQiOjEsInMiOjE0MzEyLCJlIjoiMjM2NjUifSx7InQiOjEsInMiOjE0MzEzLCJlIjoiMjM3MDIifSx7InQiOjEsInMiOjE0MzE0LCJlIjoiMjM3MDEifSx7InQiOjEsInMiOjE0MzE1LCJlIjoiOTEyODU3In0seyJ0IjoxLCJzIjoxNDMxNiwiZSI6IjkxMjg1NiJ9LHsidCI6MSwicyI6MTQzMTcsImUiOiIyMzcwNCJ9LHsidCI6MSwicyI6MTQzMTksImUiOiIyMzcwOSJ9LHsidCI6MSwicyI6MTQzMjAsImUiOiIyMzcwNiJ9LHsidCI6MSwicyI6MTQzMjIsImUiOiIyMzcwNyJ9LHsidCI6MSwicyI6MTQzMjMsImUiOiIyMzcxMyJ9LHsidCI6MSwicyI6MTQzMjQsImUiOiI5MTI4NTgifSx7InQiOjEsInMiOjE0MzI2LCJlIjoiMjM3MDUifSx7InQiOjEsInMiOjE0MzI3LCJlIjoiMjM3MTIifSx7InQiOjEsInMiOjE0MzI4LCJlIjoiMjM3MDMifSx7InQiOjEsInMiOjE0MzMwLCJlIjoiOTEyODU5In0seyJ0IjoxLCJzIjoxNDMzNiwiZSI6IjIzNzA4In0seyJ0IjoyLCJzIjoxNSwiZSI6IjEwMjY5In0seyJ0IjozLCJzIjoxMzY3MSwiZSI6IjU1In0seyJ0Ijo0LCJzIjoxMzE3NywiZSI6IjQifSx7InQiOjUsInMiOjEzMzA4LCJlIjoiNTIifSx7InQiOjUsInMiOjEzMzA5LCJlIjoiNTMifSx7InQiOjYsInMiOjEzMTkyLCJlIjoiYzliZmJkMmUtMWY2NS0xMWVkLWI1ZjYtMTIxM2U5MjdlMDU3In0seyJ0Ijo2LCJzIjoxMzI0NiwiZSI6ImM5ZWY4MzkxLTFmNjUtMTFlZC1iNWY2LTEyMTNlOTI3ZTA1NyJ9LHsidCI6NiwicyI6MTMyNTAsImUiOiJjOWVmODVlNC0xZjY1LTExZWQtYjVmNi0xMjEzZTkyN2UwNTcifSx7InQiOjYsInMiOjEzMjUzLCJlIjoiYzllZjg3YWMtMWY2NS0xMWVkLWI1ZjYtMTIxM2U5MjdlMDU3In1dLCJpYXQiOjE3NDgwOTI1MjgsImV4cCI6MTc0ODA5MjcwMH0.MR9pPfe5W_BLDi0hzrT6CES6YoDO8rzHCPlmjQ4JDlI',
          'authorization': bearerToken,
          'origin': 'https://extranet.grupoboticario.com.br',
          'referer': 'https://extranet.grupoboticario.com.br/',
          'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36'
        }
      });

      const data: BulletinResponse = await response.json();
      
      // Processar os dados do boletim
      const performanceData: StorePerformance[] = data.items.map(item => ({
        title: item.title,
        value: new Date(item.publishDate).toLocaleDateString('pt-BR'),
        change: item.isRead ? 'Lido' : 'Não lido',
        isPositive: item.isRead,
        id: item.id // Adicionando o ID do comunicado
      }));

      setStorePerformance(performanceData);
    } catch (error) {
      console.error('Erro ao carregar desempenho da loja:', error);
    } finally {
      setLoadingCommunications(false);
    }
  };

  const handleOpenCommunication = async (id: number) => {
    const url = `https://extranet.grupoboticario.com.br/comunicados?id=${id}&modalView=preview`;
    const supported = await Linking.canOpenURL(url);

    if (supported) {
      await Linking.openURL(url);
    } else {
      console.error('Não foi possível abrir o URL:', url);
    }
  };

  useEffect(() => {
    const initializeScreen = async () => {
      try {
        await loadTopSellingProducts();
      } catch (error) {
        console.error('Erro ao inicializar a tela:', error);
      }
    };

    initializeScreen();
  }, []);

  const loadTopSellingProducts = async () => {
    try {
      setLoading(true);
      
      // Buscar dados dos produtos mais vendidos
      const response = await fetch('https://api.grupoginseng.com.br/bestsellers');
      const data: BestSellerResponse = await response.json();
      
      // Buscar dados de promoções das lojas base
      const promotionsData = await fetchPromotionsData();
      
      const mappedProducts = data.bestsellers.map((product, index) => {
        const vdPromotionData = promotionsData.vd[product.code];
        const ljPromotionData = promotionsData.lj[product.code];
        
        return {
          code: product.code,
          description: product.descricao,
          image: `https://sgi.e-boticario.com.br/Paginas/Imagens/Produtos/${product.code}g.jpg`,
          totalSales: product.vendas,
          position: index + 1, // Posição baseada no índice da array (1° mais vendido, 2° mais vendido, etc.)
          promotions: vdPromotionData?.promotions_description ? [{
            description: vdPromotionData.promotions_description,
            discountPercent: processDiscountPercent(vdPromotionData.promotions_discountpercent)
          }] : [],
          storePromotions: ljPromotionData?.promotions_description ? [{
            description: ljPromotionData.promotions_description,
            discountPercent: processDiscountPercent(ljPromotionData.promotions_discountpercent)
          }] : [],
          launch: vdPromotionData?.launch || ''
        };
      });

      setTopSellingProducts(mappedProducts);
    } catch (error) {
      console.error('Erro ao carregar produtos mais vendidos:', error);
    } finally {
      setLoading(false);
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
    } catch (error) {
      console.error('Erro ao buscar dados de ruptura:', error);
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
    } catch (error) {
      console.error('Erro ao buscar dados do ciclo atual:', error);
    } finally {
      setLoadingCurrentCycle(false);
    }
  };

  const fetchHistoricalData = async () => {
    try {
      setLoadingHistorical(true);
      setHistoricalProgress(0); // Resetar progresso
      
      const cycles = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17'];
      const results: number[] = [];
      const totalCycles = cycles.length;

      // Progresso inicial
      setHistoricalProgress(5);

      // Busca dados para cada ciclo
      for (let i = 0; i < cycles.length; i++) {
        const cycle = cycles[i];
        try {
          // Atualizar progresso antes da requisição
          const progressBefore = 5 + (i / totalCycles) * 85; // 5% inicial + 85% para requests
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
          
          // Atualizar progresso após receber dados
          const progressAfter = 5 + ((i + 1) / totalCycles) * 85;
          setHistoricalProgress(progressAfter);
          
          // Pequeno delay para não sobrecarregar a API
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          console.warn(`Erro ao buscar dados do ciclo ${cycle}:`, error);
          results.push(0); // Fallback para 0 se der erro
          
          // Ainda atualizar progresso mesmo com erro
          const progressAfter = 5 + ((i + 1) / totalCycles) * 85;
          setHistoricalProgress(progressAfter);
        }
      }

      // Processamento final
      setHistoricalProgress(95);
      setHistoricalData(results);
      
      // Finalizar
      setHistoricalProgress(100);
      
      // Pequeno delay antes de esconder o loading
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error('Erro ao buscar dados históricos:', error);
      setHistoricalProgress(100); // Completar mesmo com erro
    } finally {
      setLoadingHistorical(false);
    }
  };

  const fetchRecentActivities = async () => {
    try {
      setLoadingActivities(true);
      const activities: (RecentActivity & { dataOriginal: Date })[] = [];
      
      // Data atual e data limite (15 dias atrás)
      const hoje = new Date();
      const dataLimite = new Date();
      dataLimite.setDate(hoje.getDate() - 15);
      
      // Buscar nas primeiras páginas para coletar todas as notas do Calamo PE
      for (let page = 1; page <= 10; page++) {
        const response = await fetch(`https://api.grupoginseng.com.br/tabela/fato_notas_entrada?pagina=${page}`);
        const data: NotasFiscaisResponse = await response.json();
        
        // Processar todas as notas
        data.data.forEach(nota => {
          // Extrair apenas a data (formato: 2023-12-28)
          const dataEmissao = nota.data_emissao.split('T')[0];
          const dataEmissaoObj = new Date(dataEmissao);
          
          // Filtrar apenas notas dos últimos 15 dias
          if (dataEmissaoObj >= dataLimite && dataEmissaoObj <= hoje) {
            // Calcular previsão de entrega (+10 dias)
            const previsaoEntregaObj = new Date(dataEmissaoObj);
            previsaoEntregaObj.setDate(previsaoEntregaObj.getDate() + 10);
            
            // Formatar datas para o padrão brasileiro (dd/mm/yyyy)
            const formatarData = (data: Date) => {
              return data.toLocaleDateString('pt-BR');
            };
            
            // Buscar informações da loja pelo CNPJ (sem pontuação)
            const cnpjSemPontuacao = nota.cnpj_destinatario.replace(/[^\d]/g, '');
            const lojaInfo = cnpjToLojaMap[cnpjSemPontuacao] || nota.cnpj_destinatario;
            
            // Log temporário para debug
            if (!cnpjToLojaMap[cnpjSemPontuacao]) {
              console.log('🔍 CNPJ não encontrado no mapeamento:', {
                original: nota.cnpj_destinatario,
                semPontuacao: cnpjSemPontuacao,
                numeroFatura: nota.numero_fatura
              });
            }
            
            activities.push({
              id: nota.chave,
              cnpj: nota.cnpj_destinatario,
              dataEmissao: formatarData(dataEmissaoObj),
              previsaoEntrega: formatarData(previsaoEntregaObj),
              numeroFatura: nota.numero_fatura,
              lojaInfo: lojaInfo,
              dataOriginal: dataEmissaoObj // Mantém a data original para ordenação
            });
          }
        });
        
        // Se chegou ao final das páginas, parar
        if (page >= data.total_paginas) break;
      }
      
      // Ordenar por data mais recente primeiro
      activities.sort((a, b) => b.dataOriginal.getTime() - a.dataOriginal.getTime());
      
      // Remover a propriedade dataOriginal
      const sortedActivities = activities.map(({ dataOriginal, ...activity }) => activity);
      
      setRecentActivities(sortedActivities);
      
    } catch (error) {
      console.error('Erro ao buscar atividades recentes:', error);
    } finally {
      setLoadingActivities(false);
    }
  };

  const loadSelectedAvatar = async () => {
    try {
      const savedAvatar = await AsyncStorage.getItem('selectedAvatar');
      if (savedAvatar) {
        const avatarNumber = parseInt(savedAvatar) as AvatarKey;
        if (avatarNumber >= 1 && avatarNumber <= 9) {
          setSelectedAvatar(avatarNumber);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar avatar:', error);
    }
  };

  useEffect(() => {
    loadSelectedAvatar();
  }, []);

  // Recarregar avatar quando a tela ganhar foco
  useFocusEffect(
    React.useCallback(() => {
      loadSelectedAvatar();
    }, [])
  );

  const handleAvatarSelect = async (avatarNumber: AvatarKey) => {
    try {
      await AsyncStorage.setItem('selectedAvatar', avatarNumber.toString());
      setSelectedAvatar(avatarNumber);
      setShowAvatarModal(false);
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
    }
  };

  // Funções de paginação
  const totalActivityPages = Math.ceil(recentActivities.length / activitiesPerPage);
  const startIndex = (currentActivityPage - 1) * activitiesPerPage;
  const endIndex = startIndex + activitiesPerPage;
  const currentActivities = recentActivities.slice(startIndex, endIndex);

  const animatePageTransition = (direction: 'left' | 'right', callback: () => void) => {
    // Animar saída
    RNAnimated.timing(pageTransition, {
      toValue: direction === 'left' ? -300 : 300,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      // Resetar posição sem animação
      pageTransition.setValue(direction === 'left' ? 300 : -300);
      // Executar mudança de página
      callback();
      // Animar entrada
      RNAnimated.timing(pageTransition, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    });
  };

  const goToNextActivityPage = () => {
    if (currentActivityPage < totalActivityPages) {
      animatePageTransition('left', () => {
        setCurrentActivityPage(currentActivityPage + 1);
      });
    }
  };

  const goToPreviousActivityPage = () => {
    if (currentActivityPage > 1) {
      animatePageTransition('right', () => {
        setCurrentActivityPage(currentActivityPage - 1);
      });
    }
  };

  const goToActivityPage = (page: number) => {
    if (page >= 1 && page <= totalActivityPages) {
      const direction = page > currentActivityPage ? 'left' : 'right';
      animatePageTransition(direction, () => {
        setCurrentActivityPage(page);
      });
    }
  };

  // Função para abrir modal do produto
  const handleProductPress = (product: TopSellingProduct) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  // Funções para navegação dos produtos
  const goToNextProduct = () => {
    if (currentProductIndex < topSellingProducts.length - 1) {
      const nextIndex = currentProductIndex + 1;
      setCurrentProductIndex(nextIndex);
      productScrollRef.current?.scrollTo({
        x: nextIndex * 132, // 120 + 12 de margin (25% menor)
        animated: true
      });
    }
  };

  const goToPreviousProduct = () => {
    if (currentProductIndex > 0) {
      const prevIndex = currentProductIndex - 1;
      setCurrentProductIndex(prevIndex);
      productScrollRef.current?.scrollTo({
        x: prevIndex * 132, // 120 + 12 de margin (25% menor)
        animated: true
      });
    }
  };

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

  // Função para buscar dados de promoções das lojas base (VD e LJ)
  const fetchPromotionsData = async (): Promise<{ 
    vd: { [key: string]: InventoryItemType };
    lj: { [key: string]: InventoryItemType };
  }> => {
    try {
      // Função auxiliar para buscar todas as páginas de uma loja
      const fetchAllPages = async (lojaId: string): Promise<any[]> => {
        let allData: any[] = [];
        let currentPage = 1;
        let totalPages = 1;

        do {
          const response = await fetch(`https://api.grupoginseng.com.br/tabela/draft/${lojaId}?pagina=${currentPage}`);
          const data = await response.json();
          
          if (data.data && Array.isArray(data.data)) {
            allData = [...allData, ...data.data];
          }
          
          // Atualizar informações de paginação
          totalPages = data.total_paginas || 1;
          currentPage++;
          
          // Pequeno delay para não sobrecarregar a API
          if (currentPage <= totalPages) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
          
        } while (currentPage <= totalPages);

        return allData;
      };

      // Buscar todas as páginas das duas lojas
      console.log('🔄 Buscando promoções de todas as páginas...');
      const [vdAllData, ljAllData] = await Promise.all([
        fetchAllPages('20998'), // VD
        fetchAllPages('4560')   // LJ
      ]);
      
      console.log(`📊 VD: ${vdAllData.length} produtos carregados`);
      console.log(`📊 LJ: ${ljAllData.length} produtos carregados`);
      
      // Criar mapas de código -> produto com promoções
      const vdPromotionsMap: { [key: string]: InventoryItemType } = {};
      const ljPromotionsMap: { [key: string]: InventoryItemType } = {};
      
      // Processar dados da loja VD (20998)
      vdAllData.forEach((item: any) => {
        if (item.code) {
          vdPromotionsMap[item.code] = {
            code: item.code,
            description: item.description || '',
            promotions_description: item.promotions_description,
            promotions_discountpercent: item.promotions_discountpercent,
            launch: item.launch ? 'Lançamento' : ''
          };
        }
      });
      
      // Processar dados da loja LJ (4560)
      ljAllData.forEach((item: any) => {
        if (item.code) {
          ljPromotionsMap[item.code] = {
            code: item.code,
            description: item.description || '',
            promotions_description: item.promotions_description,
            promotions_discountpercent: item.promotions_discountpercent,
            launch: item.launch ? 'Lançamento' : ''
          };
        }
      });
      
      console.log(`✅ Promoções carregadas - VD: ${Object.keys(vdPromotionsMap).length} produtos, LJ: ${Object.keys(ljPromotionsMap).length} produtos`);
      
      return {
        vd: vdPromotionsMap,
        lj: ljPromotionsMap
      };
    } catch (error) {
      console.error('Erro ao buscar dados de promoções:', error);
      return {
        vd: {},
        lj: {}
      };
    }
  };

  // Componente para animar porcentagens
  const AnimatedPercentage = ({ value, delay = 0 }: { value: string | undefined; delay?: number }) => {
    if (!value) {
      return (
        <Text style={[styles.ruptureValueNumber, styles.highlightedText]}>
          0,0%
        </Text>
      );
    }
    
    const numericValue = parseFloat(value.replace(',', '.'));
    const { value: animatedValue } = useCountAnimation(numericValue, { 
      duration: 1500, 
      delay 
    });
    
    return (
      <Text style={[styles.ruptureValueNumber, styles.highlightedText]}>
        {animatedValue.toString().replace('.', ',')}%
      </Text>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={() => setShowAvatarModal(true)}
          >
            <Image
              source={selectedAvatar ? avatarImages[selectedAvatar] : defaultAvatar}
              style={styles.avatar}
            />
          </TouchableOpacity>
          <View>
            <Text style={styles.greeting}>Olá, {user?.name || 'Usuário'}</Text>
            <Text style={styles.date}>{getFormattedDate()}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={handleOpenReportChannel}
          >
            <ShieldAlert size={22} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => router.push('/feedback')}
          >
            <MessageSquare size={22} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.iconButton} 
            onPress={() => router.push('/profile')}
          >
            <Settings size={22} color={Colors.white} />
          </TouchableOpacity>
          {/* Botão de Logout - INATIVO */}
          {false && (
            <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
              <LogOut size={22} color={Colors.white} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Modal de Seleção de Avatar */}
      <Modal
        visible={showAvatarModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowAvatarModal(false)}
        >
          <View style={styles.avatarModalContent}>
            <View style={styles.avatarModalHeader}>
              <Text style={styles.avatarModalTitle}>Escolha seu Avatar</Text>
              <TouchableOpacity 
                onPress={() => setShowAvatarModal(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <FlatList
              data={avatars}
              numColumns={3}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.avatarOption,
                    selectedAvatar === item && styles.selectedAvatar
                  ]}
                  onPress={() => handleAvatarSelect(item)}
                >
                  <Image
                    source={avatarImages[item]}
                    style={styles.avatarOptionImage}
                  />
                </TouchableOpacity>
              )}
              keyExtractor={(item) => item.toString()}
              contentContainerStyle={styles.avatarGrid}
            />
          </View>
        </Pressable>
      </Modal>

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
              data={['01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17']}
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

      {/* Modal de Detalhes do Produto */}
      <Modal
        visible={showProductModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowProductModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowProductModal(false)}
        >
          <View style={styles.productModalContent}>
            <Pressable onPress={(e) => e.stopPropagation()}>
              <View style={styles.productModalHeader}>
                <Text style={styles.productModalTitle}>Detalhes do Produto</Text>
                <TouchableOpacity 
                  onPress={() => setShowProductModal(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {selectedProduct && (
                <View style={styles.productModalBody}>
                  {/* Header com imagem e info básica */}
                  <View style={styles.productModalHeaderSection}>
                    <CachedImage 
                      uri={selectedProduct.image}
                      style={styles.productModalImageLarge}
                      resizeMode="contain"
                    />
                    <View style={styles.productModalHeaderInfo}>
                                             <View style={styles.productModalBadgeContainer}>
                         <View style={styles.productModalRankBadge}>
                           <Text style={styles.productModalRankText}>#{selectedProduct.position}</Text>
                         </View>
                         {selectedProduct.promotions && selectedProduct.promotions.length > 0 && (
                           <View style={styles.productModalPromoBadge}>
                             <Text style={styles.productModalPromoText}>PROMOÇÃO</Text>
                           </View>
                         )}
                         {selectedProduct.launch && (
                           <View style={styles.productModalLaunchBadge}>
                             <Text style={styles.productModalLaunchText}>{selectedProduct.launch.toUpperCase()}</Text>
                           </View>
                         )}
                       </View>
                      <Text style={styles.productModalCodeNew}>{selectedProduct.code}</Text>
                    </View>
                  </View>

                  {/* Descrição do produto */}
                  <View style={styles.productModalDescriptionSection}>
                    <Text style={styles.productModalDescriptionTitle}>Descrição</Text>
                    <Text style={styles.productModalDescriptionText}>
                      {selectedProduct.description}
                    </Text>
                  </View>

                  {/* Estatísticas em cards */}
                  <View style={[
                    styles.productModalStatsSection,
                    // Só adiciona borda inferior se houver promoções
                    ((selectedProduct.promotions && selectedProduct.promotions.length > 0) || 
                     (selectedProduct.storePromotions && selectedProduct.storePromotions.length > 0)) && 
                    styles.productModalStatsSectionWithBorder
                  ]}>
                    <View style={styles.productModalStatCard}>
                      <Text style={styles.productModalStatNumber}>{selectedProduct.totalSales}</Text>
                      <Text style={styles.productModalStatLabelNew}>Vendas Totais</Text>
                    </View>
                    <View style={styles.productModalStatCard}>
                      <Text style={styles.productModalStatNumber}>#{selectedProduct.position}</Text>
                      <Text style={styles.productModalStatLabelNew}>Posição no Ranking</Text>
                    </View>
                  </View>

                                    {/* Promoções ativas */}
                  {((selectedProduct.promotions && selectedProduct.promotions.length > 0) || 
                    (selectedProduct.storePromotions && selectedProduct.storePromotions.length > 0)) && (
                    <View style={styles.productModalPromotionsSection}>
                      <Text style={styles.productModalSectionTitle}>🎉 Promoções Ativas</Text>
                      <View style={styles.productModalPromotionsGrid}>
                        {/* Card VD */}
                        <View style={styles.productModalDiscountCard}>
                          <Text style={styles.productModalDiscountSource}>VD</Text>
                          {selectedProduct.promotions && selectedProduct.promotions.length > 0 ? (
                            <>
                              <Text style={styles.productModalDiscountValue}>{selectedProduct.promotions[0].discountPercent}</Text>
                              <Text style={styles.productModalDiscountLabel}>OFF</Text>
                            </>
                          ) : (
                            <Text style={styles.productModalDiscountValue}>-</Text>
                          )}
                        </View>
                        
                        {/* Card LJ */}
                        <View style={styles.productModalDiscountCard}>
                          <Text style={styles.productModalDiscountSource}>Loja</Text>
                          {selectedProduct.storePromotions && selectedProduct.storePromotions.length > 0 ? (
                            <>
                              <Text style={styles.productModalDiscountValue}>{selectedProduct.storePromotions[0].discountPercent}</Text>
                              <Text style={styles.productModalDiscountLabel}>OFF</Text>
                            </>
                          ) : (
                            <Text style={styles.productModalDiscountValue}>-</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Seção Mais vendidos - FIXA */}
      <Animated.View entering={FadeInDown.duration(400).delay(100)} style={styles.fixedTopSellingSection}>
        <View style={styles.topSellingHeaderSimple}>
          <Text style={styles.sectionTitle}>Mais vendidos</Text>
        </View>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary[500]} />
          </View>
        ) : (
          <View style={styles.topSellingWithArrows}>
            {/* Seta Esquerda - Só aparece se não estiver no primeiro produto */}
            {currentProductIndex > 0 && (
              <TouchableOpacity 
                style={[
                  styles.arrowButton,
                  styles.leftArrow
                ]}
                onPress={goToPreviousProduct}
              >
                                  <ChevronLeft 
                    size={14} 
                    color={Colors.white} 
                  />
              </TouchableOpacity>
            )}

                          <ScrollView 
                ref={productScrollRef}
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.topSellingContainer}
                style={{ backgroundColor: 'transparent', height: 190 }}
                scrollEnabled={true}
                onScroll={(event) => {
                  const scrollX = event.nativeEvent.contentOffset.x;
                  const newIndex = Math.round(scrollX / 132);
                  if (newIndex !== currentProductIndex && newIndex >= 0 && newIndex < topSellingProducts.length) {
                    setCurrentProductIndex(newIndex);
                  }
                }}
                scrollEventThrottle={16}
              >
                              {topSellingProducts.map((product, index) => (
                  <TouchableOpacity 
                    key={product.code}
                    style={styles.topSellingItem}
                    onPress={() => handleProductPress(product)}
                  >
                    {index === 0 && topSellingProducts[1] && product.totalSales >= (topSellingProducts[1].totalSales * 2) && (
                      <View style={styles.hotIndicator}>
                        <Text style={styles.hotIndicatorText}>🔥 Bombando</Text>
                      </View>
                    )}
                    <CachedImage 
                      uri={product.image}
                      style={styles.topSellingImage}
                    />
                                      <View style={styles.productInfo}>
                      <Text style={styles.productCode}>{product.code}</Text>
                      <Text style={styles.productDescription} numberOfLines={2}>
                        {product.description}
                      </Text>
                    </View>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Seta Direita - Só aparece se não estiver no último produto */}
            {currentProductIndex < topSellingProducts.length - 1 && (
              <TouchableOpacity 
                style={[
                  styles.arrowButton,
                  styles.rightArrow
                ]}
                onPress={goToNextProduct}
              >
                                  <ChevronRight 
                    size={14} 
                    color={Colors.white} 
                  />
              </TouchableOpacity>
            )}
          </View>
        )}
      </Animated.View>

      {/* Conteúdo rolável */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >

        {/* Últimos Comunicados - Segundo */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)} style={styles.communicationsSection}>
          <Text style={styles.sectionTitleWithMargin}>Últimos Comunicados</Text>
          <View style={styles.activitiesContainer}>
            {loadingToken || loadingCommunications ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={Colors.primary[500]} />
              </View>
            ) : (
              storePerformance.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.activityCard}
                  onPress={() => handleOpenCommunication(item.id)}
                >
                  <View style={[styles.activityIconContainer, { backgroundColor: Colors.warning[50] }]}>
                    <Bell size={20} color={Colors.warning[500]} />
                  </View>
                  <View style={styles.activityInfo}>
                    <Text style={styles.activityTitle} numberOfLines={2}>
                      {item.title}
                    </Text>
                    <Text style={styles.activityDescription}>
                      Publicado em {item.value}
                    </Text>
                  </View>
                  <ChevronRight size={20} color={Colors.neutral[400]} />
                </TouchableOpacity>
              ))
            )}
          </View>
        </Animated.View>

        {/* Atividades recentes - Terceiro - INATIVO */}
        {false && (
          <Animated.View entering={FadeInDown.duration(400).delay(300)}>
            <View style={styles.activitiesHeader}>
              <Text style={styles.sectionTitle}>Últimos Faturamentos</Text>
              {!loadingActivities && recentActivities.length > 0 && (
                <Text style={styles.activitiesCount}>
                  {recentActivities.length} atividades
                </Text>
              )}
            </View>
            
            <View style={styles.activitiesContainer}>
              {loadingActivities ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.primary[500]} />
                </View>
              ) : (
                <>
                  <RNAnimated.View 
                    style={[
                      styles.activitiesAnimatedContainer,
                      {
                        transform: [{ translateX: pageTransition }]
                      }
                    ]}
                  >
                    {currentActivities.map((activity, index) => (
                      <TouchableOpacity key={activity.id} style={styles.activityCard}>
                        <View style={[styles.activityIconContainer, { backgroundColor: Colors.success[50] }]}>
                          <Truck size={20} color={Colors.success[500]} />
                        </View>
                        <View style={styles.activityInfo}>
                          <Text style={styles.activityTitle}>
                            Faturamento realizado para :
                          </Text>
                          <Text style={styles.activityLojaName}>
                            {activity.lojaInfo}
                          </Text>
                          <Text style={styles.activityDescription}>
                            Data Faturamento: {activity.dataEmissao}
                          </Text>
                          <Text style={styles.activityDescription}>
                            Previsão de entrega: {activity.previsaoEntrega}
                          </Text>
                        </View>
                        <Text style={styles.activityTime}>NF {activity.numeroFatura}</Text>
                      </TouchableOpacity>
                    ))}
                  </RNAnimated.View>

                  {/* Paginação */}
                  {totalActivityPages > 1 && (
                    <View style={styles.paginationContainer}>
                      <TouchableOpacity 
                        style={[
                          styles.paginationButton, 
                          currentActivityPage === 1 && styles.paginationButtonDisabled
                        ]}
                        onPress={goToPreviousActivityPage}
                        disabled={currentActivityPage === 1}
                      >
                        <ChevronLeft size={16} color={currentActivityPage === 1 ? Colors.neutral[400] : Colors.primary[500]} />
                      </TouchableOpacity>

                      <View style={styles.paginationInfo}>
                        <Text style={styles.paginationText}>
                          {currentActivityPage} de {totalActivityPages}
                        </Text>
                        <Text style={styles.paginationSubtext}>
                          {startIndex + 1}-{Math.min(endIndex, recentActivities.length)} de {recentActivities.length}
                        </Text>
                      </View>

                      <TouchableOpacity 
                        style={[
                          styles.paginationButton, 
                          currentActivityPage === totalActivityPages && styles.paginationButtonDisabled
                        ]}
                        onPress={goToNextActivityPage}
                        disabled={currentActivityPage === totalActivityPages}
                      >
                        <ChevronRight size={16} color={currentActivityPage === totalActivityPages ? Colors.neutral[400] : Colors.primary[500]} />
                      </TouchableOpacity>
                    </View>
                  )}
                </>
              )}
            </View>
          </Animated.View>
        )}




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
    backgroundColor: '#04506B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.white,
    fontWeight: 'bold',
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[200],
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    marginLeft: 8,
    borderWidth: 2,
    borderColor: Colors.primary[500],
    backgroundColor: Colors.white,
  },
  avatar: {
    width: '100%',
    height: '100%',
    
  },
  fixedTopSellingSection: {
    paddingHorizontal: 12, // 25% menor (16 * 0.75 = 12)
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    paddingBottom: 8, // Reduzido para menos espaço embaixo
    paddingTop: 8, // Adicionado padding top menor
    minHeight: 220, // Reduzido para compactar mais
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
    fontSize: 16,
    color: Colors.neutral[900],
    marginTop: 0, // Remove margin top do título na seção fixa
    marginBottom: 0, // Remove margin bottom do título na seção fixa
    fontWeight: 'bold',
  },
  sectionTitleWithMargin: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
    marginTop: 24, // Espaço em cima para separar dos cards
    marginBottom: 16, // Espaço embaixo normal
    fontWeight: 'bold',
  },
  communicationsSection: {
    marginTop: 0, // Container sem margin extra
  },
  cardsContainer: {
    gap: 16,
  },
  activitiesContainer: {
    marginBottom: 8,
  },
  activitiesAnimatedContainer: {
    width: '100%',
  },
  activityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
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
    fontSize: 12,
    color: Colors.neutral[900],
  },
  activityLojaName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: Colors.primary[600],
    marginTop: 2,
    marginBottom: 4,
  },
  activityDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[500],
    marginTop: 4,
  },
  activityTime: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[500],
  },
  topSellingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 16,
  },
  topSellingHeaderSimple: {
    marginTop: 0, // Remove espaço em cima do título
    marginBottom: 8, // Reduz espaço embaixo do título
  },
  topSellingWithArrows: {
    position: 'relative',
    alignItems: 'center',
    height: 190, // Reduzido para menos espaço
    marginTop: 0, // Remove margin top
  },
  arrowButton: {
    position: 'absolute',
    width: 21, // 25% menor (28 * 0.75 = 21)
    height: 21, // 25% menor (28 * 0.75 = 21)
    borderRadius: 11, // 25% menor (14 * 0.75 = 10.5 ≈ 11)
    backgroundColor: 'rgba(4, 80, 107, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    top: '40%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
  },
  leftArrow: {
    left: 6, // 25% menor (8 * 0.75 = 6)
  },
  rightArrow: {
    right: 6, // 25% menor (8 * 0.75 = 6)
  },
  arrowButtonDisabled: {
    backgroundColor: 'rgba(156, 163, 175, 0.6)',
    opacity: 0.5,
  },
  navigationButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  navButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  navButtonDisabled: {
    backgroundColor: Colors.neutral[50],
    borderColor: Colors.neutral[200],
  },

  loadingContainer: {
    height: 150, // 25% menor (200 * 0.75 = 150)
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSellingContainer: {
    paddingRight: 16,
    backgroundColor: 'transparent',
  },
  topSellingItem: {
    width: 120, // 25% menor (160 * 0.75 = 120)
    marginRight: 12, // 25% menor (16 * 0.75 = 12)
    backgroundColor: Colors.neutral[50],
    borderRadius: 23, // 25% menor (30 * 0.75 = 22.5 ≈ 23)
    padding: 12, // 25% menor (16 * 0.75 = 12)
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  hotIndicator: {
    position: 'absolute',
    top: 4,
    left: 4,
    backgroundColor: Colors.warning[500],
    borderRadius: 12,
    padding: 4,
    zIndex: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  hotIndicatorText: {
    color: Colors.white,
    fontSize: 8,
    fontFamily: 'Inter-Bold',
  },
  topSellingImage: {
    width: '100%',
    height: 105, // 25% menor (140 * 0.75 = 105)
    borderRadius: 9, // 25% menor (12 * 0.75 = 9)
    marginBottom: 9, // 25% menor (12 * 0.75 = 9)
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  productInfo: {
    flex: 1,
  },
  productCode: {
    fontFamily: 'Inter-Bold',
    fontSize: 8, // 25% menor (10 * 0.75 = 7.5 ≈ 8)
    color: Colors.neutral[800],
    textAlign: 'center',
    marginBottom: 5, // 25% menor (6 * 0.75 = 4.5 ≈ 5)
    backgroundColor: Colors.neutral[100],
    paddingVertical: 3, // 25% menor (4 * 0.75 = 3)
    borderRadius: 5, // 25% menor (6 * 0.75 = 4.5 ≈ 5)
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  productDescription: {
    fontFamily: 'Inter-Medium',
    fontSize: 8, // 25% menor (10 * 0.75 = 7.5 ≈ 8)
    color: Colors.neutral[700],
    marginBottom: 6, // 25% menor (8 * 0.75 = 6)
    lineHeight: 12, // 25% menor (16 * 0.75 = 12)
    minHeight: 24, // 25% menor (32 * 0.75 = 24)
  },
  totalSales: {
    fontFamily: 'Inter-Bold',
    fontSize: 8, // 25% menor (10 * 0.75 = 7.5 ≈ 8)
    color: Colors.primary[600],
    textAlign: 'center',
    backgroundColor: Colors.primary[50],
    paddingVertical: 5, // 25% menor (6 * 0.75 = 4.5 ≈ 5)
    paddingHorizontal: 6, // 25% menor (8 * 0.75 = 6)
    borderRadius: 6, // 25% menor (8 * 0.75 = 6)
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },

  ruptureContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    // Sombra para Android
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
    fontFamily: 'Inter-SemiBold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    width: '90%',
    maxWidth: 400,
    padding: 20,
  },
  avatarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  avatarModalTitle: {
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
  avatarGrid: {
    padding: 10,
  },
  avatarOption: {
    width: 80,
    height: 80,
    margin: 10,
    borderRadius: 40,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: Colors.neutral[200],
  },
  selectedAvatar: {
    borderColor: Colors.primary[500],
    borderWidth: 3,
  },
  avatarOptionImage: {
    width: '100%',
    height: '100%',
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
  chartContainer: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Sombra para Android
    elevation: Platform.OS === 'android' ? 6 : 0,
  },
  chartLoadingContainer: {
    minHeight: 180,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    marginVertical: 8,
  },
  chartLoadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[500],
  },
  chart: {
    marginTop: 16,
    alignSelf: 'center',
  },
  disabledCycle: {
    backgroundColor: Colors.neutral[50],
    borderColor: Colors.neutral[300],
    opacity: 0.5,
  },
  disabledCycleText: {
    color: Colors.neutral[400],
    fontFamily: 'Inter-Regular',
  },
  activitiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  activitiesCount: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[500],
    backgroundColor: Colors.neutral[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  paginationButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  paginationButtonDisabled: {
    backgroundColor: Colors.neutral[50],
    borderColor: Colors.neutral[200],
  },
  paginationInfo: {
    alignItems: 'center',
  },
  paginationText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.neutral[900],
  },
  paginationSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[500],
    marginTop: 2,
  },

  // Estilos do Modal de Produto - Versão Compacta
  productModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20, // -4px (24 -> 20)
    width: '92%',
    maxWidth: 420,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
  },
  productModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20, // -4px (24 -> 20)
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
    backgroundColor: Colors.neutral[50],
    borderTopLeftRadius: 20, // -4px (24 -> 20)
    borderTopRightRadius: 20, // -4px (24 -> 20)
  },
  productModalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 14, // -4px (18 -> 14)
    color: Colors.neutral[900],
  },
  productModalBody: {
    padding: 0,
  },

  // Header Section com imagem e badges
  productModalHeaderSection: {
    alignItems: 'center',
    padding: 20, // -4px (24 -> 20)
    backgroundColor: Colors.neutral[50],
  },
  productModalImageLarge: {
    width: 120, // -20px proporcional (140 -> 120)
    height: 120, // -20px proporcional (140 -> 120)
    borderRadius: 14, // -2px (16 -> 14)
    backgroundColor: Colors.white,
    borderWidth: 2,
    borderColor: Colors.neutral[200],
    marginBottom: 12, // -4px (16 -> 12)
  },
  productModalHeaderInfo: {
    alignItems: 'center',
    width: '100%',
  },
  productModalBadgeContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8, // -4px (12 -> 8)
  },
  productModalRankBadge: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 8, // -4px (12 -> 8)
    paddingVertical: 2, // -4px (6 -> 2)
    borderRadius: 18, // -2px (20 -> 18)
  },
  productModalRankText: {
    fontFamily: 'Inter-Bold',
    fontSize: 8, // -4px (12 -> 8)
    color: Colors.white,
  },
  productModalPromoBadge: {
    backgroundColor: Colors.success[500],
    paddingHorizontal: 8, // -4px (12 -> 8)
    paddingVertical: 2, // -4px (6 -> 2)
    borderRadius: 18, // -2px (20 -> 18)
  },
  productModalPromoText: {
    fontFamily: 'Inter-Bold',
    fontSize: 6, // -4px (10 -> 6)
    color: Colors.white,
  },
  productModalLaunchBadge: {
    backgroundColor: Colors.warning[500],
    paddingHorizontal: 8, // -4px (12 -> 8)
    paddingVertical: 2, // -4px (6 -> 2)
    borderRadius: 18, // -2px (20 -> 18)
  },
  productModalLaunchText: {
    fontFamily: 'Inter-Bold',
    fontSize: 6, // -4px (10 -> 6)
    color: Colors.white,
  },
  productModalCodeNew: {
    fontFamily: 'Inter-Bold',
    fontSize: 14, // -4px (18 -> 14)
    color: Colors.neutral[900],
    backgroundColor: Colors.white,
    paddingHorizontal: 12, // -4px (16 -> 12)
    paddingVertical: 4, // -4px (8 -> 4)
    borderRadius: 10, // -2px (12 -> 10)
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },

  // Seção de Descrição
  productModalDescriptionSection: {
    padding: 16, // -4px (20 -> 16)
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  productModalDescriptionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10, // -4px (14 -> 10)
    color: Colors.neutral[600],
    marginBottom: 4, // -4px (8 -> 4)
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  productModalDescriptionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10, // -4px (14 -> 10)
    color: Colors.neutral[800],
    lineHeight: 16, // -4px (20 -> 16)
  },

  // Seção de Estatísticas
  productModalStatsSection: {
    flexDirection: 'row',
    padding: 16, // -4px (20 -> 16)
    gap: 8, // -4px (12 -> 8)
  },
  productModalStatsSectionWithBorder: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  productModalStatCard: {
    flex: 1,
    backgroundColor: Colors.white,
    padding: 12, // -4px (16 -> 12)
    borderRadius: 14, // -2px (16 -> 14)
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productModalStatNumber: {
    fontFamily: 'Inter-Bold',
    fontSize: 16, // -4px (20 -> 16)
    color: Colors.primary[600],
    marginBottom: 0, // -4px (4 -> 0)
  },
  productModalStatLabelNew: {
    fontFamily: 'Inter-Medium',
    fontSize: 7, // -4px (11 -> 7)
    color: Colors.neutral[600],
    textAlign: 'center',
  },

  // Seção de Promoções
  productModalPromotionsSection: {
    padding: 16, // -4px (20 -> 16)
  },
  productModalSectionTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 12, // -4px (16 -> 12)
    color: Colors.neutral[900],
    marginBottom: 12, // -4px (16 -> 12)
  },
  productModalPromotionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8, // -4px (12 -> 8)
    justifyContent: 'center',
  },
  productModalDiscountCard: {
    backgroundColor: Colors.warning[500],
    paddingHorizontal: 16, // -4px (20 -> 16)
    paddingVertical: 8, // -4px (12 -> 8)
    borderRadius: 14, // -2px (16 -> 14)
    alignItems: 'center',
    minWidth: 76, // -4px (80 -> 76)
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productModalDiscountSource: {
    fontFamily: 'Inter-Bold',
    fontSize: 6, // Pequeno para identificação
    color: Colors.white,
    opacity: 0.8,
    marginBottom: 2,
  },
  productModalDiscountValue: {
    fontFamily: 'Inter-Black',
    fontSize: 14, // -4px (18 -> 14)
    color: Colors.white,
  },
  productModalDiscountLabel: {
    fontFamily: 'Inter-Bold',
    fontSize: 6, // -4px (10 -> 6)
    color: Colors.white,
    marginTop: 2,
  },

});