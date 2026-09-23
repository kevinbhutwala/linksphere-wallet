import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CoinPack, TransactionRecord } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  pack: CoinPack | null;
  transaction: TransactionRecord | null;
  isProcessing: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  onSimulateKillApp: () => void;
}

export const StoreKitSheet: React.FC<Props> = ({
  visible,
  pack,
  transaction,
  isProcessing,
  onConfirm,
  onCancel,
  onSimulateKillApp,
}) => {
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (visible) {
      setConfirmed(false);
    }
  }, [visible]);

  if (!pack || !transaction) return null;

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* iOS / StoreKit Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.applePayHeader}>
              <Ionicons name="logo-apple" size={24} color="#ffffff" style={{ marginRight: 6 }} />
              <Text style={styles.sheetTitle}>App Store Purchase</Text>
            </View>
            {!isProcessing && (
              <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={26} color="#64748b" />
              </TouchableOpacity>
            )}
          </View>

          {/* Product Summary */}
          <View style={styles.productRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="cash" size={24} color="#f59e0b" />
            </View>
            <View style={styles.productDetails}>
              <Text style={styles.productTitle}>{pack.title}</Text>
              <Text style={styles.productSubtitle}>
                +{pack.coins + (pack.bonusCoins || 0)} Consumable In-App Coins
              </Text>
            </View>
            <Text style={styles.priceAmount}>{pack.priceFormatted}</Text>
          </View>

          {/* Idempotency Pre-Persistence Badge */}
          <View style={styles.idempotencyBox}>
            <View style={styles.idempotencyHeader}>
              <Ionicons name="key-outline" size={14} color="#38bdf8" />
              <Text style={styles.idempotencyLabel}>Client-Side Idempotency Key (MMKV PENDING)</Text>
            </View>
            <Text style={styles.idempotencyKey} numberOfLines={1} ellipsizeMode="middle">
              {transaction.idempotencyKey}
            </Text>
          </View>

          {/* Apple ID Account */}
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Account</Text>
            <Text style={styles.accountEmail}>user@icloud.com</Text>
          </View>

          {/* Action / State Area */}
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#38bdf8" />
              <Text style={styles.processingText}>Verifying with StoreKit & Backend Ledger...</Text>

              {/* SIMULATE NETWORK DROP / KILL APP BUTTON */}
              <TouchableOpacity
                style={styles.killAppButton}
                activeOpacity={0.8}
                onPress={onSimulateKillApp}
              >
                <Ionicons name="flash-off" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.killAppText}>Kill App / Simulate Network Drop</Text>
              </TouchableOpacity>
              <Text style={styles.killHint}>
                Triggers mid-flight disconnection to test UUID reconciliation.
              </Text>
            </View>
          ) : (
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.payButton}
                activeOpacity={0.85}
                onPress={() => {
                  setConfirmed(true);
                  onConfirm();
                }}
              >
                <Ionicons name="finger-print" size={22} color="#000" style={{ marginRight: 8 }} />
                <Text style={styles.payButtonText}>Double-Click / Pay with Face ID</Text>
              </TouchableOpacity>
              <Text style={styles.policySubtext}>
                Consumable IAP governed by App Store Guideline 3.1.1
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.72)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#161922',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#262f45',
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: '#374151',
    borderRadius: 3,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  applePayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sheetTitle: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1f2433',
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2e2716',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
  },
  productSubtitle: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 2,
  },
  priceAmount: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '800',
  },
  idempotencyBox: {
    backgroundColor: '#0c2340',
    borderColor: '#0284c7',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
  },
  idempotencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  idempotencyLabel: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  idempotencyKey: {
    color: '#e2e8f0',
    fontSize: 12,
    fontFamily: 'monospace',
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#262f45',
    marginBottom: 20,
  },
  accountLabel: {
    color: '#64748b',
    fontSize: 13,
  },
  accountEmail: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '500',
  },
  actionContainer: {
    alignItems: 'center',
  },
  payButton: {
    backgroundColor: '#ffffff',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  payButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '700',
  },
  policySubtext: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  processingText: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 10,
    marginBottom: 16,
  },
  killAppButton: {
    backgroundColor: '#dc2626',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 6,
  },
  killAppText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  killHint: {
    color: '#ef4444',
    fontSize: 11,
    textAlign: 'center',
  },
});
