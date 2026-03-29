/**
 * Payment Transaction Logger
 * Logs all payment-related events for audit trail and debugging
 */

import { logger } from './logger';

interface PaymentTransactionLog {
  orderId: string;
  transactionId: string;
  customerId: string;
  amount: number;
  event: string;
  status: string;
  timestamp: string;
  details?: unknown;
}

class PaymentTransactionLogger {
  /**
   * Log SSLCommerz session initialization
   */
  public logSessionInit(data: {
    orderId: string;
    transactionId: string;
    customerId: string;
    amount: number;
    email: string;
    phone?: string;
  }): void {
    const logEntry = {
      orderId: data.orderId,
      transactionId: data.transactionId,
      customerId: data.customerId,
      amount: data.amount,
      event: 'SESSION_INIT',
      status: 'INITIATED',
      timestamp: new Date().toISOString(),
      details: {
        customer_email: data.email,
        customer_phone: data.phone,
      },
    };

    logger.info('SSLCommerz payment session initialized', logEntry);
  }

  /**
   * Log payment success
   */
  public logPaymentSuccess(data: {
    orderId: string;
    transactionId: string;
    customerId: string;
    amount: number;
    valId: string;
    bankTranId?: string;
    cardType?: string;
  }): void {
    const logEntry = {
      orderId: data.orderId,
      transactionId: data.transactionId,
      customerId: data.customerId,
      amount: data.amount,
      event: 'PAYMENT_SUCCESS',
      status: 'PAID',
      timestamp: new Date().toISOString(),
      details: {
        validation_id: data.valId,
        bank_transaction_id: data.bankTranId,
        card_type: data.cardType,
      },
    };

    logger.info('Payment completed successfully', logEntry);
  }

  /**
   * Log payment failure
   */
  public logPaymentFailure(data: {
    orderId: string;
    transactionId: string;
    customerId: string;
    amount: number;
    reason?: string;
    validationStatus?: string;
  }): void {
    const logEntry = {
      orderId: data.orderId,
      transactionId: data.transactionId,
      customerId: data.customerId,
      amount: data.amount,
      event: 'PAYMENT_FAILED',
      status: 'FAILED',
      timestamp: new Date().toISOString(),
      details: {
        reason: data.reason,
        validation_status: data.validationStatus,
      },
    };

    logger.warn('Payment failed', logEntry);
  }

  /**
   * Log payment cancellation
   */
  public logPaymentCancellation(data: {
    orderId: string;
    transactionId: string;
    customerId: string;
    amount: number;
  }): void {
    const logEntry = {
      orderId: data.orderId,
      transactionId: data.transactionId,
      customerId: data.customerId,
      amount: data.amount,
      event: 'PAYMENT_CANCELLED',
      status: 'CANCELLED',
      timestamp: new Date().toISOString(),
    };

    logger.info('Payment cancelled by user', logEntry);
  }

  /**
   * Log IPN callback received
   */
  public logIPNCallback(data: {
    transactionId: string;
    status: string;
    amount?: number;
    valId?: string;
  }): void {
    const logEntry = {
      transactionId: data.transactionId,
      event: 'IPN_CALLBACK_RECEIVED',
      status: data.status,
      timestamp: new Date().toISOString(),
      details: {
        amount: data.amount,
        validation_id: data.valId,
      },
    };

    logger.debug('IPN callback received from SSLCommerz', logEntry);
  }

  /**
   * Log validation error
   */
  public logValidationError(data: {
    orderId: string;
    transactionId: string;
    error: string;
    callbackData?: unknown;
  }): void {
    const logEntry = {
      orderId: data.orderId,
      transactionId: data.transactionId,
      event: 'VALIDATION_ERROR',
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      details: {
        error: data.error,
        callback_data: data.callbackData,
      },
    };

    logger.error('Payment validation error', logEntry);
  }

  /**
   * Log API call error
   */
  public logApiError(data: {
    orderId?: string;
    transactionId?: string;
    apiCall: string;
    error: string;
    statusCode?: number;
  }): void {
    const logEntry = {
      orderId: data.orderId,
      transactionId: data.transactionId,
      event: 'API_ERROR',
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      details: {
        api_call: data.apiCall,
        error: data.error,
        status_code: data.statusCode,
      },
    };

    logger.error('SSLCommerz API error', logEntry);
  }

  /**
   * Log stock restoration
   */
  public logStockRestoration(data: {
    orderId: string;
    transactionId: string;
    reason: 'PAYMENT_FAILED' | 'PAYMENT_CANCELLED';
    itemsCount: number;
  }): void {
    const logEntry = {
      orderId: data.orderId,
      transactionId: data.transactionId,
      event: 'STOCK_RESTORED',
      status: 'RESTORED',
      timestamp: new Date().toISOString(),
      details: {
        reason: data.reason,
        items_restored: data.itemsCount,
      },
    };

    logger.info('Medicine stock restored', logEntry);
  }
}

export const paymentLogger = new PaymentTransactionLogger();
