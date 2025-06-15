import React, { useEffect, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Svg, { Line } from 'react-native-svg';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface Point {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  opacity: number;
}

export default function ConstellationBackground() {
  const [points, setPoints] = useState<Point[]>([]);

  // Gerar pontos iniciais
  useEffect(() => {
    const generatePoints = () => {
      const newPoints: Point[] = [];
      const numberOfPoints = 20;

      for (let i = 0; i < numberOfPoints; i++) {
        newPoints.push({
          id: i,
          x: Math.random() * (screenWidth - 20) + 10,
          y: Math.random() * (screenHeight - 20) + 10,
          vx: (Math.random() - 0.5) * 1.2,
          vy: (Math.random() - 0.5) * 1.2,
          opacity: Math.random() * 0.5 + 0.4,
        });
      }
      
      setPoints(newPoints);
    };

    generatePoints();
  }, []);

  // Animar pontos
  useEffect(() => {
    const updatePoints = () => {
      setPoints(currentPoints => 
        currentPoints.map(point => {
          let newX = point.x + point.vx;
          let newY = point.y + point.vy;
          let newVx = point.vx;
          let newVy = point.vy;

          // Fazer os pontos ricochetearem nas bordas
          if (newX <= 10 || newX >= screenWidth - 10) {
            newVx = -newVx;
            newX = Math.max(10, Math.min(screenWidth - 10, newX));
          }
          if (newY <= 10 || newY >= screenHeight - 10) {
            newVy = -newVy;
            newY = Math.max(10, Math.min(screenHeight - 10, newY));
          }

          return {
            ...point,
            x: newX,
            y: newY,
            vx: newVx,
            vy: newVy,
          };
        })
      );
    };

    const interval = setInterval(updatePoints, 30);

    return () => {
      clearInterval(interval);
    };
  }, []);

  // Calcular distância entre dois pontos
  const getDistance = (p1: Point, p2: Point) => {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2));
  };

  // Renderizar linhas conectoras
  const renderLines = () => {
    const lines = [];
    const maxDistance = 120; // Distância máxima para conectar pontos

    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const point1 = points[i];
        const point2 = points[j];
        const distance = getDistance(point1, point2);

        if (distance < maxDistance) {
          const opacity = (1 - distance / maxDistance) * 0.4; // Opacidade baseada na distância
          lines.push(
            <Line
              key={`line-${i}-${j}`}
              x1={point1.x}
              y1={point1.y}
              x2={point2.x}
              y2={point2.y}
              stroke="rgba(255, 255, 255, 0.6)"
              strokeWidth="1"
              opacity={opacity}
            />
          );
        }
      }
    }

    return lines;
  };

  const renderPoints = () => {
    return points.map(point => (
      <View
        key={`point-${point.id}`}
        style={[
          styles.point,
          {
            left: point.x,
            top: point.y,
            opacity: point.opacity,
          }
        ]}
      />
    ));
  };

  return (
    <View style={styles.container}>
      {/* SVG para as linhas */}
      <Svg width={screenWidth} height={screenHeight} style={styles.svg}>
        {renderLines()}
      </Svg>
      
      {/* Points como Views para melhor performance */}
      {renderPoints()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 0,
  },
  point: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    shadowColor: '#ffffff',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  svg: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
}); 