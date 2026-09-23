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
import { mockIAPService } from '../services/iap/mockIAPService';
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
   * Client-side UUID idempotency key pre-persistence before network call
   */
  const handleSelectPack = (pack: CoinPack) => {
    const pendingTx = mockIAPService.createPendingTransaction(pack);
    addPendingTransaction(pendingTx);
    setSelectedPack(pack);
    setActiveTx(pendingTx);
    setIsSheetVisible(true);
  };

  /**
   * STOREKIT SHEET PAYMENT CONFIRMATION
   */
  const handleConfirmStoreKit = async () => {
    if (!activeTx || !selectedPack) return;

    setIsProcessingPurchase(true);

    try {
      const result = await mockIAPService.executePurchase(activeTx, false);

      updateTransactionStatus(activeTx.id, 'SETTLED', {
        serverReceiptId: result.tx.serverReceiptId,
      });

      creditCoins(activeTx.coins);

      setIsSheetVisible(false);
      setIsProcessingPurchase(false);
      setActiveTx(null);
      setSelectedPack(null);

      onShowToast({
        id: `toast_${Date.now()}`,
        type: 'success',
        title: 'Purchase Successful!',
        description: `+${activeTx.coins.toLocaleString()} coins added to your wallet.`,
      });
    } catch (err: any) {
      setIsProcessingPurchase(false);
      setIsSheetVisible(false);

      if (err?.code === 'ERR_TRANSACTION_INTERRUPTED') {
        markInterrupted(activeTx.id, err.message);
        onShowToast({
          id: `toast_${Date.now()}`,
          type: 'error',
          title: 'Transaction Interrupted',
          description: 'Payment suspended mid-flight. Preserved in Ledger.',
        });
      } else {
        updateTransactionStatus(activeTx.id, 'FAILED', {
          failureReason: err?.message || 'StoreKit verification failed',
        });
        onShowToast({
          id: `toast_${Date.now()}`,
          type: 'error',
          title: 'Purchase Cancelled',
          description: err?.message || 'Payment was not completed.',
        });
      }
    }
  };

  /**
   * SIMULATE NETWORK DROP / KILL APP
   */
  const handleSimulateKillApp = () => {
    if (!activeTx) return;

    markInterrupted(
      activeTx.id,
      'App killed / network dropped during StoreKit verification window.'
    );

    setIsProcessingPurchase(false);
    setIsSheetVisible(false);
    setActiveTx(null);
    setSelectedPack(null);

    onShowToast({
      id: `toast_${Date.now()}`,
      type: 'error',
      title: 'Simulated Network Drop',
      description: 'Transaction preserved as INTERRUPTED in MMKV for auto-recovery.',
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
        {/* Clean, Human Section Header with Test Skeleton button */}
        <View style={styles.sectionHeaderWrap}>
          <View style={styles.sectionTitleRow}>
            <Text style={styles.sectionTitle}>Get Coins</Text>
            <TouchableOpacity
              style={styles.skeletonTestBtn}
              onPress={() => {
                setLoading(true);
                fetchCatalog();
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="sparkles-outline" size={12} color="#059669" style={{ marginRight: 4 }} />
              <Text style={styles.skeletonTestText}>Test Skeleton</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.sectionSubtitle}>
            Instant delivery to your wallet • Zero transaction fees
          </Text>
        </View>

        {/* Catalog List with Zero CLS Skeleton Cards */}
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

        {/* Elegant Footer Trust Badge */}
        <View style={styles.trustBadge}>
          <Ionicons name="lock-closed" size={13} color="#64748b" style={{ marginRight: 6 }} />
          <Text style={styles.trustText}>
            Secured via Apple StoreKit & Idempotent UUID Verification
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
              failureReason: 'User cancelled StoreKit sheet.',
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
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionHeaderWrap: {
    marginBottom: 16,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  skeletonTestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  skeletonTestText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 3,
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 18,
    paddingVertical: 8,
  },
  trustText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
});
