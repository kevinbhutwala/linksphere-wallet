import { useWalletStore } from '../src/store/useWalletStore';
import { useDevSettingsStore } from '../src/store/useDevSettingsStore';
import { storage } from '../src/services/storage/storage';
import { mockBackend } from '../src/services/backend/mockBackend';

describe('Wallet State & Optimistic Rollback (Evaluation Criterion 1)', () => {
  beforeEach(() => {
    storage.clearAll();
    useWalletStore.getState().resetWallet();
    useDevSettingsStore.getState().resetAllSettings();
  });

  test('Happy path: deductions persist synchronously to storage', async () => {
    const store = useWalletStore.getState();
    expect(store.balance).toBe(1000);
    expect(storage.getNumber('wallet:balance')).toBe(1000);

    const result = await store.sendGiftOptimistic('gift_1', 50);

    expect(result.success).toBe(true);
    expect(useWalletStore.getState().balance).toBe(950);
    expect(storage.getNumber('wallet:balance')).toBe(950);
    expect(useWalletStore.getState().rollbackCount).toBe(0);
  });

  test('Failure path: 500 error triggers atomic rollback and preserves prior balance', async () => {
    useDevSettingsStore.getState().toggle500Error(); // Activate simulated 500 error
    expect(useDevSettingsStore.getState().simulate500Error).toBe(true);

    const walletStore = useWalletStore.getState();
    const balanceBefore = walletStore.balance; // 1000

    // Expect promise rejection due to simulated 500 error
    await expect(walletStore.sendGiftOptimistic('gift_fail', 50)).rejects.toThrow();

    // Verify balance was rolled back smoothly to prior balance
    expect(useWalletStore.getState().balance).toBe(balanceBefore);
    expect(storage.getNumber('wallet:balance')).toBe(balanceBefore);
    expect(useWalletStore.getState().rollbackCount).toBe(1);
    expect(useWalletStore.getState().isDeducting).toBe(false);
  });

  test('Throws immediately if balance is insufficient', async () => {
    useWalletStore.getState().setBalance(30);

    await expect(useWalletStore.getState().sendGiftOptimistic('gift_large', 50)).rejects.toThrow(
      /Insufficient coins/
    );

    expect(useWalletStore.getState().balance).toBe(30);
  });
});
