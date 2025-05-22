import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ArrowDown, ArrowUp } from 'lucide-react-native';
import Colors from '@/constants/Colors';

interface DashboardCardProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon?: React.ReactNode;
  backgroundColor?: string;
  invertColors?: boolean;
}

export function DashboardCard({ 
  title, 
  value, 
  change, 
  isPositive, 
  icon,
  backgroundColor = Colors.neutral[50],
  invertColors = false
}: DashboardCardProps) {
  return (
    <View style={[styles.card, { backgroundColor }]}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        {icon && <View style={styles.iconContainer}>{icon}</View>}
      </View>
      <Text style={styles.value}>{value}</Text>
      <View style={styles.changeContainer}>
        {invertColors ? (
          !isPositive ? (
            <ArrowUp size={14} color={Colors.error[500]} />
          ) : (
            <ArrowDown size={14} color={Colors.info[500]} />
          )
        ) : (
          isPositive ? (
            <ArrowUp size={14} color={Colors.success[500]} />
          ) : (
            <ArrowDown size={14} color={Colors.error[500]} />
          )
        )}
        <Text 
          style={[
            styles.changeText, 
            invertColors 
              ? (!isPositive ? styles.negativeChange : styles.positiveChange)
              : (isPositive ? styles.positiveChange : styles.negativeChange)
          ]}
        >
          {change}
        </Text>
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[700],
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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