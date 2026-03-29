import { prisma } from "../../lib/prisma";
import config from "../../config";
import type { Prisma } from "../../../generated/prisma/client";
import { OrderStatus } from "../../../generated/prisma/enums";
import type {
  CreateOrderPayload,
  OrderItem,
  SslSuccessCallback,
  SslFailCallback,
  SslCancelCallback,
  SslIpnCallback,
  SslSessionInitResponse,
} from "../../validations/order.validation";

type SslCallbackPayload = SslSuccessCallback | SslFailCallback | SslCancelCallback | SslIpnCallback;

const toInputJson = (value: unknown): Prisma.InputJsonValue => {
  return JSON.parse(JSON.stringify(value)) as Prisma.InputJsonValue;
};

const ensureSslConfig = () => {
  const missing: string[] = [];

  if (!config.sslcommerz.store_id) missing.push("SSLCOMMERZ_STORE_ID");
  if (!config.sslcommerz.store_password) missing.push("SSLCOMMERZ_STORE_PASSWORD");
  if (!config.sslcommerz.session_api_url) missing.push("SSLCOMMERZ_SESSION_API_URL");
  if (!config.sslcommerz.validation_api_url) missing.push("SSLCOMMERZ_VALIDATION_API_URL");
  if (!config.app_base_url) missing.push("APP_BASE_URL");

  if (missing.length > 0) {
    throw new Error(`Missing SSLCommerz configuration: ${missing.join(", ")}`);
  }
};

const normalizePaymentMethod = (method?: string): "COD" | "SSLCOMMERZ" => {
  if (!method) return "COD";
  if (method === "COD" || method === "SSLCOMMERZ") return method;
  throw new Error("Invalid payment method. Supported values: COD, SSLCOMMERZ");
};

