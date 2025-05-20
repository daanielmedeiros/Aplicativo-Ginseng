import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Image
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, MapPin, ChevronRight, Star, AlignJustify } from 'lucide-react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import Colors from '@/constants/Colors';
import { CommonStyles } from '@/constants/Styles';
import { mockStoresData } from '@/data/mockData';

export default function StoresScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewType, setViewType] = useState('list'); // 'list' or 'map'
  
  // Filter stores based on search query
  const filteredStores = mockStoresData.filter(store => 
    store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    store.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderStoreItem = ({ item, index }: { item: any, index: number }) => (
    <Animated.View 
      entering={FadeInDown.duration(300).delay(index * 50)}
    >
      <TouchableOpacity style={styles.storeCard}>
        <View style={styles.storeImageContainer}>
          <Image 
            source={{ uri: item.image }}
            style={styles.storeImage}
            resizeMode="cover"
          />
          {item.status === 'Aberta' ? (
            <View style={[styles.statusBadge, styles.statusOpen]}>
              <Text style={styles.statusTextOpen}>Aberta</Text>
            </View>
          ) : (
            <View style={[styles.statusBadge, styles.statusClosed]}>
              <Text style={styles.statusTextClosed}>Fechada</Text>
            </View>
          )}
        </View>
        
        <View style={styles.storeContent}>
          <View style={styles.storeHeader}>
            <Text style={styles.storeName}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <Star size={14} color={Colors.accent[500]} fill={Colors.accent[500]} />
              <Text style={styles.ratingText}>{item.rating}</Text>
            </View>
          </View>
          
          <View style={styles.locationContainer}>
            <MapPin size={14} color={Colors.neutral[500]} />
            <Text style={styles.locationText}>{item.location}</Text>
          </View>
          
          <View style={styles.performanceContainer}>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Vendas</Text>
              <Text style={styles.performanceValue}>{item.sales}</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Estoque</Text>
              <Text style={styles.performanceValue}>{item.inventory} itens</Text>
            </View>
            <View style={styles.performanceItem}>
              <Text style={styles.performanceLabel}>Alertas</Text>
              <Text style={[
                styles.performanceValue, 
                item.alerts > 0 ? styles.alertValue : {}
              ]}>
                {item.alerts}
              </Text>
            </View>
          </View>
          
          <TouchableOpacity style={styles.viewDetailsButton}>
            <Text style={styles.viewDetailsText}>Ver detalhes</Text>
            <ChevronRight size={16} color={Colors.primary[500]} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Lojas</Text>
        <TouchableOpacity style={styles.viewToggle}>
          <AlignJustify size={20} color={Colors.neutral[700]} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.searchContainer}>
        <Search size={18} color={Colors.neutral[500]} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar lojas..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity 
            style={styles.clearButton} 
            onPress={() => setSearchQuery('')}
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        ) : null}
      </View>
      
      <View style={styles.countContainer}>
        <Text style={styles.countText}>
          {filteredStores.length} {filteredStores.length === 1 ? 'loja encontrada' : 'lojas encontradas'}
        </Text>
      </View>
      
      <FlatList
        data={filteredStores}
        keyExtractor={item => item.id}
        renderItem={renderStoreItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Image
              source={{ uri: 'https://images.pexels.com/photos/2079438/pexels-photo-2079438.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=200&w=200' }}
              style={styles.emptyImage}
            />
            <Text style={styles.emptyTitle}>Nenhuma loja encontrada</Text>
            <Text style={styles.emptyText}>
              Tente buscar por outro termo ou verifique a conexão
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  title: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.neutral[900],
  },
  viewToggle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.neutral[100],
    margin: 16,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 44,
    fontFamily: 'Inter-Regular',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  clearButton: {
    padding: 8,
  },
  clearButtonText: {
    fontSize: 16,
    color: Colors.neutral[500],
  },
  countContainer: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  countText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[600],
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
  },
  storeCard: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  storeImageContainer: {
    position: 'relative',
  },
  storeImage: {
    width: '100%',
    height: 120,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusOpen: {
    backgroundColor: Colors.success[500],
  },
  statusClosed: {
    backgroundColor: Colors.neutral[600],
  },
  statusTextOpen: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.white,
  },
  statusTextClosed: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.white,
  },
  storeContent: {
    padding: 16,
  },
  storeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storeName: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 16,
    color: Colors.neutral[900],
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.accent[50],
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: Colors.accent[700],
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  locationText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[600],
    marginLeft: 6,
  },
  performanceContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  performanceItem: {},
  performanceLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[500],
    marginBottom: 4,
  },
  performanceValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[900],
  },
  alertValue: {
    color: Colors.error[500],
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewDetailsText: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.primary[500],
    marginRight: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyImage: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 18,
    color: Colors.neutral[800],
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: 'Inter-Regular',
    fontSize: 14,
    color: Colors.neutral[600],
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});