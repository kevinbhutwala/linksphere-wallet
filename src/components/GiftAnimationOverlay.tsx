import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Props {
  triggerKey: number; // incremented whenever gift is sent
}

const { width } = Dimensions.get('window');

export const GiftAnimationOverlay: React.FC<Props> = ({ triggerKey }) => {
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
          <Text style={styles.giftEmoji}>🎁</Text>
        </View>

        <View style={styles.floatingTag}>
          <Ionicons name="sparkles" size={14} color="#f59e0b" style={{ marginRight: 4 }} />
          <Text style={styles.floatingText}>-50 COINS</Text>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  pointerEventsNoneContainer: {
    position: 'absolute',
    top: 140,
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
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#8b5cf6',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 16,
    elevation: 12,
    borderWidth: 3,
    borderColor: '#c4b5fd',
  },
  giftEmoji: {
    fontSize: 42,
  },
  floatingTag: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.9)',
    borderColor: '#f59e0b',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
  },
  floatingText: {
    color: '#fbbf24',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