const getCustomerForOrder = async (customerId: string) => {
  const customer = await prisma.user.findUnique({
    where: {
      id: customerId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      address: true,
      role: true,
      status: true,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  if (customer.role !== "CUSTOMER") {
    throw new Error("Only customers can place orders");
  }

  if (customer.status === "BAN") {
    throw new Error("Customer account is banned");
  }

  return customer;
};

const prepareOrderItems = async (payload: Pick<CreateOrderPayload, "items">) => {
  if (!payload.items || payload.items.length === 0) {
    throw new Error("Order must contain at least one item");
  }

  const medicineIds = payload.items.map((item) => item.medicineId);
  const medicines = await prisma.medicine.findMany({
    where: {
      id: {
        in: medicineIds,
      },
      isDeleted: false,
    },
    select: {
      id: true,
      name: true,
      price: true,
      stock: true,
    },
  });

  if (medicines.length !== medicineIds.length) {
    throw new Error("Some medicines not found or unavailable");
  }
  const medicineMap = new Map(medicines.map((m) => [m.id, m]));

  let totalAmount = 0;
  const orderItems: Array<{
    medicineId: string;
    quantity: number;
    price: number;
  }> = [];

  for (const item of payload.items) {
    const medicine = medicineMap.get(item.medicineId);
    if (!medicine) {
      throw new Error(`Medicine ${item.medicineId} not found`);
    }

    if (item.quantity <= 0) {
      throw new Error(`Invalid quantity for ${medicine.name}`);
    }

    if (medicine.stock < item.quantity) {
      throw new Error(`Insufficient stock for ${medicine.name}. Available: ${medicine.stock}`);
    }

    const itemTotal = medicine.price * item.quantity;
    totalAmount += itemTotal;

    orderItems.push({
      medicineId: item.medicineId,
      quantity: item.quantity,
      price: medicine.price,
    });
  }

  return { totalAmount, orderItems };
};

const createOrderWithStockDeduction = async (args: {
  customerId: string;
  shippingAddress: string;
  totalAmount: number;
  orderItems: Array<{
    medicineId: string;
    quantity: number;
    price: number;
  }>;
  paymentMethod: "COD" | "SSLCOMMERZ";
  paymentStatus: "COD" | "PENDING";
  transactionId?: string;
}) => {
  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.create({
      data: {
        customerId: args.customerId,
        shippingAddress: args.shippingAddress,
        totalAmount: args.totalAmount,
        status: "PLACED",
        paymentMethod: args.paymentMethod,
        paymentStatus: args.paymentStatus,
        paymentGateway: args.paymentMethod === "SSLCOMMERZ" ? "SSLCOMMERZ" : null,
        transactionId: args.transactionId,
        items: {
          create: args.orderItems,
        },
      },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    for (const item of args.orderItems) {
      await tx.medicine.update({
        where: {
          id: item.medicineId,
        },
        data: {
          stock: {
            decrement: item.quantity,
          },
        },
      });
    }

    return order;
  });

  return result;
};

const createOrderIntoDB = async (payload: CreateOrderPayload & { customerId: string }) => {
  const paymentMethod = normalizePaymentMethod(payload.paymentMethod);

  await getCustomerForOrder(payload.customerId);

  if (!payload.shippingAddress || !payload.shippingAddress.trim()) {
    throw new Error("Shipping address is required");
  }

  const { totalAmount, orderItems } = await prepareOrderItems(payload);

  if (paymentMethod === "SSLCOMMERZ") {
    throw new Error("Use /api/orders/sslcommerz/init for SSLCOMMERZ payments");
  }

  return createOrderWithStockDeduction({
    customerId: payload.customerId,
    shippingAddress: payload.shippingAddress,
    totalAmount,
    orderItems,
    paymentMethod: "COD",
    paymentStatus: "COD",
  });
};

const createSslCommerzSessionIntoDB = async (payload: CreateOrderPayload & { customerId: string; paymentMethod: string }) => {
  ensureSslConfig();

  const customer = await getCustomerForOrder(payload.customerId);

  if (!payload.shippingAddress || !payload.shippingAddress.trim()) {
    throw new Error("Shipping address is required");
  }

  const { totalAmount, orderItems } = await prepareOrderItems(payload);
  const transactionId = `ssl_${Date.now()}_${Math.floor(Math.random() * 100000)}`;

  const order = await createOrderWithStockDeduction({
    customerId: payload.customerId,
    shippingAddress: payload.shippingAddress,
    totalAmount,
    orderItems,
    paymentMethod: "SSLCOMMERZ",
    paymentStatus: "PENDING",
    transactionId,
  });

  try {
    const sessionPayload = new URLSearchParams({
      store_id: config.sslcommerz.store_id as string,
      store_passwd: config.sslcommerz.store_password as string,
      total_amount: totalAmount.toFixed(2),
      currency: "BDT",
      tran_id: transactionId,
      success_url: `${config.app_base_url}/api/orders/sslcommerz/success`,
      fail_url: `${config.app_base_url}/api/orders/sslcommerz/fail`,
      cancel_url: `${config.app_base_url}/api/orders/sslcommerz/cancel`,
      ipn_url: `${config.app_base_url}/api/orders/sslcommerz/ipn`,
      shipping_method: "Courier",
      product_name: `Medicine Order ${order.id}`,
      product_category: "Medicine",
      product_profile: "general",
      cus_name: customer.name,
      cus_email: customer.email,
      cus_add1: payload.shippingAddress,
      cus_city: "Dhaka",
      cus_state: "Dhaka",
      cus_postcode: "1207",
      cus_country: "Bangladesh",
      cus_phone: customer.phone || "01700000000",
      ship_name: customer.name,
      ship_add1: payload.shippingAddress,
      ship_city: "Dhaka",
      ship_state: "Dhaka",
      ship_postcode: "1207",
      ship_country: "Bangladesh",
      value_a: order.id,
      value_b: payload.customerId,
    });

    const response = await fetch(config.sslcommerz.session_api_url as string, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: sessionPayload.toString(),
    });

    const data = (await response.json()) as SslSessionInitResponse;

    if (!response.ok) {
      throw new Error(`SSLCommerz session API failed: ${response.status}`);
    }

    if (data.status !== "SUCCESS" || !data.GatewayPageURL) {
      throw new Error(data.failedreason || "Unable to initialize SSLCommerz session");
    }

    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentGatewayData: toInputJson({
          initResponse: data,
        }),
      },
    });

    return {
      orderId: order.id,
      transactionId,
      gatewayPageURL: data.GatewayPageURL,
      sslcommerz: data,
    };
  } catch (error) {
    await markPaymentFailedAndRestoreStock(transactionId, "FAILED", {
      error: (error as Error).message,
      source: "session-init",
    });
    throw error;
  }
};

