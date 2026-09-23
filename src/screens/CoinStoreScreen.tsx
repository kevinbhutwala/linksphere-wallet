import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { CoinPack, TransactionRecord } from '../types';
import { mockIAPService, COIN_PACKS } from '../services/iap/mockIAPService';
import { CoinCard } from '../components/CoinCard';
import { CoinCardSkeleton } from '../components/CoinCardSkeleton';
import { StoreKitSheet } from '../components/StoreKitSheet';
import { useTransactionStore } from '../store/useTransactionStore';
import { useWalletStore } from '../store/useWalletStore';
import { ToastMessage } from '../components/Toast';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onShowToast: (toast: ToastMessage) => void;
}

export const CoinStoreScreen: React.FC<Props> = ({ onShowToast }) => {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<CoinPack[]>([]);
  const [selectedPack, setSelectedPack] = useState<CoinPack | null>(null);
  const [activeTx, setActiveTx] = useState<TransactionRecord | null>(null);
  const [isProcessingPurchase, setIsProcessingPurchase] = useState(false);
  const [isSheetVisible, setIsSheetVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { addPendingTransaction, updateTransactionStatus, markInterrupted } =
    useTransactionStore();
  const { creditCoins } = useWalletStore();

  const fetchCatalog = async () => {
    try {
      const items = await mockIAPService.getProducts();
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
    setLoading(true);
    fetchCatalog();
  };

  /**
   * INITIATE PURCHASE:
   * Generate UUID idempotency key & persist PENDING state locally strictly prior to API request
   */
  const handleSelectPack = (pack: CoinPack) => {
    const pendingTx = mockIAPService.createPendingTransaction(pack);

    // Synchronously write to MMKV before displaying sheet / contacting backend
    addPendingTransaction(pendingTx);

    setSelectedPack(pack);
    setActiveTx(pendingTx);
    setIsSheetVisible(true);
  };

  /**
   * EXECUTE STOREKIT FLOW (800ms - 1500ms Latency)
   */
  const handleConfirmStoreKit = async () => {
    if (!activeTx || !selectedPack) return;

    setIsProcessingPurchase(true);

    try {
      const result = await mockIAPService.executePurchase(activeTx, false);

      // Successfully settled!
      updateTransactionStatus(activeTx.id, 'SETTLED', {
        serverReceiptId: result.tx.serverReceiptId,
      });

      // Credit coins into wallet
      creditCoins(activeTx.coins);

      setIsSheetVisible(false);
      setIsProcessingPurchase(false);
      setActiveTx(null);
      setSelectedPack(null);

      onShowToast({
        id: `toast_${Date.now()}`,
        type: 'success',
        title: 'Purchase Successful!',
        description: `Credited +${activeTx.coins} coins to your wallet.`,
      });
    } catch (err: any) {
      setIsProcessingPurchase(false);
      setIsSheetVisible(false);

      if (err?.code === 'ERR_TRANSACTION_INTERRUPTED') {
        markInterrupted(activeTx.id, err.message);
        onShowToast({
          id: `toast_${Date.now()}`,
          type: 'error',
          title: 'Transaction Interrupted!',
          description: 'Network dropped mid-flight. Recover via Ledger.',
        });
      } else {
        updateTransactionStatus(activeTx.id, 'FAILED', {
          failureReason: err?.message || 'StoreKit verification failed',
        });
        onShowToast({
          id: `toast_${Date.now()}`,
          type: 'error',
          title: 'Purchase Failed',
          description: err?.message || 'Payment was cancelled or rejected.',
        });
      }
    }
  };

  /**
   * SIMULATE KILL APP / NETWORK DROP CONTROL
   */
  const handleSimulateKillApp = () => {
    if (!activeTx) return;

    // Immediately mark transaction as INTERRUPTED in MMKV
    markInterrupted(
      activeTx.id,
      'App killed / socket hang-up during StoreKit settlement window.'
    );

    setIsProcessingPurchase(false);
    setIsSheetVisible(false);
    setActiveTx(null);
    setSelectedPack(null);

    onShowToast({
      id: `toast_${Date.now()}`,
      type: 'error',
      title: 'App Killed / Network Dropped',
      description: 'Transaction preserved in MMKV as INTERRUPTED. Open Ledger to reconcile.',
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
        {/* Policy & Domain Badge */}
        <View style={styles.policyNotice}>
          <View style={styles.policyHeader}>
            <Ionicons name="shield-checkmark" size={16} color="#34d399" />
            <Text style={styles.policyTitle}>Native In-App Purchase Flow (StoreKit / Play Billing)</Text>
          </View>
          <Text style={styles.policyDescription}>
            Consumable digital currencies are strictly governed by Apple App Store (Guideline 3.1.1)
            and Google Play billing policies. Every purchase generates a client-side UUID idempotency key.
          </Text>
        </View>

        <Text style={styles.sectionHeader}>SELECT COIN PACK</Text>

        {/* Catalog List with Zero CLS Skeleton Placeholders */}
        {loading ? (
          <>
            <CoinCardSkeleton />
            <CoinCardSkeleton />
            <CoinCardSkeleton />
          </>
        ) : (
          products.map((pack) => (
            <CoinCard
              key={pack.id}
              pack={pack}
              onPress={handleSelectPack}
              disabled={isProcessingPurchase}
            />
          ))
        )}

        {/* Feature Explainer */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={18} color="#38bdf8" />
            <Text style={styles.infoTitle}>Test Scenarios Available</Text>
          </View>
          <Text style={styles.infoPoint}>
            • <Text style={styles.bold}>Happy Path:</Text> Tap any coin pack to trigger native StoreKit sheet.
          </Text>
          <Text style={styles.infoPoint}>
            • <Text style={styles.bold}>Optimistic Gift & 500 Rollback:</Text> Use the header toggle & button to test atomic rollback.
          </Text>
          <Text style={styles.infoPoint}>
            • <Text style={styles.bold}>Network Drop Recovery:</Text> Tap "Kill App" inside the purchase sheet to verify UUID reconciliation.
          </Text>
        </View>
      </ScrollView>

      {/* StoreKit / Play Billing Sheet */}
      <StoreKitSheet
        visible={isSheetVisible}
        pack={selectedPack}
        transaction={activeTx}
        isProcessing={isProcessingPurchase}
        onConfirm={handleConfirmStoreKit}
        onCancel={() => {
          if (activeTx) {
            updateTransactionStatus(activeTx.id, 'FAILED', {
              failureReason: 'User dismissed StoreKit sheet before confirmation.',
            });
          }
          setIsSheetVisible(false);
          setActiveTx(null);
          setSelectedPack(null);
        }}
        onSimulateKillApp={handleSimulateKillApp}
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
  policyNotice: {
    backgroundColor: '#062b1a',
    borderColor: '#10b98144',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  policyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  policyTitle: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  policyDescription: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 16,
  },
  sectionHeader: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#121622',
    borderWidth: 1,
    borderColor: '#1e2436',
    borderRadius: 14,
    padding: 14,
    marginTop: 10,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoTitle: {
    color: '#38bdf8',
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 6,
  },
  infoPoint: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  bold: {
    color: '#f8fafc',
    fontWeight: '700',
  },
});
