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
            <Ionicons name={getIconName() as any} size={24} color="#f59e0b" />
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
    // Fixed layout dimensions matching CoinCardSkeleton to ensure Zero CLS
    height: 104,
    marginBottom: 14,
    width: '100%',
  },
  card: {
    height: 104,
    backgroundColor: '#161922',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#22283a',
    position: 'relative',
    overflow: 'hidden',
  },
  badge: {
    position: 'absolute',
    top: 0,
    right: 18,
    backgroundColor: '#f59e0b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderBottomLeftRadius: 6,
    borderBottomRightRadius: 6,
  },
  badgeText: {
    color: '#000',
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
    backgroundColor: '#26241a',
    borderWidth: 1,
    borderColor: '#453817',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  infoCol: {
    justifyContent: 'center',
  },
  title: {
    color: '#94a3b8',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 4,
  },
  coinsRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  coinsText: {
    color: '#f8fafc',
    fontSize: 18,
    fontWeight: '700',
  },
  bonusTag: {
    marginLeft: 6,
    backgroundColor: '#10b98122',
    borderColor: '#10b98155',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  bonusText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '700',
  },
  buyButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 88,
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
