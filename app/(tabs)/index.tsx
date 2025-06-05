import React, { useEffect, useState } from 'react';
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
  Platform
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChartBar as BarChart2, LogOut, Search, TrendingUp, TrendingDown, Package, Archive, Truck, ChevronRight, Store, User, Bell, MessageSquare } from 'lucide-react-native';
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

interface TopSellingProduct {
  code: string;
  description: string;
  image: string;
  totalSales: number;
  position: number;
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
      const response = await fetch('https://api.grupoginseng.com.br/bestsellers');
      const data: BestSellerResponse = await response.json();
      
      const mappedProducts = data.bestsellers.map((product, index) => ({
        code: product.code,
        description: product.descricao,
        image: `https://sgi.e-boticario.com.br/Paginas/Imagens/Produtos/${product.code}g.jpg`,
        totalSales: product.vendas,
        position: index + 1 // Posição baseada no índice da array (1° mais vendido, 2° mais vendido, etc.)
      }));

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

  useEffect(() => {
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

    loadSelectedAvatar();
  }, []);

  const handleAvatarSelect = async (avatarNumber: AvatarKey) => {
    try {
      await AsyncStorage.setItem('selectedAvatar', avatarNumber.toString());
      setSelectedAvatar(avatarNumber);
      setShowAvatarModal(false);
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
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
            onPress={() => router.push('/feedback')}
          >
            <MessageSquare size={22} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={handleLogout}>
            <LogOut size={22} color={Colors.white} />
          </TouchableOpacity>
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



      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Mais vendidos - Primeiro */}
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <View style={styles.topSellingHeader}>
            <Text style={styles.sectionTitle}>Mais vendidos</Text>
            <View style={styles.slideButton}>
              <Text style={styles.slideButtonText}>Deslize para ver mais</Text>
              <ChevronRight size={16} color={Colors.neutral[500]} />
            </View>
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
              style={{ backgroundColor: 'transparent' }}
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
                  <CachedImage 
                    uri={product.image}
                    style={styles.topSellingImage}
                  />
                  <View style={styles.productInfo}>
                    <Text style={styles.productCode}>{product.code}</Text>
                    <Text style={styles.productDescription} numberOfLines={2}>
                      {product.description}
                    </Text>
                    <Text style={styles.totalSales}>
                      {product.totalSales} vendas
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </Animated.View>

        {/* Últimos Comunicados - Segundo */}
        <Animated.View entering={FadeInDown.duration(400).delay(200)}>
          <Text style={styles.sectionTitle}>Últimos Comunicados</Text>
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

        {/* Atividades recentes - Terceiro */}
        <Animated.View entering={FadeInDown.duration(400).delay(300)}>
          <Text style={styles.sectionTitle}>Atividades recentes</Text>
          <View style={styles.activitiesContainer}>
            <TouchableOpacity style={styles.activityCard}>
              <View style={[styles.activityIconContainer, { backgroundColor: Colors.primary[50] }]}>
                <Package size={20} color={Colors.primary[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Transferência Incluída PDV 20998</Text>
                <Text style={styles.activityDescription}>84 produtos adicionados</Text>
              </View>
              <Text style={styles.activityTime}>13:45</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.activityCard}>
              <View style={[styles.activityIconContainer, { backgroundColor: Colors.info[50] }]}>
                <Archive size={20} color={Colors.info[500]} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityTitle}>Nota Faturada PDV 20998</Text>
                <Text style={styles.activityDescription}>Previsão de entrega 22/05/2025</Text>
              </View>
              <Text style={styles.activityTime}>09:30</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Gráfico Histórico - Quarto */}
        <Animated.View entering={FadeInDown.duration(400).delay(400)}>
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
                        color: (opacity = 1) => `rgba(4, 80, 107, ${opacity})`, // Cor da linha
                        strokeWidth: 3, // Espessura da linha
                      },
                    ],
                    legend: ['% Ruptura Causa Franqueado'],
                  }}
                  width={Dimensions.get('window').width * 0.8} // 80% da largura da tela
                  height={180} // Altura reduzida
                  yAxisSuffix="%"
                  yAxisInterval={1} // Intervalos no eixo Y
                  chartConfig={{
                    backgroundColor: Colors.white,
                    backgroundGradientFrom: Colors.white,
                    backgroundGradientTo: Colors.white,
                    decimalPlaces: 1, // Casas decimais
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
                      strokeDasharray: '', // Linhas sólidas
                      stroke: Colors.neutral[200],
                    },
                  }}
                  bezier // Curva suave
                  style={styles.chart}
                />
              );
            })()}
          </View>
        </Animated.View>

        {/* Resumo Ruptura - Quinto */}
        <Animated.View entering={FadeInDown.duration(400).delay(500)}>
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
                  <Text style={styles.ruptureValue}>Carregando...</Text>
                ) : (
                  <>
                    <View style={styles.ruptureValueRow}>
                      <Text style={styles.ruptureValueLabel}>Ruptura Total:</Text>
                      <AnimatedPercentage value={ruptureData?.totalDisruptionPercentage} delay={0} />
                    </View>
                    <View style={[styles.ruptureValueRow, styles.highlightedRow]}>
                      <Text style={[styles.ruptureValueLabel, styles.highlightedText]}>Causa Franqueado:</Text>
                      <AnimatedPercentage value={ruptureData?.franchiseDisruptionPercentage} delay={200} />
                    </View>
                    <View style={styles.ruptureValueRow}>
                      <Text style={styles.ruptureValueLabel}>Causa Industria:</Text>
                      <AnimatedPercentage value={ruptureData?.industryDisruptionPercentage} delay={400} />
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
                  <Text style={styles.ruptureValue}>Carregando...</Text>
                ) : (
                  <>
                    <View style={styles.ruptureValueRow}>
                      <Text style={styles.ruptureValueLabel}>Ruptura Total:</Text>
                      <AnimatedPercentage value={currentCycleData?.totalDisruptionPercentage} delay={600} />
                    </View>
                    <View style={[styles.ruptureValueRow, styles.highlightedRow]}>
                      <Text style={[styles.ruptureValueLabel, styles.highlightedText]}>Causa Franqueado:</Text>
                      <AnimatedPercentage value={currentCycleData?.franchiseDisruptionPercentage} delay={800} />
                    </View>
                    <View style={styles.ruptureValueRow}>
                      <Text style={styles.ruptureValueLabel}>Causa Industria:</Text>
                      <AnimatedPercentage value={currentCycleData?.industryDisruptionPercentage} delay={1000} />
                    </View>
                  </>
                )}
              </View>
            </View>
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
    backgroundColor: '#04506B',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  greeting: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.white,
  },
  date: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
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
    gap: 16,
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
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    // Sombra para Android
    elevation: Platform.OS === 'android' ? 6 : 0,
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
  slideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: Colors.neutral[100],
    borderRadius: 16,
  },
  slideButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[500],
  },

  loadingContainer: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  topSellingContainer: {
    paddingRight: 16,
    backgroundColor: 'transparent',
  },
  topSellingItem: {
    width: 180,
    marginRight: 16,
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    // Sombra para iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    // Sombra para Android
    elevation: Platform.OS === 'android' ? 12 : 0,
  },
  topSellingImage: {
    width: '100%',
    height: 140,
    borderRadius: 12,
    marginBottom: 12,
  },
  productInfo: {
    flex: 1,
  },
  productCode: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.neutral[800],
    textAlign: 'center',
    marginBottom: 6,
    backgroundColor: Colors.neutral[100],
    paddingVertical: 4,
    borderRadius: 6,
  },
  productDescription: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[700],
    marginBottom: 8,
    lineHeight: 16,
    minHeight: 32,
  },
  totalSales: {
    fontFamily: 'Inter-Bold',
    fontSize: 14,
    color: Colors.primary[600],
    textAlign: 'center',
    backgroundColor: Colors.primary[50],
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
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
    fontSize: 16,
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
    fontSize: 12,
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
    fontSize: 14,
    color: Colors.neutral[600],
  },
  ruptureValueNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
  },
  ruptureValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
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

});