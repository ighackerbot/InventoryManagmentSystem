# 📊 UML & System Diagrams — Inventory Management System

> A comprehensive reference of all UML and system architecture diagrams for the multi-tenant Inventory Management System built with React, Express.js, and MongoDB.

---

## 📋 Table of Contents

1. [System Architecture Diagram](#1-system-architecture-diagram)
2. [Class Diagram (Data Models)](#2-class-diagram-data-models)
3. [Entity-Relationship (ER) Diagram](#3-entity-relationship-er-diagram)
4. [Use Case Diagram](#4-use-case-diagram)
5. [Sequence Diagram — User Authentication](#5-sequence-diagram--user-authentication)
6. [Sequence Diagram — Sale Transaction](#6-sequence-diagram--sale-transaction)
7. [Sequence Diagram — Purchase Transaction](#7-sequence-diagram--purchase-transaction)
8. [Activity Diagram — User Signup Flow](#8-activity-diagram--user-signup-flow)
9. [Activity Diagram — Staff Join Store Flow](#9-activity-diagram--staff-join-store-flow)
10. [State Diagram — Product Stock States](#10-state-diagram--product-stock-states)
11. [State Diagram — User Session States](#11-state-diagram--user-session-states)
12. [Component Diagram — Frontend Architecture](#12-component-diagram--frontend-architecture)
13. [Deployment Diagram](#13-deployment-diagram)
14. [API Flow Diagram](#14-api-flow-diagram)
15. [Role-Based Access Control (RBAC) Matrix](#15-role-based-access-control-rbac-matrix)

---

## 1. System Architecture Diagram

High-level overview of the full-stack multi-tenant system.

```mermaid
graph TB
    subgraph Client["🖥️ Client (Browser)"]
        React["React 18 + Vite\nSPA Frontend"]
        Context["AuthContext\n(State Management)"]
        Axios["Axios HTTP Client\n(JWT Interceptor)"]
    end

    subgraph Backend["⚙️ Backend (Node.js)"]
        Express["Express.js Server\n:3001"]
        AuthMW["JWT Auth Middleware\n(Multi-Tenant)"]
        subgraph Routes["API Routes"]
            AuthR["/api/auth"]
            StoreR["/api/stores"]
            ProductR["/api/products"]
            SaleR["/api/sales"]
            PurchaseR["/api/purchases"]
            ReportR["/api/reports"]
            GuestR["/api/guest"]
        end
    end

    subgraph Database["🗄️ MongoDB (Replica Set)"]
        Users["Users Collection"]
        Stores["Stores Collection"]
        UserStoreRoles["UserStoreRoles Collection"]
        Products["Products Collection"]
        Sales["Sales Collection"]
        Purchases["Purchases Collection"]
        GuestSessions["GuestSessions Collection"]
    end

    React --> Context
    Context --> Axios
    Axios -- "JWT + x-store-id header" --> Express
    Express --> AuthMW
    AuthMW --> Routes
    Routes --> Database
```

---

## 2. Class Diagram (Data Models)

Represents all Mongoose schema models and their relationships.

```mermaid
classDiagram
    class User {
        +ObjectId _id
        +String name
        +String email
        +String passwordHash
        +String roleType [admin|coadmin|staff]
        +String oauthProvider [google|github|null]
        +Date createdAt
        +Date updatedAt
        +comparePassword(password) Boolean
        +toJSON() Object
    }

    class Store {
        +ObjectId _id
        +String name
        +String type [Warehouse|Retail|Godown|Branch|Distribution]
        +String address
        +ObjectId ownerId
        +String currency
        +Number taxPercent
        +String adminPin
        +Number teamCapacity
        +Date createdAt
        +Date updatedAt
    }

    class UserStoreRole {
        +ObjectId _id
        +ObjectId userId
        +ObjectId storeId
        +String role [admin|coadmin|staff]
        +Date createdAt
        +Date updatedAt
    }

    class Product {
        +ObjectId _id
        +ObjectId storeId
        +String name
        +String sku
        +String description
        +Number stock
        +Number costPrice
        +Number sellingPrice
        +Number lowStockThreshold
        +Boolean isLowStock [virtual]
        +Date createdAt
        +Date updatedAt
    }

    class Sale {
        +ObjectId _id
        +ObjectId storeId
        +ObjectId productId
        +Number quantity
        +Number sellingPrice
        +Number totalAmount
        +String customerName
        +ObjectId createdBy
        +Date createdAt
        +Date updatedAt
    }

    class Purchase {
        +ObjectId _id
        +ObjectId storeId
        +ObjectId productId
        +Number quantity
        +Number costPrice
        +Number totalAmount
        +String supplierName
        +ObjectId createdBy
        +Date createdAt
        +Date updatedAt
    }

    class GuestSession {
        +ObjectId _id
        +ObjectId userId
        +ObjectId storeId
        +Date expiresAt
    }

    User "1" --> "0..*" UserStoreRole : has roles in
    Store "1" --> "0..*" UserStoreRole : has members via
    Store "1" --> "0..*" Product : contains
    Store "1" --> "0..*" Sale : records
    Store "1" --> "0..*" Purchase : records
    Product "1" --> "0..*" Sale : sold as
    Product "1" --> "0..*" Purchase : purchased as
    User "1" --> "0..*" Sale : createdBy
    User "1" --> "0..*" Purchase : createdBy
    User "1" --> "1" Store : owns
    User "1" --> "0..1" GuestSession : may have
```

---

## 3. Entity-Relationship (ER) Diagram

Database-level relationships between all collections.

```mermaid
erDiagram
    USERS {
        ObjectId _id PK
        string name
        string email UK
        string passwordHash
        string roleType
        string oauthProvider
        date createdAt
        date updatedAt
    }

    STORES {
        ObjectId _id PK
        string name
        string type
        string address
        ObjectId ownerId FK
        string currency
        number taxPercent
        string adminPin
        number teamCapacity
        date createdAt
        date updatedAt
    }

    USERSTOREROLES {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId storeId FK
        string role
        date createdAt
        date updatedAt
    }

    PRODUCTS {
        ObjectId _id PK
        ObjectId storeId FK
        string name
        string sku
        string description
        number stock
        number costPrice
        number sellingPrice
        number lowStockThreshold
        date createdAt
        date updatedAt
    }

    SALES {
        ObjectId _id PK
        ObjectId storeId FK
        ObjectId productId FK
        ObjectId createdBy FK
        number quantity
        number sellingPrice
        number totalAmount
        string customerName
        date createdAt
        date updatedAt
    }

    PURCHASES {
        ObjectId _id PK
        ObjectId storeId FK
        ObjectId productId FK
        ObjectId createdBy FK
        number quantity
        number costPrice
        number totalAmount
        string supplierName
        date createdAt
        date updatedAt
    }

    GUESTSESSIONS {
        ObjectId _id PK
        ObjectId userId FK
        ObjectId storeId FK
        date expiresAt
    }

    USERS ||--o{ USERSTOREROLES : "has"
    STORES ||--o{ USERSTOREROLES : "contains"
    USERS ||--|| STORES : "owns"
    STORES ||--o{ PRODUCTS : "has"
    STORES ||--o{ SALES : "records"
    STORES ||--o{ PURCHASES : "records"
    PRODUCTS ||--o{ SALES : "sold in"
    PRODUCTS ||--o{ PURCHASES : "purchased in"
    USERS ||--o{ SALES : "creates"
    USERS ||--o{ PURCHASES : "creates"
    USERS ||--o| GUESTSESSIONS : "may have"
    STORES ||--o| GUESTSESSIONS : "linked to"
```

---

## 4. Use Case Diagram

Actors and their permitted interactions with the system.

```mermaid
graph LR
    subgraph Actors
        Admin(["👤 Admin"])
        CoAdmin(["👤 Co-Admin"])
        Staff(["👤 Staff"])
        Guest(["👤 Guest"])
    end

    subgraph Auth["Authentication"]
        UC1["Sign Up (create store)"]
        UC2["Sign In"]
        UC3["Join Store via PIN"]
        UC4["Sign Out"]
        UC5["Guest Login"]
    end

    subgraph Products["Product Management"]
        UC6["View Products"]
        UC7["Create Product"]
        UC8["Edit Product"]
        UC9["Delete Product"]
    end

    subgraph SalesUC["Sales Management"]
        UC10["View Sales"]
        UC11["Record Sale"]
    end

    subgraph PurchasesUC["Purchase Management"]
        UC12["View Purchases"]
        UC13["Record Purchase"]
    end

    subgraph Reports["Reports & Analytics"]
        UC14["View Dashboard"]
        UC15["View Sales Trends"]
        UC16["View Top Products"]
        UC17["View Low Stock Alerts"]
    end

    subgraph StoreUC["Store Management"]
        UC18["Switch Store"]
        UC19["Invite User"]
        UC20["Update User Role"]
    end

    Admin --> UC1
    Admin --> UC2
    Admin --> UC4
    Admin --> UC6
    Admin --> UC7
    Admin --> UC8
    Admin --> UC9
    Admin --> UC10
    Admin --> UC11
    Admin --> UC12
    Admin --> UC13
    Admin --> UC14
    Admin --> UC15
    Admin --> UC16
    Admin --> UC17
    Admin --> UC18
    Admin --> UC19
    Admin --> UC20

    CoAdmin --> UC2
    CoAdmin --> UC4
    CoAdmin --> UC6
    CoAdmin --> UC7
    CoAdmin --> UC8
    CoAdmin --> UC9
    CoAdmin --> UC10
    CoAdmin --> UC11
    CoAdmin --> UC12
    CoAdmin --> UC13
    CoAdmin --> UC14
    CoAdmin --> UC15
    CoAdmin --> UC16
    CoAdmin --> UC17

    Staff --> UC2
    Staff --> UC3
    Staff --> UC4
    Staff --> UC6
    Staff --> UC10
    Staff --> UC11
    Staff --> UC14

    Guest --> UC5
    Guest --> UC6
    Guest --> UC10
    Guest --> UC14
```

---

## 5. Sequence Diagram — User Authentication

Login and token-based session flow.

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant API as Express Backend
    participant MW as Auth Middleware
    participant DB as MongoDB

    User->>FE: Enter email & password
    FE->>API: POST /api/auth/signin
    API->>DB: Find user by email (with passwordHash)
    DB-->>API: User document
    API->>API: bcrypt.compare(password, hash)
    alt Invalid credentials
        API-->>FE: 401 Unauthorized
        FE-->>User: Show error message
    else Valid credentials
        API->>DB: Find UserStoreRoles for user
        DB-->>API: List of store roles
        API->>API: createAuthResponse() → JWT token
        API-->>FE: 200 { token, user, stores }
        FE->>FE: Store token in localStorage
        FE->>FE: Set AuthContext (user, stores, currentStore)
        FE-->>User: Redirect to /dashboard
    end

    Note over FE,API: Subsequent Authenticated Requests
    FE->>API: GET /api/products (Authorization: Bearer JWT, x-store-id)
    API->>MW: Validate JWT token
    MW->>MW: jwt.verify(token, secret)
    MW->>DB: Find UserStoreRole (userId + storeId)
    DB-->>MW: Role record
    MW->>API: Attach req.user + req.userRole
    API->>DB: Query products scoped to storeId
    DB-->>API: Products array
    API-->>FE: 200 { products }
```

---

## 6. Sequence Diagram — Sale Transaction

Atomic stock update when a sale is recorded.

```mermaid
sequenceDiagram
    actor User
    participant FE as React Frontend
    participant API as Express Backend
    participant MW as Auth Middleware
    participant DB as MongoDB (Replica Set)

    User->>FE: Fill sale form (product, quantity, price)
    FE->>API: POST /api/sales { productId, quantity, sellingPrice, customerName }
    API->>MW: Authenticate + authorize (any role)
    MW-->>API: req.user, req.storeId, req.userRole

    API->>DB: Start MongoDB Session & Transaction
    DB-->>API: session started

    API->>DB: findById(productId, storeId)
    DB-->>API: Product document

    alt Insufficient stock
        API->>DB: abortTransaction()
        API-->>FE: 400 { error: "Insufficient stock" }
        FE-->>User: Show error toast
    else Stock available
        API->>DB: Product.updateOne({ $inc: { stock: -quantity } }) [within session]
        DB-->>API: Stock decremented
        API->>DB: Sale.create({ storeId, productId, quantity, sellingPrice, totalAmount, createdBy }) [within session]
        DB-->>API: Sale document saved
        API->>DB: commitTransaction()
        DB-->>API: Transaction committed
        API-->>FE: 201 { sale, updatedProduct }
        FE-->>User: Show success toast, refresh sales list
    end
```

---

## 7. Sequence Diagram — Purchase Transaction

Atomic stock increment when a purchase is recorded.

```mermaid
sequenceDiagram
    actor Admin as Admin / Co-Admin
    participant FE as React Frontend
    participant API as Express Backend
    participant MW as Auth Middleware
    participant DB as MongoDB (Replica Set)

    Admin->>FE: Fill purchase form (product, quantity, costPrice, supplier)
    FE->>API: POST /api/purchases { productId, quantity, costPrice, supplierName }
    API->>MW: Authenticate + authorize (admin/coadmin only)

    alt Staff role
        MW-->>API: 403 Forbidden
        API-->>FE: 403 { error: "Admin access required" }
        FE-->>Admin: Show access denied
    else Admin or Co-Admin
        MW-->>API: req.user, req.storeId, req.userRole

        API->>DB: Start MongoDB Session & Transaction
        DB-->>API: session started

        API->>DB: findById(productId, storeId)
        DB-->>API: Product document

        API->>DB: Product.updateOne({ $inc: { stock: +quantity } }) [within session]
        DB-->>API: Stock incremented
        API->>DB: Purchase.create({ storeId, productId, quantity, costPrice, totalAmount, createdBy }) [within session]
        DB-->>API: Purchase document saved
        API->>DB: commitTransaction()
        DB-->>API: Transaction committed
        API-->>FE: 201 { purchase, updatedProduct }
        FE-->>Admin: Show success toast, refresh purchase list
    end
```

---

## 8. Activity Diagram — User Signup Flow

Complete flow for creating a new admin account and first store.

```mermaid
flowchart TD
    Start([🟢 Start]) --> EnterDetails[User fills Signup Form\nname, email, password, storeName, storeType, adminPin]
    EnterDetails --> Validate{Validate\nInputs}
    Validate -- Missing fields / short password --> ShowError[Show Validation Error]
    ShowError --> EnterDetails
    Validate -- Valid --> CheckEmail[Check if email exists in DB]
    CheckEmail -- Email taken --> EmailError[Show: User already exists]
    EmailError --> EnterDetails
    CheckEmail -- Email available --> CreateUser[Create User\nroleType = admin]
    CreateUser --> HashPW[Pre-save hook:\nbcrypt.hash password]
    HashPW --> SaveUser[Save User to MongoDB]
    SaveUser --> CreateStore[Create Store\nwith ownerId = user._id\nadminPin set by user]
    CreateStore --> SaveStore[Save Store to MongoDB]
    SaveStore --> CreateUSR[Create UserStoreRole\nrole = admin]
    CreateUSR --> SaveUSR[Save UserStoreRole to MongoDB]
    SaveUSR --> GenToken[Generate JWT Token]
    GenToken --> SendResponse[Return 201:\ntoken + user + store]
    SendResponse --> StoreLocal[Frontend:\nStore token in localStorage\nSet AuthContext]
    StoreLocal --> Redirect[Redirect to /dashboard]
    Redirect --> End([🔴 End])
```

---

## 9. Activity Diagram — Staff Join Store Flow

Flow for Co-Admin/Staff joining an existing store via PIN.

```mermaid
flowchart TD
    Start([🟢 Start]) --> FillForm[Staff fills Join-Store Form\nname, email, password, adminCode, role]
    FillForm --> ValidateForm{Validate\nInputs}
    ValidateForm -- Invalid --> ShowErr[Show Validation Error]
    ShowErr --> FillForm
    ValidateForm -- Valid --> FindStore[Find Store by adminPin]
    FindStore -- Store not found --> PinError[Error: Invalid admin code]
    PinError --> FillForm
    FindStore -- Store found --> CheckCapacity{Check Team\nCapacity}
    CheckCapacity -- At limit --> CapacityError[Error: Store is full]
    CheckCapacity -- Has space --> CheckUser{User already\nexists in DB?}

    CheckUser -- Existing user --> CheckAlreadyMember{Already in\nthis store?}
    CheckAlreadyMember -- Yes --> MemberError[Error: Already a member]
    CheckAlreadyMember -- No --> AssignRole

    CheckUser -- New user --> CreateUser[Create new User\nroleType = role]
    CreateUser --> SaveUser[Save User to DB]
    SaveUser --> AssignRole[Create UserStoreRole\nuserId + storeId + role]

    AssignRole --> SaveUSR[Save UserStoreRole]
    SaveUSR --> GenToken[Generate JWT Token]
    GenToken --> FetchStores[Fetch all user's stores]
    FetchStores --> SendResponse[Return 201:\ntoken + stores]
    SendResponse --> Redirect[Frontend Redirect\nto /dashboard]
    Redirect --> End([🔴 End])
```

---

## 10. State Diagram — Product Stock States

All possible stock states and transitions for a product.

```mermaid
stateDiagram-v2
    [*] --> InStock : Product Created\n(stock > threshold)

    InStock --> LowStock : Sale recorded\nstock ≤ lowStockThreshold
    LowStock --> InStock : Purchase recorded\nstock > lowStockThreshold
    LowStock --> OutOfStock : Sale recorded\nstock = 0
    InStock --> OutOfStock : Sale recorded\nstock = 0
    OutOfStock --> LowStock : Purchase recorded\n0 < stock ≤ threshold
    OutOfStock --> InStock : Purchase recorded\nstock > threshold

    note right of LowStock
        🔔 Low Stock Alert triggered
        Dashboard shows warning indicator
    end note

    note right of OutOfStock
        ❌ Sales blocked
        400 error returned on sale attempt
    end note
```

---

## 11. State Diagram — User Session States

Frontend authentication session lifecycle.

```mermaid
stateDiagram-v2
    [*] --> Unauthenticated : App Load\n(no token in localStorage)

    Unauthenticated --> Loading : User submits login form
    Loading --> Authenticated : JWT token received\nAuthContext updated
    Loading --> Unauthenticated : Login failed\n(invalid credentials)

    Authenticated --> StoreSelected : User selects a store\ncurrentStore set in context

    StoreSelected --> StoreSelected : API requests made\n(JWT + x-store-id header)
    StoreSelected --> StoreSwitched : User switches store\ncurrentStore updated

    StoreSwitched --> StoreSelected : New store data loaded

    StoreSelected --> Unauthenticated : Sign out\nor token expired
    Authenticated --> Unauthenticated : Sign out\nor no stores found

    note right of Authenticated
        Token stored in localStorage
        Stores list available
    end note

    note right of StoreSelected
        All API calls include:
        Authorization: Bearer {token}
        x-store-id: {currentStoreId}
    end note
```

---

## 12. Component Diagram — Frontend Architecture

React component tree and context relationships.

```mermaid
graph TB
    subgraph Entry["Entry Point"]
        Main["main.jsx"]
    end

    subgraph AppLayer["App Layer"]
        App["App.jsx"]
        AuthProvider["AuthProvider\n(AuthContext.jsx)"]
    end

    subgraph Routing["Routing"]
        AppRoutes["AppRoutes"]
        PublicRoute["PublicRoute"]
        ProtectedRoute["ProtectedRoute\n(adminOnly flag)"]
    end

    subgraph Layout["Layout Components"]
        Layout["Layout"]
        GuestBanner["GuestBanner"]
        Navbar["Navbar"]
        Sidebar["Sidebar"]
        BottomNav["BottomNav"]
    end

    subgraph Pages["Pages"]
        Login["Login.jsx"]
        Signup["Signup.jsx"]
        Dashboard["Dashboard.jsx"]
        Products["Products.jsx"]
        Sales["Sales.jsx"]
        Purchases["Purchases.jsx\n(Admin/CoAdmin only)"]
        Reports["Reports.jsx\n(Admin/CoAdmin only)"]
    end

    subgraph SharedComponents["Shared Components"]
        Button["Button.jsx"]
        Card["Card.jsx"]
        Input["Input.jsx"]
        Modal["Modal.jsx"]
        LoadingSpinner["LoadingSpinner.jsx"]
        StoreSwitcher["StoreSwitcher.jsx"]
    end

    subgraph Utils["Utilities"]
        ApiUtil["api.js\n(Axios + JWT Interceptor)"]
        AuthContext["AuthContext\n(user, stores, currentStore)"]
    end

    Main --> App
    App --> AuthProvider
    AuthProvider --> AppRoutes
    AppRoutes --> PublicRoute
    AppRoutes --> ProtectedRoute
    PublicRoute --> Login
    PublicRoute --> Signup
    ProtectedRoute --> Layout
    Layout --> GuestBanner
    Layout --> Navbar
    Layout --> Sidebar
    Layout --> BottomNav
    Layout --> Dashboard
    Layout --> Products
    Layout --> Sales
    Layout --> Purchases
    Layout --> Reports

    Dashboard --> Card
    Dashboard --> LoadingSpinner
    Products --> Modal
    Products --> Button
    Products --> Input
    Sales --> Modal
    Purchases --> Modal

    Navbar --> StoreSwitcher
    Pages --> ApiUtil
    ApiUtil --> AuthContext
```

---

## 13. Deployment Diagram

Physical deployment of all system components.

```mermaid
graph TB
    subgraph UserDevice["👤 User Device (Browser)"]
        Browser["Web Browser\nChrome / Firefox / Safari"]
    end

    subgraph FrontendHost["☁️ Frontend Hosting (Vercel)"]
        ReactApp["React + Vite Static Build\ndist/ folder\nvercel.json config"]
    end

    subgraph BackendHost["☁️ Backend Hosting (Railway / Render)"]
        NodeServer["Node.js Express Server\nPort 3001\nJWT Auth + CORS"]
    end

    subgraph DatabaseHost["☁️ Database (MongoDB Atlas)"]
        MongoCluster["MongoDB Cluster\nReplica Set (rs0)\nMulti-tenant Collections"]
    end

    Browser -- "HTTPS\n(HTML/CSS/JS bundle)" --> ReactApp
    Browser -- "REST API Calls\nHTTPS + JWT + x-store-id" --> NodeServer
    NodeServer -- "Mongoose ODM\nMongoDB Wire Protocol" --> MongoCluster

    subgraph LocalDev["💻 Local Development"]
        LocalFE["Vite Dev Server :5173\nHMR enabled"]
        LocalBE["Nodemon :3001\nAuto-restart"]
        LocalDB["MongoDB :27017\nDocker / Local Replica Set"]
    end

    LocalFE -- "localhost:3001" --> LocalBE
    LocalBE -- "localhost:27017" --> LocalDB
```

---

## 14. API Flow Diagram

Request lifecycle from frontend to database and back.

```mermaid
flowchart LR
    subgraph FE["🖥️ Frontend"]
        Page["React Page/Component"]
        AxiosInst["Axios Instance\n(api.js)"]
        Interceptor["Request Interceptor\nInjects: Authorization header\nInjects: x-store-id header"]
    end

    subgraph BE["⚙️ Backend Express"]
        CORS["CORS Middleware"]
        JSONParser["express.json()"]
        AuthMW["authenticate()\nMiddleware"]
        RouteHandler["Route Handler\n(products/sales/purchases/reports)"]
        ErrorHandler["Global Error\nHandler"]
    end

    subgraph DB["🗄️ MongoDB"]
        Model["Mongoose Model\n(Product/Sale/Purchase)"]
        Collection["MongoDB Collection\n(store-scoped query)"]
    end

    Page --> AxiosInst
    AxiosInst --> Interceptor
    Interceptor -- "HTTP Request" --> CORS
    CORS --> JSONParser
    JSONParser --> AuthMW
    AuthMW -- "401 if invalid" --> FE
    AuthMW -- "403 if insufficient role" --> FE
    AuthMW -- "req.user + req.userRole attached" --> RouteHandler
    RouteHandler --> Model
    Model --> Collection
    Collection -- "Result" --> Model
    Model -- "JSON" --> RouteHandler
    RouteHandler -- "HTTP Response" --> FE
    RouteHandler -- "on error" --> ErrorHandler
    ErrorHandler -- "500 JSON" --> FE
```

---

## 15. Role-Based Access Control (RBAC) Matrix

Permission matrix for all user roles across features.

| Feature / Endpoint | Admin | Co-Admin | Staff | Guest |
|---|:---:|:---:|:---:|:---:|
| **Authentication** | | | | |
| Sign Up (create store) | ✅ | ❌ | ❌ | ❌ |
| Sign In | ✅ | ✅ | ✅ | ❌ |
| Join Store via PIN | ❌ | ✅ | ✅ | ❌ |
| Guest Login | ❌ | ❌ | ❌ | ✅ |
| **Products** | | | | |
| View Products | ✅ | ✅ | ✅ | ✅ |
| Create Product | ✅ | ✅ | ❌ | ❌ |
| Edit Product | ✅ | ✅ | ❌ | ❌ |
| Delete Product | ✅ | ✅ | ❌ | ❌ |
| **Sales** | | | | |
| View Sales | ✅ | ✅ | ✅ | ✅ |
| Record Sale (atomic) | ✅ | ✅ | ✅ | ❌ |
| **Purchases** | | | | |
| View Purchases | ✅ | ✅ | ❌ | ❌ |
| Record Purchase (atomic) | ✅ | ✅ | ❌ | ❌ |
| **Reports & Analytics** | | | | |
| Dashboard Stats | ✅ | ✅ | ✅ (limited) | ✅ (limited) |
| Sales Trends | ✅ | ✅ | ❌ | ❌ |
| Top Products | ✅ | ✅ | ❌ | ❌ |
| Low Stock Alerts | ✅ | ✅ | ❌ | ❌ |
| **Store Management** | | | | |
| Switch Store | ✅ | ✅ | ✅ | ❌ |
| Create New Store | ✅ | ❌ | ❌ | ❌ |
| Update Store | ✅ | ❌ | ❌ | ❌ |
| Delete Store | ✅ | ❌ | ❌ | ❌ |
| **User Management** | | | | |
| View Store Users | ✅ | ❌ | ❌ | ❌ |
| Invite User | ✅ | ❌ | ❌ | ❌ |
| Update User Role | ✅ | ❌ | ❌ | ❌ |

---

## 📝 Notes

- **Multi-Tenancy**: All data queries are automatically scoped by `storeId`. The `x-store-id` request header is validated by the `authenticate` middleware on every protected route.
- **Atomic Transactions**: Sales and Purchases use MongoDB replica set transactions to ensure data integrity — if either the stock update or the record creation fails, both are rolled back.
- **JWT Strategy**: Tokens are stateless; sign-out is handled client-side by removing the token from `localStorage`. No server-side session store is used.
- **Low Stock**: The `isLowStock` field is a Mongoose virtual (computed at query time) based on `stock <= lowStockThreshold`. It does not persist in MongoDB.

---

*Generated for: Inventory Management System | Stack: React + Express.js + MongoDB*
