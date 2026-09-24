import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { GatewayProduct } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  product: GatewayProduct;
  onPayWithRazorpay: (product: GatewayProduct) => void;
  disabled?: boolean;
}

export const GatewayProductCard: React.FC<Props> = ({
  product,
  onPayWithRazorpay,
  disabled,
}) => {
  return (
    <View style={styles.card}>
      <Image source={{ uri: product.imageUri }} style={styles.image} resizeMode="cover" />
      
      <View style={styles.content}>
        <View style={styles.badgeRow}>
          <View style={styles.categoryBadge}>
            <Ionicons name="cube-outline" size={12} color="#047857" style={{ marginRight: 4 }} />
            <Text style={styles.badgeText}>{product.badge}</Text>
          </View>
          <Text style={styles.skuText}>{product.sku}</Text>
        </View>

        <Text style={styles.title}>{product.title}</Text>
        <Text style={styles.description}>{product.description}</Text>

        <View style={styles.footerRow}>
          <View>
            <Text style={styles.priceLabel}>Direct Checkout</Text>
            <Text style={styles.priceValue}>{product.priceFormatted}</Text>
          </View>

          <TouchableOpacity
            style={[styles.razorpayBtn, disabled && styles.disabledBtn]}
            activeOpacity={0.85}
            disabled={disabled}
            onPress={() => onPayWithRazorpay(product)}
          >
            <View style={styles.rzpIconPlaceholder}>
              <Ionicons name="card" size={16} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.rzpBtnText}>Razorpay Pay</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#f1f5f9',
  },
  content: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#047857',
    fontSize: 10,
    fontWeight: '700',
  },
  skuText: {
    color: '#94a3b8',
    fontSize: 11,
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
    lineHeight: 22,
  },
  description: {
    color: '#64748b',
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  priceLabel: {
    color: '#94a3b8',
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  priceValue: {
    color: '#0f172a',
    fontSize: 19,
    fontWeight: '800',
  },
  razorpayBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderRadius: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  rzpIconPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rzpBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
