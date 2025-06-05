import AsyncStorage from '@react-native-async-storage/async-storage';
import * as FileSystem from 'expo-file-system';

interface CacheItem {
  uri: string;
  timestamp: number;
  localPath: string;
}

const CACHE_KEY_PREFIX = 'image_cache_';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias em milliseconds
const MAX_CACHE_SIZE = 100; // Máximo de 100 imagens no cache

class ImageCacheManager {
  private cacheDir: string;

  constructor() {
    this.cacheDir = `${FileSystem.documentDirectory}imageCache/`;
    this.ensureCacheDirectoryExists();
  }

  private async ensureCacheDirectoryExists() {
    try {
      const dirInfo = await FileSystem.getInfoAsync(this.cacheDir);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.cacheDir, { intermediates: true });
      }
    } catch (error) {
      console.error('Erro ao criar diretório de cache:', error);
    }
  }

  private getFileNameFromUrl(url: string): string {
    // Extrai o nome do arquivo da URL
    const urlParts = url.split('/');
    const fileName = urlParts[urlParts.length - 1];
    return fileName.replace(/[^a-zA-Z0-9.]/g, '_'); // Remove caracteres especiais
  }

  private async getCacheMetadata(): Promise<{ [key: string]: CacheItem }> {
    try {
      const cacheData = await AsyncStorage.getItem('image_cache_metadata');
      return cacheData ? JSON.parse(cacheData) : {};
    } catch (error) {
      console.error('Erro ao obter metadados do cache:', error);
      return {};
    }
  }

  private async setCacheMetadata(metadata: { [key: string]: CacheItem }) {
    try {
      await AsyncStorage.setItem('image_cache_metadata', JSON.stringify(metadata));
    } catch (error) {
      console.error('Erro ao salvar metadados do cache:', error);
    }
  }

  private async cleanOldCache() {
    try {
      const metadata = await this.getCacheMetadata();
      const now = Date.now();
      const keysToRemove: string[] = [];
      
      for (const [key, item] of Object.entries(metadata)) {
        // Remove itens expirados
        if (now - item.timestamp > CACHE_DURATION) {
          keysToRemove.push(key);
          // Remove arquivo físico
          try {
            await FileSystem.deleteAsync(item.localPath, { idempotent: true });
          } catch (error) {
            // console.warn('Erro ao deletar arquivo de cache:', error);
          }
        }
      }

      // Remove entradas expiradas dos metadados
      keysToRemove.forEach(key => delete metadata[key]);
      
      // Se ainda há muitos itens, remove os mais antigos
      const entries = Object.entries(metadata);
      if (entries.length > MAX_CACHE_SIZE) {
        const sortedEntries = entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = sortedEntries.slice(0, entries.length - MAX_CACHE_SIZE);
        
        for (const [key, item] of toRemove) {
          delete metadata[key];
          try {
            await FileSystem.deleteAsync(item.localPath, { idempotent: true });
          } catch (error) {
            // console.warn('Erro ao deletar arquivo de cache:', error);
          }
        }
      }

      await this.setCacheMetadata(metadata);
    } catch (error) {
      console.error('Erro ao limpar cache antigo:', error);
    }
  }

  async getCachedImage(url: string): Promise<string | null> {
    try {
      const cacheKey = this.getFileNameFromUrl(url);
      const metadata = await this.getCacheMetadata();
      const cacheItem = metadata[cacheKey];

      if (cacheItem) {
        // Verifica se o arquivo ainda existe
        const fileInfo = await FileSystem.getInfoAsync(cacheItem.localPath);
        if (fileInfo.exists) {
          // Verifica se não expirou
          if (Date.now() - cacheItem.timestamp < CACHE_DURATION) {
            return cacheItem.localPath;
          }
        }
        // Remove entrada inválida
        delete metadata[cacheKey];
        await this.setCacheMetadata(metadata);
      }

      return null;
    } catch (error) {
      console.error('Erro ao obter imagem do cache:', error);
      return null;
    }
  }

  async cacheImage(url: string): Promise<string> {
    try {
      const fileName = this.getFileNameFromUrl(url);
      const localPath = `${this.cacheDir}${fileName}`;
      
      // Download da imagem
      const downloadResult = await FileSystem.downloadAsync(url, localPath);
      
      if (downloadResult.status === 200) {
        // Salva metadados
        const metadata = await this.getCacheMetadata();
        metadata[fileName] = {
          uri: url,
          timestamp: Date.now(),
          localPath: localPath
        };
        
        await this.setCacheMetadata(metadata);
        
        // Limpa cache antigo periodicamente
        if (Object.keys(metadata).length % 10 === 0) {
          this.cleanOldCache();
        }
        
        return localPath;
      } else if (downloadResult.status === 404) {
        // Imagem não encontrada - caso esperado, não loga erro
        return url;
      } else {
        // Outros erros de status que podem ser inesperados - silencioso para reduzir logs
        // console.warn(`Download da imagem falhou com status: ${downloadResult.status} para URL: ${url}`);
        return url;
      }
    } catch (error) {
      // Apenas loga erros realmente inesperados (não relacionados a 404)
      if (error instanceof Error && !error.message.includes('404')) {
        // console.error('Erro inesperado ao fazer cache da imagem:', error);
      }
      // Retorna URL original se o cache falhar
      return url;
    }
  }

  async clearCache() {
    try {
      // Remove diretório de cache
      await FileSystem.deleteAsync(this.cacheDir, { idempotent: true });
      // Remove metadados
      await AsyncStorage.removeItem('image_cache_metadata');
      // Recria diretório
      await this.ensureCacheDirectoryExists();
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  }

  async getCacheSize(): Promise<{ count: number; sizeInMB: number }> {
    try {
      const metadata = await this.getCacheMetadata();
      const count = Object.keys(metadata).length;
      
      let totalSize = 0;
      for (const item of Object.values(metadata)) {
        try {
          const fileInfo = await FileSystem.getInfoAsync(item.localPath);
          if (fileInfo.exists && fileInfo.size) {
            totalSize += fileInfo.size;
          }
        } catch (error) {
          // Ignora erros de arquivos individuais
        }
      }
      
      return {
        count,
        sizeInMB: totalSize / (1024 * 1024)
      };
    } catch (error) {
      console.error('Erro ao calcular tamanho do cache:', error);
      return { count: 0, sizeInMB: 0 };
    }
  }
}

export const imageCacheManager = new ImageCacheManager(); 