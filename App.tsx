import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  StatusBar,
} from 'react-native';
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

  const { sendGiftOptimistic, balance } = useWalletStore();
  const { reconcilePendingTransactions, addPendingTransaction, updateTransactionStatus } = useTransactionStore();

  /**
   * REQUIREMENT: Automatic reconciliation hook on app launch
   */
  useEffect(() => {
    const runBootReconciliation = async () => {
      try {
        const result = await reconcilePendingTransactions();
        if (result.reconciledCount > 0) {
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

      setToast({
        id: `gift_fail_${Date.now()}`,
        type: 'error',
        title: 'Gift Rolled Back (500 Error)',
        description: `Server 500 failure simulated. ${gift.cost} coins smoothly refunded to your wallet.`,
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
      title: 'Simulating App Relaunch...',
      description: 'Running auto-reconciliation hook.',
    });

    setTimeout(async () => {
      const res = await reconcilePendingTransactions();
      if (res.reconciledCount > 0) {
        setToast({
          id: `reboot_res_${Date.now()}`,
          type: 'success',
          title: 'Purchases Recovered on Launch!',
          description: `Recovered ${res.reconciledCount} purchase(s) with zero duplicate coins.`,
        });
      } else {
        setToast({
          id: `reboot_clean_${Date.now()}`,
          type: 'info',
          title: 'Reconciliation Clean',
          description: 'All past transactions are already settled.',
        });
      }
    }, 700);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
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
});
