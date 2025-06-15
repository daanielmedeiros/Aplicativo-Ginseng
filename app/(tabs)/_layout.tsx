import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { DoorOpen, Home, Package, Plus, Settings, Store, BarChart3 } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { View, TouchableOpacity, Platform } from 'react-native';
import { useAuth } from '@/contexts/AuthContext';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  
  // Verificar se o usuário tem acesso às salas (officeLocation = "Escritório")
  const hasRoomAccess = user?.officeLocation?.toLowerCase() === 'escritorio';
  
  return (
    <Tabs
      screenOptions={({ route }) => ({
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
        tabBarIconStyle: {
          marginBottom: 0,
        },
        animation: 'shift',
        tabBarButton: (props) => {
          const { children, style, onPress, delayLongPress, ...otherProps } = props;
          return (
            <TouchableOpacity 
              style={style} 
              onPress={onPress}
              activeOpacity={1}
              delayLongPress={delayLongPress || undefined}
              delayPressIn={0}
              delayPressOut={0}
            >
              {children}
            </TouchableOpacity>
          );
        },
      })}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Início',
          tabBarIcon: ({ focused, color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="inventory"
        options={{
          title: 'Estoque',
          tabBarIcon: ({ focused, color, size }) => (
            <Package size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="supplies"
        options={{
          title: 'Suprimentos',
          tabBarIcon: ({ focused, color, size }) => (
            <BarChart3 size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Salas',
          tabBarIcon: ({ focused, color, size }) => (
            <DoorOpen size={size} color={color} />
          ),
          href: hasRoomAccess ? '/analytics' : null,
        }}
      />
    </Tabs>
  );
}