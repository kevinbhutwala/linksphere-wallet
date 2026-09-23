import { create } from 'zustand';
import { TransactionRecord, TransactionStatus, ReconcileResult } from '../types';
import { storage } from '../services/storage/storage';
import { mockBackend } from '../services/backend/mockBackend';
import { useWalletStore } from './useWalletStore';

interface TransactionState {
  transactions: TransactionRecord[];
  isReconciling: boolean;
  lastReconciliationResult: ReconcileResult | null;

  // Actions
  addPendingTransaction: (tx: TransactionRecord) => void;
  updateTransactionStatus: (
    id: string,
    status: TransactionStatus,
    options?: { failureReason?: string; serverReceiptId?: string }
  ) => void;
  markInterrupted: (id: string, reason?: string) => void;
  reconcilePendingTransactions: () => Promise<ReconcileResult>;
  clearTransactions: () => void;
}

const STORAGE_KEY_TRANSACTIONS = 'wallet:transactions';

function loadInitialTransactions(): TransactionRecord[] {
  const raw = storage.getString(STORAGE_KEY_TRANSACTIONS);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Failed to parse stored transactions:', err);
    return [];
  }
}

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: loadInitialTransactions(),
  isReconciling: false,
  lastReconciliationResult: null,

  addPendingTransaction: (tx: TransactionRecord) => {
    set((state) => {
      // Prepend to top of ledger
      const updated = [tx, ...state.transactions.filter((t) => t.id !== tx.id)];
      // Synchronously persist before network API is dispatched
      storage.setString(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));
      return { transactions: updated };
    });
  },

  updateTransactionStatus: (id, status, options) => {
    set((state) => {
      const updated = state.transactions.map((tx) => {
        if (tx.id === id) {
          return {
            ...tx,
            status,
            updatedAt: Date.now(),
            failureReason: options?.failureReason ?? tx.failureReason,
            serverReceiptId: options?.serverReceiptId ?? tx.serverReceiptId,
          };
        }
        return tx;
      });
      storage.setString(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));
      return { transactions: updated };
    });
  },

  markInterrupted: (id: string, reason?: string) => {
    set((state) => {
      const updated = state.transactions.map((tx) => {
        if (tx.id === id) {
          return {
            ...tx,
            status: 'INTERRUPTED' as TransactionStatus,
            updatedAt: Date.now(),
            failureReason: reason || 'Transaction interrupted during processing',
          };
        }
        return tx;
      });
      storage.setString(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updated));
      return { transactions: updated };
    });
  },

  reconcilePendingTransactions: async () => {
    const { transactions } = get();
    // Filter any transactions that were left in flight
    const pendingList = transactions.filter(
      (tx) => tx.status === 'PENDING' || tx.status === 'INTERRUPTED'
    );

    if (pendingList.length === 0) {
      const noOpResult: ReconcileResult = {
        reconciledCount: 0,
        creditedCoins: 0,
        recoveredTransactionIds: [],
        details: ['Ledger clean: No pending or interrupted transactions found.'],
      };
      set({ lastReconciliationResult: noOpResult });
      return noOpResult;
    }

    set({ isReconciling: true });

    try {
      // Call mock backend reconciliation engine
      const reconcileResult = await mockBackend.reconcileTransactions(pendingList);

      // Atomically settle recovered transactions in MMKV
      const recoveredSet = new Set(reconcileResult.recoveredTransactionIds);
      const updatedLedger = get().transactions.map((tx) => {
        if (recoveredSet.has(tx.id)) {
          return {
            ...tx,
            status: 'SETTLED' as TransactionStatus,
            reconciledAt: Date.now(),
            updatedAt: Date.now(),
          };
        }
        return tx;
      });

      // Synchronously persist reconciled ledger
      storage.setString(STORAGE_KEY_TRANSACTIONS, JSON.stringify(updatedLedger));

      // Atomically credit coins to wallet
      if (reconcileResult.creditedCoins > 0) {
        useWalletStore.getState().creditCoins(reconcileResult.creditedCoins);
      }

      set({
        transactions: updatedLedger,
        isReconciling: false,
        lastReconciliationResult: reconcileResult,
      });

      return reconcileResult;
    } catch (err) {
      set({ isReconciling: false });
      throw err;
    }
  },

  clearTransactions: () => {
    storage.delete(STORAGE_KEY_TRANSACTIONS);
    set({ transactions: [], lastReconciliationResult: null });
  },
}));
