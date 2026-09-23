import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

export const CoinCardSkeleton: React.FC = () => {
  const shimmerAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 0.85,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0.4,
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
  },
  leftCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e2e8f0',
    marginRight: 14,
  },
  textCol: {
    justifyContent: 'center',
  },
  skeletonTitle: {
    width: 120,
    height: 18,
    borderRadius: 6,
    backgroundColor: '#e2e8f0',
    marginBottom: 8,
  },
  skeletonSubtitle: {
    width: 75,
    height: 14,
    borderRadius: 5,
    backgroundColor: '#e2e8f0',
  },
  skeletonButton: {
    width: 88,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#e2e8f0',
  },
});
