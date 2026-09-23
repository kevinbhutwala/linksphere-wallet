import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch } from 'react-native';
import { useWalletStore } from '../store/useWalletStore';
import { useDevSettingsStore } from '../store/useDevSettingsStore';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  onSendGiftPress: () => void;
  onOpenDiagnostics: () => void;
  isSendingGift: boolean;
}

export const HeaderWalletBar: React.FC<Props> = ({
  onSendGiftPress,
  onOpenDiagnostics,
  isSendingGift,
}) => {
  const { balance } = useWalletStore();
  const { simulate500Error, toggle500Error } = useDevSettingsStore();

  return (
    <View style={styles.container}>
      {/* Top Bar: Coin Balance & Diagnostics */}
      <View style={styles.topRow}>
        <View style={styles.balanceBadge}>
          <View style={styles.coinIconWrap}>
            <Ionicons name="sparkles" size={16} color="#f59e0b" />
          </View>
          <View>
            <Text style={styles.balanceLabel}>WALLET BALANCE</Text>
            <Text style={styles.balanceValue}>{balance.toLocaleString()} Coins</Text>
          </View>
        </View>

        <View style={styles.rightActions}>
          <TouchableOpacity
            style={styles.diagButton}
            onPress={onOpenDiagnostics}
            activeOpacity={0.8}
          >
            <Ionicons name="terminal-outline" size={18} color="#38bdf8" />
            <Text style={styles.diagText}>Ledger</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Row: Send Gift & 500 Toggle */}
      <View style={styles.actionRow}>
        {/* Send Gift CTA */}
        <TouchableOpacity
          style={[styles.giftBtn, isSendingGift && styles.disabledGiftBtn]}
          activeOpacity={0.85}
          onPress={onSendGiftPress}
          disabled={isSendingGift}
        >
          <Ionicons name="gift" size={18} color="#ffffff" style={{ marginRight: 6 }} />
          <Text style={styles.giftBtnText}>Send Gift (-50 Coins)</Text>
        </TouchableOpacity>

        {/* 500 Failure Simulation Pill */}
        <TouchableOpacity
          style={[
            styles.toggleContainer,
            simulate500Error ? styles.toggleActive : styles.toggleInactive,
          ]}
          activeOpacity={0.85}
          onPress={toggle500Error}
        >
          <View style={styles.toggleTextWrap}>
            <Text
              style={[
                styles.toggleTitle,
                simulate500Error ? styles.toggleTitleActive : styles.toggleTitleInactive,
              ]}
            >
              Simulate 500 Error
            </Text>
            <Text style={styles.toggleSubtitle}>
              {simulate500Error ? 'FAIL ACTIVE' : 'OFF (200 OK)'}
            </Text>
          </View>
          <Switch
            value={simulate500Error}
            onValueChange={toggle500Error}
            trackColor={{ false: '#334155', true: '#ef4444' }}
            thumbColor={simulate500Error ? '#ffffff' : '#94a3b8'}
            style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#11141c',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1e2433',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  balanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinIconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#26241a',
    borderWidth: 1,
    borderColor: '#453817',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  balanceLabel: {
    color: '#64748b',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  balanceValue: {
    color: '#f8fafc',
    fontSize: 20,
    fontWeight: '800',
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  diagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0c2340',
    borderColor: '#0284c7',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  diagText: {
    color: '#38bdf8',
    fontSize: 12,
    fontWeight: '700',
    marginLeft: 6,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  giftBtn: {
    flex: 1.1,
    backgroundColor: '#8b5cf6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  disabledGiftBtn: {
    opacity: 0.6,
  },
  giftBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  toggleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  toggleInactive: {
    backgroundColor: '#161922',
    borderColor: '#262f45',
  },
  toggleActive: {
    backgroundColor: '#450a0a',
    borderColor: '#ef4444',
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  toggleTitleInactive: {
    color: '#94a3b8',
  },
  toggleTitleActive: {
    color: '#fca5a5',
  },
  toggleSubtitle: {
    fontSize: 9,
    color: '#64748b',
    fontWeight: '600',
  },
});
