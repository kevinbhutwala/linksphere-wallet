import { TransactionRecord, ReconcileResult } from '../../types';

interface ServerReceipt {
  receiptId: string;
  idempotencyKey: string;
  productId: string;
  coins: number;
  status: 'SETTLED' | 'FAILED';
  settledAt: number;
}

export class MockBackendServer {
  private static instance: MockBackendServer;
  
  // Authoritative server balance
  private serverBalance: number = 1000;
  
  // Authoritative Idempotency Registry (Key -> Receipt)
  private idempotencyRegistry: Map<string, ServerReceipt> = new Map();

  // Test simulation flags
  public simulate500Error: boolean = false;
  public simulateNetworkDrop: boolean = false;
  public networkLatencyMs: number = 900;

  private constructor() {
    this.seedInitialState();
  }

  public static getInstance(): MockBackendServer {
    if (!MockBackendServer.instance) {
      MockBackendServer.instance = new MockBackendServer();
    }
    return MockBackendServer.instance;
  }

  private seedInitialState() {
    this.serverBalance = 1000;
    this.idempotencyRegistry.clear();
  }

  private async simulateLatency(overrideMs?: number): Promise<void> {
    const delay = overrideMs ?? this.networkLatencyMs;
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  /**
   * Settle an In-App Purchase idempotently
   */
  public async settleIAP(params: {
    idempotencyKey: string;
    productId: string;
    coins: number;
    amount: number;
  }): Promise<{ success: boolean; receiptId: string; coinsCredited: number; serverBalance: number }> {
    await this.simulateLatency();

    if (this.simulateNetworkDrop) {
      throw new Error('ERR_NETWORK_DROP: Socket hang up during settlement');
    }

    // Check Idempotency Registry
    const existing = this.idempotencyRegistry.get(params.idempotencyKey);
    if (existing) {
      // Idempotent duplicate call - return existing settled receipt without double-crediting
      return {
        success: true,
        receiptId: existing.receiptId,
        coinsCredited: 0, // already credited on server
        serverBalance: this.serverBalance,
      };
    }

    // Process new settlement
    const receiptId = `rcpt_${Math.random().toString(36).substring(2, 10).toUpperCase()}`;
    const receipt: ServerReceipt = {
      receiptId,
      idempotencyKey: params.idempotencyKey,
      productId: params.productId,
      coins: params.coins,
      status: 'SETTLED',
      settledAt: Date.now(),
    };

    this.idempotencyRegistry.set(params.idempotencyKey, receipt);
    this.serverBalance += params.coins;

    return {
      success: true,
      receiptId,
      coinsCredited: params.coins,
      serverBalance: this.serverBalance,
    };
  }

  /**
   * Process "Send Animated Gift" (50 coins)
   * Subject to simulated 500 error toggle
   */
  public async sendGift(params: {
    giftCost: number;
    giftId: string;
  }): Promise<{ success: boolean; newServerBalance: number; serverTransactionId: string }> {
    await this.simulateLatency(600);

    if (this.simulate500Error) {
      // Simulate backend microservice failure / database lock timeout
      const error = new Error('HTTP 500: Database lock acquisition timeout in gift_microservice');
      (error as any).status = 500;
      throw error;
    }

    if (this.serverBalance < params.giftCost) {
      const error = new Error('HTTP 402: Insufficient server coin balance');
      (error as any).status = 402;
      throw error;
    }

    this.serverBalance -= params.giftCost;
    return {
      success: true,
      newServerBalance: this.serverBalance,
      serverTransactionId: `tx_gift_${Date.now()}`,
    };
  }

  /**
   * Process Direct Gateway Payment (Razorpay / Stripe)
   * Strictly for physical merchandise and external passes
   */
  public async settleDirectGateway(params: {
    orderId: string;
    sku: string;
    amount: number;
    paymentId: string;
  }): Promise<{ success: boolean; status: string; gatewayRef: string }> {
    await this.simulateLatency(1100);

    return {
      success: true,
      status: 'CAPTURED',
      gatewayRef: `rzp_pay_${Math.random().toString(36).substring(2, 9)}`,
    };
  }

  /**
   * Reconciles interrupted / pending transactions on app restore
   * Prevents double-crediting while recovering missed purchases
   */
  public async reconcileTransactions(
    pendingTransactions: TransactionRecord[]
  ): Promise<ReconcileResult> {
    await this.simulateLatency(500);

    const recoveredIds: string[] = [];
    let creditedCoins = 0;
    const details: string[] = [];

    for (const tx of pendingTransactions) {
      const existing = this.idempotencyRegistry.get(tx.idempotencyKey);

      if (existing) {
        // Backend had already settled it before network dropped!
        recoveredIds.push(tx.id);
        creditedCoins += tx.coins;
        details.push(`Recovered existing settlement for ID: ${tx.id.slice(0, 8)}... (+${tx.coins} coins)`);
      } else {
        // Interrupted before backend received it. Settle now safely using idempotency key.
        const receiptId = `rcpt_recov_${Math.random().toString(36).substring(2, 9).toUpperCase()}`;
        this.idempotencyRegistry.set(tx.idempotencyKey, {
          receiptId,
          idempotencyKey: tx.idempotencyKey,
          productId: tx.productId,
          coins: tx.coins,
          status: 'SETTLED',
          settledAt: Date.now(),
        });
        this.serverBalance += tx.coins;
        recoveredIds.push(tx.id);
        creditedCoins += tx.coins;
        details.push(`Settled in-flight pending purchase ID: ${tx.id.slice(0, 8)}... (+${tx.coins} coins)`);
      }
    }

    return {
      reconciledCount: recoveredIds.length,
      creditedCoins,
      recoveredTransactionIds: recoveredIds,
      details,
    };
  }

  public getServerBalance(): number {
    return this.serverBalance;
  }

  public setServerBalance(balance: number): void {
    this.serverBalance = balance;
  }

  public resetAll(): void {
    this.serverBalance = 1000;
    this.idempotencyRegistry.clear();
    this.simulate500Error = false;
    this.simulateNetworkDrop = false;
  }
}

export const mockBackend = MockBackendServer.getInstance();
