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
                <Ionicons name="shield-checkmark" size={16} color="#38bdf8" />
                <Text style={styles.rzpTitle}>Razorpay Trusted Gateway</Text>
              </View>
              <Text style={styles.merchantName}>LinkSphere Physical Merch</Text>
            </View>
            <TouchableOpacity onPress={onCancel} disabled={isProcessing}>
              <Ionicons name="close" size={24} color="#94a3b8" />
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
            <Ionicons name="phone-portrait-outline" size={20} color="#38bdf8" />
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>UPI / QR (Google Pay, PhonePe, Paytm)</Text>
              <Text style={styles.methodSubtitle}>Instant zero-fee transfer</Text>
            </View>
            <Ionicons
              name={selectedMethod === 'UPI' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={selectedMethod === 'UPI' ? '#38bdf8' : '#475569'}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.methodCard, selectedMethod === 'CARD' && styles.methodSelected]}
            onPress={() => setSelectedMethod('CARD')}
            disabled={isProcessing}
          >
            <Ionicons name="card-outline" size={20} color="#38bdf8" />
            <View style={styles.methodInfo}>
              <Text style={styles.methodTitle}>Credit / Debit Cards</Text>
              <Text style={styles.methodSubtitle}>Visa, MasterCard, RuPay</Text>
            </View>
            <Ionicons
              name={selectedMethod === 'CARD' ? 'radio-button-on' : 'radio-button-off'}
              size={20}
              color={selectedMethod === 'CARD' ? '#38bdf8' : '#475569'}
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
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: '#0f172a',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 22,
    borderWidth: 1,
    borderColor: '#1e293b',
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
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
    textTransform: 'uppercase',
  },
  merchantName: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  amountBar: {
    backgroundColor: '#1e293b',
    borderRadius: 14,
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 18,
  },
  orderLabel: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '600',
  },
  productTitle: {
    color: '#f8fafc',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: 220,
    marginTop: 2,
  },
  priceAmount: {
    color: '#38bdf8',
    fontSize: 20,
    fontWeight: '800',
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
    backgroundColor: '#1e293b',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#334155',
  },
  methodSelected: {
    borderColor: '#38bdf8',
    backgroundColor: '#0369a122',
  },
  methodInfo: {
    flex: 1,
    marginLeft: 12,
  },
  methodTitle: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
  },
  methodSubtitle: {
    color: '#94a3b8',
    fontSize: 11,
    marginTop: 2,
  },
  submitButton: {
    backgroundColor: '#0284c7',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
    marginBottom: 10,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  submitText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  complianceNote: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
    marginTop: 6,
  },
});
