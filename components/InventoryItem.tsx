import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { ChevronDown, ChevronUp, CreditCard as Edit, Trash } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { CachedImage } from '@/components/CachedImage';

interface InventoryItemProps {
  item: {
    id: string;
    name: string;
    image: string;
    category: string;
    price: string;
    quantity: number;
    salles: number;
    status: string;
    inTransit?: string;
    sku?: string;
    critico?: string;
    lastUpdate: string;
    launch?: string;
    coverage?: number;
    daysWithoutSales?: number;
    promotions?: {
      description: string;
      discountPercent: string;
    }[];
  };
  expanded?: boolean;
  onPress: () => void;
}

export function InventoryItem({ item, expanded = false, onPress }: InventoryItemProps) {
  let statusColor;
  let statusBgColor;
  
  if (item.status === 'Em Estoque') {
    statusColor = Colors.success[700];
    statusBgColor = Colors.success[50];
  } else if (item.status === 'Baixo Estoque') {
    statusColor = Colors.warning[700];
    statusBgColor = Colors.warning[50];
  } else {
    statusColor = Colors.error[700];
    statusBgColor = Colors.error[50];
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.mainContainer}
        onPress={onPress}
      >
        <View style={styles.imageContainer}>
          <CachedImage uri={item.image} style={styles.productImage} />
          {item.promotions && item.promotions.length > 0 && (
            <View style={styles.discountFlag}>
              <Text style={styles.discountText}>{item.promotions[0].discountPercent}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.infoContainer}>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.categoryText}>{item.category}</Text>
          <View style={styles.detailsRow}>
            <Text style={styles.priceText}>{item.sku || '-'}</Text>
            <View style={styles.badgesContainer}>
              <View style={styles.badgesColumn}>
                {item.launch && (
                  <View style={[styles.statusBadge, { backgroundColor: Colors.primary[500], marginBottom: 4 }]}>
                    <Text style={[styles.statusText, { color: Colors.white }]}>
                      {item.launch}
                    </Text>
                  </View>
                )}
                <View style={[styles.statusBadge, { backgroundColor: statusBgColor }]}>
                  <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        <View style={styles.quantityContainer}>
          <Text style={styles.quantityLabel}>Venda</Text>
          <Text style={styles.quantityValue}>{item.salles}</Text>
          {expanded ? (
            <ChevronUp size={20} color={Colors.neutral[500]} />
          ) : (
            <ChevronDown size={20} color={Colors.neutral[500]} />
          )}
        </View>
      </TouchableOpacity>
      
      {expanded && (
        <View style={styles.expandedContainer}>
          <View style={styles.expandedRow}>
            <View style={styles.expandedColumn}>
              <Text style={styles.expandedLabel}>Estoque</Text>
              <Text style={styles.expandedValue}>{item.quantity || '-'}</Text>
            </View>
            <View style={styles.expandedColumn}>
              <Text style={styles.expandedLabel}>Em Trânsito</Text>
              <Text style={styles.expandedValue}>{item.inTransit || '-'}</Text>
            </View>
          </View>
          
          <View style={styles.expandedRow}>
            <View style={styles.expandedColumn}>
              <Text style={styles.expandedLabel}>Status Indústria</Text>
              <Text style={styles.expandedValue}>{item.critico || 'Disponível'}</Text>
            </View>
            <View style={styles.expandedColumn}>
              <Text style={styles.expandedLabel}>Última Atualização</Text>
              <Text style={styles.expandedValue}>{item.lastUpdate}</Text>
            </View>
          </View>
          
          <View style={styles.expandedRow}>
            <View style={styles.expandedColumn}>
              <Text style={styles.expandedLabel}>Cobertura</Text>
              <Text style={styles.expandedValue}>{item.coverage} Dias</Text>
            </View>
            <View style={styles.expandedColumn}>
              <Text style={styles.expandedLabel}>Dias Sem Venda</Text>
              <Text style={styles.expandedValue}>{item.daysWithoutSales}</Text>
            </View>
          </View>

          {item.promotions && item.promotions.length > 0 && (
            <View style={styles.promotionsContainer}>
              <Text style={styles.promotionsTitle}>Promoções</Text>
              {item.promotions.map((promo, index) => (
                <View key={index} style={styles.promotionItem}>
                  <Text style={styles.promotionDescription}>{promo.description}</Text>
                  <Text style={styles.promotionDiscount}>
                    Desconto: {promo.discountPercent}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.white,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  mainContainer: {
    flexDirection: 'row',
    padding: 12,
  },
  imageContainer: {
    position: 'relative',
    marginRight: 12,
  },
  productImage: {
    width: 70,
    height: 70,
    borderRadius: 8,
  },
  discountFlag: {
    position: 'absolute',
    top: -6,
    left: -6,
    backgroundColor: Colors.success[500],
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 4,
    zIndex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  discountText: {
    color: Colors.white,
    fontSize: 8,
    fontFamily: 'Inter-Bold',
  },
  infoContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  productName: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  categoryText: {
    fontFamily: 'Inter-Regular',
    fontSize: 9,
    color: Colors.neutral[600],
    marginBottom: 4,
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  priceText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.neutral[900],
  },
  badgesContainer: {
    alignItems: 'flex-end',
  },
  badgesColumn: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Inter-Medium',
    fontSize: 8,
  },
  quantityContainer: {
    width: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 8,
    color: Colors.neutral[500],
    marginBottom: 4,
  },
  quantityValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.neutral[900],
    marginBottom: 4,
  },
  expandedContainer: {
    padding: 12,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[100],
  },
  expandedRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  expandedColumn: {
    flex: 1,
  },
  expandedLabel: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[500],
    marginBottom: 4,
  },
  expandedValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.neutral[800],
  },
  promotionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: Colors.primary[50],
    borderRadius: 8,
  },
  promotionsTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: Colors.primary[700],
    marginBottom: 8,
  },
  promotionItem: {
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[100],
  },
  promotionDescription: {
    fontFamily: 'Inter-Regular',
    fontSize: 10,
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  promotionDiscount: {
    fontFamily: 'Inter-Medium',
    fontSize: 10,
    color: Colors.primary[700],
  },
});