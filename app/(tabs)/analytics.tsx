import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Modal,
  Pressable,
  TextInput,
  FlatList,
  Platform,
  Alert,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Share
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon, Clock, Users, MapPin, ChevronRight, Check, Plus, Info, Trash2, RefreshCw, Share2 } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';

interface APIReserva {
  id: number;
  data_reserva: string;
  horario_inicio: string;
  horario_fim: string;
  nome_responsavel: string;
  departamento: string;
  descricao: string;
  sala_nome: string;
  sala_id: string;
  status: string;
  created_at: string;
  updated_at: string;
  criado_por?: string;
  microsoft_event_id?: string; // ID do evento no calendário Microsoft (agora salvo no banco)
}

interface APIResponse {
  data: APIReserva[];
}

interface Room {
  id: string;
  name: string;
  capacity: number;
  floor: string;
  isAvailable: boolean;
  priority?: string;
  bookingInfo?: {
    responsibleName: string;
    department: string;
    description: string;
  };
  slotCounts?: {
    available: number;
    occupied: number;
    total: number;
  };
}

interface TimeSlot {
  id: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

interface BookingInfo {
  responsibleName: string;
  department: string;
  description: string;
  title: string; // Título da reunião
  participants: string; // Emails separados por vírgula
}

const API_BASE_URL = 'https://api.grupoginseng.com.br';

// Função para formatar data local (evitar problemas de fuso horário)
const formatDateLocal = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Função para obter data inicial inteligente
const getInitialDate = () => {
  const now = new Date();
  const currentHour = now.getHours();
  
  // Se já passou das 18h, automaticamente vai para o próximo dia
  if (currentHour >= 18) {
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow;
  }
  
  return now;
};

// Função para obter data mínima (início do dia atual)
const getMinimumDate = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Início do dia
  return today;
};

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(getInitialDate());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [selectedTimeSlots, setSelectedTimeSlots] = useState<string[]>([]);
  const [bookingInfo, setBookingInfo] = useState<BookingInfo>({
    responsibleName: '',
    department: '',
    description: '',
    title: '',
    participants: ''
  });
  const [reservas, setReservas] = useState<APIReserva[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingBooking, setSubmittingBooking] = useState(false);
  const [showMyBookingsModal, setShowMyBookingsModal] = useState(false);
  const [myBookings, setMyBookings] = useState<APIReserva[]>([]);
  const [loadingMyBookings, setLoadingMyBookings] = useState(false);
  const [deletingBooking, setDeletingBooking] = useState<number | null>(null);
  const [loadingRoomData, setLoadingRoomData] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(3);

  const [timeSlotFilter, setTimeSlotFilter] = useState<'available' | 'occupied'>('available');
  const [occupiedSlotsPage, setOccupiedSlotsPage] = useState(1);
  const [availableSlotsPage, setAvailableSlotsPage] = useState(1);
  const [slotsPerPage] = useState(5);
  
  // Estados para autocomplete de usuários do Azure AD
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);
  const [showUserSuggestions, setShowUserSuggestions] = useState(false);
  const [searchingUsers, setSearchingUsers] = useState(false);
  const [participantInput, setParticipantInput] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<any[]>([]);
  
  // Usando nome do usuário logado do contexto de autenticação
  const currentUser = user?.name || 'Usuário';

  // Função para fechar modal de booking de forma segura
  const closeBookingModal = () => {
    console.log('=== INICIANDO FECHAMENTO SEGURO DO MODAL DE BOOKING ===');
    try {
      setShowBookingModal(false);
      // Não limpar os dados do formulário aqui para preservar o que o usuário digitou
      console.log('Modal de booking fechado com sucesso');
    } catch (error) {
      console.error('Erro ao fechar modal de booking:', error);
    }
  };



  const rooms: Room[] = [
    { 
      id: '1', 
      name: 'SALA 1', 
      capacity: 10, 
      floor: 'Andar Principal', 
      isAvailable: true,
      priority: 'João Marcelo'
    },
    { 
      id: '2', 
      name: 'SALA 2', 
      capacity: 7, 
      floor: 'Andar Principal', 
      isAvailable: true
    },
    { 
      id: '3', 
      name: 'SALA 3', 
      capacity: 6, 
      floor: 'Andar Principal', 
      isAvailable: true 
    },
    { 
      id: '5', 
      name: 'SALA 5', 
      capacity: 8, 
      floor: 'Térreo', 
      isAvailable: true
    },
    { 
      id: '6', 
      name: 'SALA 6', 
      capacity: 9, 
      floor: 'Térreo', 
      isAvailable: true 
    },
    { 
      id: '7', 
      name: 'SALA INDIVIDUAL', 
      capacity: 1, 
      floor: 'Andar Principal', 
      isAvailable: true 
    },
  ];

  const timeSlots: TimeSlot[] = [
    { id: '1', startTime: '08:00', endTime: '08:30', isAvailable: true },
    { id: '2', startTime: '08:30', endTime: '09:00', isAvailable: true },
    { id: '3', startTime: '09:00', endTime: '09:30', isAvailable: true },
    { id: '4', startTime: '09:30', endTime: '10:00', isAvailable: true },
    { id: '5', startTime: '10:00', endTime: '10:30', isAvailable: true },
    { id: '6', startTime: '10:30', endTime: '11:00', isAvailable: true },
    { id: '7', startTime: '11:00', endTime: '11:30', isAvailable: true },
    { id: '8', startTime: '11:30', endTime: '12:00', isAvailable: true },
    { id: '9', startTime: '13:00', endTime: '13:30', isAvailable: true },
    { id: '10', startTime: '13:30', endTime: '14:00', isAvailable: true },
    { id: '11', startTime: '14:00', endTime: '14:30', isAvailable: true },
    { id: '12', startTime: '14:30', endTime: '15:00', isAvailable: true },
    { id: '13', startTime: '15:00', endTime: '15:30', isAvailable: true },
    { id: '14', startTime: '15:30', endTime: '16:00', isAvailable: true },
    { id: '15', startTime: '16:00', endTime: '16:30', isAvailable: true },
    { id: '16', startTime: '16:30', endTime: '17:00', isAvailable: true },
    { id: '17', startTime: '17:00', endTime: '17:30', isAvailable: true },
    { id: '18', startTime: '17:30', endTime: '18:00', isAvailable: true },
  ];

  // Buscar reservas da API
  const fetchReservas = async (date?: Date) => {
    try {
      setLoading(true);
      const targetDate = date || selectedDate;
      const dateString = formatDateLocal(targetDate);
      
      console.log('Buscando reservas para a data:', dateString);
      
      const response = await fetch(`${API_BASE_URL}/reservas`);
      const data: APIResponse = await response.json();
      
      // Filtrar apenas as reservas da data selecionada para otimizar performance
      const reservasDoData = data.data?.filter(reserva => {
        const reservaDate = reserva.data_reserva.split('T')[0];
        return reservaDate === dateString;
      }) || [];
      
      console.log(`Encontradas ${reservasDoData.length} reservas para ${dateString}`);
      
      setReservas(data.data || []); // Manter todas as reservas no estado para outras operações
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as reservas');
    } finally {
      setLoading(false);
    }
  };

  // Função para limpar eventos órfãos do AsyncStorage
  const cleanupOrphanedCalendarEvents = async () => {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const calendarKeys = allKeys.filter(key => key.startsWith('calendar_'));
      
      console.log(`Encontradas ${calendarKeys.length} chaves de calendário no AsyncStorage`);
      
      // Limpar chaves de eventos muito antigos (mais de 30 dias)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      for (const key of calendarKeys) {
        try {
          // Extrair data da chave (formato: calendar_salaId_YYYY-MM-DD_horario_usuario)
          const parts = key.split('_');
          if (parts.length >= 3) {
            const eventDate = new Date(parts[2]);
            if (eventDate < thirtyDaysAgo) {
              await AsyncStorage.removeItem(key);
              console.log(`Removida chave antiga: ${key}`);
            }
          }
        } catch (e) {
          // Se der erro na chave, removê-la
          await AsyncStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.log('Erro ao limpar eventos órfãos:', error);
    }
  };

  useEffect(() => {
    fetchReservas();
    cleanupOrphanedCalendarEvents(); // Limpeza ao iniciar
  }, []);

  // Buscar reservas sempre que a data mudar
  useEffect(() => {
    if (selectedDate) {
      console.log('Data alterada, buscando novas reservas...');
      fetchReservas(selectedDate);
    }
  }, [selectedDate]);

  // Debug: monitorar mudanças no estado do modal de booking
  useEffect(() => {
    console.log('Estado showBookingModal mudou para:', showBookingModal);
  }, [showBookingModal]);

  // Debounce para busca de usuários
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (participantInput.trim()) {
        searchAzureADUsers(participantInput.trim());
      } else {
        setUserSuggestions([]);
        setShowUserSuggestions(false);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [participantInput]);

  // Função para criar evento no calendário Microsoft
  const createMicrosoftCalendarEvent = async (reservaData: any, userEmail: string, participantEmails: string[] = [], meetingTitle: string = '') => {
    try {
      console.log('Criando evento no calendário Microsoft...');
      
      // Verificar se temos token disponível
      const authToken = await getAuthToken(); // Função para buscar token de autenticação
      if (!authToken) {
        console.log('⚠️ Token de autenticação não disponível para calendário');
        return null;
      }
      
      // Construir dados do evento
      const startDateTime = `${reservaData.data_reserva}T${reservaData.horario_inicio}`;
      const endDateTime = `${reservaData.data_reserva}T${reservaData.horario_fim}`;
      
      // Construir lista de participantes
      const attendees = [
        // Responsável principal
        {
          emailAddress: {
            address: userEmail,
            name: reservaData.nome_responsavel
          },
          type: 'required'
        }
      ];

      // Adicionar outros participantes
      participantEmails.forEach(email => {
        attendees.push({
          emailAddress: {
            address: email,
            name: email.split('@')[0].replace('.', ' ').replace(/\b\w/g, l => l.toUpperCase())
          },
          type: 'optional'
        });
      });

      const eventData = {
        subject: meetingTitle || `Reunião - ${reservaData.sala_nome}`,
        start: {
          dateTime: startDateTime,
          timeZone: 'America/Maceio'
        },
        end: {
          dateTime: endDateTime,
          timeZone: 'America/Maceio'
        },
        location: {
          displayName: reservaData.sala_nome,
          locationUri: '',
          locationType: 'conferenceRoom'
        },
        body: {
          contentType: 'html',
          content: `
            <div>
              <h3>Agendamento de Sala - ${reservaData.sala_nome}</h3>
              <p><strong>Responsável:</strong> ${reservaData.nome_responsavel}</p>
              <p><strong>Departamento:</strong> ${reservaData.departamento}</p>
              ${reservaData.descricao ? `<p><strong>Descrição:</strong> ${reservaData.descricao}</p>` : ''}
              ${participantEmails.length > 0 ? `<p><strong>Participantes:</strong> ${participantEmails.join(', ')}</p>` : ''}
              <p><strong>Data:</strong> ${new Date(reservaData.data_reserva).toLocaleDateString('pt-BR')}</p>
              <p><strong>Horário:</strong> ${reservaData.horario_inicio} - ${reservaData.horario_fim}</p>
              <hr>
              <p><em>Agendamento criado automaticamente pelo Ginseng APP</em></p>
            </div>
          `
        },
        attendees: attendees,
        isOnlineMeeting: true,
        onlineMeetingProvider: 'teamsForBusiness',
        allowNewTimeProposals: false,
        responseRequested: true // Mudado para true para solicitar resposta dos participantes
      };

      // Fazer requisição para Microsoft Graph API
      const response = await fetch('https://graph.microsoft.com/v1.0/me/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(eventData)
      });

      if (response.ok) {
        const event = await response.json();
        console.log('✅ Evento criado no calendário Microsoft:', event.id);
        return event.id;
      } else {
        const error = await response.text();
        console.error('❌ Erro ao criar evento no calendário:', error);
        return null;
      }
    } catch (error) {
      console.error('❌ Erro de rede ao criar evento no calendário:', error);
      return null;
    }
  };

  // Função auxiliar para obter token de autenticação
  const getAuthToken = async () => {
    try {
      // Tentar buscar token do AsyncStorage ou contexto de autenticação
      const token = await AsyncStorage.getItem('microsoftToken');
      return token;
    } catch (error) {
      console.error('Erro ao buscar token de autenticação:', error);
      return null;
    }
  };

  // Função para processar emails de participantes
  const processParticipantEmails = (participantsString: string) => {
    if (!participantsString.trim()) {
      return [];
    }

    const participants = participantsString
      .split(',')
      .map(email => email.trim())
      .filter(email => email.length > 0)
      .map(email => {
        // Se já tem @, usar como está, senão adicionar domínio
        if (email.includes('@')) {
          return email;
        } else {
          return `${email}@grupoginseng.com.br`;
        }
      })
      .filter(email => {
        // Validar que é do domínio correto
        return email.endsWith('@grupoginseng.com.br') && email.length > '@grupoginseng.com.br'.length;
      });

    // Remover duplicatas
    return [...new Set(participants)];
  };

  // Função para buscar usuários do Azure AD
  const searchAzureADUsers = async (searchTerm: string) => {
    if (!searchTerm || searchTerm.length < 2) {
      setUserSuggestions([]);
      setShowUserSuggestions(false);
      return;
    }

    try {
      setSearchingUsers(true);
      const authToken = await getAuthToken();
      
      if (!authToken) {
        console.log('Token não disponível para busca de usuários');
        return;
      }

      // Query mais simples e compatível - buscar usuários com filtro básico
      const encodedSearchTerm = encodeURIComponent(searchTerm);
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users?$search="displayName:${encodedSearchTerm}" OR "mail:${encodedSearchTerm}"&$select=id,displayName,mail,userPrincipalName&$top=10&$count=true`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json',
            'ConsistencyLevel': 'eventual'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const users = data.value || [];
        
        // Filtrar apenas usuários do domínio grupoginseng.com.br
        const filteredUsers = users.filter((user: any) => 
          user.mail && 
          user.mail.toLowerCase().includes('@grupoginseng.com.br') &&
          !selectedParticipants.some(selected => selected.mail === user.mail)
        );
        
        setUserSuggestions(filteredUsers);
        setShowUserSuggestions(filteredUsers.length > 0);
        
        console.log(`Encontrados ${filteredUsers.length} usuários para "${searchTerm}"`);
      } else {
        const errorText = await response.text();
        console.error('Erro ao buscar usuários:', response.status, errorText);
        
        // Fallback: buscar sem $search (método mais básico)
        await searchUsersFallback(searchTerm, authToken);
      }
    } catch (error) {
      console.error('Erro na busca de usuários:', error);
      
      // Tentar método fallback
      const authToken = await getAuthToken();
      if (authToken) {
        await searchUsersFallback(searchTerm, authToken);
      }
    } finally {
      setSearchingUsers(false);
    }
  };

  // Método fallback mais simples para busca de usuários
  const searchUsersFallback = async (searchTerm: string, authToken: string) => {
    try {
      console.log('Tentando busca com método fallback...');
      
      // Método mais básico - buscar todos os usuários e filtrar localmente
      const response = await fetch(
        `https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName&$top=50`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const users = data.value || [];
        
        // Filtrar localmente
        const filteredUsers = users.filter((user: any) => {
          const isGinsengDomain = user.mail && user.mail.toLowerCase().includes('@grupoginseng.com.br');
          const matchesSearch = 
            (user.displayName && user.displayName.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (user.mail && user.mail.toLowerCase().includes(searchTerm.toLowerCase()));
          const notAlreadySelected = !selectedParticipants.some(selected => selected.mail === user.mail);
          
          return isGinsengDomain && matchesSearch && notAlreadySelected;
        }).slice(0, 10); // Limitar a 10 resultados
        
        setUserSuggestions(filteredUsers);
        setShowUserSuggestions(filteredUsers.length > 0);
        
        console.log(`Método fallback: encontrados ${filteredUsers.length} usuários para "${searchTerm}"`);
      } else {
        console.error('Erro no método fallback:', response.status);
        setUserSuggestions([]);
        setShowUserSuggestions(false);
      }
    } catch (error) {
      console.error('Erro no método fallback:', error);
      setUserSuggestions([]);
      setShowUserSuggestions(false);
    }
  };

  // Função para adicionar participante selecionado
  const addParticipant = (user: any) => {
    if (!selectedParticipants.some(p => p.mail === user.mail)) {
      setSelectedParticipants(prev => [...prev, user]);
      
      // Atualizar o campo participants no bookingInfo
      const emails = [...selectedParticipants, user].map(p => p.mail).join(', ');
      setBookingInfo(prev => ({ ...prev, participants: emails }));
    }
    
    setParticipantInput('');
    setShowUserSuggestions(false);
    setUserSuggestions([]);
  };

  // Função para remover participante
  const removeParticipant = (userToRemove: any) => {
    const updatedParticipants = selectedParticipants.filter(p => p.mail !== userToRemove.mail);
    setSelectedParticipants(updatedParticipants);
    
    // Atualizar o campo participants no bookingInfo
    const emails = updatedParticipants.map(p => p.mail).join(', ');
    setBookingInfo(prev => ({ ...prev, participants: emails }));
  };

  // Função para deletar evento do calendário Microsoft
  const deleteMicrosoftCalendarEvent = async (eventId: string) => {
    try {
      const authToken = await getAuthToken();
      if (!authToken || !eventId) {
        return false;
      }

      const response = await fetch(`https://graph.microsoft.com/v1.0/me/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        console.log('✅ Evento removido do calendário Microsoft');
        return true;
      } else {
        console.error('❌ Erro ao remover evento do calendário');
        return false;
      }
    } catch (error) {
      console.error('❌ Erro de rede ao remover evento do calendário:', error);
      return false;
    }
  };

  // Função para buscar eventos no calendário por título/data (backup quando não temos o ID)
  const findCalendarEventByReserva = async (reserva: APIReserva) => {
    try {
      const authToken = await getAuthToken();
      if (!authToken) {
        return null;
      }

      // Buscar eventos do dia da reserva
      const startDate = reserva.data_reserva.split('T')[0];
      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + 1);
      const endDateString = endDate.toISOString().split('T')[0];

      const response = await fetch(
        `https://graph.microsoft.com/v1.0/me/calendar/calendarView?startDateTime=${startDate}T00:00:00&endDateTime=${endDateString}T00:00:00&$filter=contains(subject,'${reserva.sala_nome}')`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        const events = data.value || [];
        
        // Procurar evento que coincida com horário e sala
        const matchingEvent = events.find((event: any) => {
          const eventStart = new Date(event.start.dateTime).toTimeString().substring(0, 5);
          const reservaStart = reserva.horario_inicio.split('T')[1].substring(0, 5);
          return eventStart === reservaStart && event.subject.includes(reserva.sala_nome);
        });

        return matchingEvent?.id || null;
      }
    } catch (error) {
      console.error('Erro ao buscar evento no calendário:', error);
    }
    return null;
  };

  // Buscar reserva recém-criada pelos dados únicos
  const findRecentReserva = async (reservaData: any) => {
    try {
      console.log('Buscando reserva recém-criada...');
      console.log('Dados de busca:', {
        data_reserva: reservaData.data_reserva,
        horario_inicio: reservaData.horario_inicio,
        horario_fim: reservaData.horario_fim,
        sala_id: reservaData.sala_id,
        criado_por: reservaData.criado_por
      });
      
      const response = await fetch(`${API_BASE_URL}/reservas`);
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data: APIResponse = await response.json();
      console.log(`Total de reservas na API: ${data.data?.length || 0}`);
      
      // Buscar a reserva que foi criada há poucos segundos com os mesmos dados
      const now = new Date();
      
      // Filtrar reservas que coincidem com os dados
      const matchingReservas = data.data?.filter(reserva => {
        const dataMatch = reserva.data_reserva.split('T')[0] === reservaData.data_reserva;
        const horaInicioMatch = reserva.horario_inicio.includes(reservaData.horario_inicio);
        const horaFimMatch = reserva.horario_fim.includes(reservaData.horario_fim);
        const salaMatch = reserva.sala_id === reservaData.sala_id;
        const usuarioMatch = reserva.criado_por === reservaData.criado_por;
        const statusMatch = reserva.status === 'ativa';
        
        console.log(`Reserva ID ${reserva.id}:`, {
          dataMatch,
          horaInicioMatch,
          horaFimMatch,
          salaMatch,
          usuarioMatch,
          statusMatch,
          created_at: reserva.created_at
        });
        
        return dataMatch && horaInicioMatch && horaFimMatch && salaMatch && usuarioMatch && statusMatch;
      });
      
      console.log(`Reservas correspondentes encontradas: ${matchingReservas?.length || 0}`);
      
      if (matchingReservas && matchingReservas.length > 0) {
        // Pegar a mais recente se houver múltiplas
        const recentReserva = matchingReservas.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )[0];
        
        console.log('✅ Reserva encontrada:', recentReserva.id, 'criada em:', recentReserva.created_at);
        return recentReserva.id;
      } else {
        console.log('⚠️ Nenhuma reserva correspondente encontrada');
        return null;
      }
    } catch (error) {
      console.error('❌ Erro ao buscar reserva recém-criada:', error);
      return null;
    }
  };

  // Atualizar reserva com ID do evento do calendário Microsoft
  const updateReservaWithEventId = async (reservaId: number, eventId: string) => {
    try {
      console.log(`Atualizando reserva ${reservaId} com evento ID: ${eventId}`);
      
      const response = await fetch(`${API_BASE_URL}/reservas/${reservaId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          microsoft_event_id: eventId
        }),
      });

      if (response.ok) {
        console.log('✅ ID do evento salvo no banco de dados');
        return true;
      } else {
        console.error('❌ Erro ao salvar ID do evento no banco:', response.status);
        return false;
      }
    } catch (error) {
      console.error('❌ Erro de rede ao salvar ID do evento:', error);
      return false;
    }
  };

  // Criar nova reserva (versão silenciosa para uso em lote)
  const createReservaSilent = async (reservaData: any) => {
    try {
      console.log('Enviando dados para API:', reservaData);
      console.log('URL da API:', `${API_BASE_URL}/reservas`);
      
      const response = await fetch(`${API_BASE_URL}/reservas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reservaData),
      });

      console.log('Status da resposta:', response.status);
      console.log('Status text:', response.statusText);

      if (response.ok) {
        let responseData;
        try {
          responseData = await response.json();
          console.log('Reserva criada com sucesso:', responseData);
          console.log('Estrutura completa da resposta:', JSON.stringify(responseData, null, 2));
          
          // Tentar diferentes formas de extrair o ID
          const reservaId = responseData?.id || 
                           responseData?.data?.id || 
                           responseData?.reserva?.id ||
                           responseData?.insertId ||
                           responseData?.lastInsertId;
          
          if (reservaId && typeof reservaId === 'number') {
            console.log('✅ ID da reserva extraído:', reservaId);
            return reservaId;
          } else {
            console.log('⚠️ ID da reserva não encontrado na resposta, estrutura:', Object.keys(responseData || {}));
            return true; // Fallback para AsyncStorage
          }
        } catch (e) {
          console.log('Resposta não é JSON válido, mas request foi bem-sucedido');
          return true;
        }
      } else {
        // Tentar ler o erro da API
        let errorMessage = `Erro HTTP ${response.status} - ${response.statusText}`;
        try {
          const errorData = await response.text();
          console.log('Erro da API:', errorData);
          if (errorData) {
            errorMessage += `\n\nDetalhes: ${errorData}`;
          }
        } catch (e) {
          console.log('Não foi possível ler o erro da API');
        }
        console.error('Erro na API:', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Erro de rede ou conexão:', error);
      return false;
    }
  };

  // Criar nova reserva
  const createReserva = async (reservaData: any) => {
    try {
      setSubmittingBooking(true);
      
      const success = await createReservaSilent(reservaData);
      
      if (success) {
        Alert.alert('Sucesso', 'Reserva criada com sucesso!');
        fetchReservas(); // Recarregar as reservas
        return true;
      } else {
        Alert.alert('Erro', 'Não foi possível criar a reserva');
        return false;
      }
    } catch (error) {
      console.error('Erro geral na criação de reserva:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado');
      return false;
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Verificar se um horário está ocupado para uma sala específica em uma data
  const isTimeSlotOccupied = (salaId: string, timeSlot: TimeSlot, date: Date) => {
    const dateString = formatDateLocal(date);
    
    return reservas.some(reserva => {
      const reservaDate = reserva.data_reserva.split('T')[0];
      const reservaStartTime = reserva.horario_inicio.split('T')[1]?.substring(0, 5) || 
                              reserva.horario_inicio.substring(reserva.horario_inicio.length - 8, reserva.horario_inicio.length - 3);
      const reservaEndTime = reserva.horario_fim.split('T')[1]?.substring(0, 5) || 
                            reserva.horario_fim.substring(reserva.horario_fim.length - 8, reserva.horario_fim.length - 3);
      
      return reserva.sala_id === salaId && 
             reservaDate === dateString &&
             reserva.status === 'ativa' &&
             (
               (timeSlot.startTime >= reservaStartTime && timeSlot.startTime < reservaEndTime) ||
               (timeSlot.endTime > reservaStartTime && timeSlot.endTime <= reservaEndTime) ||
               (timeSlot.startTime <= reservaStartTime && timeSlot.endTime >= reservaEndTime)
             );
    });
  };

  // Obter informações da reserva para uma sala em um horário específico
  const getBookingInfo = (salaId: string, date: Date) => {
    const dateString = formatDateLocal(date);
    
    const reserva = reservas.find(reserva => {
      const reservaDate = reserva.data_reserva.split('T')[0];
      return reserva.sala_id === salaId && 
             reservaDate === dateString &&
             reserva.status === 'ativa';
    });

    if (reserva) {
      return {
        responsibleName: reserva.nome_responsavel,
        department: reserva.departamento,
        description: reserva.descricao
      };
    }
    return undefined;
  };

  // Obter informações da reserva para um horário específico
  const getTimeSlotBookingInfo = (salaId: string, timeSlot: TimeSlot, date: Date) => {
    const dateString = formatDateLocal(date);
    
    const reserva = reservas.find(reserva => {
      const reservaDate = reserva.data_reserva.split('T')[0];
      const reservaStartTime = reserva.horario_inicio.split('T')[1]?.substring(0, 5) || 
                              reserva.horario_inicio.substring(reserva.horario_inicio.length - 8, reserva.horario_inicio.length - 3);
      const reservaEndTime = reserva.horario_fim.split('T')[1]?.substring(0, 5) || 
                            reserva.horario_fim.substring(reserva.horario_fim.length - 8, reserva.horario_fim.length - 3);
      
      return reserva.sala_id === salaId && 
             reservaDate === dateString &&
             reserva.status === 'ativa' &&
             (
               (timeSlot.startTime >= reservaStartTime && timeSlot.startTime < reservaEndTime) ||
               (timeSlot.endTime > reservaStartTime && timeSlot.endTime <= reservaEndTime) ||
               (timeSlot.startTime <= reservaStartTime && timeSlot.endTime >= reservaEndTime)
             );
    });

    if (reserva) {
      return {
        responsibleName: reserva.nome_responsavel,
        department: reserva.departamento,
        description: reserva.descricao
      };
    }
    return undefined;
  };

  // Contar horários disponíveis e ocupados para uma sala
  const getSlotCounts = (roomId: string, date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Filtrar apenas os horários que ainda não passaram (se for hoje)
    const validTimeSlots = timeSlots.filter(slot => {
      if (isToday) {
        const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
        
        // Se o horário já passou, não contar
        if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
          return false;
        }
      }
      return true;
    });

    const availableSlots = validTimeSlots.filter(slot => !isTimeSlotOccupied(roomId, slot, date));
    const occupiedSlots = validTimeSlots.filter(slot => isTimeSlotOccupied(roomId, slot, date));
    
    return {
      available: availableSlots.length,
      occupied: occupiedSlots.length,
      total: validTimeSlots.length
    };
  };

  // Atualizar as salas com base nas reservas
  const getUpdatedRooms = () => {
    return rooms.map(room => {
      const bookingInfo = getBookingInfo(room.id, selectedDate);
      const slotCounts = getSlotCounts(room.id, selectedDate);
      const allSlotsOccupied = slotCounts.available === 0;

      return {
        ...room,
        isAvailable: !allSlotsOccupied,
        bookingInfo,
        slotCounts
      };
    });
  };

  // Atualizar os horários com base nas reservas para a sala selecionada
  const getUpdatedTimeSlots = () => {
    if (!selectedRoom) return timeSlots;

    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    return timeSlots
      .filter(slot => {
        // Se for hoje, ocultar horários que já passaram
        if (isToday) {
          const [slotHour, slotMinute] = slot.startTime.split(':').map(Number);
          
          // Se o horário já passou, não mostrar na lista
          if (slotHour < currentHour || (slotHour === currentHour && slotMinute <= currentMinute)) {
            return false;
          }
        }
        return true;
      })
      .map(slot => ({
        ...slot,
        isAvailable: !isTimeSlotOccupied(selectedRoom.id, slot, selectedDate),
      }));
  };

  // Verificar se precisa avançar automaticamente para o próximo dia
  const checkAndAdvanceDate = () => {
    const now = new Date();
    const isToday = selectedDate.toDateString() === now.toDateString();
    
    if (isToday) {
      const currentHour = now.getHours();
      
      // Se já passou das 18h, avançar para o próximo dia
      if (currentHour >= 18) {
        const tomorrow = new Date(selectedDate);
        tomorrow.setDate(tomorrow.getDate() + 1);
        setSelectedDate(tomorrow);
        return true;
      }
    }
    
    return false;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const minimumDate = getMinimumDate();
      
      // Verificar se a data selecionada não é anterior a hoje
      if (selectedDate >= minimumDate) {
        setSelectedDate(selectedDate);
      } else {
        // Se tentar selecionar data passada, manter a data atual
        console.log('Data passada selecionada, mantendo data atual');
      }
    }
  };

  const toggleTimeSlot = (slotId: string) => {
    setSelectedTimeSlots(prev => 
      prev.includes(slotId)
        ? prev.filter(id => id !== slotId)
        : [...prev, slotId]
    );
  };

  const handleBooking = () => {
    if (selectedTimeSlots.length === 0) {
      // Mostrar mensagem de erro
      return;
    }
    setShowRoomModal(false);
    setShowBookingModal(true);
  };

  const submitBooking = async () => {
    if (!selectedRoom || selectedTimeSlots.length === 0) {
      Alert.alert('Erro', 'Selecione uma sala e pelo menos um horário');
      return;
    }

    if (!bookingInfo.department.trim() || !bookingInfo.title.trim()) {
      Alert.alert('Erro', 'Preencha o departamento e o título da reunião');
      return;
    }

    // Validar emails dos participantes
    if (bookingInfo.participants.trim()) {
      const participantEmails = processParticipantEmails(bookingInfo.participants);
      const originalEmails = bookingInfo.participants.split(',').map(e => e.trim()).filter(e => e.length > 0);
      
      if (participantEmails.length !== originalEmails.length) {
        const invalidEmails = originalEmails.filter(original => 
          !participantEmails.some(valid => 
            valid === original || valid === `${original}@grupoginseng.com.br`
          )
        );
        
        Alert.alert(
          'Emails Inválidos', 
          `Os seguintes emails não são válidos ou não são do domínio @grupoginseng.com.br:\n\n${invalidEmails.join(', ')}\n\nDeseja continuar sem esses participantes?`,
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Continuar', onPress: () => continueBooking() }
          ]
        );
        return;
      }
    }

    continueBooking();
  };

     const continueBooking = async () => {
      if (!selectedRoom) {
        Alert.alert('Erro', 'Nenhuma sala selecionada');
        return;
      }

      try {
        setSubmittingBooking(true);

        console.log('=== INÍCIO DO ENVIO DE RESERVA ===');
        console.log('Sala selecionada:', selectedRoom);
        console.log('Data selecionada:', selectedDate);
        console.log('Horários selecionados:', selectedTimeSlots);
        console.log('Informações da reserva:', bookingInfo);

      let successCount = 0;
      let failCount = 0;

      // Criar uma reserva para cada horário selecionado
      for (const timeSlotId of selectedTimeSlots) {
        const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
        if (!timeSlot) {
          console.log('TimeSlot não encontrado:', timeSlotId);
          failCount++;
          continue;
        }

        // Processar participantes para o calendário Microsoft
        const participantEmails = processParticipantEmails(bookingInfo.participants);

        const reservaData = {
          data_reserva: formatDateLocal(selectedDate),
          horario_inicio: timeSlot.startTime + ':00',
          horario_fim: timeSlot.endTime + ':00',
          nome_responsavel: user?.name || currentUser,
          departamento: bookingInfo.department.trim(),
          descricao: bookingInfo.title.trim(),
          sala_nome: selectedRoom.name,
          sala_id: selectedRoom.id,
          status: 'ativa',
          criado_por: currentUser,
          microsoft_event_id: null // Será atualizado após criar o evento
        };

        console.log('Dados da reserva preparados:', reservaData);

        const reservaResult = await createReservaSilent(reservaData); // Usar versão silenciosa
        if (reservaResult) {
          successCount++;
          const reservaId = typeof reservaResult === 'number' ? reservaResult : null;
          
          // Tentar criar evento no calendário Microsoft (não bloquear se falhar)
          try {
            const userEmail = user?.email || `${(user?.name || currentUser).toLowerCase().replace(/\s+/g, '.')}@grupoginseng.com.br`;
            
            // Processar emails dos participantes
            const participantEmails = processParticipantEmails(bookingInfo.participants);
            console.log('Participantes processados:', participantEmails);
            
            const calendarEventId = await createMicrosoftCalendarEvent(reservaData, userEmail, participantEmails, bookingInfo.title);
            
            if (calendarEventId) {
              console.log('✅ Evento criado no calendário:', calendarEventId);
              
              // Se temos o ID da reserva direto da API, usar
              if (reservaId) {
                console.log('Usando ID da reserva da API:', reservaId);
                await updateReservaWithEventId(reservaId, calendarEventId);
              } else {
                console.log('Tentando encontrar a reserva recém-criada...');
                
                // Fazer até 3 tentativas com intervalos crescentes
                let foundReservaId = null;
                for (let attempt = 1; attempt <= 3; attempt++) {
                  console.log(`Tentativa ${attempt}/3 de buscar a reserva...`);
                  await new Promise(resolve => setTimeout(resolve, attempt * 1000)); // 1s, 2s, 3s
                  
                  foundReservaId = await findRecentReserva(reservaData);
                  if (foundReservaId) {
                    break;
                  }
                }
                
                if (foundReservaId) {
                  console.log('✅ Reserva encontrada, salvando ID do evento no banco');
                  await updateReservaWithEventId(foundReservaId, calendarEventId);
                } else {
                  console.log('⚠️ Reserva não encontrada após 3 tentativas, usando AsyncStorage como fallback');
                  // Fallback para AsyncStorage se não conseguir encontrar a reserva
                  const reservaKey = `calendar_${reservaData.sala_id}_${reservaData.data_reserva}_${reservaData.horario_inicio}_${currentUser}`;
                  await AsyncStorage.setItem(reservaKey, calendarEventId);
                }
              }
            }
          } catch (calendarError) {
            console.log('Aviso: Não foi possível criar evento no calendário:', calendarError);
            // Não interromper o processo principal
          }
        } else {
          failCount++;
          console.log('Falha ao criar reserva para horário:', timeSlot.startTime);
        }
      }

      console.log('=== PROCESSO DE RESERVAS FINALIZADO ===');
      console.log(`Sucessos: ${successCount}, Falhas: ${failCount}`);

      // Mostrar apenas um alert com o resultado final
      if (successCount > 0 && failCount === 0) {
        // Alert.alert('Sucesso', `${successCount} horário(s) reservado(s) com sucesso!`);
      } else if (successCount > 0 && failCount > 0) {
        Alert.alert('Parcialmente Concluído', `${successCount} horário(s) reservado(s) com sucesso, ${failCount} falharam.`);
      } else {
        Alert.alert('Erro', 'Não foi possível criar nenhuma reserva.');
        return;
      }

      // Recarregar dados
      await fetchReservas();

      // Limpar formulário e fechar modals apenas se houve algum sucesso
      if (successCount > 0) {
        setShowBookingModal(false);
        setSelectedTimeSlots([]);
        setBookingInfo({
          responsibleName: '',
          department: '',
          description: '',
          title: '',
          participants: ''
        });
        setSelectedParticipants([]);
        setParticipantInput('');
        setShowUserSuggestions(false);
        setUserSuggestions([]);
      }

    } catch (error) {
      console.error('Erro geral no processo de reserva:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Compartilhar reunião
  const shareBooking = async (booking: APIReserva) => {
    try {
      const startTime = booking.horario_inicio.split('T')[1].substring(0, 5);
      const endTime = booking.horario_fim.split('T')[1].substring(0, 5);
      const bookingDate = new Date(booking.data_reserva).toLocaleDateString('pt-BR');
      
      // Tentar buscar o link do evento do calendário Microsoft
      let calendarLink = '';
      try {
        // Priorizar o ID salvo no banco de dados
        let calendarEventId = booking.microsoft_event_id;
        
        // Fallback para AsyncStorage se não tiver no banco (reservas antigas)
        if (!calendarEventId) {
          const reservaKey = `calendar_${booking.sala_id}_${booking.data_reserva.split('T')[0]}_${startTime}:00_${currentUser}`;
          const asyncStorageEventId = await AsyncStorage.getItem(reservaKey);
          if (asyncStorageEventId) {
            calendarEventId = asyncStorageEventId;
          }
        }
        
        if (calendarEventId) {
          // Link direto para o evento no Outlook Web
          calendarLink = `\n\n🔗 Abrir no Outlook: https://outlook.office.com/calendar/item/${calendarEventId}`;
        }
      } catch (error) {
        console.log('Não foi possível obter link do calendário:', error);
      }
      
      const shareMessage = `📅 *Reunião Agendada*

🏢 *Sala:* ${booking.sala_nome}
📋 *Título:* ${booking.descricao}
👤 *Responsável:* ${booking.nome_responsavel}
🏷️ *Departamento:* ${booking.departamento}

📅 *Data:* ${bookingDate}
⏰ *Horário:* ${startTime} - ${endTime}

Agendado via Ginseng APP${calendarLink}`;

      const result = await Share.share({
        message: shareMessage,
        title: `Reunião - ${booking.sala_nome}`,
      });

      if (result.action === Share.sharedAction) {
        console.log('Reunião compartilhada com sucesso');
      }
    } catch (error) {
      console.error('Erro ao compartilhar reunião:', error);
      Alert.alert('Erro', 'Não foi possível compartilhar a reunião');
    }
  };

  // Excluir agendamento
  const deleteBooking = async (bookingId: number) => {
    Alert.alert(
      'Excluir Agendamento',
      'Tem certeza que deseja excluir este agendamento?',
      [
        {
          text: 'Cancelar',
          style: 'cancel',
        },
        {
          text: 'Excluir',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingBooking(bookingId);
              console.log('Excluindo agendamento:', bookingId);
              
              // Primeiro, encontrar os dados da reserva para poder deletar do calendário
              const reservaParaDeletar = myBookings.find(booking => booking.id === bookingId);
              
              const response = await fetch(`${API_BASE_URL}/reservas/${bookingId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                              // Se conseguiu excluir da API, tentar excluir do calendário Microsoft
              if (reservaParaDeletar) {
                try {
                  console.log('Tentando excluir evento do calendário Microsoft...');
                  
                  // Priorizar o ID salvo no banco de dados
                  let calendarEventId = reservaParaDeletar.microsoft_event_id;
                  
                  if (calendarEventId) {
                    console.log('ID do evento encontrado no banco de dados:', calendarEventId);
                    const deletedFromCalendar = await deleteMicrosoftCalendarEvent(calendarEventId);
                    
                    if (deletedFromCalendar) {
                      console.log('✅ Evento excluído do calendário Microsoft');
                    } else {
                      console.log('⚠️ Não foi possível excluir do calendário Microsoft');
                    }
                  } else {
                    console.log('ℹ️ ID do evento não encontrado no banco, tentando AsyncStorage como fallback...');
                    
                    // Fallback: tentar buscar no AsyncStorage (para reservas antigas)
                    const reservaKey = `calendar_${reservaParaDeletar.sala_id}_${reservaParaDeletar.data_reserva.split('T')[0]}_${reservaParaDeletar.horario_inicio.split('T')[1].substring(0, 5)}:00_${currentUser}`;
                    const asyncStorageEventId = await AsyncStorage.getItem(reservaKey);
                    
                    if (asyncStorageEventId) {
                      console.log('ID do evento encontrado no AsyncStorage:', asyncStorageEventId);
                      const deletedFromCalendar = await deleteMicrosoftCalendarEvent(asyncStorageEventId);
                      
                      if (deletedFromCalendar) {
                        console.log('✅ Evento excluído do calendário Microsoft');
                        // Remover a chave do AsyncStorage
                        await AsyncStorage.removeItem(reservaKey);
                      } else {
                        console.log('⚠️ Não foi possível excluir do calendário Microsoft');
                      }
                    } else {
                      console.log('ℹ️ ID do evento não encontrado, tentando buscar no calendário...');
                      
                      // Último recurso: tentar buscar o evento no calendário Microsoft
                      const foundEventId = await findCalendarEventByReserva(reservaParaDeletar);
                      
                      if (foundEventId) {
                        console.log('ID do evento encontrado no calendário:', foundEventId);
                        const deletedFromCalendar = await deleteMicrosoftCalendarEvent(foundEventId);
                        
                        if (deletedFromCalendar) {
                          console.log('✅ Evento encontrado e excluído do calendário Microsoft');
                        } else {
                          console.log('⚠️ Evento encontrado mas não foi possível excluir');
                        }
                      } else {
                        console.log('ℹ️ Evento não encontrado no calendário Microsoft');
                      }
                    }
                  }
                  } catch (calendarError) {
                    console.log('⚠️ Erro ao tentar excluir do calendário:', calendarError);
                    // Não impedir a operação principal se houver erro no calendário
                  }
                }
                
                fetchMyBookings(); // Recarregar lista
                fetchReservas(); // Recarregar reservas gerais
                
                // Feedback visual para o usuário
                // Alert.alert('Sucesso', 'Agendamento excluído com sucesso!', [{ text: 'OK' }]);
              } else {
                throw new Error(`Erro HTTP ${response.status}`);
              }
            } catch (error) {
              console.error('Erro ao excluir agendamento:', error);
              Alert.alert('Erro', 'Não foi possível excluir o agendamento');
            } finally {
              setDeletingBooking(null);
            }
          },
        },
      ],
    );
  };

  // Buscar agendamentos do usuário atual
  const fetchMyBookings = async () => {
    try {
      setLoadingMyBookings(true);
      
      // Pegar o nome do usuário logado
      const nomeUsuario = user?.name || 'Usuário';
      
      // Buscar todas as reservas da API
      const response = await fetch(`${API_BASE_URL}/reservas`);
      if (!response.ok) {
        throw new Error(`Erro na API: ${response.status}`);
      }
      
      const data: APIResponse = await response.json();
      
      const now = new Date();
      const currentDate = formatDateLocal(now);
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Filtrar apenas os agendamentos criados por este usuário que ainda não passaram
      const agendamentosDoUsuario = data.data?.filter(reserva => {
        // Primeiro filtro: deve ser do usuário atual e estar ativo
        if (reserva.criado_por !== nomeUsuario || reserva.status !== 'ativa') {
          return false;
        }
        
        const reservaDate = reserva.data_reserva.split('T')[0];
        
        // Se a reserva é de um dia futuro, sempre mostrar
        if (reservaDate > currentDate) {
          return true;
        }
        
        // Se a reserva é de um dia passado, não mostrar
        if (reservaDate < currentDate) {
          return false;
        }
        
        // Se a reserva é de hoje, verificar se ainda não passou
        if (reservaDate === currentDate) {
          const horarioFim = reserva.horario_fim.split('T')[1].substring(0, 5);
          const [endHour, endMinute] = horarioFim.split(':').map(Number);
          
          // Se o horário de fim já passou, não mostrar
          if (endHour < currentHour || (endHour === currentHour && endMinute <= currentMinute)) {
            return false;
          }
        }
        
        return true;
      }) || [];
      
      // Ordenar por data e horário (mais próximos primeiro)
      agendamentosDoUsuario.sort((a, b) => {
        const dataA = new Date(a.data_reserva + ' ' + a.horario_inicio.split('T')[1]);
        const dataB = new Date(b.data_reserva + ' ' + b.horario_inicio.split('T')[1]);
        return dataA.getTime() - dataB.getTime();
      });
      
      // Atualizar o estado
      setMyBookings(agendamentosDoUsuario);
      
    } catch (error) {
      console.error('Erro ao buscar agendamentos do usuário:', error);
      Alert.alert('Erro', 'Não foi possível carregar seus agendamentos. Verifique sua conexão.');
      setMyBookings([]);
    } finally {
      setLoadingMyBookings(false);
    }
  };

  // Funções para paginação
  const totalPages = Math.ceil(myBookings.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentBookings = myBookings.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  const resetPagination = () => {
    setCurrentPage(1);
  };

  // Obter salas atualizadas com dados da API
  const updatedRooms = getUpdatedRooms();
  const updatedTimeSlots = getUpdatedTimeSlots();

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Agendamento de Salas</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary[500]} />
          <Text style={styles.loadingText}>Carregando reservas...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Agendamento de Salas</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            onPress={() => {
              setShowMyBookingsModal(true);
              fetchMyBookings();
              resetPagination();
            }}
            style={[styles.refreshButton, styles.refreshIconButton]}
          >
            <CalendarIcon size={20} color={Colors.white} />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={async () => {
              // Teste simples de permissões
              try {
                const authToken = await getAuthToken();
                console.log('🔍 Testando busca de usuários...');
                
                const response = await fetch('https://graph.microsoft.com/v1.0/users?$top=3&$select=displayName,mail', {
                  headers: {
                    'Authorization': `Bearer ${authToken}`,
                    'Content-Type': 'application/json'
                  }
                });
                
                if (response.ok) {
                  const data = await response.json();
                  console.log('✅ Sucesso! Usuários encontrados:', data.value?.length || 0);
                  data.value?.forEach((user: any) => {
                    console.log(' -', user.displayName, '|', user.mail);
                  });
                } else {
                  const error = await response.text();
                  console.log('❌ Erro:', response.status, error);
                }
              } catch (error) {
                console.error('❌ Erro no teste:', error);
              }
            }}
            style={[styles.refreshButton, styles.refreshIconButton]}
          >
            <RefreshCw size={20} color={Colors.white} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInDown.duration(400).delay(100)}>
          <TouchableOpacity 
            style={styles.dateSelector}
            onPress={() => setShowDatePicker(true)}
          >
            <CalendarIcon size={20} color={Colors.primary[500]} />
            <Text style={styles.dateText}>{formatDate(selectedDate)}</Text>
            <ChevronRight size={20} color={Colors.neutral[500]} />
          </TouchableOpacity>

          <View style={styles.roomsContainer}>
            {updatedRooms.map((room) => (
              <TouchableOpacity
                key={room.id}
                style={[
                  styles.roomCard,
                  room.isAvailable === false && styles.roomCardUnavailable,
                  loadingRoomData && styles.roomCardLoading
                ]}
                disabled={loadingRoomData}
                onPress={async () => {
                  // Verificar se precisa avançar a data automaticamente
                  checkAndAdvanceDate();
                  
                  console.log('Atualizando dados das reservas ao clicar na sala:', room.name);
                  
                  // Atualizar dados das reservas antes de abrir o modal
                  setLoadingRoomData(true);
                  await fetchReservas();
                  setLoadingRoomData(false);
                  
                  console.log('Dados atualizados, abrindo modal da sala:', room.name);
                  
                  setSelectedRoom(room);
                  setTimeSlotFilter('available'); // Resetar filtro ao abrir modal
                  setOccupiedSlotsPage(1); // Resetar página de ocupados
                  setAvailableSlotsPage(1); // Resetar página de disponíveis
                  setShowRoomModal(true);
                }}
              >
                <View style={styles.roomInfo}>
                  <Text style={styles.roomName}>{room.name}</Text>
                  <View style={styles.roomDetails}>
                    <View style={styles.roomDetail}>
                      <Users size={16} color={Colors.neutral[500]} />
                      <Text style={styles.roomDetailText}>{room.capacity} pessoas</Text>
                    </View>
                    <View style={styles.roomDetail}>
                      <MapPin size={16} color={Colors.neutral[500]} />
                      <Text style={styles.roomDetailText}>{room.floor}</Text>
                    </View>
                  </View>
                  {room.priority && (
                    <View style={styles.priorityContainer}>
                      <Text style={styles.priorityText}>Prioridade: {room.priority}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.roomStatus}>
                  {room.slotCounts && (
                    <View style={styles.slotCountsContainer}>
                      <Text style={styles.slotCountsTitle}>Horários:</Text>
                      <View style={styles.slotCountsRow}>
                        <View style={styles.slotCount}>
                          <Text style={[styles.slotCountNumber, styles.availableText]}>
                            {room.slotCounts.available}
                          </Text>
                          <Text style={styles.slotCountLabel}>Disponíveis</Text>
                        </View>
                        <View style={styles.slotCount}>
                          <Text style={[styles.slotCountNumber, styles.occupiedText]}>
                            {room.slotCounts.occupied}
                          </Text>
                          <Text style={styles.slotCountLabel}>Ocupados</Text>
                        </View>
                      </View>
                    </View>
                  )}
                  {loadingRoomData ? (
                    <ActivityIndicator size="small" color={Colors.primary[500]} />
                  ) : (
                    <ChevronRight size={20} color={Colors.neutral[400]} />
                  )}
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </Animated.View>
      </ScrollView>

      {showDatePicker && (
        <Modal
          visible={showDatePicker}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowDatePicker(false)}
        >
          <Pressable 
            style={styles.dateModalOverlay}
            onPress={() => setShowDatePicker(false)}
          >
            <View style={styles.dateModalContent}>
              <View style={styles.dateModalHeader}>
                <Text style={styles.dateModalTitle}>Selecionar Data</Text>
                <TouchableOpacity 
                  onPress={() => setShowDatePicker(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              <View style={styles.quickDateContainer}>
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => {
                    setSelectedDate(new Date());
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.quickDateText}>Hoje</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.quickDateButton}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    setSelectedDate(tomorrow);
                    setShowDatePicker(false);
                  }}
                >
                  <Text style={styles.quickDateText}>Amanhã</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.datePickerContainer}>
                {Platform.OS === 'ios' ? (
                  <DateTimePicker
                    value={selectedDate}
                    mode="date"
                    display="compact"
                    onChange={onDateChange}
                    minimumDate={getMinimumDate()}
                    locale="pt-BR"
                  />
                ) : (
                  <TouchableOpacity 
                    style={styles.androidDateButton}
                    onPress={async () => {
                      try {
                        const { DateTimePickerAndroid } = require('@react-native-community/datetimepicker');
                        const { action, year, month, day } = await DateTimePickerAndroid.open({
                          value: selectedDate,
                          onChange: onDateChange,
                          mode: 'date',
                          minimumDate: getMinimumDate(),
                        });
                        if (action !== DateTimePickerAndroid.dismissedAction && year && month !== undefined && day) {
                          const newDate = new Date(year, month, day);
                          setSelectedDate(newDate);
                        }
                        setShowDatePicker(false);
                      } catch (error) {
                        console.log('Erro ao abrir DatePicker:', error);
                        setShowDatePicker(false);
                      }
                    }}
                  >
                    <CalendarIcon size={24} color={Colors.primary[500]} />
                    <Text style={styles.androidDateButtonText}>
                      {selectedDate.toLocaleDateString('pt-BR')}
                    </Text>
                    <Text style={styles.androidDateButtonSubtext}>
                      Toque para alterar
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
              
              <View style={styles.dateModalButtons}>
                <TouchableOpacity 
                  style={styles.dateModalButton}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={styles.dateModalButtonText}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.dateModalButton, styles.dateModalButtonPrimary]}
                  onPress={() => setShowDatePicker(false)}
                >
                  <Text style={[styles.dateModalButtonText, styles.dateModalButtonTextPrimary]}>Confirmar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Pressable>
        </Modal>
      )}

      <Modal
        visible={showRoomModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          setShowRoomModal(false);
          setSelectedTimeSlots([]);
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackground}
            onPress={() => {
              setShowRoomModal(false);
              setSelectedTimeSlots([]);
            }}
          />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>{selectedRoom?.name}</Text>
                <TouchableOpacity 
                  onPress={() => {
                    setShowRoomModal(false);
                    setSelectedTimeSlots([]);
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.timeSlotsContainer}>
                <Text style={styles.timeSlotsTitle}>Horários:</Text>
                
                {/* Botões de filtro */}
                <View style={styles.filterButtonsContainer}>
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      timeSlotFilter === 'available' && styles.filterButtonActive
                    ]}
                    onPress={() => {
                      console.log('Filtro disponível selecionado');
                      setTimeSlotFilter('available');
                      setAvailableSlotsPage(1); // Reset página
                    }}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      timeSlotFilter === 'available' && styles.filterButtonTextActive
                    ]}>
                      Disponível
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.filterButton,
                      timeSlotFilter === 'occupied' && styles.filterButtonActive
                    ]}
                    onPress={() => {
                      console.log('Filtro ocupado selecionado');
                      setTimeSlotFilter('occupied');
                      setOccupiedSlotsPage(1); // Reset página
                    }}
                  >
                    <Text style={[
                      styles.filterButtonText,
                      timeSlotFilter === 'occupied' && styles.filterButtonTextActive
                    ]}>
                      Ocupado
                    </Text>
                  </TouchableOpacity>
                  

                </View>
                
{timeSlotFilter === 'occupied' ? (
                  // Paginação para horários ocupados
                  <>
                    <View style={{ minHeight: 250 }}>
                      {(() => {
                        const occupiedSlots = updatedTimeSlots.filter(slot => !slot.isAvailable);
                        const totalOccupiedPages = Math.ceil(occupiedSlots.length / slotsPerPage);
                        const startIndex = (occupiedSlotsPage - 1) * slotsPerPage;
                        const endIndex = startIndex + slotsPerPage;
                        const currentOccupiedSlots = occupiedSlots.slice(startIndex, endIndex);
                        
                        return currentOccupiedSlots.map((slot) => {
                          const bookingInfo = selectedRoom ? 
                            getTimeSlotBookingInfo(selectedRoom.id, slot, selectedDate) : null;
                          
                          return (
                            <View key={slot.id} style={[styles.timeSlot, styles.timeSlotUnavailable]}>
                              <Clock size={16} color={Colors.neutral[500]} />
                              <Text style={styles.timeSlotText}>
                                {slot.startTime} - {slot.endTime}
                              </Text>
                              <View style={styles.timeSlotInfo}>
                                {bookingInfo && (
                                  <Text style={styles.bookingInfoText}>
                                    Ocupado - {bookingInfo.responsibleName} - {bookingInfo.department}
                                  </Text>
                                )}
                                {!bookingInfo && (
                                  <Text style={styles.bookingInfoText}>Ocupado</Text>
                                )}
                              </View>
                            </View>
                          );
                        });
                      })()}
                    </View>
                    
                    {/* Paginação para horários ocupados */}
                    {(() => {
                      const occupiedSlots = updatedTimeSlots.filter(slot => !slot.isAvailable);
                      const totalOccupiedPages = Math.ceil(occupiedSlots.length / slotsPerPage);
                      
                      if (totalOccupiedPages > 1) {
                        return (
                          <View style={styles.paginationContainer}>
                            <TouchableOpacity 
                              onPress={() => {
                                if (occupiedSlotsPage > 1) {
                                  setOccupiedSlotsPage(occupiedSlotsPage - 1);
                                }
                              }}
                              style={[
                                styles.paginationButton,
                                occupiedSlotsPage === 1 && styles.paginationButtonDisabled
                              ]}
                              disabled={occupiedSlotsPage === 1}
                            >
                              <Text style={[
                                styles.paginationButtonText,
                                occupiedSlotsPage === 1 && styles.paginationButtonTextDisabled
                              ]}>Anterior</Text>
                            </TouchableOpacity>
                            <Text style={styles.paginationText}>
                              Página {occupiedSlotsPage} de {totalOccupiedPages}
                            </Text>
                            <TouchableOpacity 
                              onPress={() => {
                                if (occupiedSlotsPage < totalOccupiedPages) {
                                  setOccupiedSlotsPage(occupiedSlotsPage + 1);
                                }
                              }}
                              style={[
                                styles.paginationButton,
                                occupiedSlotsPage === totalOccupiedPages && styles.paginationButtonDisabled
                              ]}
                              disabled={occupiedSlotsPage === totalOccupiedPages}
                            >
                              <Text style={[
                                styles.paginationButtonText,
                                occupiedSlotsPage === totalOccupiedPages && styles.paginationButtonTextDisabled
                              ]}>Próximo</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </>
                ) : (
                  // Paginação para horários disponíveis (mesmo layout que ocupados)
                  <>
                    <View style={{ minHeight: 250 }}>
                      {(() => {
                        const availableSlots = updatedTimeSlots.filter(slot => slot.isAvailable);
                        const totalAvailablePages = Math.ceil(availableSlots.length / slotsPerPage);
                        const startIndex = (availableSlotsPage - 1) * slotsPerPage;
                        const endIndex = startIndex + slotsPerPage;
                        const currentAvailableSlots = availableSlots.slice(startIndex, endIndex);
                        
                        return currentAvailableSlots.map((slot) => {
                          return (
                            <TouchableOpacity
                              key={slot.id}
                              style={[
                                styles.timeSlot,
                                selectedTimeSlots.includes(slot.id) && styles.timeSlotSelected
                              ]}
                              onPress={() => toggleTimeSlot(slot.id)}
                            >
                              <Clock size={16} color={Colors.neutral[500]} />
                              <Text style={styles.timeSlotText}>
                                {slot.startTime} - {slot.endTime}
                              </Text>
                              <View style={styles.timeSlotInfo}>
                                {/* Slot disponível */}
                              </View>
                              {selectedTimeSlots.includes(slot.id) && (
                                <Check size={20} color={Colors.primary[500]} />
                              )}
                            </TouchableOpacity>
                          );
                        });
                      })()}
                    </View>
                    
                    {/* Paginação para horários disponíveis */}
                    {(() => {
                      const availableSlots = updatedTimeSlots.filter(slot => slot.isAvailable);
                      const totalAvailablePages = Math.ceil(availableSlots.length / slotsPerPage);
                      
                      if (totalAvailablePages > 1) {
                        return (
                          <View style={styles.paginationContainer}>
                            <TouchableOpacity 
                              onPress={() => {
                                if (availableSlotsPage > 1) {
                                  setAvailableSlotsPage(availableSlotsPage - 1);
                                }
                              }}
                              style={[
                                styles.paginationButton,
                                availableSlotsPage === 1 && styles.paginationButtonDisabled
                              ]}
                              disabled={availableSlotsPage === 1}
                            >
                              <Text style={[
                                styles.paginationButtonText,
                                availableSlotsPage === 1 && styles.paginationButtonTextDisabled
                              ]}>Anterior</Text>
                            </TouchableOpacity>
                            <Text style={styles.paginationText}>
                              Página {availableSlotsPage} de {totalAvailablePages}
                            </Text>
                            <TouchableOpacity 
                              onPress={() => {
                                if (availableSlotsPage < totalAvailablePages) {
                                  setAvailableSlotsPage(availableSlotsPage + 1);
                                }
                              }}
                              style={[
                                styles.paginationButton,
                                availableSlotsPage === totalAvailablePages && styles.paginationButtonDisabled
                              ]}
                              disabled={availableSlotsPage === totalAvailablePages}
                            >
                              <Text style={[
                                styles.paginationButtonText,
                                availableSlotsPage === totalAvailablePages && styles.paginationButtonTextDisabled
                              ]}>Próximo</Text>
                            </TouchableOpacity>
                          </View>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}
              </View>

              <TouchableOpacity 
                style={[
                  styles.scheduleButton,
                  selectedTimeSlots.length === 0 && styles.scheduleButtonDisabled
                ]}
                onPress={handleBooking}
                disabled={selectedTimeSlots.length === 0}
              >
                <Text style={[
                  styles.scheduleButtonText,
                  selectedTimeSlots.length === 0 && styles.scheduleButtonTextDisabled
                ]}>
                  {selectedTimeSlots.length === 0 ? 'Selecione um horário' : 'Agendar Sala'}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      <Modal
        visible={showBookingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => {
          console.log('Modal de booking sendo fechado via onRequestClose');
          closeBookingModal();
        }}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackground}
            onPress={() => {
              console.log('Modal de booking sendo fechado via Pressable');
              closeBookingModal();
            }}
          />
          <KeyboardAvoidingView 
            style={{ flex: 1, justifyContent: 'center' }}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
          >
            <ScrollView 
              contentContainerStyle={styles.modalScrollContainer}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Informações do Agendamento</Text>
                <TouchableOpacity 
                  onPress={() => {
                    console.log('Modal de booking sendo fechado via botão X');
                    closeBookingModal();
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={styles.bookingForm}>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Título da Reunião *</Text>
                  <TextInput
                    style={styles.input}
                    value={bookingInfo.title}
                    onChangeText={(text) => setBookingInfo(prev => ({ ...prev, title: text }))}
                    placeholder="Digite o título da reunião"
                    placeholderTextColor={Colors.neutral[400]}
                    editable={!submittingBooking}
                  />
                </View>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Departamento *</Text>
                  <TextInput
                    style={styles.input}
                    value={bookingInfo.department}
                    onChangeText={(text) => setBookingInfo(prev => ({ ...prev, department: text }))}
                    placeholder="Digite o departamento"
                    placeholderTextColor={Colors.neutral[400]}
                    editable={!submittingBooking}
                  />
                </View>

                {/* Campo de descrição comentado - não sendo usado no momento */}
                {/* <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Descrição</Text>
                  <TextInput
                    style={styles.input}
                    value={bookingInfo.description}
                    onChangeText={(text) => setBookingInfo(prev => ({ ...prev, description: text }))}
                    placeholder="Digite a descrição do agendamento"
                    placeholderTextColor={Colors.neutral[400]}
                    editable={!submittingBooking}
                  />
                </View> */}

                                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Participantes da Reunião</Text>
                  
                  {/* Campo de busca integrado com chips */}
                  <View style={styles.integratedSearchContainer}>
                    <View style={styles.chipsAndInputWrapper}>
                      {/* Chips dos participantes selecionados */}
                      {selectedParticipants.map((participant, index) => (
                        <View key={index} style={styles.inlineParticipantChip}>
                          <Text style={styles.inlineParticipantChipText}>
                            {participant.displayName}
                          </Text>
                          <TouchableOpacity 
                            onPress={() => removeParticipant(participant)}
                            style={styles.inlineParticipantChipRemove}
                          >
                            <Text style={styles.inlineParticipantChipRemoveText}>×</Text>
                          </TouchableOpacity>
                        </View>
                      ))}
                      
                      {/* Input de busca */}
                      <TextInput
                        style={styles.inlineParticipantSearchInput}
                        value={participantInput}
                        onChangeText={setParticipantInput}
                        placeholder={selectedParticipants.length > 0 ? "Adicionar mais..." : "Digite o nome ou email do participante..."}
                        placeholderTextColor={Colors.neutral[400]}
                        editable={!submittingBooking}
                      />
                    </View>
                    
                    {searchingUsers && (
                      <ActivityIndicator 
                        size="small" 
                        color={Colors.primary[500]} 
                        style={styles.inlineSearchingIndicator}
                      />
                    )}
                  </View>
                  
                  {/* Lista de sugestões */}
                  {showUserSuggestions && userSuggestions.length > 0 && (
                    <View style={styles.suggestionsContainer}>
                      <Text style={styles.suggestionsTitle}>Usuários encontrados:</Text>
                      <ScrollView 
                        style={styles.suggestionsList}
                        nestedScrollEnabled={true}
                        keyboardShouldPersistTaps="handled"
                      >
                        {userSuggestions.map((user, index) => (
                          <TouchableOpacity
                            key={index}
                            style={styles.suggestionItem}
                            onPress={() => addParticipant(user)}
                          >
                            <View style={styles.suggestionInfo}>
                              <Text style={styles.suggestionName}>
                                {user.displayName}
                              </Text>
                              <Text style={styles.suggestionEmail}>
                                {user.mail}
                              </Text>
                            </View>
                            <Text style={styles.suggestionAdd}>+</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  )}
                  
                  <Text style={styles.participantsHelp}>
                    💡 Digite o nome ou email para buscar usuários do domínio @grupoginseng.com.br
                  </Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[
                  styles.scheduleButton,
                  submittingBooking && styles.scheduleButtonDisabled
                ]}
                onPress={submitBooking}
                disabled={submittingBooking}
              >
                {submittingBooking ? (
                  <View style={styles.loadingButton}>
                    <ActivityIndicator size="small" color={Colors.white} />
                    <Text style={styles.scheduleButtonText}>Criando reserva...</Text>
                  </View>
                ) : (
                  <Text style={styles.scheduleButtonText}>Confirmar Agendamento</Text>
                )}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={showMyBookingsModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMyBookingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <Pressable 
            style={styles.modalBackground}
            onPress={() => setShowMyBookingsModal(false)}
          />
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Meus Agendamentos ({myBookings.length})</Text>
                <TouchableOpacity 
                  onPress={() => setShowMyBookingsModal(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              {myBookings.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Nenhum agendamento encontrado</Text>
                </View>
              ) : (
                <>
                  <View style={styles.bookingsContainer}>
                    {currentBookings.map((booking) => (
                      <View key={booking.id} style={styles.myBookingCard}>
                        <View style={styles.myBookingHeader}>
                          <Text style={styles.myBookingTitle}>
                            {booking.sala_nome}
                          </Text>
                          <View style={styles.myBookingActions}>
                            {/* Botão de compartilhar - INATIVO */}
                            {false && (
                              <TouchableOpacity 
                                onPress={() => shareBooking(booking)}
                                style={styles.myBookingShareButton}
                              >
                                <Share2 size={14} color={Colors.white} />
                              </TouchableOpacity>
                            )}
                            <TouchableOpacity 
                              onPress={() => deleteBooking(booking.id)}
                              style={styles.myBookingDeleteButton}
                              disabled={deletingBooking === booking.id}
                            >
                              {deletingBooking === booking.id ? (
                                <ActivityIndicator size="small" color={Colors.white} />
                              ) : (
                                <Trash2 size={14} color={Colors.white} />
                              )}
                            </TouchableOpacity>
                          </View>
                        </View>
                        
                        <View style={styles.myBookingContent}>
                          <View style={styles.myBookingInfo}>
                            <View style={styles.myBookingInfoRow}>
                              <Text style={styles.myBookingLabel}>Responsável:</Text>
                              <Text style={styles.myBookingValue}>{booking.nome_responsavel}</Text>
                            </View>
                            <View style={styles.myBookingInfoRow}>
                              <Text style={styles.myBookingLabel}>Departamento:</Text>
                              <Text style={styles.myBookingValue}>{booking.departamento}</Text>
                            </View>
                            {booking.descricao && (
                              <View style={styles.myBookingInfoRow}>
                                <Text style={styles.myBookingLabel}>Descrição:</Text>
                                <Text style={[styles.myBookingValue, styles.myBookingDescription]} numberOfLines={2}>
                                  {booking.descricao}
                                </Text>
                              </View>
                            )}
                          </View>
                          
                          <View style={styles.myBookingDateTime}>
                            <View style={styles.myBookingDateTimeRow}>
                              <Text style={styles.myBookingDateTimeLabel}>Data:</Text>
                              <Text style={styles.myBookingDateTimeValue}>
                                {new Date(booking.data_reserva).toLocaleDateString('pt-BR')}
                              </Text>
                            </View>
                            <View style={styles.myBookingDateTimeRow}>
                              <Text style={styles.myBookingDateTimeLabel}>Horário:</Text>
                              <Text style={styles.myBookingDateTimeValue}>
                                {booking.horario_inicio.split('T')[1].substring(0, 5)} - {booking.horario_fim.split('T')[1].substring(0, 5)}
                              </Text>
                            </View>
                          </View>
                        </View>
                      </View>
                    ))}
                  </View>
                  
                  <View style={styles.paginationContainer}>
                    <TouchableOpacity 
                      onPress={goToPreviousPage}
                      style={[
                        styles.paginationButton,
                        currentPage === 1 && styles.paginationButtonDisabled
                      ]}
                      disabled={currentPage === 1}
                    >
                      <Text style={[
                        styles.paginationButtonText,
                        currentPage === 1 && styles.paginationButtonTextDisabled
                      ]}>Anterior</Text>
                    </TouchableOpacity>
                    <Text style={styles.paginationText}>
                      Página {currentPage} de {totalPages}
                    </Text>
                    <TouchableOpacity 
                      onPress={goToNextPage}
                      style={[
                        styles.paginationButton,
                        currentPage === totalPages && styles.paginationButtonDisabled
                      ]}
                      disabled={currentPage === totalPages}
                    >
                      <Text style={[
                        styles.paginationButtonText,
                        currentPage === totalPages && styles.paginationButtonTextDisabled
                      ]}>Próximo</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#04506B',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.white,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 32,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    marginBottom: 16,
  },
  dateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[900],
    marginLeft: 12,
    flex: 1,
  },
  roomsContainer: {
    gap: 12,
  },
  roomCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  roomCardUnavailable: {
    opacity: 0.6,
  },
  roomCardLoading: {
    opacity: 0.5,
  },
  roomInfo: {
    flex: 1,
  },
  roomName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.neutral[900],
    marginBottom: 8,
  },
  roomDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  roomDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomDetailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[500],
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  roomStatusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    marginRight: 8,
  },
  availableText: {
    color: Colors.success[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    paddingTop: 60,
  },
  modalScrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
  },

  modalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 16,
    marginVertical: 'auto',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
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
    fontSize: 10,
    color: Colors.neutral[700],
  },
  timeSlotsContainer: {
    marginBottom: 20,
  },
  timeSlotsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.neutral[900],
    marginBottom: 12,
  },
  timeSlotsScrollView: {
    maxHeight: 250,
  },
  timeSlot: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[50],
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  timeSlotUnavailable: {
    opacity: 0.6,
  },
  timeSlotSelected: {
    backgroundColor: Colors.primary[50],
    borderColor: Colors.primary[500],
    borderWidth: 1,
  },
  timeSlotText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[900],
    marginLeft: 8,
    flex: 1,
  },
  timeSlotInfo: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  bookingInfoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[600],
    marginTop: 2,
  },
  scheduleButton: {
    backgroundColor: Colors.primary[500],
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonDisabled: {
    backgroundColor: Colors.neutral[300],
    opacity: 1,
  },
  scheduleButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.white,
  },
  scheduleButtonTextDisabled: {
    color: Colors.neutral[500],
  },
  priorityContainer: {
    marginTop: 8,
    backgroundColor: Colors.primary[50],
    padding: 8,
    borderRadius: 6,
  },
  priorityText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.primary[700],
  },
  bookingForm: {
    gap: 16,
    marginBottom: 20,
  },
  inputContainer: {
    gap: 8,
  },
  inputLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[700],
  },
  input: {
    backgroundColor: Colors.neutral[50],
    padding: 12,
    borderRadius: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },

  dateModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dateModalContent: {
    backgroundColor: Colors.white,
    borderRadius: 20,
    padding: 20,
    maxWidth: 320,
    width: '80%',
    maxHeight: '80%',
  },
  dateModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  dateModalTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.neutral[900],
  },
  quickDateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 16,
  },
  quickDateButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.primary[200],
  },
  quickDateText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.primary[700],
  },
  datePickerContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  androidDateButton: {
    width: '100%',
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.neutral[50],
    flexDirection: 'column',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  androidDateButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.neutral[900],
  },
  androidDateButtonSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[500],
  },
  dateModalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  dateModalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    backgroundColor: Colors.neutral[200],
  },
  dateModalButtonPrimary: {
    backgroundColor: Colors.primary[500],
  },
  dateModalButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.neutral[700],
  },
  dateModalButtonTextPrimary: {
    color: Colors.white,
  },
  refreshButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
  },
  refreshButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.white,
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
  bookingInfoContainer: {
    marginTop: 8,
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.primary[50],
  },
  summaryContainer: {
    marginTop: 16,
    padding: 8,
    borderRadius: 6,
    backgroundColor: Colors.primary[50],
  },
  summaryTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.primary[700],
    marginBottom: 8,
  },
  summaryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.primary[700],
  },
  loadingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  slotCountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  slotCountsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[700],
  },
  slotCountsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  slotCount: {
    flexDirection: 'column',
    alignItems: 'center',
  },
  slotCountNumber: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.neutral[900],
  },
  slotCountLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[500],
  },
  occupiedText: {
    color: Colors.error[500],
  },
  modalBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  bookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    marginBottom: 12,
  },
  bookingCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  bookingCardTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  deleteButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.neutral[200],
  },
  bookingCardDetails: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  bookingCardDetail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bookingCardDetailText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[500],
  },
  bookingCardInfo: {
    marginBottom: 8,
  },
  bookingCardLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[700],
  },
  bookingCardValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[900],
  },
  refreshIconButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
  },
  paginationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    paddingHorizontal: 8,
  },
  paginationButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
    alignItems: 'center',
    minWidth: 80,
  },
  paginationButtonDisabled: {
    backgroundColor: Colors.neutral[300],
    opacity: 1,
  },
  paginationButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.white,
  },
  paginationButtonTextDisabled: {
    color: Colors.neutral[500],
  },
  paginationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.neutral[700],
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.neutral[700],
  },
  bookingsContainer: {
    minHeight: 180,
    justifyContent: 'flex-start',
  },

  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.neutral[50],
    alignItems: 'center',
    overflow: 'hidden',
    elevation: 0,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
    overflow: 'hidden',
    elevation: 2,
  },
  filterButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[700],
  },
  filterButtonTextActive: {
    color: Colors.white,
  },

  // Estilos para o modal "Meus Agendamentos"
  myBookingCard: {
    backgroundColor: Colors.white,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  myBookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  myBookingTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: Colors.neutral[900],
    flex: 1,
  },
  myBookingActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  myBookingShareButton: {
    backgroundColor: Colors.primary[500],
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  myBookingDeleteButton: {
    backgroundColor: Colors.error[500],
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 4,
    minWidth: 28,
    alignItems: 'center',
  },
  myBookingContent: {
    flexDirection: 'row',
    gap: 12,
  },
  myBookingInfo: {
    flex: 1,
  },
  myBookingInfoRow: {
    marginBottom: 4,
  },
  myBookingLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[600],
    marginBottom: 2,
  },
  myBookingValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 11,
    color: Colors.neutral[800],
  },
  myBookingDescription: {
    fontSize: 10,
    color: Colors.neutral[600],
    lineHeight: 14,
  },
  myBookingDateTime: {
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    minWidth: 80,
  },
  myBookingDateTimeRow: {
    marginBottom: 4,
    alignItems: 'flex-end',
  },
  myBookingDateTimeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 9,
    color: Colors.neutral[500],
    marginBottom: 1,
  },
  myBookingDateTimeValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[700],
  },
  participantsHelp: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[500],
    marginTop: 4,
    fontStyle: 'italic',
  },
  participantsPreview: {
    marginTop: 8,
    padding: 8,
    backgroundColor: Colors.neutral[50],
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  participantsPreviewTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[700],
    marginBottom: 4,
  },
  participantsPreviewEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: Colors.success[500],
    marginLeft: 8,
    marginBottom: 2,
  },
  participantsPreviewError: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: Colors.error[500],
    marginLeft: 8,
    fontStyle: 'italic',
  },

  suggestionsContainer: {
    marginTop: 8,
    backgroundColor: Colors.white,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
    maxHeight: 200,
  },
  suggestionsTitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[700],
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  suggestionsList: {
    maxHeight: 150,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  suggestionInfo: {
    flex: 1,
  },
  suggestionName: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[900],
    marginBottom: 2,
  },
  suggestionEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: Colors.neutral[600],
  },
  suggestionAdd: {
    fontSize: 18,
    color: Colors.primary[500],
    fontWeight: 'bold',
    marginLeft: 8,
  },
  integratedSearchContainer: {
    backgroundColor: Colors.neutral[50],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    minHeight: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipsAndInputWrapper: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
  },
  inlineParticipantChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary[100],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 2,
  },
  inlineParticipantChipText: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: Colors.primary[700],
    marginRight: 4,
  },
  inlineParticipantChipRemove: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  inlineParticipantChipRemoveText: {
    fontSize: 9,
    color: Colors.white,
    fontWeight: 'bold',
  },
  inlineParticipantSearchInput: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[900],
    minWidth: 120,
    flex: 1,
    paddingVertical: 4,
  },
  inlineSearchingIndicator: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -10,
  },
});
