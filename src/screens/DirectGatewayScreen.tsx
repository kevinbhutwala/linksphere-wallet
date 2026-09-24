import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { GatewayProduct, TransactionRecord } from '../types';
import { mockGatewayService } from '../services/gateway/mockGatewayService';
import { GatewayProductCard } from '../components/GatewayProductCard';
import { RazorpaySheet } from '../components/RazorpaySheet';
import { useTransactionStore } from '../store/useTransactionStore';
import { ToastMessage } from '../components/Toast';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onShowToast: (toast: ToastMessage) => void;
  onOpenPolicy?: () => void;
}

export const DirectGatewayScreen: React.FC<Props> = ({ onShowToast, onOpenPolicy }) => {
  const [products, setProducts] = useState<GatewayProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<GatewayProduct | null>(null);
  const [activeTx, setActiveTx] = useState<TransactionRecord | null>(null);
  const [isSheetVisible, setIsSheetVisible] = useState(false);

  const { addPendingTransaction, updateTransactionStatus } = useTransactionStore();

  const fetchCatalog = async () => {
    try {
      const items = await mockGatewayService.getProducts();
      setProducts(items);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCatalog();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchCatalog();
  };

  const handleSelectProduct = (product: GatewayProduct) => {
    const pendingTx = mockGatewayService.createPendingOrder(product);
    addPendingTransaction(pendingTx);
    setSelectedProduct(product);
    setActiveTx(pendingTx);
    setIsSheetVisible(true);
  };

  const handleRazorpaySuccess = (gatewayPaymentId: string) => {
    if (!activeTx) return;

    updateTransactionStatus(activeTx.id, 'SETTLED', {
      serverReceiptId: gatewayPaymentId,
    });

    setIsSheetVisible(false);
    setActiveTx(null);
    setSelectedProduct(null);

    onShowToast({
      id: `toast_${Date.now()}`,
      type: 'success',
      title: 'Order Confirmed!',
      description: `Razorpay payment captured. Shipping confirmation emailed.`,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#00A86B" />
        }
      >
        <View style={styles.sectionHeaderWrap}>
          <Text style={styles.sectionTitle}>Physical Merch & Passes</Text>
          <Text style={styles.sectionSubtitle}>
            Official gear & conference badges • Shipped to your address
          </Text>
        </View>

        {products.map((product) => (
          <GatewayProductCard
            key={product.id}
            product={product}
            onPayWithRazorpay={handleSelectProduct}
          />
        ))}

        <TouchableOpacity
          style={styles.policyFooter}
          onPress={onOpenPolicy}
          activeOpacity={0.7}
        >
          <Ionicons name="shield-checkmark-outline" size={14} color="#059669" style={{ marginRight: 6 }} />
          <Text style={styles.policyFooterText}>
            Official Merch & Passes • Secured by Razorpay Gateway • <Text style={{ color: '#059669', fontWeight: '700' }}>Store Policy →</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Razorpay Sheet Modal */}
      <RazorpaySheet
        visible={isSheetVisible}
        product={selectedProduct}
        transaction={activeTx}
        onSuccess={handleRazorpaySuccess}
        onCancel={() => {
          if (activeTx) {
            updateTransactionStatus(activeTx.id, 'FAILED', {
              failureReason: 'User cancelled Razorpay checkout',
            });
          }
          setIsSheetVisible(false);
          setActiveTx(null);
          setSelectedProduct(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionHeaderWrap: {
    marginBottom: 16,
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 3,
  },
  policyFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 14,
    marginBottom: 10,
  },
  policyFooterText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
    textAlign: 'center',
  },
});
