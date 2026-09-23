import { GatewayProduct, TransactionRecord } from '../../types';
import { generateUUID } from '../../utils/uuid';
import { mockBackend } from '../backend/mockBackend';

export const GATEWAY_PRODUCTS: GatewayProduct[] = [
  {
    id: 'merch_hoodie',
    sku: 'SKU_PHYS_HOODIE_01',
    title: 'Developer Edition Heavyweight Hoodie',
    description: '100% organic cotton embroidered physical merchandise shipped to your door.',
    priceFormatted: '$49.99',
    priceAmount: 49.99,
    currency: 'USD',
    category: 'PHYSICAL_GOODS',
    imageUri: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?auto=format&fit=crop&w=600&q=80',
    badge: 'PHYSICAL MERCHANDISE',
  },
  {
    id: 'merch_tumbler',
    sku: 'SKU_PHYS_TUMBLER_02',
    title: 'Stainless Steel Insulated Smart Tumbler',
    description: 'Double-walled vacuum insulated flask with LinkSphere thermal monitor.',
    priceFormatted: '$24.99',
    priceAmount: 24.99,
    currency: 'USD',
    category: 'PHYSICAL_GOODS',
    imageUri: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=600&q=80',
    badge: 'PHYSICAL MERCHANDISE',
  },
  {
    id: 'pass_external_conf',
    sku: 'SKU_EXT_CONF_PASS_2026',
    title: 'Global Tech Summit 2026 In-Person Ticket',
    description: 'External physical venue conference badge and all-access networking pass.',
    priceFormatted: '$99.99',
    priceAmount: 99.99,
    currency: 'USD',
    category: 'EXTERNAL_SUBSCRIPTION',
    imageUri: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?auto=format&fit=crop&w=600&q=80',
    badge: 'EXTERNAL EVENT PASS',
  },
];

export class MockGatewayService {
  private static instance: MockGatewayService;

  public static getInstance(): MockGatewayService {
    if (!MockGatewayService.instance) {
      MockGatewayService.instance = new MockGatewayService();
    }
    return MockGatewayService.instance;
  }

  public async getProducts(): Promise<GatewayProduct[]> {
    await new Promise((res) => setTimeout(res, 400));
    return GATEWAY_PRODUCTS;
  }

  /**
   * Creates a transaction record for direct gateway payment
   */
  public createPendingOrder(product: GatewayProduct): TransactionRecord {
    const id = `tx_rzp_${generateUUID().substring(0, 8)}`;
    const idempotencyKey = generateUUID();
    const now = Date.now();

    return {
      id,
      idempotencyKey,
      productId: product.sku,
      productType: 'PHYSICAL_GOODS',
      coins: 0,
      amount: product.priceAmount,
      currency: product.currency,
      status: 'PENDING',
      paymentMethod: 'RAZORPAY_GATEWAY',
      createdAt: now,
      updatedAt: now,
    };
  }

  /**
   * Simulates Razorpay Checkout sheet / Webhook payment flow
   */
  public async executeRazorpayPayment(
    tx: TransactionRecord,
    paymentMethod: 'UPI' | 'CARD' | 'NETBANKING'
  ): Promise<{ success: boolean; tx: TransactionRecord; gatewayPaymentId: string }> {
    // Razorpay standard processing latency (1000ms - 1400ms)
    await new Promise((res) => setTimeout(res, 1200));

    const result = await mockBackend.settleDirectGateway({
      orderId: tx.id,
      sku: tx.productId,
      amount: tx.amount,
      paymentId: `pay_${generateUUID().substring(0, 10)}`,
    });

    const settledTx: TransactionRecord = {
      ...tx,
      status: 'SETTLED',
      serverReceiptId: result.gatewayRef,
      updatedAt: Date.now(),
    };

    return {
      success: true,
      tx: settledTx,
      gatewayPaymentId: result.gatewayRef,
    };
  }
}

export const mockGatewayService = MockGatewayService.getInstance();
