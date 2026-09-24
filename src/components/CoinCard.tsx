import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { CoinPack } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  pack: CoinPack;
  onPress: (pack: CoinPack) => void;
  disabled?: boolean;
}

export const CoinCard: React.FC<Props> = ({ pack, onPress, disabled }) => {
  const getIconName = () => {
    switch (pack.icon) {
      case 'sparkles':
        return 'sparkles';
      case 'crown':
        return 'trophy';
      default:
        return 'cash-outline';
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.cardContainer}
      disabled={disabled}
      onPress={() => onPress(pack)}
    >
      <View style={styles.card}>
        <View style={styles.leftCol}>
          <View style={styles.iconCircle}>
            <Ionicons name={getIconName() as any} size={24} color="#059669" />
          </View>
          <View style={styles.infoCol}>
            <View style={styles.titleRow}>
              <Text style={styles.title} numberOfLines={1}>{pack.title}</Text>
              {pack.badge && (
                <View style={styles.badgePill}>
                  <Text style={styles.badgeText}>{pack.badge}</Text>
                </View>
              )}
            </View>
            <View style={styles.coinsRow}>
              <Text style={styles.coinsText}>{pack.coins.toLocaleString()} Coins</Text>
              {pack.bonusCoins ? (
                <View style={styles.bonusTag}>
                  <Text style={styles.bonusText}>+{pack.bonusCoins}</Text>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={[styles.buyButton, disabled && styles.disabledButton]}>
          <Text style={styles.priceText}>{pack.priceFormatted}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    height: 104,
    marginBottom: 14,
    width: '100%',
  },
  card: {
    height: 104,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  leftCol: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 12,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  infoCol: {
    flex: 1,
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
    gap: 6,
  },
  title: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
  },
  badgePill: {
    backgroundColor: '#059669',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinsText: {
    color: '#0f172a',
    fontSize: 18,
    fontWeight: '800',
  },
  bonusTag: {
    marginLeft: 6,
    backgroundColor: '#d1fae5',
    borderColor: '#6ee7b7',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonusText: {
    color: '#047857',
    fontSize: 11,
    fontWeight: '700',
  },
  buyButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  disabledButton: {
    opacity: 0.5,
  },
  priceText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
});
