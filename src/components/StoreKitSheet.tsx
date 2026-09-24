import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { CoinPack, TransactionRecord } from '../types';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    if (visible) {
      setConfirmed(false);
    }
  }, [visible]);

  if (!pack || !transaction) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={!isProcessing ? onCancel : undefined}>
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={!isProcessing ? onCancel : undefined}
        />
        <View
          style={[
            styles.sheetContainer,
            { paddingBottom: Math.max(insets.bottom, 20) + 16 },
          ]}
        >
          {/* Handle */}
          <View style={styles.handle} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.applePayHeader}>
              <Ionicons name="logo-apple" size={24} color="#0f172a" style={{ marginRight: 6 }} />
              <Text style={styles.sheetTitle}>App Store Purchase</Text>
            </View>
            {!isProcessing && (
              <TouchableOpacity onPress={onCancel} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close-circle" size={26} color="#94a3b8" />
              </TouchableOpacity>
            )}
          </View>

          {/* Product Summary */}
          <View style={styles.productRow}>
            <View style={styles.iconCircle}>
              <Ionicons name="cash" size={24} color="#059669" />
            </View>
            <View style={styles.productDetails}>
              <Text style={styles.productTitle}>{pack.title}</Text>
              <Text style={styles.productSubtitle}>
                +{pack.coins + (pack.bonusCoins || 0)} Consumable In-App Coins
              </Text>
            </View>
            <Text style={styles.priceAmount}>{pack.priceFormatted}</Text>
          </View>

          {/* Order Reference ID */}
          <View style={styles.idempotencyBox}>
            <View style={styles.idempotencyHeader}>
              <Ionicons name="shield-checkmark" size={14} color="#059669" />
              <Text style={styles.idempotencyLabel}>Order Reference (Client UUID)</Text>
            </View>
            <Text style={styles.idempotencyKey} numberOfLines={1} ellipsizeMode="middle">
              {transaction.idempotencyKey}
            </Text>
          </View>

          {/* Apple ID Account */}
          <View style={styles.accountRow}>
            <Text style={styles.accountLabel}>Apple ID Account</Text>
            <Text style={styles.accountEmail}>kevin.bhutwala@icloud.com</Text>
          </View>

          {/* Action / State Area */}
          {isProcessing ? (
            <View style={styles.processingContainer}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.processingText}>Contacting App Store & Verifying...</Text>

              {/* Edge Case Simulation Button */}
              <TouchableOpacity
                style={styles.killAppButton}
                activeOpacity={0.8}
                onPress={onSimulateKillApp}
              >
                <Ionicons name="flash-off" size={16} color="#ffffff" style={{ marginRight: 6 }} />
                <Text style={styles.killAppText}>Kill App / Simulate Network Drop</Text>
              </TouchableOpacity>
              <Text style={styles.killHint}>
                Simulates in-flight drop & automatic reconciliation on restart.
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
                <Ionicons name="finger-print" size={22} color="#ffffff" style={{ marginRight: 8 }} />
                <Text style={styles.payButtonText}>Pay with Face ID</Text>
              </TouchableOpacity>
              <Text style={styles.policySubtext}>
                In-App Purchase • Instant Delivery • Apple ID Billed
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
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 10,
  },
  handle: {
    width: 44,
    height: 5,
    backgroundColor: '#cbd5e1',
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
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  productRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    padding: 14,
    borderRadius: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  productDetails: {
    flex: 1,
  },
  productTitle: {
    color: '#0f172a',
    fontSize: 15,
    fontWeight: '800',
  },
  productSubtitle: {
    color: '#64748b',
    fontSize: 12,
    marginTop: 2,
  },
  priceAmount: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '900',
  },
  idempotencyBox: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
  },
  idempotencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  idempotencyLabel: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 6,
  },
  idempotencyKey: {
    color: '#047857',
    fontSize: 12,
    fontFamily: 'monospace',
    marginTop: 4,
    lineHeight: 16,
  },
  accountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    marginBottom: 20,
  },
  accountLabel: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
  },
  accountEmail: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '600',
  },
  actionContainer: {
    alignItems: 'center',
  },
  payButton: {
    backgroundColor: '#059669',
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  payButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  policySubtext: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  processingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  processingText: {
    color: '#64748b',
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
    color: '#dc2626',
    fontSize: 11,
    textAlign: 'center',
  },
});
