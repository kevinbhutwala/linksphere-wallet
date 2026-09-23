import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useTransactionStore } from '../store/useTransactionStore';
import { useWalletStore } from '../store/useWalletStore';
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
  onSimulatedAppReboot,
}) => {
  const { transactions, isReconciling, lastReconciliationResult, reconcilePendingTransactions, clearTransactions } =
    useTransactionStore();
  const { balance, rollbackCount, resetWallet } = useWalletStore();
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
  }, [visible, transactions, balance]);

  const handleManualReconcile = async () => {
    try {
      const res = await reconcilePendingTransactions();
      setReconcileReport(
        `Reconciliation Completed: ${res.reconciledCount} transactions resolved, +${res.creditedCoins} coins credited.`
      );
      refreshDump();
    } catch (err: any) {
      setReconcileReport(`Reconciliation Failed: ${err?.message}`);
    }
  };

  const handleReset = () => {
    storage.clearAll();
    resetWallet();
    clearTransactions();
    refreshDump();
    setReconcileReport('All storage and state reset to defaults.');
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'SETTLED':
        return '#10b981';
      case 'PENDING':
        return '#f59e0b';
      case 'INTERRUPTED':
        return '#ef4444';
      case 'ROLLED_BACK':
        return '#8b5cf6';
      default:
        return '#64748b';
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <Ionicons name="terminal" size={20} color="#38bdf8" />
              <Text style={styles.title}>Ledger & Resilience Diagnostics</Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Quick Metrics Bar */}
            <View style={styles.metricRow}>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>DISK BALANCE</Text>
                <Text style={styles.metricVal}>{balance} Coins</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>ROLLBACKS</Text>
                <Text style={styles.metricVal}>{rollbackCount}</Text>
              </View>
              <View style={styles.metricBox}>
                <Text style={styles.metricLabel}>RECORDS</Text>
                <Text style={styles.metricVal}>{transactions.length}</Text>
              </View>
            </View>

            {/* Reconciliation Control Banner */}
            <View style={styles.reconcileBox}>
              <Text style={styles.reconcileTitle}>Resilience Simulation Action</Text>
              <Text style={styles.reconcileDesc}>
                Simulate app relaunch after network drop to trigger `reconcilePendingTransactions()` against the mock backend.
              </Text>

              <TouchableOpacity
                style={styles.reconcileBtn}
                onPress={handleManualReconcile}
                disabled={isReconciling}
              >
                {isReconciling ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <>
                    <Ionicons name="refresh" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                    <Text style={styles.reconcileBtnText}>Execute reconcilePendingTransactions()</Text>
                  </>
                )}
              </TouchableOpacity>

              {reconcileReport && (
                <View style={styles.reportBox}>
                  <Text style={styles.reportText}>{reconcileReport}</Text>
                </View>
              )}
            </View>

            {/* Local Transaction Ledger */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>TRANSACTION LEDGER (MMKV)</Text>
              <Text style={styles.sectionCount}>{transactions.length} total</Text>
            </View>

            {transactions.length === 0 ? (
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>No transactions recorded yet.</Text>
              </View>
            ) : (
              transactions.map((tx: TransactionRecord) => (
                <View key={tx.id} style={styles.txCard}>
                  <View style={styles.txHeader}>
                    <Text style={styles.txId}>{tx.id}</Text>
                    <View
                      style={[
                        styles.statusChip,
                        { backgroundColor: `${getStatusBadgeColor(tx.status)}22` },
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: getStatusBadgeColor(tx.status) },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: getStatusBadgeColor(tx.status) },
                        ]}
                      >
                        {tx.status}
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.idempKeyLabel}>Idempotency UUID:</Text>
                  <Text style={styles.idempKey}>{tx.idempotencyKey}</Text>

                  <View style={styles.txMetaRow}>
                    <Text style={styles.txMeta}>Coins: +{tx.coins}</Text>
                    <Text style={styles.txMeta}>Amount: ${tx.amount.toFixed(2)}</Text>
                    <Text style={styles.txMeta}>{new Date(tx.createdAt).toLocaleTimeString()}</Text>
                  </View>

                  {tx.failureReason && (
                    <Text style={styles.failureText}>Note: {tx.failureReason}</Text>
                  )}
                  {tx.serverReceiptId && (
                    <Text style={styles.receiptText}>Receipt: {tx.serverReceiptId}</Text>
                  )}
                </View>
              ))
            )}

            {/* Raw MMKV Storage State */}
            <View style={styles.sectionHeaderRow}>
              <Text style={styles.sectionTitle}>RAW MMKV DISK STATE</Text>
            </View>
            <View style={styles.rawStorageBox}>
              {Object.keys(storageKeys).length === 0 ? (
                <Text style={styles.emptyText}>No storage keys.</Text>
              ) : (
                Object.entries(storageKeys).map(([key, val]) => (
                  <View key={key} style={styles.storageEntry}>
                    <Text style={styles.storageKey}>{key}:</Text>
                    <Text style={styles.storageVal} numberOfLines={3} ellipsizeMode="tail">
                      {val}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Reset All Button */}
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
              <Ionicons name="trash-outline" size={16} color="#ef4444" style={{ marginRight: 6 }} />
              <Text style={styles.resetButtonText}>Reset All Wallet & Ledger Data</Text>
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
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#0b0e14',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: '#1f293d',
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
  title: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 8,
  },
  scrollArea: {
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  metricBox: {
    flex: 1,
    backgroundColor: '#161b26',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#242c3d',
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
  },
  metricVal: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 4,
  },
  reconcileBox: {
    backgroundColor: '#0c2340',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  reconcileTitle: {
    color: '#38bdf8',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 4,
  },
  reconcileDesc: {
    color: '#94a3b8',
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
  },
  reconcileBtn: {
    backgroundColor: '#0284c7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 10,
  },
  reconcileBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  reportBox: {
    backgroundColor: '#062b1a',
    borderColor: '#10b981',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  reportText: {
    color: '#34d399',
    fontSize: 12,
    fontWeight: '600',
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 6,
  },
  sectionTitle: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  sectionCount: {
    color: '#475569',
    fontSize: 11,
  },
  emptyBox: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#161b26',
    borderRadius: 12,
    marginBottom: 16,
  },
  emptyText: {
    color: '#64748b',
    fontSize: 13,
  },
  txCard: {
    backgroundColor: '#141822',
    borderWidth: 1,
    borderColor: '#222838',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  txHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  txId: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '700',
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  idempKeyLabel: {
    color: '#64748b',
    fontSize: 10,
    marginTop: 2,
  },
  idempKey: {
    color: '#38bdf8',
    fontSize: 11,
    fontFamily: 'monospace',
    marginBottom: 6,
  },
  txMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: '#1e2433',
  },
  txMeta: {
    color: '#94a3b8',
    fontSize: 11,
  },
  failureText: {
    color: '#f87171',
    fontSize: 11,
    marginTop: 6,
  },
  receiptText: {
    color: '#34d399',
    fontSize: 11,
    marginTop: 4,
  },
  rawStorageBox: {
    backgroundColor: '#12151d',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#1e2330',
    marginBottom: 16,
  },
  storageEntry: {
    marginBottom: 8,
  },
  storageKey: {
    color: '#f59e0b',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'monospace',
  },
  storageVal: {
    color: '#94a3b8',
    fontSize: 11,
    fontFamily: 'monospace',
    marginTop: 2,
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1f1315',
    borderColor: '#7f1d1d',
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
  },
  resetButtonText: {
    color: '#f87171',
    fontSize: 13,
    fontWeight: '700',
  },
});
