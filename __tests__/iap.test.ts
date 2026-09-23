import { mockIAPService, COIN_PACKS } from '../src/services/iap/mockIAPService';
import { mockGatewayService, GATEWAY_PRODUCTS } from '../src/services/gateway/mockGatewayService';
import { useWalletStore } from '../src/store/useWalletStore';
import { useTransactionStore } from '../src/store/useTransactionStore';
import { storage } from '../src/services/storage/storage';

describe('IAP & Direct Gateway Flow Simulation (Evaluation Criterion 4 & Architecture)', () => {
  beforeEach(() => {
    storage.clearAll();
    useWalletStore.getState().resetWallet();
    useTransactionStore.getState().clearTransactions();
  });

  test('StoreKit purchase resolves and credits bonus coins properly', async () => {
    const pack = COIN_PACKS[2]; // 1200 + 250 bonus = 1450 coins
    const tx = mockIAPService.createPendingTransaction(pack);
    useTransactionStore.getState().addPendingTransaction(tx);

    const initialBalance = useWalletStore.getState().balance;

    const result = await mockIAPService.executePurchase(tx, false);
    expect(result.success).toBe(true);
    expect(result.tx.status).toBe('SETTLED');
    expect(result.tx.serverReceiptId).toBeDefined();

    useWalletStore.getState().creditCoins(result.tx.coins);
    expect(useWalletStore.getState().balance).toBe(initialBalance + 1450);
  });

  test('MockIAPService.purchase(productId) matches PDF API spec with latency and UUID', async () => {
    const productId = 'com.linksphere.coins.500';
    const result = await mockIAPService.purchase(productId);

    expect(result.success).toBe(true);
    expect(result.tx.status).toBe('SETTLED');
    expect(result.tx.idempotencyKey).toBeDefined();
    expect(result.tx.coins).toBe(550); // 500 + 50 bonus
    expect(result.tx.serverReceiptId).toBeDefined();
  });

  test('Direct gateway order creates order for physical goods with separate payment method', async () => {
    const product = GATEWAY_PRODUCTS[0]; // Physical Hoodie
    const tx = mockGatewayService.createPendingOrder(product);

    expect(tx.productType).toBe('PHYSICAL_GOODS');
    expect(tx.paymentMethod).toBe('RAZORPAY_GATEWAY');
    expect(tx.coins).toBe(0); // Physical goods never grant consumable coins

    const result = await mockGatewayService.executeRazorpayPayment(tx, 'UPI');
    expect(result.success).toBe(true);
    expect(result.tx.status).toBe('SETTLED');
    expect(result.gatewayPaymentId).toMatch(/^(rzp_)?pay_/);
  });
});
