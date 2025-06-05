import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withTiming,
  Easing 
} from 'react-native-reanimated';
import Colors from '@/constants/Colors';

interface ProgressBarProps {
  /** Progresso atual (0-100) - controlado externamente */
  progress?: number;
  /** Duração da animação para mudanças de progresso */
  animationDuration?: number;
  /** Mostrar texto de porcentagem */
  showPercentage?: boolean;
  /** Texto personalizado durante carregamento */
  loadingText?: string;
  /** Cor da barra de progresso */
  color?: string;
  /** Altura da barra */
  height?: number;
}

export default function ProgressBar({
  progress = 0,
  animationDuration = 300,
  showPercentage = true,
  loadingText = "Carregando histórico...",
  color = Colors.primary[500],
  height = 6
}: ProgressBarProps) {
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    // Animar a barra para o progresso atual
    progressWidth.value = withTiming(progress, {
      duration: animationDuration,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress, animationDuration]);

  const animatedBarStyle = useAnimatedStyle(() => {
    return {
      width: `${progressWidth.value}%`,
    };
  });

  const getStatusText = () => {
    if (progress < 40) return "Carregando...";
    if (progress < 60) return "Por favor aguarde...";
    if (progress < 80) return "Processando...";
    if (progress < 90) return "Estamos quase lá...";
    if (progress >= 100) return "Concluído!";
    return "Carregando...";
  };

  return (
    <View style={styles.container}>
      <Text style={styles.loadingText}>{loadingText}</Text>
      
      <View style={styles.progressContainer}>
        <View style={[styles.progressBackground, { height }]}>
          <Animated.View 
            style={[
              styles.progressBar,
              { 
                backgroundColor: color,
                height: height,
              },
              animatedBarStyle
            ]}
          />
        </View>
        
        {showPercentage && (
          <Text style={styles.percentageText}>
            {Math.round(progress)}%
          </Text>
        )}
      </View>

      <Text style={styles.statusText}>
        {getStatusText()}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    minHeight: 100,
  },
  loadingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: Colors.neutral[700],
    marginBottom: 16,
    textAlign: 'center',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBackground: {
    width: '100%',
    backgroundColor: Colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 3,
  },
  percentageText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[600],
    marginTop: 8,
  },
  statusText: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
}); 