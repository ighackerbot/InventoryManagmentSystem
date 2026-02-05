# Inventory Management System

A premium full-stack inventory management system built with React, Express.js, and Supabase. Features role-based access control, real-time inventory tracking, sales and purchase management.

## Features

- 🔐 **Authentication & Authorization** - Secure authentication with role-based access control (Admin, Co-Admin, Staff)
- 📦 **Product Management** - Complete CRUD operations for products with stock level indicators
- 💰 **Sales Tracking** - Record sales with automatic stock updates and duplicate prevention
- 🛒 **Purchase Management** - Track purchases with automatic stock increments (Admin/Co-Admin only)
- 📊 **Dashboard Analytics** - Real-time statistics and recent activity tracking
- 🎨 **Premium Design** - Modern dark blue & white theme with smooth animations

## Tech Stack

**Frontend:**
- React 18+ with Vite
- React Router for navigation
- Supabase JS Client
- Vanilla CSS with premium design system

**Backend:**
- Node.js with Express.js
- Supabase for PostgreSQL database and authentication
- RESTful API architecture

## Prerequisites

- Node.js 16+ installed
- Supabase account and project
- npm or yarn package manager

## Setup Instructions

### 1. Clone and Setup

```bash
cd inventory-management
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials:
# SUPABASE_URL=your_supabase_project_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
# PORT=3001

# Start the backend server
npm run dev
```

The backend server will run on `http://localhost:3001`

### 3. Frontend Setup

```bash
cd ../frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Edit .env and add your Supabase credentials:
# VITE_SUPABASE_URL=your_supabase_project_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_API_URL=http://localhost:3001/api

# Start the frontend development server
npm run dev
```

The frontend will run on `http://localhost:5173`

### 4. Supabase Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Run the provided schema SQL (from the original request) to create all tables, indexes, triggers, and RLS policies

### 5. Create Admin User

After signing up through the app, you need to manually set the role to 'admin' in Supabase:

1. Go to Supabase Dashboard > Table Editor > profiles
2. Find your user and update the `role` field to `'admin'`

## User Roles

- **Admin**: Full access to all features including product management and purchases
- **Co-Admin**: Same as Admin
- **Staff**: Can view products and record sales, but cannot manage products or purchases

## Project Structure

```
inventory-management/
├── backend/
│   ├── config/
│   │   └── supabase.js          # Supabase client configuration
│   ├── middleware/
│   │   └── auth.js               # Authentication middleware
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   ├── products.js           # Product CRUD routes
│   │   ├── purchases.js          # Purchase routes
│   │   ├── sales.js              # Sales routes
│   │   └── profiles.js           # User profile routes
│   ├── server.js                 # Express server entry point
│   └── package.json
│
└── frontend/
    ├── src/
    │   ├── components/           # Reusable UI components
    │   │   ├── Button.jsx
    │   │   ├── Card.jsx
    │   │   ├── Input.jsx
    │   │   ├── Modal.jsx
    │   │   ├── Navbar.jsx
    │   │   ├── Sidebar.jsx
    │   │   └── LoadingSpinner.jsx
    │   ├── contexts/
    │   │   └── AuthContext.jsx   # Authentication context
    │   ├── pages/
    │   │   ├── Login.jsx
    │   │   ├── Signup.jsx
    │   │   ├── Dashboard.jsx
    │   │   ├── Products.jsx
    │   │   ├── Sales.jsx
    │   │   └── Purchases.jsx
    │   ├── utils/
    │   │   └── supabase.js       # Supabase client config
    │   ├── App.jsx               # Main app component
    │   ├── main.jsx              # React entry point
    │   └── index.css             # Premium design system
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Key Features Explained

### Duplicate Sale Prevention
The system includes a unique constraint on sales to prevent duplicate entries within the same minute for the same product, quantity, and customer combination.

### Automatic Stock Management
- **Sales**: Automatically decrements product stock and validates sufficient quantity
- **Purchases**: Automatically increments product stock

### Role-Based Access Control
- Authentication middleware validates user tokens
- Role-based helpers restrict access to admin/co-admin only features
- UI components automatically hide/show based on user role

### Premium Design
- Dark blue (#0A1929, #1E3A5F, #2C5AA0) and white (#FFFFFF, #F8FAFC) color palette
- Smooth animations and transitions
- Glassmorphism effects
- Responsive design for all screen sizes
- Modern typography with Inter and Outfit fonts

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in with credentials
- `POST /api/auth/signout` - Sign out current user
- `GET /api/auth/me` - Get current user profile

### Products
- `GET /api/products` - Get all products (with search)
- `GET /api/products/:id` - Get single product
- `POST /api/products` - Create product (admin/coadmin)
- `PUT /api/products/:id` - Update product (admin/coadmin)
- `DELETE /api/products/:id` - Delete product (admin/coadmin)

### Sales
- `GET /api/sales` - Get all sales (authenticated)
- `POST /api/sales` - Create sale (authenticated)

### Purchases
- `GET /api/purchases` - Get all purchases (admin/coadmin)
- `POST /api/purchases` - Create purchase (admin/coadmin)

### Profiles
- `GET /api/profiles` - Get all profiles (admin)
- `GET /api/profiles/me` - Get own profile
- `PATCH /api/profiles/:id/role` - Update user role (admin)

## Development

Both servers support hot-reloading for development:
- Backend uses `nodemon` for automatic restarts
- Frontend uses Vite's HMR for instant updates

## Production Deployment

For production deployment:

1. Build the frontend:
   ```bash
   cd frontend && npm run build
   ```

2. Set up environment variables for production
3. Deploy backend to your Node.js hosting service
4. Deploy frontend build to static hosting (Vercel, Netlify, etc.)
5. Update CORS settings in backend for production frontend URL

## Troubleshooting

- **Authentication issues**: Verify Supabase credentials in `.env` files
- **CORS errors**: Check that backend CORS settings allow frontend URL
- **Database errors**: Ensure all SQL schema has been run in Supabase
- **Role permissions**: Manually update user role in Supabase dashboard

## License

MIT

## Author

Built with ❤️ using modern web technologies
# NEW-INVENTORY-TRACKER-FOR-SGTC
