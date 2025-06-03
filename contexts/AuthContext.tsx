import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AUTH_CONFIG } from '@/constants/AuthConfig';

// Configuração para funcionar com o Expo
WebBrowser.maybeCompleteAuthSession();

interface User {
  id: string;
  name: string;
  email: string;
  picture?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Configurações do Azure AD usando o arquivo de config
const getRedirectUri = () => {
  if (Platform.OS === 'web') {
    // Para web, usar localhost
    return 'https://app.danielmedeiros.fun/';
  } else {
    // Para mobile, usar um scheme customizado específico
    return 'com.grupoginseng.app://auth';
  }
};

const REDIRECT_URI = getRedirectUri();

console.log('=== CONFIG DEBUG ===');
console.log('Platform:', Platform.OS);
console.log('REDIRECT_URI configurado:', REDIRECT_URI);
console.log('==================');

const discovery = {
  authorizationEndpoint: `${AUTH_CONFIG.AUTHORITY}${AUTH_CONFIG.TENANT_ID}/oauth2/v2.0/authorize`,
  tokenEndpoint: `${AUTH_CONFIG.AUTHORITY}${AUTH_CONFIG.TENANT_ID}/oauth2/v2.0/token`,
  revocationEndpoint: `${AUTH_CONFIG.AUTHORITY}${AUTH_CONFIG.TENANT_ID}/oauth2/v2.0/logout`,
};

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId: AUTH_CONFIG.CLIENT_ID,
      scopes: ['openid', 'profile', 'email', 'User.Read'],
      responseType: AuthSession.ResponseType.Code,
      redirectUri: REDIRECT_URI,
      extraParams: {
        prompt: 'select_account',
      },
    },
    discovery
  );

  // Verificar se há token salvo ao inicializar
  useEffect(() => {
    loadStoredAuth();
  }, []);

  // Processar resposta da autenticação
  useEffect(() => {
    if (response?.type === 'success') {
      handleAuthResponse(response);
    }
  }, [response]);

  const loadStoredAuth = async () => {
    try {
      const storedUser = await AsyncStorage.getItem('@auth_user');
      const storedToken = await AsyncStorage.getItem('@auth_token');
      
      if (storedUser && storedToken) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erro ao carregar dados salvos:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthResponse = async (response: AuthSession.AuthSessionResult) => {
    if (response.type === 'success' && response.params.code) {
      try {
        setIsLoading(true);
        
        // Trocar o código por um token
        const tokenResponse = await AuthSession.exchangeCodeAsync(
          {
            clientId: AUTH_CONFIG.CLIENT_ID,
            code: response.params.code,
            redirectUri: REDIRECT_URI,
            extraParams: {
              code_verifier: request?.codeVerifier || '',
            },
          },
          discovery
        );

        if (tokenResponse.accessToken) {
          // Buscar informações do usuário
          const userInfo = await fetchUserInfo(tokenResponse.accessToken);
          
          // Salvar dados
          await AsyncStorage.setItem('@auth_token', tokenResponse.accessToken);
          await AsyncStorage.setItem('@auth_user', JSON.stringify(userInfo));
          
          setUser(userInfo);
        }
      } catch (error) {
        console.error('Erro na autenticação:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const fetchUserInfo = async (accessToken: string): Promise<User> => {
    try {
      const response = await fetch('https://graph.microsoft.com/v1.0/me', {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      const userData = await response.json();
      
      return {
        id: userData.id,
        name: userData.displayName || userData.givenName + ' ' + userData.surname,
        email: userData.mail || userData.userPrincipalName,
        picture: userData.photo?.['@odata.mediaContentType'] ? 
          `https://graph.microsoft.com/v1.0/me/photo/$value` : undefined,
      };
    } catch (error) {
      console.error('Erro ao buscar informações do usuário:', error);
      throw error;
    }
  };

  const signIn = async () => {
    try {
      setIsLoading(true);
      await promptAsync();
    } catch (error) {
      console.error('Erro ao iniciar login:', error);
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setIsLoading(true);
      
      // Remover dados salvos
      await AsyncStorage.removeItem('@auth_token');
      await AsyncStorage.removeItem('@auth_user');
      
      setUser(null);
      
      // Opcional: fazer logout no Azure AD
      // WebBrowser.openAuthSessionAsync(
      //   `https://login.microsoftonline.com/${AUTH_CONFIG.TENANT_ID}/oauth2/v2.0/logout?post_logout_redirect_uri=${encodeURIComponent(REDIRECT_URI)}`,
      //   REDIRECT_URI
      // );
      
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
} 