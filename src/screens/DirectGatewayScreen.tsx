import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { GatewayProduct, TransactionRecord } from '../types';
import { mockGatewayService } from '../services/gateway/mockGatewayService';
import { GatewayProductCard } from '../components/GatewayProductCard';
import { RazorpaySheet } from '../components/RazorpaySheet';
import { useTransactionStore } from '../store/useTransactionStore';
import { ToastMessage } from '../components/Toast';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onShowToast: (toast: ToastMessage) => void;
}

export const DirectGatewayScreen: React.FC<Props> = ({ onShowToast }) => {
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
      title: 'Order Confirmed via Razorpay!',
      description: `Payment ${gatewayPaymentId.slice(0, 12)} captured. Physical order dispatched.`,
    });
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor="#38bdf8" />
        }
      >
        {/* Compliance & Policy Architecture Callout */}
        <View style={styles.policyWarningCard}>
          <View style={styles.cardHeader}>
            <Ionicons name="alert-circle" size={18} color="#38bdf8" />
            <Text style={styles.cardTitle}>Store Policy & Architectural Isolation</Text>
          </View>
          <Text style={styles.cardBody}>
            Direct gateways (Razorpay/Stripe) are <Text style={styles.bold}>strictly isolated</Text> to physical merchandise and off-platform passes.
            Under Apple Guideline 3.1.1 & Google Play policies, consumable in-game coins may NOT bypass StoreKit/Play Billing.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>PHYSICAL GOODS & EXTERNAL PASSES</Text>

        {products.map((product) => (
          <GatewayProductCard
            key={product.id}
            product={product}
            onPayWithRazorpay={handleSelectProduct}
          />
        ))}
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
    backgroundColor: '#0a0d14',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  policyWarningCard: {
    backgroundColor: '#0c2340',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardTitle: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  cardBody: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  bold: {
    color: '#ffffff',
    fontWeight: '700',
  },
  sectionHeader: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
});
