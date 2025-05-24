import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChartBar as BarChart2, Chrome as Home, Package, Plus, Settings, Store } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { View } from 'react-native';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#04506B',
        tabBarInactiveTintColor: Colors.neutral[400],
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom,
          paddingTop: 1,
        },
        tabBarLabelStyle: {
          fontFamily: 'Inter-Medium',
          fontSize: 12,
          marginTop: 2,
          marginBottom: 4,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(4, 80, 107, 0.1)',
                    bottom: -8,
                  }}
                />
              )}
              <View style={{ marginTop: 4 }}>
                {focused ? (
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 12, 
                    backgroundColor: Colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#04506B'
                  }}>
                    <Home size={size - 4} color={color} />
                  </View>
                ) : (
                  <Home size={size} color={color} />
                )}
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Estoque',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(4, 80, 107, 0.1)',
                    bottom: -8,
                  }}
                />
              )}
              <View style={{ marginTop: 4 }}>
                {focused ? (
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 12, 
                    backgroundColor: Colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#04506B'
                  }}>
                    <Package size={size - 4} color={color} />
                  </View>
                ) : (
                  <Package size={size} color={color} />
                )}
              </View>
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ focused, color, size }) => (
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              {focused && (
                <View
                  style={{
                    position: 'absolute',
                    width: 40,
                    height: 40,
                    borderRadius: 20,
                    backgroundColor: 'rgba(4, 80, 107, 0.1)',
                    bottom: -8,
                  }}
                />
              )}
              <View style={{ marginTop: 4 }}>
                {focused ? (
                  <View style={{ 
                    width: 24, 
                    height: 24, 
                    borderRadius: 12, 
                    backgroundColor: Colors.white,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderWidth: 2,
                    borderColor: '#04506B'
                  }}>
                    <BarChart2 size={size - 4} color={color} />
                  </View>
                ) : (
                  <BarChart2 size={size} color={color} />
                )}
              </View>
            </View>
          ),
        }}
      />
    </Tabs>
  );
}