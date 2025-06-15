// Configurações do Azure AD
// Substitua pelos valores reais do seu app registrado no Azure AD

export const AUTH_CONFIG = {
  // Cliente ID do app registrado no Azure AD
  CLIENT_ID: '98e59cc1-5c5a-4b9a-9c3e-f4f6be935097',
  
  // Tenant ID (ou 'common' para multi-tenant)
  TENANT_ID: '77940b3a-cb7f-46d9-b090-1de03fc08a3a', // ou 'common'
  
  // Scopes que a aplicação precisa - Versão básica funcionando
  SCOPES: ['openid', 'profile', 'email', 'User.Read'],
  
  // Scopes completos para calendário (quando admin aprovar)
  FULL_SCOPES: ['openid', 'profile', 'email', 'User.Read', 'Mail.ReadWrite', 'Group.ReadWrite.All'],
  
  // Scopes para autocomplete de usuários e calendário completo
  AUTOCOMPLETE_SCOPES: ['openid', 'profile', 'email', 'User.Read', 'User.Read.All', 'Mail.ReadWrite', 'Group.ReadWrite.All'],
  
  // Endpoints do Azure AD
  AUTHORITY: 'https://login.microsoftonline.com/',
  
  // Configuração adicional
  PROMPT: 'select_account', // Força seleção de conta
};

// Instruções para configuração:
/*
1. Acesse o Azure Portal (https://portal.azure.com)
2. Vá para "Azure Active Directory" > "Registros do aplicativo"
3. Clique em "Novo registro"
4. Configure:
   - Nome: "Ginseng App"
   - Tipos de conta suportados: "Contas neste diretório organizacional apenas"
   - URI de redirecionamento: Deixe em branco por enquanto
5. Após criar, copie:
   - ID do aplicativo (cliente) → CLIENT_ID
   - ID do diretório (locatário) → TENANT_ID
6. Vá para "Autenticação" e adicione:
   - Plataforma: "Aplicativo móvel e de desktop"
   - URI de redirecionamento personalizado: será gerado automaticamente pelo Expo
7. Em "Certificados e segredos", você pode criar um segredo do cliente se necessário
8. Em "Permissões de API", verifique se tem as permissões:
   - Microsoft Graph > User.Read (delegada)
   - openid, profile, email são incluídas automaticamente
*/ 