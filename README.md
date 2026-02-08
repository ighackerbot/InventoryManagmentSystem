# Inventory Management System

A premium full-stack multi-store inventory management system built with React, Express.js, and MongoDB. Features role-based access control, multi-tenant architecture, real-time inventory tracking, and atomic transaction processing.

## Features

- 🔐 **JWT Authentication** - Secure token-based authentication with role-based access control
- 🏪 **Multi-Store Support** - Manage multiple stores with isolated data and role-based permissions
- 👥 **User Roles** - Admin, Co-Admin, and Staff roles with granular permissions
- 📦 **Product Management** - Complete CRUD operations with stock level indicators
- 💰 **Sales Tracking** - Record sales with automatic atomic stock updates
- 🛒 **Purchase Management** - Track purchases with atomic stock increments (Admin/Co-Admin only)
- 📊 **Dashboard Analytics** - Real-time MongoDB aggregation for statistics and insights
- 🎨 **Premium Design** - Modern dark blue & white theme with smooth animations
- 🔒 **Data Isolation** - Complete data separation between stores with multi-tenant architecture

## Tech Stack

**Frontend:**
- React 18+ with Vite
- React Router for navigation
- Axios for HTTP requests
- Context API for state management
- Vanilla CSS with premium design system

**Backend:**
- Node.js with Express.js
- MongoDB with Mongoose ODM
- JWT for authentication
- MongoDB transactions for atomic operations
- RESTful API architecture

**Database:**
- MongoDB (requires replica set for transactions)
- Mongoose schemas with validation
- Multi-tenant data isolation

## Prerequisites

- Node.js 16+ installed
- MongoDB 4.0+ (with replica set configuration)
- npm or yarn package manager

## Setup Instructions

### 1. Clone and Setup

```bash
cd InventoryManagmentSystem
```

### 2. MongoDB Setup

MongoDB transactions require a **replica set**. Choose one option:

#### Option A: Docker Compose (Recommended for Local Development)

Create `docker-compose.yml` in the project root:

```yaml
version: '3.8'
services:
  mongo1:
    image: mongo:6
    command: ["--replSet", "rs0", "--bind_ip_all", "--port", "27017"]
    ports:
      - "27017:27017"
    volumes:
      - mongo1-data:/data/db
    healthcheck:
      test: echo "try { rs.status() } catch (err) { rs.initiate({_id:'rs0',members:[{_id:0,host:'mongo1:27017'}]}) }" | mongosh --port 27017 --quiet
      interval: 5s
      timeout: 30s
      start_period: 0s
      start_interval: 1s
      retries: 30

volumes:
  mongo1-data:
```

Start MongoDB:
```bash
docker-compose up -d
```

#### Option B: Local MongoDB with Replica Set

```bash
# Start MongoDB with replica set
mongod --replSet rs0 --port 27017 --dbpath /opt/homebrew/var/mongodb

# In another terminal, initialize replica set
mongosh
> rs.initiate({
    _id: "rs0",
    members: [{ _id: 0, host: "localhost:27017" }]
  })
```

#### Option C: MongoDB Atlas (Cloud)

