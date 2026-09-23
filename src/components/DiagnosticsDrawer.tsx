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

interface Props {
  visible: boolean;
  onClose: () => void;
  onSimulatedAppReboot: () => void;
}

export const DiagnosticsDrawer: React.FC<Props> = ({
  visible,
  onClose,
}) => {
  const { transactions, isReconciling, reconcilePendingTransactions, clearTransactions } =
    useTransactionStore();
  const { balance, rollbackCount, resetWallet } = useWalletStore();
  const { simulate500Error, toggle500Error } = useDevSettingsStore();
  const [storageKeys, setStorageKeys] = useState<Record<string, string>>({});
  const [reconcileReport, setReconcileReport] = useState<string | null>(null);

  const refreshDump = () => {
    setStorageKeys(storage.dumpState());
  };

  useEffect(() => {
    if (visible) {
      refreshDump();
      setReconcileReport(null);
    }
  }, [visible, transactions, balance, simulate500Error]);

  const handleManualReconcile = async () => {
    try {
      const res = await reconcilePendingTransactions();
      setReconcileReport(
        `Reconciled: ${res.reconciledCount} purchase(s) recovered. +${res.creditedCoins} coins credited.`
      );
      refreshDump();
    } catch (err: any) {
      setReconcileReport(`Reconciliation error: ${err?.message}`);
    }
  };

  const handleReset = () => {
    storage.clearAll();
    resetWallet();
    clearTransactions();
    refreshDump();
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
        return { color: '#7c3aed', bg: '#f5f3ff', label: 'Rolled Back' };
      default:
        return { color: '#64748b', bg: '#f1f5f9', label: status };
    }
  };

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
                <Text style={styles.title}>Test Scenarios & Ledger</Text>
                <Text style={styles.subtitle}>Payment Resilience Console</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
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

            {/* SCENARIO 2: 500 SERVER FAILURE TOGGLE */}
            <View style={[styles.scenarioCard, simulate500Error && styles.scenarioCardActive]}>
              <View style={styles.scenarioHeader}>
                <View style={{ flex: 1, paddingRight: 10 }}>
                  <Text style={[styles.scenarioTag, simulate500Error && { color: '#dc2626' }]}>
                    SCENARIO 2
                  </Text>
                  <Text style={styles.scenarioTitle}>Simulate 500 Server Error</Text>
                  <Text style={styles.scenarioDesc}>
                    When active, sending gifts instantly debits the UI balance, fails on the mock server, then smoothly rolls back.
                  </Text>
                </View>
                <Switch
                  value={simulate500Error}
                  onValueChange={toggle500Error}
                  trackColor={{ false: '#cbd5e1', true: '#ef4444' }}
                  thumbColor={simulate500Error ? '#ffffff' : '#f8fafc'}
                />
              </View>
            </View>

            {/* SCENARIO 3: RECONCILE PENDING / INTERRUPTED PURCHASES */}
            <View style={styles.scenarioCard}>
              <Text style={styles.scenarioTag}>SCENARIO 3</Text>
              <Text style={styles.scenarioTitle}>Network Interruption Recovery</Text>
              <Text style={styles.scenarioDesc}>
                Triggered automatically on app launch. Tap below to run the UUID reconciliation hook against pending in-flight transactions.
              </Text>

              <TouchableOpacity
                style={styles.actionBtn}
                onPress={handleManualReconcile}
                disabled={isReconciling}
                activeOpacity={0.85}
              >
                {isReconciling ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.actionBtnText}>Run reconcilePendingTransactions()</Text>
                  </>
                )}
              </TouchableOpacity>

              {reconcileReport && (
                <View style={styles.reportPill}>
                  <Ionicons name="checkmark-circle" size={15} color="#059669" style={{ marginRight: 6 }} />
                  <Text style={styles.reportPillText}>{reconcileReport}</Text>
                </View>
              )}
            </View>

            {/* TRANSACTION LEDGER */}
            <View style={styles.sectionRow}>
              <Text style={styles.sectionTitle}>TRANSACTION LEDGER (MMKV)</Text>
              <Text style={styles.sectionSubtitle}>{transactions.length} items</Text>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyCard}>
                <Ionicons name="receipt-outline" size={24} color="#94a3b8" style={{ marginBottom: 6 }} />
                <Text style={styles.emptyCardText}>No transactions recorded yet.</Text>
              </View>
            ) : (
              transactions.map((tx: TransactionRecord) => {
                const badge = getStatusBadge(tx.status);
                return (
                  <View key={tx.id} style={styles.txRow}>
                    <View style={styles.txTop}>
                      <View>
                        <Text style={styles.txId}>{tx.id}</Text>
                        <Text style={styles.txDate}>{new Date(tx.createdAt).toLocaleTimeString()}</Text>
                      </View>
                      <View style={[styles.badgePill, { backgroundColor: badge.bg }]}>
                        <View style={[styles.badgeDot, { backgroundColor: badge.color }]} />
                        <Text style={[styles.badgeLabel, { color: badge.color }]}>{badge.label}</Text>
                      </View>
                    </View>

                    <Text style={styles.uuidLabel}>Idempotency UUID:</Text>
                    <Text style={styles.uuidValue} numberOfLines={1} ellipsizeMode="middle">
                      {tx.idempotencyKey}
                    </Text>

                    <View style={styles.txFooter}>
                      <Text style={styles.footerCoins}>
                        {tx.coins > 0 ? `+${tx.coins.toLocaleString()} Coins` : `$${tx.amount.toFixed(2)}`}
                      </Text>
                      <Text style={styles.footerMethod}>{tx.paymentMethod}</Text>
                    </View>

                    {tx.failureReason ? (
                      <Text style={styles.failureNote}>{tx.failureReason}</Text>
                    ) : null}
                  </View>
                );
              })
            )}

            {/* RESET BUTTON */}
            <TouchableOpacity style={styles.resetBtn} onPress={handleReset} activeOpacity={0.85}>
              <Ionicons name="trash-outline" size={15} color="#dc2626" style={{ marginRight: 6 }} />
              <Text style={styles.resetBtnText}>Reset Demo Ledger & Balance</Text>
            </TouchableOpacity>

            <View style={{ height: 40 }} />
          </ScrollView>
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
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
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
    fontSize: 12,
  },
  scrollArea: {
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  statValue: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 4,
  },
  scenarioCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  scenarioCardActive: {
    borderColor: '#fca5a5',
    backgroundColor: '#fef2f2',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scenarioTag: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  scenarioTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 4,
  },
  scenarioDesc: {
    color: '#64748b',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  actionBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  reportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  reportPillText: {
    color: '#047857',
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  sectionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginBottom: 16,
  },
  emptyCardText: {
    color: '#94a3b8',
    fontSize: 13,
  },
  txRow: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  txTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  txId: {
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
    borderRadius: 8,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 5,
  },
  badgeLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
  uuidLabel: {
    color: '#94a3b8',
    fontSize: 10,
    marginTop: 2,
  },
  uuidValue: {
    color: '#047857',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 1,
  },
  txFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  footerCoins: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
  },
  footerMethod: {
    color: '#64748b',
    fontSize: 11,
  },
  failureNote: {
    color: '#dc2626',
    fontSize: 11,
    marginTop: 6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  resetBtnText: {
    color: '#dc2626',
    fontSize: 13,
    fontWeight: '700',
  },
});
