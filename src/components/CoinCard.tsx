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
    <View style={styles.cardContainer}>
      <View style={styles.card}>
        {pack.badge && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{pack.badge}</Text>
          </View>
        )}

        <View style={styles.leftCol}>
          <View style={styles.iconCircle}>
            <Ionicons name={getIconName() as any} size={24} color="#059669" />
          </View>
          <View style={styles.infoCol}>
            <Text style={styles.title}>{pack.title}</Text>
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

        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.buyButton, disabled && styles.disabledButton]}
          disabled={disabled}
          onPress={() => onPress(pack)}
        >
          <Text style={styles.priceText}>{pack.priceFormatted}</Text>
        </TouchableOpacity>
      </View>
    </View>
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
    position: 'relative',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 18,
    backgroundColor: '#10b981',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
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
    marginRight: 14,
  },
  infoCol: {
    justifyContent: 'center',
  },
  title: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 4,
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
