import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface PerformanceMetricProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon?: React.ReactNode;
  backgroundColor?: string;
}

export function PerformanceMetric({ 
  title, 
  value, 
  change, 
  isPositive, 
  icon,
  backgroundColor = Colors.neutral[50]
}: PerformanceMetricProps) {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.value}>{value}</Text>
        <View style={styles.changeContainer}>
          {isPositive ? (
            <ArrowUp size={14} color={Colors.success[500]} />
          ) : (
            <ArrowDown size={14} color={Colors.error[500]} />
          )}
          <Text 
            style={[
              styles.changeText, 
              isPositive ? styles.positiveChange : styles.negativeChange
            ]}
          >
            {change}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[700],
    marginBottom: 8,
  },
  value: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 20,
    color: Colors.neutral[900],
    marginBottom: 8,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    marginLeft: 4,
  },
  positiveChange: {
    color: Colors.success[700],
  },
  negativeChange: {
    color: Colors.error[700],
  },
});