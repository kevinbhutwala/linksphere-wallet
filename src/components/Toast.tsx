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
            color={isError ? '#dc2626' : isSuccess ? '#059669' : '#0284c7'}
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
    backgroundColor: '#ffffff',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
  },
  errorCard: {
    backgroundColor: '#fff5f5',
    borderColor: '#fecaca',
  },
  successCard: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
  },
  iconCol: {
    marginRight: 12,
  },
  textCol: {
    flex: 1,
  },
  titleText: {
    color: '#0f172a',
    fontSize: 14,
    fontWeight: '800',
  },
  descText: {
    color: '#475569',
    fontSize: 12,
    marginTop: 2,
    lineHeight: 16,
  },
});
