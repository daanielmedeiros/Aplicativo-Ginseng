import React from 'react';
import { Image, ImageProps, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useImageCache } from '@/hooks/useImageCache';
import Colors from '@/constants/Colors';

interface CachedImageProps extends Omit<ImageProps, 'source'> {
  uri: string;
  showLoader?: boolean;
  loaderSize?: 'small' | 'large';
  loaderColor?: string;
  fallbackSource?: ImageProps['source'];
}

export const CachedImage: React.FC<CachedImageProps> = ({
  uri,
  style,
  showLoader = true,
  loaderSize = 'small',
  loaderColor = Colors.primary[500],
  fallbackSource,
  ...imageProps
}) => {
  const { cachedUri, isLoading, error } = useImageCache(uri);

  if (error && fallbackSource) {
    return <Image source={fallbackSource} style={style} {...imageProps} />;
  }

  if (!cachedUri) {
    return showLoader ? (
      <View style={[styles.loaderContainer, style]}>
        <ActivityIndicator size={loaderSize} color={loaderColor} />
      </View>
    ) : (
      <View style={style} />
    );
  }

  return (
    <Image 
      source={{ uri: cachedUri }} 
      style={style} 
      {...imageProps}
    />
  );
};

const styles = StyleSheet.create({
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
  },
}); 