import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
} from 'react-native';
import { useTransactionStore } from '../store/useTransactionStore';
import { useWalletStore } from '../store/useWalletStore';
import { useDevSettingsStore } from '../store/useDevSettingsStore';
import { storage } from '../services/storage/storage';
import { Ionicons } from '@expo/vector-icons';
import { TransactionRecord } from '../types';
import { generateUUID } from '../utils/uuid';

interface Props {
  visible: boolean;
  onClose: () => void;
  onSimulatedAppReboot: () => void;
  initialTab?: 'SCENARIOS' | 'LEDGER' | 'POLICY';
  onTrigger500Test?: () => void;
}

type TabType = 'SCENARIOS' | 'LEDGER' | 'POLICY';
type FilterType = 'ALL' | 'SETTLED' | 'INTERRUPTED' | 'ROLLED_BACK' | 'PENDING';

export const DiagnosticsDrawer: React.FC<Props> = ({
  visible,
  onClose,
  initialTab = 'SCENARIOS',
  onTrigger500Test,
}) => {
  const { transactions, isReconciling, reconcilePendingTransactions, clearTransactions, addPendingTransaction } =
    useTransactionStore();
  const { balance, rollbackCount, resetWallet } = useWalletStore();
  const { simulate500Error, toggle500Error } = useDevSettingsStore();

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [selectedFilter, setSelectedFilter] = useState<FilterType>('ALL');
  const [selectedTx, setSelectedTx] = useState<TransactionRecord | null>(null);
  const [reconcileReport, setReconcileReport] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setActiveTab(initialTab);
      setReconcileReport(null);
    }
  }, [visible, initialTab]);

  const handleManualReconcile = async () => {
    try {
      const res = await reconcilePendingTransactions();
      setReconcileReport(
        `Recovered ${res.reconciledCount} purchase(s). Credited +${res.creditedCoins.toLocaleString()} coins with zero double-crediting.`
      );
    } catch (err: any) {
      setReconcileReport(`Reconciliation error: ${err?.message}`);
    }
  };

  const handleInjectInterruptedPurchase = () => {
    const interruptedTx: TransactionRecord = {
      id: `tx_${Date.now()}`,
      idempotencyKey: generateUUID(),
      productId: 'coin_pack_pro',
      productType: 'COIN_PACK',
      coins: 550,
      amount: 4.99,
      currency: 'USD',
      status: 'INTERRUPTED',
      paymentMethod: 'IAP_STOREKIT',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      failureReason: 'App killed / network dropped during StoreKit verification window.',
    };
    addPendingTransaction(interruptedTx);
    setReconcileReport('Injected 1 INTERRUPTED StoreKit purchase (+550 coins) into MMKV. Ready for recovery.');
  };

  const handleReset = () => {
    storage.clearAll();
    resetWallet();
    clearTransactions();
    setReconcileReport('Wallet and transaction ledger reset to fresh defaults.');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return { color: '#059669', bg: '#ecfdf5', label: 'Settled' };
      case 'PENDING':
        return { color: '#d97706', bg: '#fef3c7', label: 'Pending' };
      case 'INTERRUPTED':
        return { color: '#dc2626', bg: '#fee2e2', label: 'Interrupted' };
      case 'ROLLED_BACK':
        return { color: '#0284c7', bg: '#f0f9ff', label: 'Rolled Back' };
      default:
        return { color: '#64748b', bg: '#f1f5f9', label: status };
    }
  };

  const filteredTransactions = transactions.filter((tx) => {
    if (selectedFilter === 'ALL') return true;
    return tx.status === selectedFilter;
  });

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.iconCircle}>
                <Ionicons name="options-outline" size={18} color="#059669" />
              </View>
              <View>
                <Text style={styles.title}>System Console & Audit Ledger</Text>
                <Text style={styles.subtitle}>Resilience Controls, Ledger & Compliance</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Segmented Top Tabs */}
          <View style={styles.tabContainer}>
            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'SCENARIOS' && styles.tabButtonActive]}
              onPress={() => setActiveTab('SCENARIOS')}
            >
              <Ionicons
                name="shield-outline"
                size={14}
                color={activeTab === 'SCENARIOS' ? '#059669' : '#64748b'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.tabText, activeTab === 'SCENARIOS' && styles.tabTextActive]}>
                Resilience Suite
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'LEDGER' && styles.tabButtonActive]}
              onPress={() => setActiveTab('LEDGER')}
            >
              <Ionicons
                name="receipt-outline"
                size={14}
                color={activeTab === 'LEDGER' ? '#059669' : '#64748b'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.tabText, activeTab === 'LEDGER' && styles.tabTextActive]}>
                Transaction Ledger ({transactions.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabButton, activeTab === 'POLICY' && styles.tabButtonActive]}
              onPress={() => setActiveTab('POLICY')}
            >
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={activeTab === 'POLICY' ? '#059669' : '#64748b'}
                style={{ marginRight: 5 }}
              />
              <Text style={[styles.tabText, activeTab === 'POLICY' && styles.tabTextActive]}>
                Store Policy
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* TAB 1: RESILIENCE SUITE */}
            {activeTab === 'SCENARIOS' && (
              <>
                {/* Quick Metrics */}
                <View style={styles.statsGrid}>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>DISK BALANCE</Text>
                    <Text style={styles.statValue}>{balance.toLocaleString()}</Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>ROLLBACKS</Text>
                    <Text style={[styles.statValue, { color: rollbackCount > 0 ? '#dc2626' : '#059669' }]}>
                      {rollbackCount}
                    </Text>
                  </View>
                  <View style={styles.statCard}>
                    <Text style={styles.statLabel}>RECORDS</Text>
                    <Text style={styles.statValue}>{transactions.length}</Text>
                  </View>
                </View>

                {/* SUITE 1: HAPPY PATH */}
                <View style={styles.scenarioCard}>
                  <View style={styles.scenarioHeaderRow}>
                    <View style={styles.scenarioTagBadge}>
                      <Text style={styles.scenarioTagText}>STOREKIT IAP</Text>
                    </View>
                    <Text style={styles.scenarioTitle}>Direct StoreKit In-App Purchase</Text>
                  </View>
                  <Text style={styles.scenarioDesc}>
                    Tap any coin pack on the main store. Verifies StoreKit sheet latency (800-1500ms), pre-persisted client-side UUID, and instant coin delivery.
                  </Text>
                </View>

                {/* SUITE 2: 500 SERVER FAILURE TOGGLE */}
                <View style={[styles.scenarioCard, simulate500Error && styles.scenarioCardActive]}>
                  <View style={styles.scenarioHeader}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                      <View style={styles.scenarioHeaderRow}>
                        <View style={[styles.scenarioTagBadge, simulate500Error && { backgroundColor: '#fee2e2' }]}>
                          <Text style={[styles.scenarioTagText, simulate500Error && { color: '#dc2626' }]}>
                            SERVER RESILIENCE
                          </Text>
                        </View>
                        <Text style={styles.scenarioTitle}>Server 500 Outage & Rollback</Text>
                      </View>
                      <Text style={styles.scenarioDesc}>
                        When enabled, sending a gift instantly debits the UI balance, fails on the mock server with 500, then smoothly rolls back to the prior balance from snapshot.
                      </Text>
                    </View>
                    <Switch
                      value={simulate500Error}
                      onValueChange={toggle500Error}
                      trackColor={{ false: '#cbd5e1', true: '#ef4444' }}
                      thumbColor={simulate500Error ? '#ffffff' : '#f8fafc'}
                    />
                  </View>

                  {onTrigger500Test && (
                    <TouchableOpacity
                      style={[styles.scenarioActionBtn, { backgroundColor: '#ef4444' }]}
                      onPress={onTrigger500Test}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="flash" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                      <Text style={styles.scenarioActionBtnText}>Trigger Spend with 500 Rollback</Text>
                    </TouchableOpacity>
                  )}
                </View>

                {/* SUITE 3: RECONCILE PENDING / INTERRUPTED PURCHASES */}
                <View style={styles.scenarioCard}>
                  <View style={styles.scenarioHeaderRow}>
                    <View style={styles.scenarioTagBadge}>
                      <Text style={styles.scenarioTagText}>NETWORK DISRUPTION</Text>
                    </View>
                    <Text style={styles.scenarioTitle}>Network Drop & Transaction Recovery</Text>
                  </View>
                  <Text style={styles.scenarioDesc}>
                    During checkout, tapping "Simulate Network Interruption" preserves the transaction in MMKV with status INTERRUPTED. Running reconciliation recovers the purchase with zero duplicate crediting.
                  </Text>

                  <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
                    <TouchableOpacity
                      style={[styles.scenarioActionBtn, { flex: 1, backgroundColor: '#f1f5f9', borderWidth: 1, borderColor: '#cbd5e1' }]}
                      onPress={handleInjectInterruptedPurchase}
                      activeOpacity={0.85}
                    >
                      <Ionicons name="cloud-offline-outline" size={15} color="#475569" style={{ marginRight: 6 }} />
                      <Text style={[styles.scenarioActionBtnText, { color: '#334155' }]}>Inject Interrupted</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[styles.scenarioActionBtn, { flex: 1.3, backgroundColor: '#059669' }]}
                      onPress={handleManualReconcile}
                      disabled={isReconciling}
                      activeOpacity={0.85}
                    >
                      {isReconciling ? (
                        <ActivityIndicator color="#ffffff" size="small" />
                      ) : (
                        <>
                          <Ionicons name="refresh" size={15} color="#ffffff" style={{ marginRight: 6 }} />
                          <Text style={styles.scenarioActionBtnText}>Run Reconcile Hook</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </View>

                  {reconcileReport && (
                    <View style={styles.reportPill}>
                      <Ionicons name="checkmark-circle" size={15} color="#059669" style={{ marginRight: 6 }} />
                      <Text style={styles.reportPillText}>{reconcileReport}</Text>
                    </View>
                  )}
                </View>

                {/* RESET BUTTON */}
                <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.85}>
                  <Ionicons name="refresh-outline" size={15} color="#dc2626" style={{ marginRight: 6 }} />
                  <Text style={styles.resetBtnText}>Reset Ledger & Restore Initial Balance</Text>
                </TouchableOpacity>
              </>
            )}

            {/* TAB 2: TRANSACTION LEDGER */}
            {activeTab === 'LEDGER' && (
              <>
                {/* Filter Chips */}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                  {(['ALL', 'SETTLED', 'INTERRUPTED', 'ROLLED_BACK', 'PENDING'] as FilterType[]).map((f) => (
                    <TouchableOpacity
                      key={f}
                      style={[styles.filterChip, selectedFilter === f && styles.filterChipActive]}
                      onPress={() => setSelectedFilter(f)}
                    >
                      <Text style={[styles.filterChipText, selectedFilter === f && styles.filterChipTextActive]}>
                        {f.replace('_', ' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {filteredTransactions.length === 0 ? (
                  <View style={styles.emptyCard}>
                    <Ionicons name="receipt-outline" size={28} color="#94a3b8" style={{ marginBottom: 8 }} />
                    <Text style={styles.emptyCardTitle}>No {selectedFilter === 'ALL' ? '' : selectedFilter} records</Text>
                    <Text style={styles.emptyCardText}>Transactions will appear here as you interact with the app.</Text>
                  </View>
                ) : (
                  filteredTransactions.map((tx: TransactionRecord) => {
                    const badge = getStatusBadge(tx.status);
                    const isDebit = tx.productType === 'GIFT_SPEND';
                    const isMerch = tx.productType === 'PHYSICAL_GOODS';

                    return (
                      <TouchableOpacity
                        key={tx.id}
                        style={styles.txRow}
                        activeOpacity={0.85}
                        onPress={() => setSelectedTx(tx)}
                      >
                        <View style={styles.txTop}>
                          <View style={{ flex: 1 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.txProductType}>
                                {isDebit ? '🎁 Gift Spend' : isMerch ? '📦 Merchandise' : '🪙 Coin Purchase'}
                              </Text>
                            </View>
                            <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleTimeString()} • {new Date(tx.createdAt).toLocaleDateString()}</Text>
                          </View>
                          <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                            <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
                            <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
                          </View>
                        </View>

                        <View style={styles.txMiddle}>
                          <Text style={styles.uuidLabel}>UUID:</Text>
                          <Text style={styles.uuidValue} numberOfLines={1} ellipsizeMode="middle">
                            {tx.idempotencyKey}
                          </Text>
                        </View>

                        <View style={styles.txFooter}>
                          <Text style={[styles.footerCoins, isDebit && { color: '#dc2626' }]}>
                            {tx.productType === 'PHYSICAL_GOODS'
                              ? `$${tx.amount.toFixed(2)}`
                              : isDebit
                              ? `${tx.coins} Coins`
                              : `+${tx.coins.toLocaleString()} Coins`}
                          </Text>
                          <View style={styles.methodTag}>
                            <Text style={styles.methodTagText}>
                              {tx.paymentMethod === 'IAP_STOREKIT' ? 'Apple StoreKit' : 'Razorpay Gateway'}
                            </Text>
                          </View>
                        </View>

                        {tx.failureReason ? (
                          <View style={styles.failureBox}>
                            <Ionicons name="information-circle" size={13} color="#dc2626" style={{ marginRight: 4 }} />
                            <Text style={styles.failureNote}>{tx.failureReason}</Text>
                          </View>
                        ) : null}
                      </TouchableOpacity>
                    );
                  })
                )}
              </>
            )}

            {/* TAB 3: STORE POLICY & ARCHITECTURE */}
            {activeTab === 'POLICY' && (
              <View style={styles.policyContainer}>
                <View style={styles.policyCard}>
                  <View style={styles.policyHeaderRow}>
                    <Ionicons name="logo-apple" size={20} color="#0f172a" style={{ marginRight: 8 }} />
                    <Text style={styles.policyCardTitle}>Apple Guideline 3.1.1 & Play Billing</Text>
                  </View>
                  <Text style={styles.policyCardText}>
                    In-app virtual currencies (Coins, Diamonds, Tokens) that are unlocked or consumed inside the mobile app MUST exclusively use Apple StoreKit / Google Play Billing.
                  </Text>
                  <View style={styles.policyCallout}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.policyCalloutText}>Implemented on Screen 1 via StoreKit simulation with 30% commission accounting.</Text>
                  </View>
                </View>

                <View style={styles.policyCard}>
                  <View style={styles.policyHeaderRow}>
                    <Ionicons name="cube-outline" size={20} color="#059669" style={{ marginRight: 8 }} />
                    <Text style={styles.policyCardTitle}>Physical Goods & External Passes (Guideline 3.1.3e)</Text>
                  </View>
                  <Text style={styles.policyCardText}>
                    Goods and services consumed <Text style={{ fontWeight: '700' }}>outside</Text> the app (such as hoodies, physical tumblers, and real-world conference tickets) are strictly forbidden from using Apple IAP and must use direct gateways like Razorpay or Stripe.
                  </Text>
                  <View style={styles.policyCallout}>
                    <Ionicons name="checkmark-circle" size={16} color="#059669" style={{ marginRight: 6 }} />
                    <Text style={styles.policyCalloutText}>Implemented on Screen 2 with dedicated Razorpay sheet (UPI, Cards, NetBanking).</Text>
                  </View>
                </View>

                <View style={styles.policyCard}>
                  <View style={styles.policyHeaderRow}>
                    <Ionicons name="key-outline" size={20} color="#0284c7" style={{ marginRight: 8 }} />
                    <Text style={styles.policyCardTitle}>Client-Side UUID Idempotency</Text>
                  </View>
                  <Text style={styles.policyCardText}>
                    Before any network dispatch occurs, a unique client-side UUID is generated and pre-persisted with PENDING status in synchronous MMKV storage. If the network drops or the OS kills the app, the UUID prevents duplicate server processing or double-crediting.
                  </Text>
                </View>

                <View style={styles.policyCard}>
                  <View style={styles.policyHeaderRow}>
                    <Ionicons name="speedometer-outline" size={20} color="#d97706" style={{ marginRight: 8 }} />
                    <Text style={styles.policyCardTitle}>Zero Cumulative Layout Shift (CLS)</Text>
                  </View>
                  <Text style={styles.policyCardText}>
                    Async catalog fetches render skeleton cards matching the exact container dimensions (104px height, 14px bottom margin, 18px border radius). Layout shifts are mathematically 0.
                  </Text>
                </View>
              </View>
            )}

            <View style={{ height: 40 }} />
          </ScrollView>

          {/* TX DETAIL MODAL */}
          {selectedTx && (
            <Modal visible={!!selectedTx} transparent animationType="fade">
              <View style={styles.txDetailBackdrop}>
                <View style={styles.txDetailCard}>
                  <View style={styles.txDetailHeader}>
                    <Text style={styles.txDetailTitle}>Transaction Receipt</Text>
                    <TouchableOpacity onPress={() => setSelectedTx(null)}>
                      <Ionicons name="close" size={22} color="#64748b" />
                    </TouchableOpacity>
                  </View>

                  <ScrollView style={{ maxHeight: 300 }}>
                    <Text style={styles.jsonText}>{JSON.stringify(selectedTx, null, 2)}</Text>
                  </ScrollView>

                  <TouchableOpacity
                    style={styles.txDetailCloseBtn}
                    onPress={() => setSelectedTx(null)}
                  >
                    <Text style={styles.txDetailCloseText}>Close Receipt</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '90%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#ecfdf5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  title: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
  },
  subtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 3,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 9,
  },
  tabButtonActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  tabText: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#059669',
    fontWeight: '700',
  },
  scrollArea: {
    maxHeight: '85%',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  statValue: {
    color: '#0f172a',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 3,
  },
  scenarioCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  scenarioCardActive: {
    borderColor: '#fca5a5',
    backgroundColor: '#fff5f5',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  scenarioHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  scenarioTagBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginRight: 6,
  },
  scenarioTagText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  scenarioTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
  },
  scenarioDesc: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  scenarioActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginTop: 10,
  },
  scenarioActionBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  reportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 10,
    padding: 10,
    marginTop: 10,
  },
  reportPillText: {
    color: '#065f46',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  filterScroll: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: '#059669',
  },
  filterChipText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  txRow: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 10,
  },
  txTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  txProductType: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  txDate: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  txMiddle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  uuidLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '600',
    marginRight: 4,
  },
  uuidValue: {
    color: '#334155',
    fontSize: 10,
    fontFamily: 'Courier',
    flex: 1,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerCoins: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '800',
  },
  methodTag: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  methodTagText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '600',
  },
  failureBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fee2e2',
    padding: 6,
    borderRadius: 6,
    marginTop: 6,
  },
  failureNote: {
    color: '#b91c1c',
    fontSize: 11,
    fontWeight: '500',
    flex: 1,
  },
  emptyCard: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 10,
  },
  emptyCardTitle: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  emptyCardText: {
    color: '#94a3b8',
    fontSize: 12,
    textAlign: 'center',
  },
  policyContainer: {
    paddingTop: 4,
  },
  policyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 12,
  },
  policyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  policyCardTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  policyCardText: {
    color: '#475569',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 8,
  },
  policyCallout: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  policyCalloutText: {
    color: '#065f46',
    fontSize: 11,
    fontWeight: '600',
    flex: 1,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    marginTop: 10,
  },
  resetBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
  txDetailBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  txDetailCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 18,
    width: '100%',
    maxHeight: '80%',
  },
  txDetailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  txDetailTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  jsonText: {
    fontSize: 11,
    color: '#334155',
    fontFamily: 'Courier',
    backgroundColor: '#f8fafc',
    padding: 10,
    borderRadius: 8,
  },
  txDetailCloseBtn: {
    backgroundColor: '#059669',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
  },
  txDetailCloseText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});

