import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Platform,
  Modal,
  Pressable,
  FlatList
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { ArrowLeft, User, Mail, Briefcase, Building, Edit3, LogOut } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';

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

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const [selectedAvatar, setSelectedAvatar] = useState<AvatarKey | null>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const avatars: AvatarKey[] = [1, 2, 3, 4, 5, 6, 7, 8, 9];

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

  const handleGoBack = () => {
    router.back();
  };

  const handleAvatarSelect = async (avatarNumber: AvatarKey) => {
    try {
      await AsyncStorage.setItem('selectedAvatar', avatarNumber.toString());
      setSelectedAvatar(avatarNumber);
      setShowAvatarModal(false);
    } catch (error) {
      console.error('Erro ao salvar avatar:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut();
      // A navegação será feita automaticamente pelo contexto
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const ProfileItem = ({ icon, label, value }: { icon: React.ReactNode, label: string, value?: string }) => {
    return (
      <View style={styles.profileItem}>
        <View style={styles.profileItemIcon}>
          {icon}
        </View>
        <View style={styles.profileItemContent}>
          <Text style={styles.profileItemLabel}>{label}</Text>
          <Text style={styles.profileItemValue}>{value || 'Não informado'}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={handleGoBack}
        >
          <ArrowLeft size={24} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar e Nome */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarSection}>
            <TouchableOpacity 
              style={styles.avatarContainer}
              onPress={() => setShowAvatarModal(true)}
            >
              <Image
                source={selectedAvatar ? avatarImages[selectedAvatar] : defaultAvatar}
                style={styles.avatar}
              />
              <View style={styles.editAvatarIcon}>
                <Edit3 size={16} color={Colors.white} />
              </View>
            </TouchableOpacity>
          </View>
          <Text style={styles.userName}>{user?.name || 'Usuário'}</Text>
        </View>

        {/* Informações do Perfil */}
        <View style={styles.profileSection}>
          <Text style={styles.sectionTitle}>Informações Pessoais</Text>
          
          <ProfileItem 
            icon={<User size={20} color={Colors.primary[500]} />}
            label="Nome Completo"
            value={user?.name}
          />
          
          <ProfileItem 
            icon={<Mail size={20} color={Colors.primary[500]} />}
            label="Email"
            value={user?.email}
          />
          
          <ProfileItem 
            icon={<Briefcase size={20} color={Colors.primary[500]} />}
            label="Cargo"
            value={user?.jobTitle}
          />
        </View>

        {/* Informações da Empresa - INATIVO */}
        {false && (
          <View style={styles.profileSection}>
            <Text style={styles.sectionTitle}>Informações da Empresa</Text>
            
            <ProfileItem 
              icon={<Building size={20} color={Colors.primary[500]} />}
              label="Empresa"
              value="Grupo Ginseng"
            />
            
            <ProfileItem 
              icon={<User size={20} color={Colors.primary[500]} />}
              label="ID do Usuário"
              value={user?.id}
            />
          </View>
        )}

        {/* Dados Técnicos - INATIVO */}
        {false && (
          <View style={styles.debugSection}>
            <Text style={styles.debugTitle}>📋 Dados do Sistema</Text>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Nome:</Text>
              <Text style={styles.debugValue}>{user?.givenName || 'N/A'}</Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>Sobrenome:</Text>
              <Text style={styles.debugValue}>{user?.surname || 'N/A'}</Text>
            </View>
            <View style={styles.debugRow}>
              <Text style={styles.debugLabel}>ID:</Text>
              <Text style={styles.debugValue}>{user?.id || 'N/A'}</Text>
            </View>
          </View>
        )}

        {/* Botão de Logout */}
        <View style={styles.logoutSection}>
          <TouchableOpacity 
            style={styles.logoutButton}
            onPress={handleLogout}
          >
            <View style={styles.logoutIcon}>
              <LogOut size={20} color={Colors.white} />
            </View>
            <Text style={styles.logoutText}>Sair da Conta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#04506B',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  headerTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.white,
    fontWeight: 'bold',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 24,
  },
  avatarSection: {
    position: 'relative',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.primary[500],
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  editAvatarIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.white,
  },
  userName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.neutral[900],
    marginBottom: 8,
    textAlign: 'center',
  },
  userEmail: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[600],
    textAlign: 'center',
  },
  profileSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
    marginBottom: 16,
  },
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: Platform.OS === 'android' ? 2 : 0,
  },
  profileItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: Colors.primary[50],
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  profileItemContent: {
    flex: 1,
  },
  profileItemLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[500],
    marginBottom: 2,
  },
  profileItemValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.neutral[900],
  },
  debugSection: {
    marginTop: 24,
    padding: 16,
    backgroundColor: Colors.neutral[50],
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  debugTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.neutral[700],
    marginBottom: 12,
  },
  debugRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  debugLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[600],
  },
  debugValue: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[700],
    flex: 1,
    textAlign: 'right',
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
  logoutSection: {
    marginTop: 32,
    marginBottom: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    backgroundColor: '#dc2626',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: Platform.OS === 'android' ? 3 : 0,
  },
  logoutIcon: {
    marginRight: 12,
  },
  logoutText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.white,
    fontWeight: '600',
  },
}); 