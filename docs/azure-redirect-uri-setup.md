# 🔧 Como Configurar URIs de Redirecionamento no Azure AD

## ❌ **Erro que você está vendo:**
```
AADSTS50011: The redirect URI 'exp://192.168.0.11:8081' specified in the request does not match the redirect URIs configured for the application
```

## ✅ **Solução Passo a Passo:**

### 1. **Descobrir o URI correto**
- Abra o app Ginseng
- Na tela de login, clique no botão "Debug Azure" (canto superior direito)
- **COPIE** o URI que aparece (exemplo: `exp://192.168.0.11:8081`)

### 2. **Configurar no Azure Portal**

#### **Acessar o Azure Portal:**
1. Vá para https://portal.azure.com
2. Faça login com sua conta corporativa

#### **Encontrar seu app:**
1. Clique em **"Azure Active Directory"**
2. No menu lateral, clique em **"Registros de aplicativo"**
3. Encontre e clique em **"Ginseng App"** (ou o nome que você deu)

#### **Configurar URIs de redirecionamento:**
1. No menu lateral do app, clique em **"Autenticação"**
2. Na seção **"URIs de redirecionamento"**, clique em **"Adicionar URI"**
3. **Cole o URI** que você copiou do app (ex: `exp://192.168.0.11:8081`)
4. Clique em **"Salvar"**

### 3. **URIs comuns para adicionar**

Para cobrir diferentes cenários, adicione TODOS estes URIs:

```
exp://127.0.0.1:8081
exp://localhost:8081
exp://192.168.0.11:8081    # (substitua pelo seu IP local)
exp://192.168.1.x:8081     # (outros IPs da sua rede)
```

### 4. **Configuração para Produção**

Para quando o app for publicado, adicione também:
```
com.grupoginseng.app://auth
ginsengapp://auth
```

## 🔍 **Verificar se funcionou:**

1. **Salve** as alterações no Azure Portal
2. **Feche** o app completamente
3. **Abra** o app novamente
4. Tente fazer login com Microsoft
5. Deve funcionar sem o erro AADSTS50011

## 📱 **Diferentes tipos de URI por ambiente:**

### **Desenvolvimento (Expo Go):**
- `exp://127.0.0.1:8081` - IP local
- `exp://localhost:8081` - Localhost
- `exp://SEU-IP-LOCAL:8081` - IP da sua máquina na rede

### **Tunnel/ngrok:**
- `exp://abc123.ngrok.io:8081` - Se usando tunnel

### **Build standalone:**
- `com.grupoginseng.app://auth` - Scheme customizado

## ⚠️ **Dicas importantes:**

1. **IP pode mudar:** Se o IP da sua máquina mudar, você precisará adicionar o novo URI
2. **Múltiplos URIs:** Pode adicionar vários URIs sem problema
3. **Case sensitive:** URIs são sensíveis a maiúsculas/minúsculas
4. **Aguardar propagação:** Mudanças podem levar alguns minutos para funcionar

## 🆘 **Se ainda não funcionar:**

1. **Aguarde 5-10 minutos** para as mudanças no Azure se propagarem
2. **Feche completamente** o app e abra novamente
3. **Verifique** se o URI foi salvo corretamente no Azure
4. **Adicione outros URIs** da lista acima
5. **Consulte os logs** no Azure Portal > Azure AD > Sign-ins

---

**💡 Dica:** Mantenha o botão "Debug Azure" no app durante o desenvolvimento para facilitar a descoberta de novos URIs quando necessário. 