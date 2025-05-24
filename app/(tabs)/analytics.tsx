import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Settings } from 'lucide-react-native';
import Colors from '@/constants/Colors';

export default function AnalyticsScreen() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Settings size={80} color={Colors.neutral[400]} />
        <Text style={styles.title}>Em Construção</Text>
        <Text style={styles.subtitle}>Esta tela está em desenvolvimento</Text>
        <Text style={styles.subtitle}>Agradecemos a compreensão</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 24,
    color: Colors.neutral[800],
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.neutral[500],
    textAlign: 'center',
  },
});