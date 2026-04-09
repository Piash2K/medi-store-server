import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env') });

export default {
  port: process.env.PORT,
  database_url: process.env.DATABASE_URL,
  jwt_secret_key: process.env.JWT_SECRET_KEY || process.env.JWT_SECRET,
  app_base_url: process.env.APP_BASE_URL,
  client_success_url: process.env.CLIENT_PAYMENT_SUCCESS_URL,
  client_failed_url: process.env.CLIENT_PAYMENT_FAILED_URL,
  client_cancel_url: process.env.CLIENT_PAYMENT_CANCEL_URL,
  sslcommerz: {
    store_id: process.env.SSLCOMMERZ_STORE_ID,
    store_password: process.env.SSLCOMMERZ_STORE_PASSWORD,
    session_api_url: process.env.SSLCOMMERZ_SESSION_API_URL,
    validation_api_url: process.env.SSLCOMMERZ_VALIDATION_API_URL,
  },
};
