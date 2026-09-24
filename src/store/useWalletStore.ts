import { create } from 'zustand';
import { storage } from '../services/storage/storage';
import { mockBackend } from '../services/backend/mockBackend';

export interface ScenarioBannerInfo {
  scenarioNumber: 1 | 2 | 3;
  tag: string;
  tagColor: string;
  title: string;
  description: string;
}

interface WalletState {
  balance: number;
  isDeducting: boolean;
  lastDeductedAmount: number | null;
  rollbackCount: number;
  optimisticSnapshot: number | null;
  scenarioBanner: ScenarioBannerInfo | null;

  // Actions
  creditCoins: (amount: number) => void;
  sendGiftOptimistic: (giftId?: string, cost?: number) => Promise<{ success: boolean; balance: number }>;
  setBalance: (newBalance: number) => void;
  resetWallet: () => void;
  setScenarioBanner: (banner: ScenarioBannerInfo | null) => void;
}

const STORAGE_KEY_BALANCE = 'wallet:balance';
const DEFAULT_INITIAL_BALANCE = 1000;

export const useWalletStore = create<WalletState>((set, get) => {
  // Read initial balance synchronously from MMKV
  const storedBalance = storage.getNumber(STORAGE_KEY_BALANCE);
  const initialBalance = storedBalance !== undefined ? storedBalance : DEFAULT_INITIAL_BALANCE;

  // Ensure disk has initial balance if first run
  if (storedBalance === undefined) {
    storage.setNumber(STORAGE_KEY_BALANCE, initialBalance);
  }

  // Sync mock backend initial state
  mockBackend.setServerBalance(initialBalance);

  return {
    balance: initialBalance,
    isDeducting: false,
    lastDeductedAmount: null,
    rollbackCount: 0,
    optimisticSnapshot: null,
    scenarioBanner: null,

    setScenarioBanner: (banner: ScenarioBannerInfo | null) => set({ scenarioBanner: banner }),

    creditCoins: (amount: number) => {
      const current = get().balance;
      const next = current + amount;
      // Synchronous MMKV write
      storage.setNumber(STORAGE_KEY_BALANCE, next);
      set({ balance: next });
    },

    sendGiftOptimistic: async (giftId = 'gift_rocket', cost = 50) => {
      const currentBalance = get().balance;

      if (currentBalance < cost) {
        throw new Error(`Insufficient coins! You have ${currentBalance} coins, but this gift requires ${cost}.`);
      }

      // 1. OPTIMISTIC PHASE: Instant UI deduction + atomic snapshot
      const optimisticNewBalance = currentBalance - cost;
      
      // Synchronously persist updated balance to disk immediately
      storage.setNumber(STORAGE_KEY_BALANCE, optimisticNewBalance);

      set({
        balance: optimisticNewBalance,
        isDeducting: true,
        lastDeductedAmount: cost,
        optimisticSnapshot: currentBalance, // snapshot prior balance
      });

      try {
        // 2. NETWORK MUTATION: Call mock backend validation
        await mockBackend.sendGift({
          giftCost: cost,
          giftId,
        });

        // 3. SETTLED: Backend confirmed deduction
        set({
          isDeducting: false,
          optimisticSnapshot: null,
        });

        return {
          success: true,
          balance: optimisticNewBalance,
        };
      } catch (err: any) {
        // 4. ROLLBACK PHASE: Server returned 500 or network failure!
        // Smoothly roll back coins to the prior balance from snapshot
        const snapshot = get().optimisticSnapshot ?? currentBalance;

        // Synchronously persist restored balance to disk
        storage.setNumber(STORAGE_KEY_BALANCE, snapshot);

        set((state) => ({
          balance: snapshot,
          isDeducting: false,
          optimisticSnapshot: null,
          rollbackCount: state.rollbackCount + 1,
        }));

        // Re-throw so presentational UI can display non-blocking inline error toast
        const errorMessage = err?.message || '500 Internal Server Error';
        throw new Error(errorMessage);
      }
    },

    setBalance: (newBalance: number) => {
      storage.setNumber(STORAGE_KEY_BALANCE, newBalance);
      mockBackend.setServerBalance(newBalance);
      set({ balance: newBalance });
    },

    resetWallet: () => {
      storage.setNumber(STORAGE_KEY_BALANCE, DEFAULT_INITIAL_BALANCE);
      mockBackend.setServerBalance(DEFAULT_INITIAL_BALANCE);
      set({
        balance: DEFAULT_INITIAL_BALANCE,
        isDeducting: false,
        lastDeductedAmount: null,
        rollbackCount: 0,
        optimisticSnapshot: null,
        scenarioBanner: null,
      });
    },
  };
});
