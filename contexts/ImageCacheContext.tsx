import React, { createContext, useContext, useEffect, useState } from 'react';
import { imageCacheManager } from '@/utils/imageCache';

interface ImageCacheContextType {
  cacheSize: { count: number; sizeInMB: number };
  clearCache: () => Promise<void>;
  isInitialized: boolean;
}

const ImageCacheContext = createContext<ImageCacheContextType | undefined>(undefined);

export const useImageCacheContext = () => {
  const context = useContext(ImageCacheContext);
  if (!context) {
    throw new Error('useImageCacheContext deve ser usado dentro de ImageCacheProvider');
  }
  return context;
};

interface ImageCacheProviderProps {
  children: React.ReactNode;
}

export const ImageCacheProvider: React.FC<ImageCacheProviderProps> = ({ children }) => {
  const [cacheSize, setCacheSize] = useState({ count: 0, sizeInMB: 0 });
  const [isInitialized, setIsInitialized] = useState(false);

  const updateCacheSize = async () => {
    try {
      const size = await imageCacheManager.getCacheSize();
      setCacheSize(size);
    } catch (error) {
      console.error('Erro ao atualizar tamanho do cache:', error);
    }
  };

  const clearCache = async () => {
    try {
      await imageCacheManager.clearCache();
      await updateCacheSize();
    } catch (error) {
      console.error('Erro ao limpar cache:', error);
    }
  };

  useEffect(() => {
    const initializeCache = async () => {
      try {
        await updateCacheSize();
        setIsInitialized(true);
      } catch (error) {
        console.error('Erro ao inicializar cache:', error);
        setIsInitialized(true); // Define como inicializado mesmo com erro
      }
    };

    initializeCache();
  }, []);

  return (
    <ImageCacheContext.Provider 
      value={{ 
        cacheSize, 
        clearCache,
        isInitialized 
      }}
    >
      {children}
    </ImageCacheContext.Provider>
  );
}; 