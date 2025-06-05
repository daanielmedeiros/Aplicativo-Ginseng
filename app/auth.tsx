import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import Colors from '@/constants/Colors';

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Processando...');

  useEffect(() => {
    console.log('=== AUTH CALLBACK ===');
    console.log('Parâmetros recebidos:', params);
    console.log('Todas as chaves:', Object.keys(params));
    
    const processCallback = async () => {
      try {
        setStatus('Processando autenticação...');
        
        // Verificar se há parâmetros de erro
        if (params.error) {
          console.error('Erro no callback:', params.error);
          setStatus('Erro na autenticação');
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 2000);
          return;
        }

        // Se há código de autorização, significa que o login foi bem-sucedido
        if (params.code) {
          console.log('✅ Código de autorização recebido');
          setStatus('Login realizado com sucesso! Aguarde...');
        } else {
          setStatus('Redirecionando para o app...');
        }

        // Aguardar um pouco para mostrar o feedback
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Redirecionar para a tela principal (tabs)
        router.replace('/(tabs)');
        
      } catch (error) {
        console.error('Erro ao processar callback:', error);
        setStatus('Erro inesperado');
        setTimeout(() => {
          router.replace('/(auth)/login');
        }, 2000);
      }
    };

    processCallback();
  }, [params, router]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.title}>Ginseng APP</Text>
        <Text style={styles.subtitle}>
          {status}
        </Text>
        
        {/* Debug info */}
        {__DEV__ && Object.keys(params).length > 0 && (
          <View style={styles.debugContainer}>
            <Text style={styles.debugTitle}>Callback Debug:</Text>
            <Text style={styles.debugText}>
              {JSON.stringify(params, null, 2)}
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#04506B',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#CCCCCC',
    marginTop: 8,
    textAlign: 'center',
  },
  debugContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    maxWidth: '100%',
    maxHeight: 200,
  },
  debugTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  debugText: {
    fontSize: 12,
    color: '#CCCCCC',
  },
}); 