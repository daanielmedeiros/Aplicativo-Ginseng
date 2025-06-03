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
  ActivityIndicator
} from 'react-native';
import { useColorScheme } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Calendar as CalendarIcon, Clock, Users, MapPin, ChevronRight, Check, Plus, Info } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import Colors from '@/constants/Colors';

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

const API_BASE_URL = 'https://api.grupoginseng.com.br/';

export default function AnalyticsScreen() {
  const colorScheme = useColorScheme();
  const [selectedDate, setSelectedDate] = useState(new Date());
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
    { id: '1', startTime: '08:00', endTime: '09:00', isAvailable: true },
    { id: '2', startTime: '09:00', endTime: '10:00', isAvailable: true },
    { id: '3', startTime: '10:00', endTime: '11:00', isAvailable: true },
    { id: '4', startTime: '11:00', endTime: '12:00', isAvailable: true },
    { id: '5', startTime: '13:00', endTime: '14:00', isAvailable: true },
    { id: '6', startTime: '14:00', endTime: '15:00', isAvailable: true },
    { id: '7', startTime: '15:00', endTime: '16:00', isAvailable: true },
    { id: '8', startTime: '16:00', endTime: '17:00', isAvailable: true },
    { id: '9', startTime: '17:00', endTime: '18:00', isAvailable: true },
  ];

  // Buscar reservas da API
  const fetchReservas = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/reservas`);
      const data: APIResponse = await response.json();
      setReservas(data.data || []);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
      Alert.alert('Erro', 'Não foi possível carregar as reservas');
    } finally {
      setLoading(false);
    }
  };

  // Criar nova reserva
  const createReserva = async (reservaData: any) => {
    try {
      setSubmittingBooking(true);
      
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
        Alert.alert('Sucesso', 'Reserva criada com sucesso!');
        fetchReservas(); // Recarregar as reservas
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
        
        Alert.alert('Erro na API', errorMessage);
        return false;
      }
    } catch (error) {
      console.error('Erro de rede ou conexão:', error);
      
      let errorMessage = 'Verifique sua conexão com a internet e tente novamente';
      if (error instanceof Error) {
        errorMessage += `\n\nDetalhes técnicos: ${error.message}`;
      }
      
      Alert.alert('Erro de Conexão', errorMessage);
      return false;
    } finally {
      setSubmittingBooking(false);
    }
  };

  // Testar conexão com a API
  const testAPIConnection = async () => {
    try {
      console.log('Testando conexão com a API...');
      const response = await fetch(`${API_BASE_URL}/reservas`);
      console.log('Status do teste:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        Alert.alert('Teste API', `Conexão OK! ${data.data?.length || 0} reservas encontradas`);
      } else {
        Alert.alert('Teste API', `Erro: ${response.status} - ${response.statusText}`);
      }
    } catch (error) {
      console.error('Erro no teste da API:', error);
      Alert.alert('Teste API', `Erro de conexão: ${error}`);
    }
  };

  useEffect(() => {
    fetchReservas();
  }, []);

  // Verificar se um horário está ocupado para uma sala específica em uma data
  const isTimeSlotOccupied = (salaId: string, timeSlot: TimeSlot, date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    
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
    const dateString = date.toISOString().split('T')[0];
    
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

  // Atualizar as salas com base nas reservas
  const getUpdatedRooms = () => {
    return rooms.map(room => {
      const bookingInfo = getBookingInfo(room.id, selectedDate);
      const allSlotsOccupied = timeSlots.every(slot => 
        isTimeSlotOccupied(room.id, slot, selectedDate)
      );

      return {
        ...room,
        isAvailable: !allSlotsOccupied,
        bookingInfo
      };
    });
  };

  // Atualizar os horários com base nas reservas para a sala selecionada
  const getUpdatedTimeSlots = () => {
    if (!selectedRoom) return timeSlots;

    return timeSlots.map(slot => ({
      ...slot,
      isAvailable: !isTimeSlotOccupied(selectedRoom.id, slot, selectedDate)
    }));
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
      setSelectedDate(selectedDate);
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

    console.log('=== INÍCIO DO ENVIO DE RESERVA ===');
    console.log('Sala selecionada:', selectedRoom);
    console.log('Data selecionada:', selectedDate);
    console.log('Horários selecionados:', selectedTimeSlots);
    console.log('Informações da reserva:', bookingInfo);

    // Criar uma reserva para cada horário selecionado
    for (const timeSlotId of selectedTimeSlots) {
      const timeSlot = timeSlots.find(slot => slot.id === timeSlotId);
      if (!timeSlot) {
        console.log('TimeSlot não encontrado:', timeSlotId);
        continue;
      }

      const reservaData = {
        data_reserva: selectedDate.toISOString().split('T')[0],
        horario_inicio: timeSlot.startTime + ':00',
        horario_fim: timeSlot.endTime + ':00',
        nome_responsavel: bookingInfo.responsibleName.trim(),
        departamento: bookingInfo.department.trim(),
        descricao: bookingInfo.description.trim() || '',
        sala_nome: selectedRoom.name,
        sala_id: selectedRoom.id,
        status: 'ativa'
      };

      console.log('Dados da reserva preparados:', reservaData);

      const success = await createReserva(reservaData);
      if (!success) {
        console.log('Falha ao criar reserva, parando o processo');
        return; // Parar se houve erro
      }
    }

    console.log('=== TODAS AS RESERVAS CRIADAS COM SUCESSO ===');

    // Limpar formulário e fechar modals
    setShowBookingModal(false);
    setSelectedTimeSlots([]);
    setBookingInfo({
      responsibleName: '',
      department: '',
      description: ''
    });
  };

  const isAllTimeSlotsOccupied = (room: Room) => {
    const updatedTimeSlots = timeSlots.map(slot => ({
      ...slot,
      isAvailable: !isTimeSlotOccupied(room.id, slot, selectedDate)
    }));
    return updatedTimeSlots.every(slot => !slot.isAvailable);
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
            onPress={testAPIConnection}
            style={[styles.refreshButton, styles.testButton]}
          >
            <Text style={styles.refreshButtonText}>Testar API</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={fetchReservas}
            style={styles.refreshButton}
          >
            <Text style={styles.refreshButtonText}>Atualizar</Text>
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
                  isAllTimeSlotsOccupied(room) && styles.roomCardUnavailable
                ]}
                onPress={() => {
                  setSelectedRoom(room);
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
                  {room.bookingInfo && (
                    <View style={styles.bookingInfoContainer}>
                      <Text style={styles.bookingInfoText}>
                        Reservado por: {room.bookingInfo.responsibleName}
                      </Text>
                      <Text style={styles.bookingInfoText}>
                        Depto: {room.bookingInfo.department}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.roomStatus}>
                  <Text style={[
                    styles.roomStatusText,
                    isAllTimeSlotsOccupied(room) ? styles.unavailableText : styles.availableText
                  ]}>
                    {isAllTimeSlotsOccupied(room) ? 'Ocupada' : 'Disponível'}
                  </Text>
                  <ChevronRight size={20} color={Colors.neutral[400]} />
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
                    minimumDate={new Date()}
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
                          minimumDate: new Date(),
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
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => {
            setShowRoomModal(false);
            setSelectedTimeSlots([]);
          }}
        >
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
              <Text style={styles.timeSlotsTitle}>Horários Disponíveis</Text>
              {updatedTimeSlots.map((slot) => (
                <TouchableOpacity
                  key={slot.id}
                  style={[
                    styles.timeSlot,
                    !slot.isAvailable && styles.timeSlotUnavailable,
                    selectedTimeSlots.includes(slot.id) && styles.timeSlotSelected
                  ]}
                  disabled={!slot.isAvailable}
                  onPress={() => toggleTimeSlot(slot.id)}
                >
                  <Clock size={16} color={Colors.neutral[500]} />
                  <Text style={styles.timeSlotText}>
                    {slot.startTime} - {slot.endTime}
                  </Text>
                  {selectedTimeSlots.includes(slot.id) && (
                    <Check size={20} color={Colors.primary[500]} />
                  )}
                  {!slot.isAvailable && (
                    <Text style={styles.unavailableText}>Ocupado</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity 
              style={[
                styles.scheduleButton,
                selectedTimeSlots.length === 0 && styles.scheduleButtonDisabled
              ]}
              onPress={handleBooking}
              disabled={selectedTimeSlots.length === 0}
            >
              <Text style={styles.scheduleButtonText}>Agendar Sala</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      <Modal
        visible={showBookingModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowBookingModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowBookingModal(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Informações do Agendamento</Text>
              <TouchableOpacity 
                onPress={() => setShowBookingModal(false)}
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
                  placeholder="Digite o nome do responsável"
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

              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Descrição</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bookingInfo.description}
                  onChangeText={(text) => setBookingInfo(prev => ({ ...prev, description: text }))}
                  placeholder="Digite a descrição do agendamento"
                  placeholderTextColor={Colors.neutral[400]}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                  editable={!submittingBooking}
                />
              </View>

              <View style={styles.summaryContainer}>
                <Text style={styles.summaryTitle}>Resumo da Reserva:</Text>
                <Text style={styles.summaryText}>Sala: {selectedRoom?.name}</Text>
                <Text style={styles.summaryText}>Data: {formatDate(selectedDate)}</Text>
                <Text style={styles.summaryText}>
                  Horários: {selectedTimeSlots.map(id => {
                    const slot = timeSlots.find(s => s.id === id);
                    return slot ? `${slot.startTime}-${slot.endTime}` : '';
                  }).join(', ')}
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
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#04506B',
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
  unavailableText: {
    color: Colors.error[500],
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: '80%',
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
  scheduleButton: {
    backgroundColor: Colors.primary[500],
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  scheduleButtonDisabled: {
    opacity: 0.5,
  },
  scheduleButtonText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.white,
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
    fontSize: 16,
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
  bookingInfoText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.primary[700],
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
  testButton: {
    backgroundColor: Colors.primary[500],
  },
});