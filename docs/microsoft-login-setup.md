# Configuração do Login Microsoft Azure AD

Este documento explica como configurar o login com Microsoft Azure AD no app Ginseng.

## 🔧 Pré-requisitos

1. Conta Azure com permissões para registrar aplicativos
2. Acesso ao Azure Portal (https://portal.azure.com)

## 📋 Passo a passo

### 1. Registrar o aplicativo no Azure AD

1. **Acesse o Azure Portal**
   - Vá para https://portal.azure.com
   - Faça login com sua conta corporativa

2. **Navegue para Azure Active Directory**
   - No menu lateral, clique em "Azure Active Directory"
   - Ou pesquise por "Azure Active Directory" na barra de pesquisa

3. **Registrar novo aplicativo**
   - Clique em "Registros de aplicativo" no menu lateral
   - Clique em "Novo registro"

4. **Preencher informações do registro**
   ```
   Nome: Ginseng App
   Tipos de conta suportados: Contas neste diretório organizacional apenas
   URI de redirecionamento: Deixe em branco (configuraremos depois)
   ```

5. **Copiar IDs necessários**
   Após criar o registro, copie:
   - **ID do aplicativo (cliente)** → Use como `CLIENT_ID`
   - **ID do diretório (locatário)** → Use como `TENANT_ID`

### 2. Configurar autenticação

1. **Adicionar plataforma mobile**
   - No app registrado, vá para "Autenticação"
   - Clique em "Adicionar uma plataforma"
   - Selecione "Aplicativos móveis e de desktop"
   - Adicione este URI de redirecionamento personalizado: `exp://127.0.0.1:19000/--/`
   - Para produção, use: `ginsengapp://auth` (ajuste conforme necessário)

2. **Configurar tipos de token**
   - Marque "Tokens de ID" se não estiver marcado
   - Salve as alterações

### 3. Configurar permissões da API

1. **Ir para Permissões de API**
   - No menu lateral do app, clique em "Permissões de API"

2. **Verificar permissões padrão**
   As seguintes permissões devem estar presentes:
   - `Microsoft Graph > openid` (delegada)
   - `Microsoft Graph > profile` (delegada)  
   - `Microsoft Graph > email` (delegada)
   - `Microsoft Graph > User.Read` (delegada)

3. **Adicionar permissão se necessário**
   - Se `User.Read` não estiver presente, clique em "Adicionar uma permissão"
   - Selecione "Microsoft Graph"
   - Selecione "Permissões delegadas"
   - Procure e selecione "User.Read"
   - Clique em "Adicionar permissões"

4. **Conceder consentimento de administrador** (se necessário)
   - Se sua organização exigir, clique em "Conceder consentimento de administrador"

### 4. Configurar o aplicativo

1. **Editar arquivo de configuração**
   Abra o arquivo `constants/AuthConfig.ts` e substitua:

   ```typescript
   export const AUTH_CONFIG = {
     CLIENT_ID: 'SEU_CLIENT_ID_AQUI', // ID copiado do Azure
     TENANT_ID: 'SEU_TENANT_ID_AQUI', // ID copiado do Azure
     SCOPES: ['openid', 'profile', 'email', 'User.Read'],
     AUTHORITY: 'https://login.microsoftonline.com/',
     PROMPT: 'select_account',
   };
   ```

2. **Exemplo de configuração**
   ```typescript
   export const AUTH_CONFIG = {
     CLIENT_ID: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
     TENANT_ID: '12345678-90ab-cdef-1234-567890abcdef',
     SCOPES: ['openid', 'profile', 'email', 'User.Read'],
     AUTHORITY: 'https://login.microsoftonline.com/',
     PROMPT: 'select_account',
   };
   ```

## 🚀 Testando a configuração

1. **Executar o app**
   ```bash
   npm run dev
   ```

2. **Testar login**
   - Abra o app no dispositivo/emulador
   - Clique em "Entrar com Microsoft"
   - Deve abrir o navegador/webview com a tela de login da Microsoft
   - Faça login com uma conta da organização
   - Deve retornar para o app logado

## 🔍 Troubleshooting

### Erro: "AADSTS50011: The reply URL specified in the request does not match the reply URLs configured for the application"

**Solução:** 
- Verifique se o URI de redirecionamento no Azure AD está correto
- Para desenvolvimento: `exp://127.0.0.1:19000/--/`
- Para produção: configure um scheme personalizado

### Erro: "Invalid client"

**Solução:**
- Verifique se o `CLIENT_ID` está correto
- Verifique se copiou o ID completo do Azure Portal

### Erro: "AADSTS700054: response_type 'code' is not supported for the application"

**Solução:**
- No Azure Portal, vá para "Autenticação"
- Marque "Tokens de ID" nas configurações avançadas

### Login não acontece/trava

**Solução:**
- Verifique a conexão com a internet
- Teste em um dispositivo físico (emuladores podem ter problemas)
- Verifique os logs no console

## 📱 URIs de redirecionamento por ambiente

### Desenvolvimento (Expo Go)
```
exp://127.0.0.1:19000/--/
exp://localhost:19000/--/
```

### Build de desenvolvimento
```
exp://192.168.x.x:19000/--/
```

### Produção (Custom Scheme)
```
ginsengapp://auth
com.grupoginseng.app://auth
```

## 🔐 Segurança

1. **Nunca commite** o `CLIENT_ID` e `TENANT_ID` reais no repositório público
2. **Use variáveis de ambiente** em produção
3. **Configure apenas os URIs necessários** no Azure AD
4. **Monitore os logs** de autenticação no Azure Portal

## 📞 Suporte

Se tiver problemas:

1. Verifique os logs no Azure Portal > Azure AD > Sign-ins
2. Confirme que todas as permissões estão configuradas
3. Teste com uma conta válida da organização
4. Verifique se o app está registrado corretamente

---

**Nota:** Esta configuração permite que usuários da organização façam login no app usando suas credenciais corporativas Microsoft. 