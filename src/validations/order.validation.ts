import { z } from 'zod';

// Order creation payload validation
export const OrderItemSchema = z.object({
  medicineId: z.string().uuid('Invalid medicine ID format'),
  quantity: z.number().int('Quantity must be an integer').positive('Quantity must be greater than 0'),
});

export const CreateOrderPayloadSchema = z.object({
  shippingAddress: z.string().min(5, 'Shipping address must be at least 5 characters').trim(),
  shippingCost: z.coerce.number().min(0, 'Shipping cost cannot be negative').optional().default(0),
  items: z.array(OrderItemSchema).min(1, 'Order must contain at least one item'),
  paymentMethod: z.enum(['COD', 'SSLCOMMERZ']).optional().default('COD'),
});

export type CreateOrderPayload = z.infer<typeof CreateOrderPayloadSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;

// Refund payload validation
export const RefundPayloadSchema = z.object({
  orderId: z.string().uuid('Invalid order ID format'),
  reason: z.string().min(5, 'Refund reason must be at least 5 characters'),
  refundAmount: z.number().positive('Refund amount must be greater than 0').optional(),
  notes: z.string().optional(),
});

export type RefundPayload = z.infer<typeof RefundPayloadSchema>;

// SSLCommerz callback payloads validation
export const SslSuccessCallbackSchema = z.object({
  tran_id: z.string().min(1, 'Transaction ID is required'),
  val_id: z.string().min(1, 'Validation ID is required for success callback'),
  status: z.string().optional(),
  amount: z.string().optional(),
  currency: z.string().optional(),
  card_type: z.string().optional(),
  store_amount: z.string().optional(),
  bank_tran_id: z.string().optional(),
  bank_status: z.string().optional(),
  card_issuer: z.string().optional(),
  card_brand: z.string().optional(),
  card_sub_brand: z.string().optional(),
  card_issuer_country: z.string().optional(),
  card_issuer_country_code: z.string().optional(),
}).passthrough(); // Allow any other fields SSLCommerz might send

export const SslFailCallbackSchema = z.object({
  tran_id: z.string().min(1, 'Transaction ID is required'),
  status: z.string().optional(),
  reason: z.string().optional(),
}).passthrough();

export const SslCancelCallbackSchema = z.object({
  tran_id: z.string().min(1, 'Transaction ID is required'),
  status: z.string().optional(),
}).passthrough();

export const SslIpnCallbackSchema = z.object({
  tran_id: z.string().min(1, 'Transaction ID is required'),
  status: z.string().min(1, 'Status is required'),
  val_id: z.string().optional(),
  amount: z.string().optional(),
}).passthrough();

export type SslSuccessCallback = z.infer<typeof SslSuccessCallbackSchema>;
export type SslFailCallback = z.infer<typeof SslFailCallbackSchema>;
export type SslCancelCallback = z.infer<typeof SslCancelCallbackSchema>;
export type SslIpnCallback = z.infer<typeof SslIpnCallbackSchema>;

// SSLCommerz session initialization response validation
export const SslSessionInitResponseSchema = z.object({
  status: z.string().optional(),
  failedreason: z.string().optional(),
  GatewayPageURL: z.string().url('Invalid gateway URL format').optional(),
}).strict().passthrough(); // SSLCommerz might return additional fields

export type SslSessionInitResponse = z.infer<typeof SslSessionInitResponseSchema>;

// Helper function to safely parse and validate callback payloads
export const parseOrderPayload = (data: unknown) => {
  return CreateOrderPayloadSchema.safeParse(data);
};

export const parseRefundPayload = (data: unknown) => {
  return RefundPayloadSchema.safeParse(data);
};

export const parseSslSuccessCallback = (data: unknown) => {
  return SslSuccessCallbackSchema.safeParse(data);
};

export const parseSslFailCallback = (data: unknown) => {
  return SslFailCallbackSchema.safeParse(data);
};

export const parseSslCancelCallback = (data: unknown) => {
  return SslCancelCallbackSchema.safeParse(data);
};

export const parseSslIpnCallback = (data: unknown) => {
  return SslIpnCallbackSchema.safeParse(data);
};

export const parseSslSessionInitResponse = (data: unknown) => {
  return SslSessionInitResponseSchema.safeParse(data);
};
