import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  title: string;
  description?: string;
}

interface Props {
  toast: ToastMessage | null;
  onDismiss: () => void;
}

export const Toast: React.FC<Props> = ({ toast, onDismiss }) => {
  const translateY = useRef(new Animated.Value(-80)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (toast) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: -80,
            duration: 200,
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
        ]).start(() => onDismiss());
      }, 3500);

      return () => clearTimeout(timer);
    }
  }, [toast, translateY, opacity, onDismiss]);

  if (!toast) return null;

  const isError = toast.type === 'error';
  const isSuccess = toast.type === 'success';

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View
        style={[
          styles.toastCard,
          isError && styles.errorCard,
          isSuccess && styles.successCard,
          {
            transform: [{ translateY }],
            opacity,
          },
        ]}
      >
        <View style={styles.iconCol}>
          <Ionicons
            name={
              isError
                ? 'alert-circle'
                : isSuccess
                ? 'checkmark-circle'
                : 'information-circle'
            }
            size={24}
            color={isError ? '#f87171' : isSuccess ? '#34d399' : '#38bdf8'}
          />
        </View>

        <View style={styles.textCol}>
          <Text style={styles.titleText}>{toast.title}</Text>
          {toast.description ? (
            <Text style={styles.descText}>{toast.description}</Text>
          ) : null}
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 50,
    left: 16,
    right: 16,
    zIndex: 99999,
    alignItems: 'center',
  },
  toastCard: {
    width: '100%',
    maxWidth: 500,
    backgroundColor: '#1e293b',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
  },
  errorCard: {
    backgroundColor: '#2b1212',
    borderColor: '#ef4444',
  },
  successCard: {
    backgroundColor: '#062b1a',
    borderColor: '#10b981',
  },
  iconCol: {
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  titleText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  descText: {
    color: '#cbd5e1',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
