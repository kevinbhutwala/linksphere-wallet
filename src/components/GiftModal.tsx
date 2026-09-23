import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface GiftOption {
  id: string;
  name: string;
  cost: number;
  emoji: string;
  color: string;
}

const GIFTS: GiftOption[] = [
  { id: 'gift_star', name: 'Super Star', cost: 50, emoji: '⭐', color: '#f59e0b' },
  { id: 'gift_rocket', name: 'Hyper Rocket', cost: 50, emoji: '🚀', color: '#8b5cf6' },
  { id: 'gift_heart', name: 'Golden Heart', cost: 50, emoji: '💖', color: '#ec4899' },
  { id: 'gift_crown', name: 'Royal Crown', cost: 50, emoji: '👑', color: '#eab308' },
];

interface Props {
  visible: boolean;
  onClose: () => void;
  onSend: (gift: GiftOption) => void;
  userBalance: number;
  isSending: boolean;
}

export const GiftModal: React.FC<Props> = ({
  visible,
  onClose,
  onSend,
  userBalance,
  isSending,
}) => {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Send a Gift</Text>
              <Text style={styles.subtitle}>
                Balance: <Text style={styles.balanceText}>{userBalance.toLocaleString()} Coins</Text>
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="close-circle" size={26} color="#475569" />
            </TouchableOpacity>
          </View>

          <View style={styles.grid}>
            {GIFTS.map((g) => {
              const canAfford = userBalance >= g.cost;
              return (
                <TouchableOpacity
                  key={g.id}
                  style={[styles.giftCard, !canAfford && styles.disabledCard]}
                  activeOpacity={0.8}
                  disabled={!canAfford || isSending}
                  onPress={() => onSend(g)}
                >
                  <View style={[styles.emojiWrap, { backgroundColor: `${g.color}15`, borderColor: `${g.color}40` }]}>
                    <Text style={styles.emoji}>{g.emoji}</Text>
                  </View>
                  <Text style={styles.giftName}>{g.name}</Text>
                  <View style={styles.costBadge}>
                    <Ionicons name="sparkles" size={11} color="#f59e0b" style={{ marginRight: 3 }} />
                    <Text style={styles.costText}>{g.cost} Coins</Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.hint}>
            Optimistically deducted from wallet. Subject to 500 error rollback test.
          </Text>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#12141c',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 36,
    borderWidth: 1,
    borderColor: '#1e2436',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: '#334155',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    color: '#94a3b8',
    fontSize: 13,
    marginTop: 2,
  },
  balanceText: {
    color: '#f59e0b',
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  giftCard: {
    width: '48%',
    backgroundColor: '#181c28',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#262f44',
  },
  disabledCard: {
    opacity: 0.4,
  },
  emojiWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    marginBottom: 10,
  },
  emoji: {
    fontSize: 30,
  },
  giftName: {
    color: '#f8fafc',
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  costBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#26241a',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  costText: {
    color: '#fbbf24',
    fontSize: 11,
    fontWeight: '700',
  },
  hint: {
    color: '#64748b',
    fontSize: 11,
    textAlign: 'center',
  },
});