1. Create a free cluster at [mongodb.com/cloud/atlas](https://www.mongodb.com/cloud/atlas)
2. Get the connection string (includes replica set by default)
3. Update `.env` with the Atlas connection string

### 3. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env` and configure:

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/inventory_management?replicaSet=rs0
# For Atlas: mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/inventory_management

# JWT Configuration
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d

# Server Configuration
PORT=3001
NODE_ENV=development
```

Start the backend:
```bash
npm run dev
```

The backend server will run on `http://localhost:3001`

### 4. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
```

Edit `.env`:

```env
VITE_API_URL=http://localhost:3001/api
```

Start the frontend:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173`

### 5. Create Your First Admin User

1. Navigate to `http://localhost:5173`
2. Click "Sign Up" and create an account
3. The first user will automatically become an admin
4. Create your first store through the signup flow

## User Roles

### Admin
- Full access to all features
- Can manage products, sales, and purchases
- Can view all analytics
- Can create and manage stores
- Can invite users and assign roles

### Co-Admin
- Same as Admin permissions
- Cannot delete stores

### Staff
- Can view and manage products
- Can record sales
- **Cannot** access purchases page
- Limited analytics view

## Multi-Store Architecture

### Store Isolation
- Each store has completely isolated data
- Products, sales, and purchases are scoped by `store_id`
- Users can have different roles in different stores
- Store selection persists across sessions

### Store Switching
- Admin users can switch between stores via dropdown
- Context automatically updates to show store-specific data
- All API requests include `x-store-id` header

## Project Structure

```
InventoryManagmentSystem/
├── backend/
│   ├── config/
│   │   └── db.js                 # MongoDB connection
│   ├── middleware/
│   │   └── auth.js               # JWT authentication + multi-tenant
│   ├── models/
│   │   ├── User.js               # User schema
│   │   ├── Store.js              # Store schema
│   │   ├── UserStoreRole.js      # User-Store-Role mapping
│   │   ├── Product.js            # Product schema
│   │   ├── Sale.js               # Sale schema
│   │   └── Purchase.js           # Purchase schema
│   ├── routes/
│   │   ├── authRoutes.js         # Authentication (signup, login, staff-login, me)
│   │   ├── storeRoutes.js        # Store management
│   │   ├── productRoutes.js      # Product CRUD
│   │   ├── saleRoutes.js         # Sales with transactions
│   │   ├── purchaseRoutes.js     # Purchases with transactions
│   │   ├── reportRoutes.js       # MongoDB aggregation analytics
│   │   ├── userRoutes.js         # User management
│   │   ├── auditRoutes.js        # Audit logs
│   │   ├── alertRoutes.js        # Low stock alerts
│   │   └── exportRoutes.js       # Data export
│   ├── utils/
│   │   └── jwt.js                # JWT utilities
│   ├── server.js                 # Express server entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Input.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   ├── LoadingSpinner.jsx
    │   │   └── StoreSwitcher.jsx  # Multi-store dropdown
    │   ├── contexts/
    │   │   └── AuthContext.jsx    # Auth + multi-store context
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Products.jsx
    │   │   ├── Sales.jsx
    │   │   └── Purchases.jsx
    │   ├── utils/
    │   │   └── api.js             # Axios instance with interceptors
    │   ├── App.jsx                # Protected/Public routes
    │   ├── main.jsx
    │   └── index.css              # Premium design system
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Key Features Explained

### MongoDB Transactions
Sales and purchases use atomic MongoDB transactions to ensure data consistency:
- Stock updates and record creation happen atomically
- Automatic rollback on errors
- Prevents race conditions and data corruption

### Automatic Stock Management
- **Sales**: Automatically decrements product stock with validation
- **Purchases**: Automatically increments product stock
- **Low Stock Alerts**: Automatic alerts when stock falls below threshold

### Role-Based Access Control
- JWT middleware validates tokens and extracts user info
- Store-scoped permissions with `UserStoreRole` model
- UI components automatically hide/show based on user role
- Protected routes enforce role requirements

### Premium Design
- Dark blue (#0A1929, #1E3A5F, #2C5AA0) and white (#FFFFFF, #F8FAFC) palette
- Smooth animations and transitions
- Glassmorphism effects
- Responsive design for all screen sizes
- Modern typography with Inter and Outfit fonts

## API Endpoints

All endpoints require authentication via JWT token (except signup/signin).  
Multi-store endpoints require `x-store-id` header.

### Authentication
- `POST /api/auth/signup` - Create new user and store
- `POST /api/auth/signin` - Sign in with email/password
- `POST /api/auth/staff-login` - Staff login with store code
- `GET /api/auth/me` - Get current user with stores

### Stores
- `GET /api/stores` - Get user's stores
- `POST /api/stores` - Create new store (admin)
- `PUT /api/stores/:id` - Update store (admin)

### Products
- `GET /api/products` - Get all products (store-scoped)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin/coadmin)
- `PUT /api/products/:id` - Update product (admin/coadmin)
- `DELETE /api/products/:id` - Delete product (admin/coadmin)

### Sales
- `GET /api/sales` - Get all sales (store-scoped)
- `POST /api/sales` - Create sale with atomic stock update

### Purchases
- `GET /api/purchases` - Get all purchases (admin/coadmin, store-scoped)
- `POST /api/purchases` - Create purchase with atomic stock update (admin/coadmin)

### Reports
- `GET /api/reports/dashboard` - Get dashboard statistics (store-scoped)
- `GET /api/reports/sales-trends` - Sales analytics
- `GET /api/reports/top-products` - Best-selling products
- `GET /api/reports/low-stock` - Products below threshold

### Users
- `GET /api/users` - Get store users (admin)
- `POST /api/users/invite` - Invite user to store (admin)
- `PUT /api/users/:id/role` - Update user role (admin)

## Development

Both servers support hot-reloading:
- Backend uses `nodemon` for automatic restarts
- Frontend uses Vite's HMR for instant updates

Run both servers concurrently:

```bash
# Terminal 1: MongoDB
mongod --replSet rs0 --dbpath /opt/homebrew/var/mongodb

# Terminal 2: Backend
cd backend && npm run dev

# Terminal 3: Frontend
cd frontend && npm run dev
```

## Testing

The system has been comprehensively tested:
- ✅ User registration and authentication flows
- ✅ Multi-store switching and context management
- ✅ Role-based access control (staff/coadmin/admin)
- ✅ Data isolation between stores
- ✅ Product CRUD operations
- ✅ Sales and purchase transactions (with MongoDB replica set)
- ✅ Dashboard analytics with MongoDB aggregation

See [phase6_testing_report.md](brain/phase6_testing_report.md) for detailed test results.

## Production Deployment

### Frontend
```bash
cd frontend
npm run build
# Deploy 'dist' folder to Vercel, Netlify, etc.
```

### Backend
1. Set environment variables for production:
   ```env
   MONGODB_URI=<production_mongodb_uri>
   JWT_SECRET=<secure_secret>
   NODE_ENV=production
   ```
2. Deploy to Node.js hosting (Railway, Render, Heroku, etc.)
3. Ensure MongoDB replica set is configured

### MongoDB
- Use MongoDB Atlas for production (includes replica set)
- Or configure your own MongoDB cluster with replica set
- Enable authentication and SSL/TLS

## Troubleshooting

### "Maximum update depth exceeded" Error
- **Fixed**: This was a rendering loop between ProtectedRoute and PublicRoute
- Solution: Clear localStorage when currentStore is missing

### Sales/Purchases Fail with 400 Error
- **Cause**: MongoDB transactions require replica set
- **Solution**: Configure MongoDB as replica set (see setup instructions)

### Authentication Issues
- Verify JWT_SECRET is set in backend `.env`
- Check token expiration settings
- Ensure frontend sends Authorization header

### Store Switching Not Working
- Check that `x-store-id` header is sent with requests
- Verify `currentStoreId` is stored in localStorage
- Ensure user has access to the selected store

### CORS Errors
- Update backend CORS settings to allow frontend URL
- Check that frontend API URL matches backend address

## Environment Variables

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/inventory_management?replicaSet=rs0
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
PORT=3001
NODE_ENV=development
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## Migration from Supabase

This system was migrated from Supabase to MongoDB. Key changes:
- PostgreSQL → MongoDB with Mongoose
- Supabase Auth → JWT authentication
- RLS policies → Application-level multi-tenancy
- Supabase client → Axios HTTP client

See migration documentation in `brain/` directory for details.

## License

MIT

## Author

Built with ❤️ using modern full-stack technologies

---

## Quick Start

```bash
# 1. Start MongoDB with replica set
mongod --replSet rs0 --dbpath /opt/homebrew/var/mongodb

# 2. Start backend (in new terminal)
cd backend && npm install && npm run dev

# 3. Start frontend (in new terminal)
cd frontend && npm install && npm run dev

# 4. Open browser
open http://localhost:5173
```

🎉 **You're ready to go!** Sign up to create your first admin account and store.
