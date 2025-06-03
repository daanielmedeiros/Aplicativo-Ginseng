import * as AuthSession from 'expo-auth-session';

export const getRedirectUri = () => {
  const redirectUri = AuthSession.makeRedirectUri({});
  console.log('🔧 URI de redirecionamento gerado:', redirectUri);
  return redirectUri;
};

export const logAuthConfig = () => {
  const redirectUri = AuthSession.makeRedirectUri({});
  
  console.log('=====================================');
  console.log('🔧 CONFIGURAÇÃO DE AUTENTICAÇÃO');
  console.log('=====================================');
  console.log('URI de redirecionamento:', redirectUri);
  console.log('=====================================');
  console.log('');
  console.log('📋 COPIE ESTE URI PARA O AZURE PORTAL:');
  console.log(redirectUri);
  console.log('');
  console.log('🎯 ONDE ADICIONAR NO AZURE:');
  console.log('1. Vá para o Azure Portal');
  console.log('2. Azure Active Directory > Registros de aplicativo');
  console.log('3. Selecione seu app: Ginseng App');
  console.log('4. Clique em "Autenticação"');
  console.log('5. Em "URIs de redirecionamento", adicione:');
  console.log(`   ${redirectUri}`);
  console.log('6. Salve as alterações');
  console.log('=====================================');
  
  return redirectUri;
}; 