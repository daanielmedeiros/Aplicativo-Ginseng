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
} from 'react-native';
import { router } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { CommonStyles } from '@/constants/Styles';

export default function LoginScreen() {
  const [email, setEmail] = useState('usuario@grupoginseng.com.br');
  const [password, setPassword] = useState('123456');
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      // Simulate login process
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Navegação com tratamento de erro
      try {
        await router.replace('/(tabs)');
      } catch (navigationError) {
        console.error('Erro na navegação:', navigationError);
        setError('Erro ao navegar para a tela inicial. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro no login:', error);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Animated.View entering={FadeIn.duration(600)} style={styles.logoContainer}>
          <Image
            source={require('@/assets/images/icon.png')}
            style={styles.logo}
          />
        </Animated.View>

        <Animated.View entering={FadeIn.duration(600).delay(300)} style={styles.formContainer}>
          <View style={styles.inputWrapper}>
            <Mail 
              size={20} 
              color={emailFocused ? Colors.primary[500] : Colors.neutral[500]} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[
                CommonStyles.input, 
                styles.input,
                emailFocused && CommonStyles.inputFocused
              ]}
              placeholder="Email"
              placeholderTextColor={Colors.neutral[500]}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              onFocus={() => setEmailFocused(true)}
              onBlur={() => setEmailFocused(false)}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Lock 
              size={20} 
              color={passwordFocused ? Colors.primary[500] : Colors.neutral[500]} 
              style={styles.inputIcon} 
            />
            <TextInput
              style={[
                CommonStyles.input, 
                styles.input,
                passwordFocused && CommonStyles.inputFocused
              ]}
              placeholder="Senha"
              placeholderTextColor={Colors.neutral[500]}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              onFocus={() => setPasswordFocused(true)}
              onBlur={() => setPasswordFocused(false)}
            />
          </View>

          {error ? (
            <Text style={styles.errorText}>{error}</Text>
          ) : null}

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[
              CommonStyles.buttonPrimary, 
              styles.loginButton,
              loading && styles.buttonLoading
            ]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={CommonStyles.buttonText}>
              {loading ? 'Entrando...' : 'Entrar'}
            </Text>
          </TouchableOpacity>

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
    marginBottom: 8,
  },
  tagline: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.neutral[200],
    textAlign: 'center',
  },
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    paddingLeft: 48,
    marginBottom: 0,
    backgroundColor: Colors.white,
  },
  inputIcon: {
    position: 'absolute',
    left: 16,
    top: 14,
    zIndex: 1,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 24,
  },
  forgotPasswordText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.white,
  },
  loginButton: {
    marginBottom: 16,
  },
  buttonLoading: {
    opacity: 0.7,
  },
  errorText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.error[500],
    marginBottom: 16,
  },
  versionText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[200],
    textAlign: 'center',
    marginTop: 32,
  },
});