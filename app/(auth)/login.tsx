import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { CommonStyles } from '@/constants/Styles';
import { useAuth } from '@/contexts/AuthContext';
import ConstellationBackground from '@/components/ConstellationBackground';

export default function LoginScreen() {
  const [error, setError] = useState('');

  const { signIn, isLoading: authLoading } = useAuth();

  const handleMicrosoftLogin = async () => {
    try {
      setError('');
      await signIn();
      // Se o login for bem-sucedido, o contexto irá atualizar o estado
      // e o app redirecionará automaticamente
    } catch (error) {
      console.error('Erro no login Microsoft:', error);
      setError('Erro ao fazer login com Microsoft. Tente novamente.');
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ConstellationBackground />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
          />

        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(300)} style={styles.formContainer}>
          {/* Login com Microsoft - Botão principal */}
          <TouchableOpacity 
            style={[styles.microsoftButton, authLoading && styles.buttonLoading]} 
            onPress={handleMicrosoftLogin}
            disabled={authLoading}
          >
            <View style={styles.microsoftButtonContent}>
              <Image
                source={{ uri: 'https://docs.microsoft.com/en-us/azure/active-directory/develop/media/howto-add-branding-in-azure-ad-apps/ms-symbollockup_mssymbol_19.png' }}
                style={styles.microsoftIcon}
              />
              {authLoading ? (
                <ActivityIndicator size="small" color={Colors.white} style={{ marginLeft: 12 }} />
              ) : (
                <Text style={styles.microsoftButtonText}>Entrar com Microsoft</Text>
              )}
            </View>
          </TouchableOpacity>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <Text style={styles.helpText}>
            Use suas credenciais corporativas para acessar o sistema.
          </Text>

          <Text style={styles.versionText}>Versão 1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04506B',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    marginTop: -200,
    width: 300,
    height: 200,
    borderRadius: 20,
    resizeMode: 'contain',
  },
  appName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 28,
    color: Colors.white,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.neutral[200],
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
  },
  microsoftButton: {
    backgroundColor: Colors.primary[500],
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  microsoftButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  microsoftIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
  },
  microsoftButtonText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.white,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.error[500],
    marginBottom: 16,
    textAlign: 'center',
  },
  helpText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[200],
    textAlign: 'center',
    marginBottom: 24,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[200],
    textAlign: 'center',
    marginTop: 32,
  },
});