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
            <Ionicons name="cube-outline" size={12} color="#06b6d4" style={{ marginRight: 4 }} />
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
    backgroundColor: '#161922',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#22283a',
    marginBottom: 16,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 140,
    backgroundColor: '#1e2230',
  },
  content: {
    padding: 16,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06b6d418',
    borderColor: '#06b6d440',
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: {
    color: '#22d3ee',
    fontSize: 10,
    fontWeight: '700',
  },
  skuText: {
    color: '#64748b',
    fontSize: 11,
    fontFamily: 'monospace',
  },
  title: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 6,
  },
  description: {
    color: '#94a3b8',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#22283a',
  },
  priceLabel: {
    color: '#64748b',
    fontSize: 11,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  priceValue: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  razorpayBtn: {
    backgroundColor: '#0c2340',
    borderWidth: 1,
    borderColor: '#0284c7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  disabledBtn: {
    opacity: 0.5,
  },
  rzpIconPlaceholder: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rzpBtnText: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
  },
});
