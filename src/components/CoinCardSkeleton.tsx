import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const CoinCardSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.7,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.3,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [shimmerAnim]);

  return (
    <View style={styles.cardContainer}>
      <Animated.View style={[styles.card, { opacity: shimmerAnim }]}>
        <View style={styles.leftCol}>
          <View style={styles.skeletonIcon} />
          <View style={styles.textCol}>
            <View style={styles.skeletonTitle} />
            <View style={styles.skeletonSubtitle} />
          </View>
        </View>
        <View style={styles.skeletonButton} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    // Fixed layout dimensions matching CoinCard exactly to eliminate CLS
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
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#262d42',
    marginRight: 14,
  },
  textCol: {
    justifyContent: 'center',
  },
  skeletonTitle: {
    width: 120,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#262d42',
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: 75,
    height: 14,
    borderRadius: 5,
    backgroundColor: '#262d42',
  },
  skeletonButton: {
    width: 88,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#262d42',
  },
});
