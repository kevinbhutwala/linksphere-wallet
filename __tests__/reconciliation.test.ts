import { useTransactionStore } from '../src/store/useTransactionStore';
import { useWalletStore } from '../src/store/useWalletStore';
import { mockIAPService, COIN_PACKS } from '../src/services/iap/mockIAPService';
import { storage } from '../src/services/storage/storage';
import { mockBackend } from '../src/services/backend/mockBackend';

describe('Interrupted Transaction & Idempotent Reconciliation (Evaluation Criterion 2)', () => {
  beforeEach(() => {
    storage.clearAll();
    useWalletStore.getState().resetWallet();
    useTransactionStore.getState().clearTransactions();
    mockBackend.resetAll();
  });

  test('Generates client-side UUID idempotency key and persists PENDING state prior to API request', () => {
    const pack = COIN_PACKS[0]; // 100 coins
    const tx = mockIAPService.createPendingTransaction(pack);

    expect(tx.idempotencyKey).toBeDefined();
    expect(tx.idempotencyKey.length).toBeGreaterThan(10);
    expect(tx.status).toBe('PENDING');

    useTransactionStore.getState().addPendingTransaction(tx);

    const stored = JSON.parse(storage.getString('wallet:transactions') || '[]');
    expect(stored.length).toBe(1);
    expect(stored[0].idempotencyKey).toBe(tx.idempotencyKey);
    expect(stored[0].status).toBe('PENDING');
  });

  test('Simulated network drop marks transaction as INTERRUPTED', () => {
    const pack = COIN_PACKS[1]; // 500 coins (+50 bonus = 550)
    const tx = mockIAPService.createPendingTransaction(pack);
    useTransactionStore.getState().addPendingTransaction(tx);

    useTransactionStore.getState().markInterrupted(tx.id, 'Simulated drop');

    const transactions = useTransactionStore.getState().transactions;
    const current = transactions.find((t) => t.id === tx.id);
    expect(current?.status).toBe('INTERRUPTED');
  });

  test('Reconciliation on boot resolves interrupted transaction and credits coins without double-crediting', async () => {
    const initialBalance = useWalletStore.getState().balance; // 1000

    // Simulate an interrupted transaction in MMKV
    const pack = COIN_PACKS[1]; // 500 + 50 bonus = 550 coins
    const tx = mockIAPService.createPendingTransaction(pack);
    useTransactionStore.getState().addPendingTransaction(tx);
    useTransactionStore.getState().markInterrupted(tx.id, 'App killed');

    // Run reconciliation hook
    const result = await useTransactionStore.getState().reconcilePendingTransactions();

    expect(result.reconciledCount).toBe(1);
    expect(result.creditedCoins).toBe(550);

    // Verify wallet balance incremented
    expect(useWalletStore.getState().balance).toBe(initialBalance + 550);

    // Verify transaction status changed to SETTLED
    const updatedTx = useTransactionStore.getState().transactions.find((t) => t.id === tx.id);
    expect(updatedTx?.status).toBe('SETTLED');

    // SECOND RECONCILIATION: Verify ZERO duplicate crediting
    const secondResult = await useTransactionStore.getState().reconcilePendingTransactions();
    expect(secondResult.reconciledCount).toBe(0);
    expect(secondResult.creditedCoins).toBe(0);
    expect(useWalletStore.getState().balance).toBe(initialBalance + 550); // Balance remains identical!
  });
});
