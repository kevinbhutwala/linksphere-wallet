import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
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
  const { simulate500Error } = useDevSettingsStore();

  return (
    <View style={styles.container}>
      {/* Top Navbar Row */}
      <View style={styles.navBar}>
        <View style={styles.userSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>KB</Text>
          </View>
          <View>
            <Text style={styles.greeting}>LinkSphere Wallet</Text>
            <View style={styles.syncStatus}>
              <View style={styles.syncDot} />
              <Text style={styles.syncText}>MMKV Synced</Text>
            </View>
          </View>
        </View>

        {/* Developer / Resilience Control Pill */}
        <TouchableOpacity
          style={[styles.testDockBtn, simulate500Error && styles.testDockBtnActive]}
          activeOpacity={0.8}
          onPress={onOpenDiagnostics}
        >
          <Ionicons
            name={simulate500Error ? 'alert-circle' : 'flask'}
            size={15}
            color={simulate500Error ? '#f87171' : '#38bdf8'}
          />
          <Text
            style={[
              styles.testDockText,
              simulate500Error && styles.testDockTextActive,
            ]}
          >
            {simulate500Error ? '500 Error ON' : 'Test Scenarios'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Hero Wallet Balance Card */}
      <View style={styles.heroCard}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardLabel}>Available Balance</Text>
          <View style={styles.badgeInstant}>
            <Ionicons name="flash" size={11} color="#10b981" />
            <Text style={styles.badgeInstantText}>Instant</Text>
          </View>
        </View>

        <View style={styles.balanceRow}>
          <View style={styles.coinGlyph}>
            <Text style={styles.coinEmoji}>🪙</Text>
          </View>
          <Text style={styles.balanceAmount}>{balance.toLocaleString()}</Text>
          <Text style={styles.currencyName}>COINS</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={[styles.primaryActionBtn, isSendingGift && styles.disabledBtn]}
            activeOpacity={0.85}
            onPress={onSendGiftPress}
            disabled={isSendingGift}
          >
            <Ionicons name="gift" size={16} color="#ffffff" style={{ marginRight: 6 }} />
            <Text style={styles.primaryActionText}>Send Gift (-50)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            activeOpacity={0.85}
            onPress={onOpenDiagnostics}
          >
            <Ionicons name="time-outline" size={16} color="#94a3b8" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryActionText}>Ledger</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#0c0f17',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 14,
  },
  navBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#252d40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#374151',
  },
  avatarText: {
    color: '#e2e8f0',
    fontSize: 13,
    fontWeight: '700',
  },
  greeting: {
    color: '#f8fafc',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  syncStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  syncDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 5,
  },
  syncText: {
    color: '#64748b',
    fontSize: 11,
    fontWeight: '500',
  },
  testDockBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#161e2e',
    borderColor: '#25354e',
    borderWidth: 1,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 40, // clear Expo Go gear icon
  },
  testDockBtnActive: {
    backgroundColor: '#3b1219',
    borderColor: '#ef4444',
  },
  testDockText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '700',
    marginLeft: 5,
  },
  testDockTextActive: {
    color: '#fca5a5',
  },
  heroCard: {
    backgroundColor: '#141824',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#1f2638',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  cardLabel: {
    color: '#64748b',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  badgeInstant: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#062b1a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#10b98133',
  },
  badgeInstantText: {
    color: '#34d399',
    fontSize: 10,
    fontWeight: '700',
    marginLeft: 3,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 16,
  },
  coinGlyph: {
    marginRight: 8,
  },
  coinEmoji: {
    fontSize: 26,
  },
  balanceAmount: {
    color: '#ffffff',
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  currencyName: {
    color: '#f59e0b',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginLeft: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1.4,
    backgroundColor: '#7c3aed',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
  },
  disabledBtn: {
    opacity: 0.6,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#1b202e',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#293245',
  },
  secondaryActionText: {
    color: '#cbd5e1',
    fontSize: 13,
    fontWeight: '600',
  },
});
