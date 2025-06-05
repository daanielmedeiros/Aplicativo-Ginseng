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
    return 'http://localhost:8081/';
  } else {
    // Para mobile, sempre usar o scheme customizado
    return 'com.grupoginseng.app://auth';
  }
};

export const logAuthConfig = () => {
  const currentUri = getCurrentRedirectUri();
  
  console.log('=====================================');
  console.log('🔧 URI CUSTOMIZADO - GINSENG APP');
  console.log('=====================================');
  console.log('Platform:', Platform.OS);
  console.log('🎯 URI FIXO para Azure:', currentUri);
  console.log('=====================================');
  console.log('');
  console.log('🚨 ADICIONE ESTE URI EXATO NO AZURE:');
  console.log(currentUri);
  console.log('');
  console.log('🎯 COMO ADICIONAR NO AZURE AD:');
  console.log('1. Portal: https://portal.azure.com');
  console.log('2. Azure AD > Registros de aplicativo');
  console.log('3. App ID: 98e59cc1-5c5a-4b9a-9c3e...');
  console.log('4. Clique em "Autenticação"');
  console.log('5. Em "URIs de redirecionamento":');
  console.log('   - Tipo: "Cliente público/nativo (móvel e desktop)"');
  console.log('   - URI: com.grupoginseng.app://auth');
  console.log('6. IMPORTANTE: NÃO escolha "Web" ou "SPA"');
  console.log('7. Salve as alterações');
  console.log('=====================================');
  
  return {
    current: currentUri,
    type: 'Cliente público/nativo (móvel e desktop)',
    appId: '98e59cc1-5c5a-4b9a-9c3e-f4f6be935097'
  };
}; 