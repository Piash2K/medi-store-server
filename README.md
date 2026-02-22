# 💊 MediStore Backend

Backend API for **MediStore** — a scalable online medicine e-commerce platform built with **Express.js, TypeScript, Prisma ORM, and PostgreSQL**.

This server manages authentication, role-based authorization, medicine inventory, order processing, and admin operations in a secure and structured architecture.


## 🚀 Tech Stack

* **Node.js**
* **Express.js (v5)**
* **TypeScript**
* **Prisma ORM**
* **PostgreSQL**
* **JWT Authentication**
* **Zod (Schema Validation)**
* **bcrypt / bcryptjs (Password Hashing)**
* **ESLint + Prettier (Code Quality)**


## 📦 Project Structure

```
medi-store-server/
│
├── src/
│   ├── app/
│   │   ├── modules/        # Business logic modules
│   │   ├── middleware/     # Auth & error middleware
│   │   ├── utils/          # Helper utilities
│   │   └── routes/         # Route definitions
│   │
│   ├── scripts/
│   │   └── seed-admin.ts   # Admin seeding script
│   │
│   └── server.ts           # Entry point
│
├── prisma/
│   └── schema.prisma       # Database schema
│
├── .env
├── package.json
└── tsconfig.json
```


## ⚙️ Installation & Setup

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/Piash2K/medi-store-server.git
cd medi-store-server
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root directory:

```env
PORT=5000
DATABASE_URL=your_postgresql_database_url
JWT_SECRET=your_super_secret_key

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=strong_password
ADMIN_NAME=Admin
ADMIN_PHONE=01700000000
ADMIN_ADDRESS=Dhaka, Bangladesh
```


## 🛠 Available Scripts

| Script             | Description                              |
| ------------------ | ---------------------------------------- |
| `npm run dev`      | Start development server with hot reload |
| `npm run build`    | Compile TypeScript to JavaScript         |
| `npm start`        | Run production server                    |
| `npm run lint`     | Check ESLint errors                      |
| `npm run lint:fix` | Fix ESLint errors                        |
| `npm run format`   | Format code using Prettier               |
| `npm run seed`     | Seed default admin user                  |


## 🗄 Prisma Setup

### Generate Prisma Client

```bash
npx prisma generate
```

### Run Database Migrations

```bash
npx prisma migrate dev --name init
```

### Open Prisma Studio

```bash
npx prisma studio
```

## 🔐 Authentication & Authorization

* JWT-based authentication
* Role-based access control (RBAC)
* Secure password hashing with bcrypt
* Protected routes via middleware

### 👥 User Roles

* **Admin**
* **Seller**
* **Customer**


## 👑 Seed Admin User

To create the initial admin account:

```bash
npm run seed
```

Ensure these environment variables are properly configured:

```
ADMIN_EMAIL
ADMIN_PASSWORD
ADMIN_NAME
```

## 📚 API Features

### 🧑 Users

* User Registration
* User Login
* Role-based access control

### 💊 Medicines

* Create medicine (Seller/Admin)
* Update medicine
* Delete medicine
* Retrieve all medicines
* Retrieve single medicine

### 🛒 Orders

* Create order
* Update order status
* Retrieve user orders
* Admin order management


## 🌍 API Base URL

```
http://localhost:5000/api/
```

## 🧪 Development Mode

```bash
npm run dev
```

Runs the server with **ts-node-dev** and automatic reload.

---

## 🏗 Production Build

```bash
npm run build
npm start
```


## 🔒 Security Practices

* Environment-based configuration
* Secure password hashing
* JWT authentication
* Zod request validation
* CORS enabled
* Cookie parsing support
* Clean modular architecture

---

## 📄 License

Licensed under the **ISC License**.

---

## 👨‍💻 Author

Developed as part of the **MediStore Full-Stack E-commerce Project**.
