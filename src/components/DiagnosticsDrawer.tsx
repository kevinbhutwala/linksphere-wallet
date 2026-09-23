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
        return { color: '#10b981', label: 'Settled' };
      case 'PENDING':
        return { color: '#f59e0b', label: 'Pending' };
      case 'INTERRUPTED':
        return { color: '#ef4444', label: 'Interrupted' };
      case 'ROLLED_BACK':
        return { color: '#8b5cf6', label: 'Rolled Back' };
      default:
        return { color: '#64748b', label: status };
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
                <Ionicons name="options-outline" size={18} color="#38bdf8" />
              </View>
              <View>
                <Text style={styles.title}>Test Scenarios & Ledger</Text>
                <Text style={styles.subtitle}>Payment Resilience Console</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="close-circle" size={26} color="#64748b" />
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
                <Text style={[styles.statValue, { color: rollbackCount > 0 ? '#f87171' : '#ffffff' }]}>
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
                <View style={{ flex: 1 }}>
                  <Text style={styles.scenarioTag}>SCENARIO 2</Text>
                  <Text style={styles.scenarioTitle}>Simulate 500 Server Error</Text>
                  <Text style={styles.scenarioDesc}>
                    When active, sending gifts instantly debits the UI balance, fails on the mock server, then smoothly rolls back.
                  </Text>
                </View>
                <Switch
                  value={simulate500Error}
                  onValueChange={toggle500Error}
                  trackColor={{ false: '#334155', true: '#ef4444' }}
                  thumbColor={simulate500Error ? '#ffffff' : '#94a3b8'}
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
                  <Ionicons name="checkmark-circle" size={15} color="#34d399" style={{ marginRight: 6 }} />
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
                <Ionicons name="receipt-outline" size={24} color="#475569" style={{ marginBottom: 6 }} />
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
                      <View style={[styles.badgePill, { backgroundColor: `${badge.color}22` }]}>
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
              <Ionicons name="trash-outline" size={15} color="#f87171" style={{ marginRight: 6 }} />
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
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0e111a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: '#1e2436',
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
    backgroundColor: '#162338',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
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
    backgroundColor: '#151926',
    borderRadius: 14,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#20273a',
  },
  statLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  statValue: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  scenarioCard: {
    backgroundColor: '#151926',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#222a3d',
  },
  scenarioCardActive: {
    borderColor: '#ef4444',
    backgroundColor: '#2e1215',
  },
  scenarioHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  scenarioTag: {
    color: '#38bdf8',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  scenarioTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  scenarioDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 10,
  },
  actionBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  actionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  reportPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#062b1a',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#10b98133',
  },
  reportPillText: {
    color: '#34d399',
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
    color: '#475569',
    fontSize: 11,
  },
  emptyCard: {
    backgroundColor: '#151926',
    borderRadius: 14,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyCardText: {
    color: '#64748b',
    fontSize: 13,
  },
  txRow: {
    backgroundColor: '#141824',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#20273a',
  },
  txTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  txId: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  txDate: {
    color: '#64748b',
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
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  uuidValue: {
    color: '#38bdf8',
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
    borderTopColor: '#1e2436',
  },
  footerCoins: {
    color: '#f59e0b',
    fontSize: 13,
    fontWeight: '700',
  },
  footerMethod: {
    color: '#94a3b8',
    fontSize: 11,
  },
  failureNote: {
    color: '#f87171',
    fontSize: 11,
    marginTop: 6,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#261214',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  resetBtnText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
  },
});
