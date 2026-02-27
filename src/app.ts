import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { AuthRoutes } from './modules/Auth/auth.route';
import { MedicineRoutes } from './modules/Medicine/medicine.route';
import { CategoryRoutes } from './modules/Category/category.route';
import { SellerRoutes } from './modules/Seller/seller.route';
import { OrderRoutes } from './modules/Order/order.route';
import { AdminRoutes } from './modules/Admin/admin.route';
import { UserRoutes } from './modules/User/user.route';
import { ReviewRoutes } from './modules/Review/review.route';
import { CartRoutes } from './modules/Cart/cart.route';

const app: Application = express();

// parsers
app.use(express.json());
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);
app.use(cookieParser());

// application routes
// app.use('/api/v1', router);

app.use('/api/auth', AuthRoutes);
app.use('/api/medicines', MedicineRoutes);
app.use('/api/categories', CategoryRoutes);
app.use('/api/seller', SellerRoutes);
app.use('/api/orders', OrderRoutes);
app.use('/api/admin', AdminRoutes);
app.use('/api/user', UserRoutes);
app.use('/api/reviews', ReviewRoutes);
app.use('/api/cart', CartRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello from Medi Store API!');
});

export default app;