const markPaymentFailedAndRestoreStock = async (
  transactionId: string,
  paymentStatus: "FAILED" | "CANCELLED",
  callbackPayload?: Record<string, unknown>
) => {
  const order = await prisma.order.findFirst({
    where: { transactionId },
    include: {
      items: true,
    },
  });

  if (!order) {
    throw new Error("Order not found for this transaction");
  }

  if (order.paymentStatus === "PAID") {
    return order;
  }

  if (order.paymentStatus === paymentStatus) {
    return order;
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.order.update({
      where: { id: order.id },
      data: {
        paymentStatus,
        status: "CANCELLED",
        paymentGatewayData: toInputJson({
          callbackPayload: callbackPayload || null,
          previousStatus: order.paymentStatus,
        }),
      },
    });

    for (const item of order.items) {
      await tx.medicine.update({
        where: {
          id: item.medicineId,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    return updated;
  });
};

const buildClientRedirectUrl = (isSuccess: boolean, transactionId: string, orderId?: string) => {
  const baseUrl = isSuccess ? config.client_success_url : config.client_failed_url;
  if (!baseUrl) return null;

  const redirectUrl = new URL(baseUrl);
  redirectUrl.searchParams.set("tran_id", transactionId);
  if (orderId) {
    redirectUrl.searchParams.set("order_id", orderId);
  }
  return redirectUrl.toString();
};

const handleSslCommerzSuccess = async (callbackPayload: SslSuccessCallback) => {
  ensureSslConfig();

  const transactionId = callbackPayload.tran_id;
  const valId = callbackPayload.val_id;

  if (!transactionId) {
    throw new Error("tran_id is required in SSLCommerz success callback");
  }

  const order = await prisma.order.findFirst({
    where: { transactionId },
  });

  if (!order) {
    throw new Error("Order not found for transaction");
  }

  if (order.paymentStatus === "PAID") {
    return {
      order,
      redirectUrl: buildClientRedirectUrl(true, transactionId, order.id),
      alreadyPaid: true,
    };
  }

  if (!valId) {
    throw new Error("val_id is required to validate SSLCommerz transaction");
  }

  const validatorParams = new URLSearchParams({
    val_id: valId as string,
    store_id: config.sslcommerz.store_id as string,
    store_passwd: config.sslcommerz.store_password as string,
    format: "json",
  });

  const validateResponse = await fetch(
    `${config.sslcommerz.validation_api_url}?${validatorParams.toString()}`,
    { method: "GET" }
  );
  const validation = (await validateResponse.json()) as Record<string, unknown>;

  const validatedStatus = String(validation.status || "");
  const validatedTranId = String(validation.tran_id || "");
  const validatedAmount = Number(validation.amount || 0);

  const isValidStatus = validatedStatus === "VALID" || validatedStatus === "VALIDATED";
  const amountMatches = Math.abs(validatedAmount - order.totalAmount) < 0.01;
  const tranMatches = validatedTranId === transactionId;

  if (!validateResponse.ok || !isValidStatus || !amountMatches || !tranMatches) {
    await markPaymentFailedAndRestoreStock(transactionId, "FAILED", {
      callbackPayload,
      validation,
    });
    throw new Error("SSLCommerz validation failed");
  }

  const updatedOrder = await prisma.order.update({
    where: { id: order.id },
    data: {
      paymentStatus: "PAID",
      paymentGatewayData: toInputJson({
        callbackPayload,
        validation,
      }),
    },
  });

  return {
    order: updatedOrder,
    redirectUrl: buildClientRedirectUrl(true, transactionId, updatedOrder.id),
    alreadyPaid: false,
  };
};

const handleSslCommerzFail = async (callbackPayload: SslCallbackPayload) => {
  const transactionId = callbackPayload.tran_id;
  if (!transactionId) {
    throw new Error("tran_id is required in SSLCommerz fail callback");
  }

  const order = await markPaymentFailedAndRestoreStock(transactionId, "FAILED", callbackPayload);
  return {
    order,
    redirectUrl: buildClientRedirectUrl(false, transactionId, order.id),
  };
};

const handleSslCommerzCancel = async (callbackPayload: SslCallbackPayload) => {
  const transactionId = callbackPayload.tran_id;
  if (!transactionId) {
    throw new Error("tran_id is required in SSLCommerz cancel callback");
  }

  const order = await markPaymentFailedAndRestoreStock(transactionId, "CANCELLED", callbackPayload);
  return {
    order,
    redirectUrl: buildClientRedirectUrl(false, transactionId, order.id),
  };
};

const handleSslCommerzIpn = async (callbackPayload: SslIpnCallback) => {
  const status = String(callbackPayload.status || "").toUpperCase();

  if (status === "VALID" || status === "VALIDATED") {
    return handleSslCommerzSuccess(callbackPayload as SslSuccessCallback);
  }

  if (status === "FAILED") {
    return handleSslCommerzFail(callbackPayload as SslFailCallback);
  }

  if (status === "CANCELLED") {
    return handleSslCommerzCancel(callbackPayload as SslCancelCallback);
  }

  return {
    message: `IPN ignored for status: ${status || "UNKNOWN"}`,
  };
};

const getUserOrdersFromDB = async (customerId: string) => {
  const customer = await prisma.user.findUnique({
    where: {
      id: customerId,
    },
    select: {
      id: true,
      role: true,
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  if (customer.role !== "CUSTOMER") {
    throw new Error("Only customers can view orders");
  }

  const orders = await prisma.order.findMany({
    where: {
      customerId,
    },
    include: {
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              price: true,
              manufacturer: true,
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  return orders;
};

const getSingleOrderFromDB = async (orderId: string, customerId: string) => {
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: {
        include: {
          medicine: {
            select: {
              id: true,
              name: true,
              price: true,
              manufacturer: true,
              description: true,
            },
          },
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.customerId !== customerId) {
    throw new Error("You can only view your own orders");
  }

  return order;
};

const cancelOrderIntoDB = async (orderId: string, customerId: string) => {
  // Get the order
  const order = await prisma.order.findUnique({
    where: {
      id: orderId,
    },
    include: {
      items: {
        include: {
          medicine: true,
        },
      },
    },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Check if customer owns the order
  if (order.customerId !== customerId) {
    throw new Error("You can only cancel your own orders");
  }

  // Check if order can be cancelled (only PLACED and PROCESSING can be cancelled)
  if (order.status !== "PLACED" && order.status !== "PROCESSING") {
    throw new Error(
      `Cannot cancel order with status ${order.status}. Only PLACED or PROCESSING orders can be cancelled.`
    );
  }

  // Cancel order within a transaction to restore stock
  const result = await prisma.$transaction(async (tx) => {
    // Update order status
    const cancelledOrder = await tx.order.update({
      where: {
        id: orderId,
      },
      data: {
        status: "CANCELLED",
      },
      include: {
        items: {
          include: {
            medicine: {
              select: {
                id: true,
                name: true,
                price: true,
              },
            },
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Restore medicine stock
    for (const item of order.items) {
      await tx.medicine.update({
        where: {
          id: item.medicineId,
        },
        data: {
          stock: {
            increment: item.quantity,
          },
        },
      });
    }

    return cancelledOrder;
  });

  return result;
};

// Allowed status transitions
const allowedTransitions: Record<OrderStatus, OrderStatus[]> = {
  [OrderStatus.PLACED]: [OrderStatus.PROCESSING, OrderStatus.CANCELLED],
  [OrderStatus.PROCESSING]: [OrderStatus.SHIPPED, OrderStatus.CANCELLED],
  [OrderStatus.SHIPPED]: [OrderStatus.DELIVERED],
  [OrderStatus.DELIVERED]: [],
  [OrderStatus.CANCELLED]: [],
};

const updateOrderStatus = async (orderId: string, newStatus: OrderStatus, actorRole: string) => {
  // Fetch current order
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new Error("Order not found");

  // Prevent status change if already DELIVERED or CANCELLED
  const currentStatus = order.status as OrderStatus;
  if (currentStatus === OrderStatus.DELIVERED || currentStatus === OrderStatus.CANCELLED) {
    throw new Error(`Cannot change status of a ${order.status} order`);
  }

  // Check allowed transitions
  const allowed = allowedTransitions[currentStatus] || [];
  if (!allowed.includes(newStatus as OrderStatus)) {
    throw new Error(`Invalid status transition: ${order.status} → ${newStatus}`);
  }

  // Optionally, add role-based checks here (e.g., only seller can mark as SHIPPED/DELIVERED)

  // Update status
  const updatedOrder = await prisma.order.update({
    where: { id: orderId },
    data: { status: newStatus },
  });
  return updatedOrder;
};

export const OrderService = {
  createOrderIntoDB,
  createSslCommerzSessionIntoDB,
  handleSslCommerzSuccess,
  handleSslCommerzFail,
  handleSslCommerzCancel,
  handleSslCommerzIpn,
  getUserOrdersFromDB,
  getSingleOrderFromDB,
  cancelOrderIntoDB,
  updateOrderStatus,
};
