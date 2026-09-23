import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  triggerKey: number; // incremented whenever gift is sent
  giftEmoji?: string;
  giftCost?: number;
}

export const GiftAnimationOverlay: React.FC<Props> = ({
  triggerKey,
  giftEmoji = '🎁',
  giftCost = 50,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(40)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (triggerKey === 0) return;

    // Reset values
    scaleAnim.setValue(0.2);
    translateYAnim.setValue(40);
    opacityAnim.setValue(1);

    // Run fluid 60fps spring + float animation
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1.25,
        friction: 4,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(translateYAnim, {
        toValue: -90,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.delay(650),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 350,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [triggerKey, scaleAnim, translateYAnim, opacityAnim]);

  if (triggerKey === 0) return null;

  return (
    <View style={styles.pointerEventsNoneContainer} pointerEvents="none">
      <Animated.View
        style={[
          styles.burstContainer,
          {
            opacity: opacityAnim,
            transform: [{ translateY: translateYAnim }, { scale: scaleAnim }],
          },
        ]}
      >
        <View style={styles.giftIconCircle}>
          <Text style={styles.giftEmoji}>{giftEmoji}</Text>
        </View>

        <View style={styles.floatingTag}>
          <Ionicons name="sparkles" size={14} color="#059669" style={{ marginRight: 4 }} />
          <Text style={styles.floatingText}>-{giftCost} COINS</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  pointerEventsNoneContainer: {
    position: 'absolute',
    top: 150,
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  burstContainer: {
    alignItems: 'center',
  },
  giftIconCircle: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#00A86B',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#a7f3d0',
  },
  giftEmoji: {
    fontSize: 44,
  },
  floatingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderColor: '#a7f3d0',
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  floatingText: {
    color: '#047857',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
