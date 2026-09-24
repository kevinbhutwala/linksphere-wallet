import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
  LogBox,
} from 'react-native';

LogBox.ignoreAllLogs();
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { HeaderWalletBar } from './src/components/HeaderWalletBar';
import { CoinStoreScreen } from './src/screens/CoinStoreScreen';
import { DirectGatewayScreen } from './src/screens/DirectGatewayScreen';
import { DiagnosticsDrawer } from './src/components/DiagnosticsDrawer';
import { GiftAnimationOverlay } from './src/components/GiftAnimationOverlay';
import { GiftModal } from './src/components/GiftModal';
import { Toast, ToastMessage } from './src/components/Toast';
import { useWalletStore } from './src/store/useWalletStore';
import { useTransactionStore } from './src/store/useTransactionStore';
import { TransactionRecord } from './src/types';
import { generateUUID } from './src/utils/uuid';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [activeTab, setActiveTab] = useState<'COINS' | 'STORE'>('COINS');
  const [diagnosticsVisible, setDiagnosticsVisible] = useState(false);
  const [diagnosticsTab, setDiagnosticsTab] = useState<'SCENARIOS' | 'LEDGER' | 'POLICY'>('SCENARIOS');
  const [giftModalVisible, setGiftModalVisible] = useState(false);
  const [activeGiftEmoji, setActiveGiftEmoji] = useState('🎁');
  const [activeGiftCost, setActiveGiftCost] = useState(50);
  const [giftTriggerKey, setGiftTriggerKey] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSendingGift, setIsSendingGift] = useState(false);

  const { sendGiftOptimistic, balance, scenarioBanner, setScenarioBanner } = useWalletStore();
  const { reconcilePendingTransactions, addPendingTransaction, updateTransactionStatus } = useTransactionStore();

  /**
   * REQUIREMENT: Automatic reconciliation hook on app launch
   */
  useEffect(() => {
    const runBootReconciliation = async () => {
      try {
        const result = await reconcilePendingTransactions();
        if (result.reconciledCount > 0) {
          setScenarioBanner({
            scenarioNumber: 3,
            tag: 'SCENARIO 3 / 3: RECONCILIATION COMPLETE',
            tagColor: '#059669',
            title: `Boot Recovery: +${result.creditedCoins.toLocaleString()} Coins Credited!`,
            description: `MMKV write-ahead log replayed safely. Restored ${result.reconciledCount} purchase(s) with zero duplicate crediting.`,
          });
          setToast({
            id: `boot_recov_${Date.now()}`,
            type: 'success',
            title: 'Interrupted Purchases Recovered!',
            description: `Restored ${result.reconciledCount} purchase(s). Credited +${result.creditedCoins.toLocaleString()} coins.`,
          });
        }
      } catch (err) {
        console.warn('Boot reconciliation error:', err);
      }
    };

    runBootReconciliation();
  }, []);

  useEffect(() => {
    if (scenarioBanner) {
      const timer = setTimeout(() => {
        setScenarioBanner(null);
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [scenarioBanner]);

  /**
   * EXECUTE OPTIMISTIC GIFT MUTATION
   */
  const handleConfirmSendGift = async (gift: { id: string; cost: number; name: string; emoji?: string }) => {
    setGiftModalVisible(false);
    setIsSendingGift(true);
    setActiveGiftEmoji(gift.emoji || '🎁');
    setActiveGiftCost(gift.cost);
    setGiftTriggerKey((prev) => prev + 1);

    // Create client-side UUID and pre-persist in MMKV
    const giftTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      idempotencyKey: generateUUID(),
      productId: gift.id,
      productType: 'GIFT_SPEND',
      coins: -gift.cost,
      amount: 0,
      currency: 'COINS',
      status: 'PENDING',
      paymentMethod: 'IAP_STOREKIT',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    addPendingTransaction(giftTx);

    try {
      await sendGiftOptimistic(gift.id, gift.cost);

      updateTransactionStatus(giftTx.id, 'SETTLED', {
        serverReceiptId: `rcpt_gift_${Date.now()}`,
      });

      setToast({
        id: `gift_ok_${Date.now()}`,
        type: 'success',
        title: `${gift.name} Sent! ${gift.emoji || '🎁'}`,
        description: `${gift.cost} coins deducted and verified by server.`,
      });
    } catch (err: any) {
      updateTransactionStatus(giftTx.id, 'ROLLED_BACK', {
        failureReason: `500 Server Error: Restored prior balance (${gift.cost} coins refunded).`,
      });

      setScenarioBanner({
        scenarioNumber: 2,
        tag: 'SCENARIO 2 / 3: ATOMIC ROLLBACK',
        tagColor: '#dc2626',
        title: '500 Server Error: Spend Rolled Back!',
        description: `UI debited optimistically, mock server returned 500 error, and wallet atomically restored prior balance from snapshot.`,
      });

      setToast({
        id: `gift_fail_${Date.now()}`,
        type: 'error',
        title: 'Gift Delivery Failed',
        description: `Server 500 error. ${gift.cost} coins refunded to your balance.`,
      });
    } finally {
      setIsSendingGift(false);
    }
  };

  const handleSimulatedAppReboot = async () => {
    setDiagnosticsVisible(false);
    setToast({
      id: `sim_reboot_${Date.now()}`,
      type: 'info',
      title: 'Connecting to Cloud...',
      description: 'Synchronizing wallet ledger...',
    });

    setTimeout(async () => {
      const res = await reconcilePendingTransactions();
      if (res.reconciledCount > 0) {
        setToast({
          id: `reboot_res_${Date.now()}`,
          type: 'success',
          title: 'Transactions Recovered!',
          description: `Successfully restored ${res.reconciledCount} purchase(s) (+${res.creditedCoins.toLocaleString()} coins).`,
        });
      } else {
        setToast({
          id: `reboot_clean_${Date.now()}`,
          type: 'info',
          title: 'Wallet Synchronized',
          description: 'All past transactions are confirmed and settled.',
        });
      }
    }, 700);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />

        {/* Hero Wallet Bar */}
        <HeaderWalletBar
          onSendGiftPress={() => setGiftModalVisible(true)}
          onOpenDiagnostics={(tab) => {
            setDiagnosticsTab(tab || 'SCENARIOS');
            setDiagnosticsVisible(true);
          }}
          isSendingGift={isSendingGift}
        />

        {/* Sleek On-Screen Scenario Walkthrough Banner */}
        {scenarioBanner && (
          <View style={styles.scenarioBanner}>
            <View style={styles.scenarioBannerHeader}>
              <View style={[styles.scenarioTagBadge, { backgroundColor: scenarioBanner.tagColor }]}>
                <Text style={styles.scenarioTagText}>{scenarioBanner.tag}</Text>
              </View>
              <TouchableOpacity
                onPress={() => setScenarioBanner(null)}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="close-circle" size={18} color="#94a3b8" />
              </TouchableOpacity>
            </View>
            <Text style={styles.scenarioBannerTitle}>{scenarioBanner.title}</Text>
            <Text style={styles.scenarioBannerDesc}>{scenarioBanner.description}</Text>
          </View>
        )}

        {/* Clean Segmented Tab Control */}
        <View style={styles.segmentWrapper}>
          <View style={styles.segmentedControl}>
            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'COINS' && styles.segmentBtnActive]}
              activeOpacity={0.85}
              onPress={() => setActiveTab('COINS')}
            >
              <Ionicons
                name="sparkles"
                size={14}
                color={activeTab === 'COINS' ? '#ffffff' : '#64748b'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'COINS' && styles.segmentTextActive,
                ]}
              >
                Coin Store (IAP)
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.segmentBtn, activeTab === 'STORE' && styles.segmentBtnActive]}
              activeOpacity={0.85}
              onPress={() => setActiveTab('STORE')}
            >
              <Ionicons
                name="bag-handle"
                size={14}
                color={activeTab === 'STORE' ? '#ffffff' : '#64748b'}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.segmentText,
                  activeTab === 'STORE' && styles.segmentTextActive,
                ]}
              >
                Merch & Passes
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Screen Content */}
        <View style={styles.screenContainer}>
          {activeTab === 'COINS' ? (
            <CoinStoreScreen onShowToast={(t) => setToast(t)} />
          ) : (
            <DirectGatewayScreen
              onShowToast={(t) => setToast(t)}
              onOpenPolicy={() => {
                setDiagnosticsTab('POLICY');
                setDiagnosticsVisible(true);
              }}
            />
          )}
        </View>

        {/* Gift Selector Modal */}
        <GiftModal
          visible={giftModalVisible}
          onClose={() => setGiftModalVisible(false)}
          onSend={handleConfirmSendGift}
          userBalance={balance}
          isSending={isSendingGift}
        />

        {/* Non-Blocking Floating Toast */}
        <Toast toast={toast} onDismiss={() => setToast(null)} />

        {/* 60fps Gift Burst Particle Overlay */}
        <GiftAnimationOverlay
          triggerKey={giftTriggerKey}
          giftEmoji={activeGiftEmoji}
          giftCost={activeGiftCost}
        />

        {/* Test Scenarios & Ledger Drawer */}
        <DiagnosticsDrawer
          visible={diagnosticsVisible}
          onClose={() => setDiagnosticsVisible(false)}
          onSimulatedAppReboot={handleSimulatedAppReboot}
          initialTab={diagnosticsTab}
          onTrigger500Test={() =>
            handleConfirmSendGift({
              id: 'gift_rocket',
              cost: 50,
              name: 'Hyper Rocket',
              emoji: '🚀',
            })
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  segmentWrapper: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 10,
    backgroundColor: '#ffffff',
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 3,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  segmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 11,
  },
  segmentBtnActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  segmentText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#ffffff',
    fontWeight: '800',
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scenarioBanner: {
    position: 'absolute',
    bottom: 30,
    left: 16,
    right: 16,
    zIndex: 9999,
    backgroundColor: '#0f172a',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1.5,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 12,
  },
  scenarioBannerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  scenarioTagBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  scenarioTagText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scenarioBannerTitle: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 3,
  },
  scenarioBannerDesc: {
    color: '#94a3b8',
    fontSize: 11,
    lineHeight: 15,
  },
});
