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
import { Toast, ToastMessage } from './src/components/Toast';
import { useWalletStore } from './src/store/useWalletStore';
import { useTransactionStore } from './src/store/useTransactionStore';
import { Ionicons } from '@expo/vector-icons';

export default function App() {
  const [activeTab, setActiveTab] = useState<'IAP' | 'GATEWAY'>('IAP');
  const [diagnosticsVisible, setDiagnosticsVisible] = useState(false);
  const [giftTriggerKey, setGiftTriggerKey] = useState(0);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isSendingGift, setIsSendingGift] = useState(false);

  const { sendGiftOptimistic, balance } = useWalletStore();
  const { reconcilePendingTransactions } = useTransactionStore();

  /**
   * REQUIREMENT: Automatic reconciliation hook on app launch / restore
   */
  useEffect(() => {
    const runBootReconciliation = async () => {
      try {
        const result = await reconcilePendingTransactions();
        if (result.reconciledCount > 0) {
          setToast({
            id: `boot_recov_${Date.now()}`,
            type: 'success',
            title: 'Automatic Reconciliation Recovered Transactions!',
            description: `Recovered ${result.reconciledCount} interrupted purchase(s). Credited +${result.creditedCoins} coins.`,
          });
        }
      } catch (err) {
        console.warn('Boot reconciliation error:', err);
      }
    };

    runBootReconciliation();
  }, []);

  /**
   * REQUIREMENT: "Send Animated Gift" Action (50 Coins)
   * Instant local balance deduction + fluid UI animation + synchronous MMKV storage.
   * If 500 error toggle is active: atomic rollback to prior balance + non-blocking error toast.
   */
  const handleSendGift = async () => {
    setIsSendingGift(true);
    setGiftTriggerKey((prev) => prev + 1);

    try {
      await sendGiftOptimistic('gift_rocket_pack', 50);

      setToast({
        id: `gift_ok_${Date.now()}`,
        type: 'success',
        title: 'Gift Sent Successfully! 🎁',
        description: '50 coins deducted and validated by server.',
      });
    } catch (err: any) {
      // Caught rolled-back error from store
      setToast({
        id: `gift_fail_${Date.now()}`,
        type: 'error',
        title: 'Gift Failed (500 Server Error)',
        description: `Backend validation failed. 50 coins smoothly rolled back to ${useWalletStore.getState().balance}.`,
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
      title: 'Simulating App Launch...',
      description: 'Running reconcilePendingTransactions() hook.',
    });

    setTimeout(async () => {
      const res = await reconcilePendingTransactions();
      if (res.reconciledCount > 0) {
        setToast({
          id: `reboot_res_${Date.now()}`,
          type: 'success',
          title: 'Transactions Reconciled on Boot!',
          description: `Recovered ${res.reconciledCount} purchase(s) with zero duplicate coins.`,
        });
      } else {
        setToast({
          id: `reboot_clean_${Date.now()}`,
          type: 'info',
          title: 'Boot Reconciliation Complete',
          description: 'All transactions already settled.',
        });
      }
    }, 700);
  };

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" backgroundColor="#11141c" />

        {/* Global Wallet Bar with Balance, Gift CTA, & 500 Toggle */}
        <HeaderWalletBar
          onSendGiftPress={handleSendGift}
          onOpenDiagnostics={() => setDiagnosticsVisible(true)}
          isSendingGift={isSendingGift}
        />

        {/* Navigation Tabs */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'IAP' && styles.activeTabItem]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('IAP')}
          >
            <Ionicons
              name="cart"
              size={16}
              color={activeTab === 'IAP' ? '#38bdf8' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'IAP' && styles.activeTabLabel,
              ]}
            >
              1. Digital Coin Store (IAP)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabItem, activeTab === 'GATEWAY' && styles.activeTabItem]}
            activeOpacity={0.8}
            onPress={() => setActiveTab('GATEWAY')}
          >
            <Ionicons
              name="card"
              size={16}
              color={activeTab === 'GATEWAY' ? '#38bdf8' : '#64748b'}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabLabel,
                activeTab === 'GATEWAY' && styles.activeTabLabel,
              ]}
            >
              2. Direct Gateway (Razorpay)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Active Screen */}
        <View style={styles.screenContainer}>
          {activeTab === 'IAP' ? (
            <CoinStoreScreen onShowToast={(t) => setToast(t)} />
          ) : (
            <DirectGatewayScreen onShowToast={(t) => setToast(t)} />
          )}
        </View>

        {/* Floating Non-Blocking Toast */}
        <Toast toast={toast} onDismiss={() => setToast(null)} />

        {/* 60fps Fluid Gift Animation Overlay */}
        <GiftAnimationOverlay triggerKey={giftTriggerKey} />

        {/* Diagnostics & Transaction Ledger Drawer */}
        <DiagnosticsDrawer
          visible={diagnosticsVisible}
          onClose={() => setDiagnosticsVisible(false)}
          onSimulatedAppReboot={handleSimulatedAppReboot}
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0a0d14',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#11141c',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2433',
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTabItem: {
    borderBottomColor: '#38bdf8',
  },
  tabLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '700',
  },
  activeTabLabel: {
    color: '#38bdf8',
  },
  screenContainer: {
    flex: 1,
  },
});
