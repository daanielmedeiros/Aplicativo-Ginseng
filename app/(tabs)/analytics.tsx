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
  TouchableWithoutFeedback
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon, Clock, Users, MapPin, ChevronRight, Check, Plus, Info, Trash2, RefreshCw } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
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
    description: ''
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
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [timeSlotFilter, setTimeSlotFilter] = useState<'available' | 'occupied'>('available');
  const [occupiedSlotsPage, setOccupiedSlotsPage] = useState(1);
  const [slotsPerPage] = useState(5);
  
  // Usando nome do usuário logado do contexto de autenticação
  const currentUser = user?.name || 'Usuário';

  // Função para fechar modal de booking de forma segura
  const closeBookingModal = () => {
    console.log('=== INICIANDO FECHAMENTO SEGURO DO MODAL DE BOOKING ===');
    try {
      setShowBookingModal(false);
      setShowDepartmentDropdown(false);
      // Não limpar os dados do formulário aqui para preservar o que o usuário digitou
      console.log('Modal de booking fechado com sucesso');
    } catch (error) {
      console.error('Erro ao fechar modal de booking:', error);
    }
  };

  // Lista de departamentos pré-definidos
  const departments = [
    'Diretoria',
    'Gente & Cultura',
    'Administração',
    'Financeiro',
    'T.I',
    'Auditoria',
    'Suprimentos',
    'Departamento Pessoal',
    'Infraestrutura',
    'Contabilidade',
    'AMG',
    'Outros'
  ];

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

  useEffect(() => {
    fetchReservas();
  }, []);

  // Buscar reservas sempre que a data mudar
  useEffect(() => {
    if (selectedDate) {
      console.log('Data alterada, buscando novas reservas...');
      fetchReservas(selectedDate);
    }
  }, [selectedDate]);

  // Debug: monitorar mudanças no estado do dropdown de departamento
  useEffect(() => {
    console.log('Estado showDepartmentDropdown mudou para:', showDepartmentDropdown);
  }, [showDepartmentDropdown]);

  // Debug: monitorar mudanças no estado do modal de booking
  useEffect(() => {
    console.log('Estado showBookingModal mudou para:', showBookingModal);
  }, [showBookingModal]);

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
        } catch (e) {
          console.log('Resposta não é JSON válido, mas request foi bem-sucedido');
        }
        return true;
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

    if (!bookingInfo.responsibleName.trim() || !bookingInfo.department.trim()) {
      Alert.alert('Erro', 'Preencha o nome do responsável e departamento');
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

        const reservaData = {
          data_reserva: formatDateLocal(selectedDate),
          horario_inicio: timeSlot.startTime + ':00',
          horario_fim: timeSlot.endTime + ':00',
          nome_responsavel: bookingInfo.responsibleName.trim(),
          departamento: bookingInfo.department.trim(),
          descricao: bookingInfo.description.trim() || '',
          sala_nome: selectedRoom.name,
          sala_id: selectedRoom.id,
          status: 'ativa',
          criado_por: currentUser
        };

        console.log('Dados da reserva preparados:', reservaData);

        const success = await createReservaSilent(reservaData); // Usar versão silenciosa
        if (success) {
          successCount++;
        } else {
          failCount++;
          console.log('Falha ao criar reserva para horário:', timeSlot.startTime);
        }
      }

      console.log('=== PROCESSO DE RESERVAS FINALIZADO ===');
      console.log(`Sucessos: ${successCount}, Falhas: ${failCount}`);

      // Mostrar apenas um alert com o resultado final
      if (successCount > 0 && failCount === 0) {
        Alert.alert('Sucesso', `${successCount} horário(s) reservado(s) com sucesso!`);
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
          description: ''
        });
      }

    } catch (error) {
      console.error('Erro geral no processo de reserva:', error);
      Alert.alert('Erro', 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setSubmittingBooking(false);
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
              
              const response = await fetch(`${API_BASE_URL}/reservas/${bookingId}`, {
                method: 'DELETE',
                headers: {
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                Alert.alert('Sucesso', 'Agendamento excluído com sucesso!');
                fetchMyBookings(); // Recarregar lista
                fetchReservas(); // Recarregar reservas gerais
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
            onPress={() => fetchReservas()}
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
                      setOccupiedSlotsPage(1); // Reset página
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
                  // FlatList para horários disponíveis (mantém scroll)
                  <FlatList
                    style={{ maxHeight: 400 }}
                    showsVerticalScrollIndicator={true}
                    keyboardShouldPersistTaps="handled"
                    data={updatedTimeSlots.filter(slot => slot.isAvailable)}
                    keyExtractor={(slot) => slot.id}
                    renderItem={({ item: slot }) => (
                      <TouchableOpacity
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
                    )}
                  />
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
                  <Text style={styles.inputLabel}>Nome do Responsável *</Text>
                  <TextInput
                    style={styles.input}
                    value={bookingInfo.responsibleName}
                    onChangeText={(text) => setBookingInfo(prev => ({ ...prev, responsibleName: text }))}
                    onFocus={() => {
                      console.log('Campo nome recebeu foco - fechando dropdown');
                      if (showDepartmentDropdown) {
                        setShowDepartmentDropdown(false);
                      }
                    }}
                    placeholder="Digite o nome do responsável"
                    placeholderTextColor={Colors.neutral[400]}
                    editable={!submittingBooking}
                  />
                </View>

                <TouchableWithoutFeedback>
                  <View style={styles.inputContainer}>
                    <Text style={styles.inputLabel}>Departamento *</Text>
                    <TouchableOpacity
                      style={[styles.input, styles.departmentSelector]}
                      onPress={() => {
                        console.log('=== CLIQUE NO DROPDOWN DE DEPARTAMENTO ===');
                        console.log('Estado atual showDepartmentDropdown:', showDepartmentDropdown);
                        
                        // Fechar teclado se estiver aberto
                        Keyboard.dismiss();
                        console.log('Teclado fechado');
                        
                        setShowDepartmentDropdown(!showDepartmentDropdown);
                      }}
                      disabled={submittingBooking}
                      activeOpacity={0.7}
                    >
                      <Text style={[
                        styles.departmentSelectorText,
                        !bookingInfo.department && styles.placeholderText
                      ]}>
                        {bookingInfo.department || 'Selecione o departamento'}
                      </Text>
                      <ChevronRight 
                        size={20} 
                        color={Colors.neutral[500]} 
                        style={{
                          transform: [{ rotate: showDepartmentDropdown ? '90deg' : '0deg' }]
                        }}
                      />
                    </TouchableOpacity>
                    
                    {/* Dropdown de departamentos */}
                    {showDepartmentDropdown && (
                      <View style={styles.departmentDropdown}>
                        <ScrollView style={styles.departmentDropdownScroll} nestedScrollEnabled={true}>
                          {departments.map((department, index) => (
                            <TouchableOpacity
                              key={index}
                              style={[
                                styles.departmentDropdownItem,
                                bookingInfo.department === department && styles.departmentDropdownItemSelected
                              ]}
                              onPress={() => {
                                console.log('=== SELECIONANDO DEPARTAMENTO NO DROPDOWN ===', department);
                                setBookingInfo(prev => ({ ...prev, department }));
                                setShowDepartmentDropdown(false);
                              }}
                            >
                              <Text style={[
                                styles.departmentDropdownItemText,
                                bookingInfo.department === department && styles.departmentDropdownItemTextSelected
                              ]}>
                                {department}
                              </Text>
                              {bookingInfo.department === department && (
                                <Check size={16} color={Colors.primary[500]} />
                              )}
                            </TouchableOpacity>
                          ))}
                        </ScrollView>
                      </View>
                    )}
                  </View>
                </TouchableWithoutFeedback>

                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Descrição</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={bookingInfo.description}
                    onChangeText={(text) => setBookingInfo(prev => ({ ...prev, description: text }))}
                    onFocus={() => {
                      console.log('Campo descrição recebeu foco - fechando dropdown');
                      if (showDepartmentDropdown) {
                        setShowDepartmentDropdown(false);
                      }
                    }}
                    placeholder="Digite a descrição do agendamento"
                    placeholderTextColor={Colors.neutral[400]}
                    multiline
                    numberOfLines={4}
                    textAlignVertical="top"
                    editable={!submittingBooking}
                  />
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
                      <View key={booking.id} style={{ backgroundColor: 'white', borderRadius: 8, padding: 15, marginBottom: 10, borderWidth: 1, borderColor: '#ddd' }}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                          <Text style={{ fontSize: 18, fontWeight: 'bold', color: 'black' }}>
                            {booking.sala_nome}
                          </Text>
                          <TouchableOpacity 
                            onPress={() => deleteBooking(booking.id)}
                            style={{ backgroundColor: '#ff6b6b', padding: 8, borderRadius: 5 }}
                          >
                            <Text style={{ color: 'white', fontSize: 16 }}>✕</Text>
                          </TouchableOpacity>
                        </View>
                        
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                          {/* Coluna da esquerda - Informações principais */}
                          <View style={{ flex: 1, paddingRight: 12 }}>
                            <Text style={{ fontSize: 14, color: 'black', marginBottom: 6 }}>
                              👤 <Text style={{ fontWeight: 'bold' }}>Responsável:</Text> {booking.nome_responsavel}
                            </Text>
                            <Text style={{ fontSize: 14, color: 'black', marginBottom: 6 }}>
                              🏢 <Text style={{ fontWeight: 'bold' }}>Departamento:</Text> {booking.departamento}
                            </Text>
                            {booking.descricao && (
                              <Text style={{ fontSize: 14, color: 'black' }}>
                                📝 <Text style={{ fontWeight: 'bold' }}>Descrição:</Text> {booking.descricao}
                              </Text>
                            )}
                          </View>
                          
                          {/* Coluna da direita - Data e horário */}
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={{ fontSize: 14, color: 'gray', marginBottom: 6 }}>
                              📅 {booking.data_reserva.split('T')[0]}
                            </Text>
                            <Text style={{ fontSize: 14, color: 'gray' }}>
                              🕐 {booking.horario_inicio.split('T')[1].substring(0, 5)} - {booking.horario_fim.split('T')[1].substring(0, 5)}
                            </Text>
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
    fontSize: 20,
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
    fontSize: 16,
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
    fontSize: 16,
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
    fontSize: 14,
    color: Colors.neutral[500],
  },
  roomStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  roomStatusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
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
  modalContent: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
    minHeight: 400,
    marginHorizontal: 16,
    marginVertical: 70,
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
  timeSlotsContainer: {
    marginBottom: 20,
  },
  timeSlotsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
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
    fontSize: 14,
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
    fontSize: 12,
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
    fontSize: 16,
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
    fontSize: 12,
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
    fontSize: 14,
    color: Colors.neutral[700],
  },
  input: {
    backgroundColor: Colors.neutral[50],
    padding: 12,
    borderRadius: 8,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.neutral[900],
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  textArea: {
    height: 100,
    paddingTop: 12,
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
    fontSize: 20,
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
    fontSize: 14,
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
    fontSize: 18,
    color: Colors.neutral[900],
  },
  androidDateButtonSubtext: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
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
    fontSize: 14,
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
    fontSize: 16,
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
    padding: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary[500],
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
    fontSize: 14,
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
    fontSize: 16,
    color: Colors.neutral[900],
  },
  slotCountLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
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
    fontSize: 14,
    color: Colors.white,
  },
  paginationButtonTextDisabled: {
    color: Colors.neutral[500],
  },
  paginationText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
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
    minHeight: 250,
    justifyContent: 'flex-start',
  },
  departmentSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    paddingHorizontal: 12,
  },
  departmentSelectorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.neutral[900],
    flex: 1,
  },
  placeholderText: {
    color: Colors.neutral[400],
  },
  departmentDropdown: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    borderRadius: 8,
    maxHeight: 200,
    marginTop: 4,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  departmentDropdownScroll: {
    maxHeight: 200,
  },
  departmentDropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  departmentDropdownItemSelected: {
    backgroundColor: Colors.primary[50],
  },
  departmentDropdownItemText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[900],
    flex: 1,
  },
  departmentDropdownItemTextSelected: {
    fontFamily: 'Inter-Medium',
    color: Colors.primary[700],
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
    marginTop: 8,
  },
  filterButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    backgroundColor: Colors.neutral[50],
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: Colors.primary[500],
    borderColor: Colors.primary[500],
  },
  filterButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[700],
  },
  filterButtonTextActive: {
    color: Colors.white,
  },
});