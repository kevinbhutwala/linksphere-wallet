import { CoinPack, TransactionRecord } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { mockBackend } from '../backend/mockBackend';

export const COIN_PACKS: CoinPack[] = [
  {
    id: 'pack_100',
    productId: 'com.linksphere.coins.100',
    coins: 100,
    priceFormatted: '$0.99',
    priceAmount: 0.99,
    currency: 'USD',
    title: 'Starter Pouch',
    icon: 'coins',
  },
  {
    id: 'pack_500',
    productId: 'com.linksphere.coins.500',
    coins: 500,
    bonusCoins: 50,
    priceFormatted: '$4.99',
    priceAmount: 4.99,
    currency: 'USD',
    title: 'Pro Stash',
    badge: 'MOST POPULAR',
    icon: 'sparkles',
  },
  {
    id: 'pack_1200',
    productId: 'com.linksphere.coins.1200',
    coins: 1200,
    bonusCoins: 250,
    priceFormatted: '$9.99',
    priceAmount: 9.99,
    currency: 'USD',
    title: 'Treasury Vault',
    badge: 'BEST VALUE',
    icon: 'crown',
  },
];

export interface PurchaseCallbacks {
  onPendingCreated?: (tx: TransactionRecord) => void;
  onBiometricPrompt?: () => void;
  onInterrupted?: (tx: TransactionRecord) => void;
}

export class MockIAPService {
  private static instance: MockIAPService;

  public static getInstance(): MockIAPService {
    if (!MockIAPService.instance) {
      MockIAPService.instance = new MockIAPService();
    }
    return MockIAPService.instance;
  }

  /**
   * Fetches consumable catalog with simulated async latency
   */
  public async getProducts(): Promise<CoinPack[]> {
    // 400ms network delay to showcase zero CLS skeleton cards
    await new Promise((res) => setTimeout(res, 400));
    return COIN_PACKS;
  }

  public getProductById(productId: string): CoinPack | undefined {
    return COIN_PACKS.find((p) => p.productId === productId || p.id === productId);
  }

  /**
   * Generates a new pending transaction with client-side UUID idempotency key
   * strictly before any network interaction.
   */
  public createPendingTransaction(pack: CoinPack): TransactionRecord {
    const id = `tx_iap_${generateUUID().substring(0, 8)}`;
    const idempotencyKey = generateUUID();
    const now = Date.now();

    return {
      id,
      idempotencyKey,
      productId: pack.productId,
      productType: 'COIN_PACK',
      coins: pack.coins + (pack.bonusCoins || 0),
      amount: pack.priceAmount,
      currency: pack.currency,
      status: 'PENDING',
      paymentMethod: 'IAP_STOREKIT',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Executes the StoreKit / Google Play Billing sheet lifecycle
   * Simulated latency: 800ms - 1500ms
   */
  public async executePurchase(
    tx: TransactionRecord,
    shouldSimulateDrop: boolean = false
  ): Promise<{ success: boolean; tx: TransactionRecord }> {
    // Step 1: Simulate native StoreKit biometric prompt & payment sheet presentation
    const latency = 800 + Math.floor(Math.random() * 700); // 800ms - 1500ms
    await new Promise((res) => setTimeout(res, latency));

    // Step 2: Check if network drop / app termination was triggered during processing
    if (shouldSimulateDrop || mockBackend.simulateNetworkDrop) {
      const interruptedTx: TransactionRecord = {
        ...tx,
        status: 'INTERRUPTED',
        updatedAt: Date.now(),
        failureReason: 'Transaction interrupted by network drop / client crash during StoreKit verification',
      };
      throw {
        code: 'ERR_TRANSACTION_INTERRUPTED',
        message: 'Network dropped during StoreKit checkout sheet processing.',
        interruptedTx,
      };
    }

    // Step 3: Settle transaction with authoritative mock backend
    const settlement = await mockBackend.settleIAP({
      idempotencyKey: tx.idempotencyKey,
      productId: tx.productId,
      coins: tx.coins,
      amount: tx.amount,
    });

    const settledTx: TransactionRecord = {
      ...tx,
      status: 'SETTLED',
      serverReceiptId: settlement.receiptId,
      updatedAt: Date.now(),
    };

    return {
      success: true,
      tx: settledTx,
    };
  }
}

export const mockIAPService = MockIAPService.getInstance();
