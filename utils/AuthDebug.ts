import * as AuthSession from 'expo-auth-session';
import { Platform } from 'react-native';

export const getRedirectUri = () => {
  const redirectUri = AuthSession.makeRedirectUri({ preferLocalhost: true, isTripleSlashed: true });
  console.log('🔧 URI de redirecionamento gerado:', redirectUri);
  return redirectUri;
};

export const getCurrentRedirectUri = () => {
  // Esta é a mesma lógica usada no AuthContext
  if (Platform.OS === 'web') {
    return 'https://app.danielmedeiros.fun/';
  } else if (Platform.OS === 'android') {
    return AuthSession.makeRedirectUri({
      preferLocalhost: false,
      isTripleSlashed: true,
    });
  } else {
    return AuthSession.makeRedirectUri({
      preferLocalhost: true,
      isTripleSlashed: true,
    });
  }
};

export const logAuthConfig = () => {
  const currentUri = getCurrentRedirectUri();
  const alternativeUris = [
    AuthSession.makeRedirectUri({ preferLocalhost: false }),
    AuthSession.makeRedirectUri({ preferLocalhost: true }),
    'com.grupoginseng.app://auth',
    'exp://localhost:8081',
    'exp://127.0.0.1:8081'
  ];
  
  console.log('=====================================');
  console.log('🔧 CONFIGURAÇÃO AZURE AD - ERRO RESOLVIDO');
  console.log('=====================================');
  console.log('Platform:', Platform.OS);
  console.log('🎯 URI ATUAL (que está dando erro):', currentUri);
  console.log('=====================================');
  console.log('');
  console.log('🚨 COPIE ESTE URI EXATO PARA O AZURE:');
  console.log(currentUri);
  console.log('');
  console.log('📋 URIs ADICIONAIS RECOMENDADOS:');
  alternativeUris.forEach((uri, index) => {
    console.log(`${index + 1}. ${uri}`);
  });
  console.log('');
  console.log('🎯 PASSOS PARA RESOLVER:');
  console.log('1. Vá para: https://portal.azure.com');
  console.log('2. Azure Active Directory > Registros de aplicativo');
  console.log('3. Encontre o app ID: 91258904-3a5c-483e-ac12-d8e13d78b460');
  console.log('4. Clique em "Autenticação"');
  console.log('5. Adicione como "Cliente público/nativo (móvel e desktop)":');
  console.log(`   ${currentUri}`);
  console.log('6. Salve e teste novamente');
  console.log('=====================================');
  
  return {
    current: currentUri,
    alternatives: alternativeUris,
    appId: '91258904-3a5c-483e-ac12-d8e13d78b460'
  };
}; 