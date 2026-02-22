import { prisma } from "../../lib/prisma";

type AddToCartPayload = {
  userId: string;
  medicineId: string;
  quantity: number;
};

type UpdateCartItemPayload = {
  userId: string;
  medicineId: string;
  quantity: number;
};

type RemoveFromCartPayload = {
  userId: string;
  medicineId: string;
};

// In-memory cart storage: userId -> {medicineId -> quantity}
const cartStore = new Map<string, Map<string, number>>();

const getCartForUser = async (userId: string) => {
  if (!cartStore.has(userId)) {
    return [];
  }

  const userCart = cartStore.get(userId)!;
  const medicineIds = Array.from(userCart.keys());

  if (medicineIds.length === 0) {
    return [];
  }

  // Fetch medicine details
  const medicines = await prisma.medicine.findMany({
    where: {
      id: {
        in: medicineIds,
      },
      isDeleted: false,
    },
    include: {
      category: {
        select: {
          id: true,
          name: true,
        },
      },
      seller: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  // Combine with quantities
  return medicines.map((medicine) => ({
    ...medicine,
    cartQuantity: userCart.get(medicine.id) || 0,
  }));
};

const addToCartIntoDB = async (payload: AddToCartPayload) => {
  // Validate medicine exists and is not deleted
  const medicine = await prisma.medicine.findUnique({
    where: {
      id: payload.medicineId,
    },
    select: {
      id: true,
      name: true,
      stock: true,
      price: true,
      isDeleted: true,
    },
  });

  if (!medicine) {
    throw new Error("Medicine not found");
  }

  if (medicine.isDeleted) {
    throw new Error("Cannot add deleted medicine to cart");
  }

  if (payload.quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  if (payload.quantity > medicine.stock) {
    throw new Error(
      `Insufficient stock. Available: ${medicine.stock}, Requested: ${payload.quantity}`
    );
  }

  // Initialize cart for user if not exists
  if (!cartStore.has(payload.userId)) {
    cartStore.set(payload.userId, new Map<string, number>());
  }

  const userCart = cartStore.get(payload.userId)!;
  const currentQuantity = userCart.get(payload.medicineId) || 0;
  const newQuantity = currentQuantity + payload.quantity;

  if (newQuantity > medicine.stock) {
    throw new Error(
      `Total quantity exceeds stock. Available: ${medicine.stock}, Total requested: ${newQuantity}`
    );
  }

  userCart.set(payload.medicineId, newQuantity);

  return {
    message: "Medicine added to cart",
    medicineId: payload.medicineId,
    quantity: newQuantity,
  };
};

const updateCartItemIntoDB = async (payload: UpdateCartItemPayload) => {
  // Validate medicine exists
  const medicine = await prisma.medicine.findUnique({
    where: {
      id: payload.medicineId,
    },
    select: {
      stock: true,
      isDeleted: true,
    },
  });

  if (!medicine) {
    throw new Error("Medicine not found");
  }

  if (medicine.isDeleted) {
    throw new Error("Cannot update deleted medicine in cart");
  }

  if (payload.quantity <= 0) {
    throw new Error("Quantity must be greater than 0");
  }

  if (payload.quantity > medicine.stock) {
    throw new Error(
      `Insufficient stock. Available: ${medicine.stock}, Requested: ${payload.quantity}`
    );
  }

  if (!cartStore.has(payload.userId)) {
    throw new Error("Cart is empty");
  }

  const userCart = cartStore.get(payload.userId)!;
  if (!userCart.has(payload.medicineId)) {
    throw new Error("Medicine not in cart");
  }

  userCart.set(payload.medicineId, payload.quantity);

  return {
    message: "Cart item updated",
    medicineId: payload.medicineId,
    quantity: payload.quantity,
  };
};

const removeFromCartIntoDB = async (payload: RemoveFromCartPayload) => {
  if (!cartStore.has(payload.userId)) {
    throw new Error("Cart is empty");
  }

  const userCart = cartStore.get(payload.userId)!;
  if (!userCart.has(payload.medicineId)) {
    throw new Error("Medicine not in cart");
  }

  userCart.delete(payload.medicineId);

  return {
    message: "Medicine removed from cart",
    medicineId: payload.medicineId,
  };
};

const clearCartIntoDB = async (userId: string) => {
  if (!cartStore.has(userId)) {
    return { message: "Cart is already empty" };
  }

  cartStore.delete(userId);

  return { message: "Cart cleared successfully" };
};

export const CartService = {
  getCartForUser,
  addToCartIntoDB,
  updateCartItemIntoDB,
  removeFromCartIntoDB,
  clearCartIntoDB,
};
