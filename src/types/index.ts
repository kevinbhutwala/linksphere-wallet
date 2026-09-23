export type TransactionStatus = 
  | 'PENDING'
  | 'PROCESSING'
  | 'SETTLED'
  | 'INTERRUPTED'
  | 'FAILED'
  | 'ROLLED_BACK';

export type PaymentMethodType = 'IAP_STOREKIT' | 'IAP_PLAY_BILLING' | 'RAZORPAY_GATEWAY';

export interface CoinPack {
  id: string;
  productId: string;
  coins: number;
  bonusCoins?: number;
  priceFormatted: string;
  priceAmount: number;
  currency: string;
  title: string;
  badge?: string;
  icon: string;
}

export interface GatewayProduct {
  id: string;
  sku: string;
  title: string;
  description: string;
  priceFormatted: string;
  priceAmount: number;
  currency: string;
  category: 'PHYSICAL_GOODS' | 'EXTERNAL_SUBSCRIPTION';
  imageUri: string;
  badge: string;
}

export interface TransactionRecord {
  id: string;
  idempotencyKey: string;
  productId: string;
  productType: 'COIN_PACK' | 'PHYSICAL_GOODS' | 'GIFT_SPEND';
  coins: number;
  amount: number;
  currency: string;
  status: TransactionStatus;
  paymentMethod: PaymentMethodType;
  createdAt: number;
  updatedAt: number;
  failureReason?: string;
  serverReceiptId?: string;
  reconciledAt?: number;
}

export interface ReconcileResult {
  reconciledCount: number;
  creditedCoins: number;
  recoveredTransactionIds: string[];
  details: string[];
}

export interface GiftSendResult {
  success: boolean;
  message: string;
  previousBalance: number;
  newBalance: number;
  rolledBack?: boolean;
}
