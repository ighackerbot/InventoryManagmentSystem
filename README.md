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

