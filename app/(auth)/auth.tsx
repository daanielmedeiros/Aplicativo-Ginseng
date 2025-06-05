// app/auth.tsx - Versão com tratamento completo
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function AuthRedirect() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const [status, setStatus] = useState('Processando login...');

  useEffect(() => {
    const handleAuthRedirect = async () => {
      try {
        console.log('Parâmetros recebidos:', params);

        // Verifica se há um erro no retorno
        if (params.error) {
          console.error('Erro de autenticação:', params.error);
          setStatus('Erro no login');
          
          Alert.alert(
            'Erro de Autenticação', 
            'Houve um problema com o login. Tente novamente.',
            [{ text: 'OK', onPress: () => router.replace('/') }]
          );
          return;
        }

        // Processa sucesso do login
        if (params.access_token || params.code || params.token) {
          setStatus('Login realizado com sucesso!');
          
          // Salva os dados recebidos
          const dataToSave = {
            access_token: params.access_token,
            refresh_token: params.refresh_token,
            code: params.code,
            state: params.state,
            timestamp: new Date().toISOString()
          };

          await AsyncStorage.setItem('auth_data', JSON.stringify(dataToSave));
          
          // Marca como logado
          await AsyncStorage.setItem('is_logged_in', 'true');

          setTimeout(() => {
            router.replace('/');
          }, 1500);
        } else {
          // Caso não tenha parâmetros esperados
          console.log('Nenhum token recebido, redirecionando...');
          setStatus('Redirecionando...');
          
          setTimeout(() => {
            router.replace('/');
          }, 1000);
        }

      } catch (error) {
        console.error('Erro no processamento de auth:', error);
        setStatus('Erro interno');
        
        setTimeout(() => {
          router.replace('/');
        }, 2000);
      }
    };

    handleAuthRedirect();
  }, [params, router]);

  return (
    <View style={{
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#ffffff',
      padding: 20
    }}>
      <ActivityIndicator size="large" color="#0078d4" />
      <Text style={{
        marginTop: 20,
        fontSize: 18,
        color: '#323130',
        textAlign: 'center',
        fontWeight: '500'
      }}>
        {status}
      </Text>
      <Text style={{
        marginTop: 10,
        fontSize: 14,
        color: '#605e5c',
        textAlign: 'center'
      }}>
        Aguarde um momento...
      </Text>
    </View>
  );
}