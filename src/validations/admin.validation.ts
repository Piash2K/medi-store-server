import { z } from 'zod';

// Admin payment query filters
export const AdminPaymentFiltersSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  status: z.enum(['PENDING', 'PAID', 'FAILED', 'CANCELLED', 'COD']).optional(),
  paymentMethod: z.enum(['COD', 'SSLCOMMERZ']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  customerId: z.string().uuid().optional(),
  transactionId: z.string().optional(),
  sortBy: z.enum(['createdAt', 'amount', 'status']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type AdminPaymentFilters = z.infer<typeof AdminPaymentFiltersSchema>;

// Admin refund query filters
export const AdminRefundFiltersSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(20),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  customerId: z.string().uuid().optional(),
  minAmount: z.number().positive().optional(),
  maxAmount: z.number().positive().optional(),
  reason: z.string().optional(),
  sortBy: z.enum(['createdAt', 'amount']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type AdminRefundFilters = z.infer<typeof AdminRefundFiltersSchema>;

// Helper functions
export const parseAdminPaymentFilters = (data: unknown) => {
  return AdminPaymentFiltersSchema.safeParse(data);
};

export const parseAdminRefundFilters = (data: unknown) => {
  return AdminRefundFiltersSchema.safeParse(data);
};
