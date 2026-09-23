import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { GatewayProduct, TransactionRecord } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  visible: boolean;
  product: GatewayProduct | null;
  transaction: TransactionRecord | null;
  onSuccess: (paymentId: string) => void;
  onCancel: () => void;
}

export const RazorpaySheet: React.FC<Props> = ({
  visible,
  product,
  transaction,
  onSuccess,
  onCancel,
}) => {
  const [selectedMethod, setSelectedMethod] = useState<'UPI' | 'CARD' | 'NETBANKING'>('UPI');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!product || !transaction) return null;

  const handlePay = async () => {
    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 1200));
    setIsProcessing(false);
    onSuccess(`pay_${Math.random().toString(36).substring(2, 9)}`);
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.rzpBadgeRow}>
                <Ionicons name="shield-checkmark" size={16} color="#059669" />
                <Text style={styles.rzpTitle}>Razorpay Trusted Gateway</Text>
              </View>
              <Text style={styles.merchantName}>LinkSphere Physical Merch</Text>
            </View>
            <TouchableOpacity onPress={onCancel} disabled={isProcessing}>
              <Ionicons name="close-circle" size={26} color="#94a3b8" />
            </TouchableOpacity>
          </View>

          {/* Amount Bar */}
          <View style={styles.amountBar}>
            <View>
              <Text style={styles.orderLabel}>Order #{transaction.id.slice(0, 10)}</Text>
              <Text style={styles.productTitle}>{product.title}</Text>
            </View>
            <Text style={styles.priceAmount}>{product.priceFormatted}</Text>
          </View>

          {/* Payment Method Selector */}
          <Text style={styles.sectionHeader}>SELECT PAYMENT METHOD</Text>

          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'UPI' && styles.methodSelected]}
            onPress={() => setSelectedMethod('UPI')}
            disabled={isProcessing}
          >
            <Ionicons name="phone-portrait-outline" size={20} color="#059669" />
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>UPI / QR (Google Pay, PhonePe, Paytm)</Text>
              <Text style={styles.methodSubtitle}>Instant zero-fee transfer</Text>
            </View>
            <Ionicons
              name={selectedMethod === 'UPI' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={selectedMethod === 'UPI' ? '#059669' : '#94a3b8'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'CARD' && styles.methodSelected]}
            onPress={() => setSelectedMethod('CARD')}
            disabled={isProcessing}
          >
            <Ionicons name="card-outline" size={20} color="#059669" />
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Credit / Debit Cards</Text>
              <Text style={styles.methodSubtitle}>Visa, MasterCard, RuPay</Text>
            </View>
            <Ionicons
              name={selectedMethod === 'CARD' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={selectedMethod === 'CARD' ? '#059669' : '#94a3b8'}
            />
          </TouchableOpacity>

          {/* Submit CTA */}
          <TouchableOpacity
            style={[styles.submitButton, isProcessing && styles.disabledBtn]}
            activeOpacity={0.85}
            onPress={handlePay}
            disabled={isProcessing}
          >
            {isProcessing ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.submitText}>
                Pay {product.priceFormatted} via {selectedMethod}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.complianceNote}>
            Designated for physical delivery & off-platform services under store guidelines.
          </Text>
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
  container: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  rzpBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rzpTitle: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  merchantName: {
    color: '#0f172a',
    fontSize: 17,
    fontWeight: '800',
    marginTop: 2,
  },
  amountBar: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  orderLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
  },
  productTitle: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '700',
    maxWidth: 220,
    marginTop: 2,
  },
  priceAmount: {
    color: '#059669',
    fontSize: 20,
    fontWeight: '900',
  },
  sectionHeader: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  methodSelected: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodTitle: {
    color: '#0f172a',
    fontSize: 13,
    fontWeight: '700',
  },
  methodSubtitle: {
    color: '#64748b',
    fontSize: 11,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  complianceNote: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
});
