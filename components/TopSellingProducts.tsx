import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity } from 'react-native';
import Colors from '@/constants/Colors';
import { CachedImage } from '@/components/CachedImage';

// Mock data temporário
const mockTopSellingData = [
  {
    id: '1',
    name: 'Produto Exemplo',
    category: 'Categoria',
    image: 'https://via.placeholder.com/150',
    price: 'R$ 50,00',
    sold: 100
  }
];

export function TopSellingProducts() {
  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {mockTopSellingData.map((product, index) => (
        <TouchableOpacity key={product.id} style={styles.productCard}>
          <View style={styles.imageContainer}>
            <CachedImage uri={product.image} style={styles.productImage} />
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.productName} numberOfLines={2}>{product.name}</Text>
            <Text style={styles.productCategory}>{product.category}</Text>
            <View style={styles.statsRow}>
              <Text style={styles.productPrice}>{product.price}</Text>
              <Text style={styles.productSold}>{product.sold} vendidos</Text>
            </View>
          </View>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingRight: 16,
  },
  productCard: {
    width: 180,
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginRight: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  imageContainer: {
    position: 'relative',
    width: '100%',
    height: 120,
  },
  productImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  rankBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary[500],
    justifyContent: 'center',
    alignItems: 'center',
  },
  rankText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: Colors.white,
  },
  productInfo: {
    padding: 12,
  },
  productName: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: Colors.neutral[900],
    marginBottom: 4,
    height: 40,
  },
  productCategory: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[600],
    marginBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productPrice: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: Colors.primary[700],
  },
  productSold: {
    fontFamily: 'Inter-Regular',
    fontSize: 12,
    color: Colors.neutral[500],
  },
});