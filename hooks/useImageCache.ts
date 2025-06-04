import { useState, useEffect } from 'react';
import { imageCacheManager } from '@/utils/imageCache';

interface UseImageCacheResult {
  cachedUri: string | null;
  isLoading: boolean;
  error: string | null;
}

export const useImageCache = (originalUri: string): UseImageCacheResult => {
  const [cachedUri, setCachedUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const loadImage = async () => {
      if (!originalUri) {
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Primeiro tenta obter do cache
        const cachedPath = await imageCacheManager.getCachedImage(originalUri);
        
        if (cachedPath && isMounted) {
          setCachedUri(cachedPath);
          setIsLoading(false);
          return;
        }

        // Se não está no cache, usa a URL original temporariamente
        if (isMounted) {
          setCachedUri(originalUri);
        }

        // Faz o cache em background
        const newCachedPath = await imageCacheManager.cacheImage(originalUri);
        
        if (isMounted && newCachedPath !== originalUri) {
          setCachedUri(newCachedPath);
        }
        
        if (isMounted) {
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          // Não trata como erro se a imagem simplesmente não existe (404)
          const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar imagem';
          const is404Error = errorMessage.includes('404') || errorMessage.includes('não encontrada');
          
          if (!is404Error) {
            setError(errorMessage);
          }
          setCachedUri(originalUri); // Fallback para URL original
          setIsLoading(false);
        }
      }
    };

    loadImage();

    return () => {
      isMounted = false;
    };
  }, [originalUri]);

  return { cachedUri, isLoading, error };
}; 