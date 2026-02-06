-- ============================================
-- Multi-Tenant Inventory Management System
-- Database Schema with RLS Policies
-- ============================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- TABLES
-- ============================================

-- Stores table: Multi-store/multi-tenant support
CREATE TABLE stores (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('shop', 'godown', 'branch')),
    address TEXT,
    owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    currency VARCHAR(10) DEFAULT 'INR',
    tax_percent DECIMAL(5,2) DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User-Store-Roles junction table: Multi-tenant role management
CREATE TABLE user_store_roles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'coadmin', 'staff')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, store_id)
);

-- Products table: Enhanced with multi-tenant support
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    description TEXT,
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    low_stock_threshold INTEGER DEFAULT 10 CHECK (low_stock_threshold >= 0),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(store_id, sku)
);

-- Sales table: Enhanced with multi-tenant support
CREATE TABLE sales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    selling_price DECIMAL(10,2) NOT NULL CHECK (selling_price >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    customer_name VARCHAR(255),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Purchases table: Enhanced with multi-tenant support
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    cost_price DECIMAL(10,2) NOT NULL CHECK (cost_price >= 0),
    total_amount DECIMAL(10,2) NOT NULL CHECK (total_amount >= 0),
    supplier_name VARCHAR(255),
    created_by UUID NOT NULL REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Audit logs table: Track all critical actions
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    store_id UUID REFERENCES stores(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'ROLE_CHANGE')),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_user_store_roles_user_id ON user_store_roles(user_id);
CREATE INDEX idx_user_store_roles_store_id ON user_store_roles(store_id);
CREATE INDEX idx_products_store_id ON products(store_id);
CREATE INDEX idx_products_sku ON products(store_id, sku);
CREATE INDEX idx_sales_store_id ON sales(store_id);
CREATE INDEX idx_sales_created_at ON sales(created_at);
CREATE INDEX idx_purchases_store_id ON purchases(store_id);
CREATE INDEX idx_purchases_created_at ON purchases(created_at);
CREATE INDEX idx_audit_logs_store_id ON audit_logs(store_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- ============================================
-- FUNCTIONS
-- ============================================

-- Get all stores accessible to current user
CREATE OR REPLACE FUNCTION get_user_stores()
RETURNS TABLE (store_id UUID, role TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT usr.store_id, usr.role::TEXT
    FROM user_store_roles usr
    WHERE usr.user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has required role in a store
CREATE OR REPLACE FUNCTION has_store_role(p_store_id UUID, required_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_store_roles
        WHERE user_id = auth.uid()
        AND store_id = p_store_id
        AND role = ANY(required_roles)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if user has access to a store (any role)
CREATE OR REPLACE FUNCTION has_store_access(p_store_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM user_store_roles
        WHERE user_id = auth.uid()
        AND store_id = p_store_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Audit logging trigger function
CREATE OR REPLACE FUNCTION audit_trigger()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'DELETE') THEN
        INSERT INTO audit_logs (user_id, store_id, action, entity_type, entity_id, old_values)
        VALUES (auth.uid(), OLD.store_id, 'DELETE', TG_TABLE_NAME, OLD.id, row_to_json(OLD));
        RETURN OLD;
    ELSIF (TG_OP = 'UPDATE') THEN
        INSERT INTO audit_logs (user_id, store_id, action, entity_type, entity_id, old_values, new_values)
        VALUES (auth.uid(), NEW.store_id, 'UPDATE', TG_TABLE_NAME, NEW.id, row_to_json(OLD), row_to_json(NEW));
        RETURN NEW;
    ELSIF (TG_OP = 'INSERT') THEN
        INSERT INTO audit_logs (user_id, store_id, action, entity_type, entity_id, new_values)
        VALUES (auth.uid(), NEW.store_id, 'CREATE', TG_TABLE_NAME, NEW.id, row_to_json(NEW));
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-create first store on user signup
CREATE OR REPLACE FUNCTION create_first_store_for_user()
RETURNS TRIGGER AS $$
DECLARE
    new_store_id UUID;
BEGIN
    -- Create default store
    INSERT INTO stores (name, type, owner_id)
    VALUES ('My Store', 'shop', NEW.id)
    RETURNING id INTO new_store_id;
    
    -- Assign user as admin
    INSERT INTO user_store_roles (user_id, store_id, role)
    VALUES (NEW.id, new_store_id, 'admin');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update stock on sale
CREATE OR REPLACE FUNCTION update_stock_on_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock - NEW.quantity
    WHERE id = NEW.product_id;
    
    -- Check if stock is sufficient
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Product not found';
    END IF;
    
    -- Verify stock didn't go negative
    IF (SELECT stock FROM products WHERE id = NEW.product_id) < 0 THEN
        RAISE EXCEPTION 'Insufficient stock';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Update stock on purchase
CREATE OR REPLACE FUNCTION update_stock_on_purchase()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE products
    SET stock = stock + NEW.quantity
    WHERE id = NEW.product_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- TRIGGERS
-- ============================================

-- Updated_at triggers
CREATE TRIGGER update_stores_updated_at BEFORE UPDATE ON stores
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_store_roles_updated_at BEFORE UPDATE ON user_store_roles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create first store on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION create_first_store_for_user();

-- Audit logging triggers
CREATE TRIGGER audit_products AFTER INSERT OR UPDATE OR DELETE ON products
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_sales AFTER INSERT OR UPDATE OR DELETE ON sales
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

CREATE TRIGGER audit_purchases AFTER INSERT OR UPDATE OR DELETE ON purchases
    FOR EACH ROW EXECUTE FUNCTION audit_trigger();

-- Stock management triggers
CREATE TRIGGER trigger_update_stock_on_sale AFTER INSERT ON sales
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_sale();

CREATE TRIGGER trigger_update_stock_on_purchase AFTER INSERT ON purchases
    FOR EACH ROW EXECUTE FUNCTION update_stock_on_purchase();

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE stores ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_store_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- STORES POLICIES
-- ============================================

-- Users can view stores they have access to
CREATE POLICY "Users can view accessible stores" ON stores
    FOR SELECT
    USING (
        id IN (SELECT store_id FROM user_store_roles WHERE user_id = auth.uid())
        OR owner_id = auth.uid()
    );

-- Any authenticated user can create a store
CREATE POLICY "Authenticated users can create stores" ON stores
    FOR INSERT
    WITH CHECK (auth.uid() IS NOT NULL AND owner_id = auth.uid());

-- Only store owner and admins can update store
CREATE POLICY "Store owner and admins can update" ON stores
    FOR UPDATE
    USING (
        owner_id = auth.uid()
        OR has_store_role(id, ARRAY['admin'])
    )
    WITH CHECK (
        owner_id = auth.uid()
        OR has_store_role(id, ARRAY['admin'])
    );

-- Only store owner can delete store
CREATE POLICY "Store owner can delete" ON stores
    FOR DELETE
    USING (owner_id = auth.uid());

-- ============================================
-- USER_STORE_ROLES POLICIES
-- ============================================

-- Users can view roles in their accessible stores
CREATE POLICY "Users can view store roles" ON user_store_roles
    FOR SELECT
    USING (has_store_access(store_id));

-- Admins can insert new user roles
CREATE POLICY "Admins can add users to stores" ON user_store_roles
    FOR INSERT
    WITH CHECK (has_store_role(store_id, ARRAY['admin']));

-- Admins can update user roles
CREATE POLICY "Admins can update user roles" ON user_store_roles
    FOR UPDATE
    USING (has_store_role(store_id, ARRAY['admin']))
    WITH CHECK (has_store_role(store_id, ARRAY['admin']));

-- Admins can remove users from stores
CREATE POLICY "Admins can remove users" ON user_store_roles
    FOR DELETE
    USING (has_store_role(store_id, ARRAY['admin']));

-- ============================================
-- PRODUCTS POLICIES
-- ============================================

-- All store members can view products
CREATE POLICY "Store members can view products" ON products
    FOR SELECT
    USING (has_store_access(store_id));

-- Admin and coadmin can insert products
CREATE POLICY "Admin and coadmin can create products" ON products
    FOR INSERT
    WITH CHECK (has_store_role(store_id, ARRAY['admin', 'coadmin']));

-- Admin and coadmin can update products
CREATE POLICY "Admin and coadmin can update products" ON products
    FOR UPDATE
    USING (has_store_role(store_id, ARRAY['admin', 'coadmin']))
    WITH CHECK (has_store_role(store_id, ARRAY['admin', 'coadmin']));

-- Admin and coadmin can delete products
CREATE POLICY "Admin and coadmin can delete products" ON products
    FOR DELETE
    USING (has_store_role(store_id, ARRAY['admin', 'coadmin']));

-- ============================================
-- SALES POLICIES
-- ============================================

-- All store members can view sales
CREATE POLICY "Store members can view sales" ON sales
    FOR SELECT
    USING (has_store_access(store_id));

-- All store members can create sales
CREATE POLICY "Store members can create sales" ON sales
    FOR INSERT
    WITH CHECK (
        has_store_access(store_id)
        AND created_by = auth.uid()
    );

-- Admin and coadmin can update sales
CREATE POLICY "Admin and coadmin can update sales" ON sales
    FOR UPDATE
    USING (has_store_role(store_id, ARRAY['admin', 'coadmin']))
    WITH CHECK (has_store_role(store_id, ARRAY['admin', 'coadmin']));

-- Admin and coadmin can delete sales
CREATE POLICY "Admin and coadmin can delete sales" ON sales
    FOR DELETE
    USING (has_store_role(store_id, ARRAY['admin', 'coadmin']));

-- ============================================
-- PURCHASES POLICIES
-- ============================================

-- Only admin and coadmin can view purchases
CREATE POLICY "Admin and coadmin can view purchases" ON purchases
    FOR SELECT
    USING (has_store_role(store_id, ARRAY['admin', 'coadmin']));

-- Only admin and coadmin can create purchases
CREATE POLICY "Admin and coadmin can create purchases" ON purchases
    FOR INSERT
    WITH CHECK (
        has_store_role(store_id, ARRAY['admin', 'coadmin'])
        AND created_by = auth.uid()
    );

-- Only admin and coadmin can update purchases
CREATE POLICY "Admin and coadmin can update purchases" ON purchases
    FOR UPDATE
    USING (has_store_role(store_id, ARRAY['admin', 'coadmin']))
    WITH CHECK (has_store_role(store_id, ARRAY['admin', 'coadmin']));

-- Only admin and coadmin can delete purchases
CREATE POLICY "Admin and coadmin can delete purchases" ON purchases
    FOR DELETE
    USING (has_store_role(store_id, ARRAY['admin', 'coadmin']));

-- ============================================
-- AUDIT_LOGS POLICIES
-- ============================================

-- Only admins can view audit logs
CREATE POLICY "Admins can view audit logs" ON audit_logs
    FOR SELECT
    USING (has_store_role(store_id, ARRAY['admin']));

-- System can insert audit logs (via triggers)
CREATE POLICY "System can insert audit logs" ON audit_logs
    FOR INSERT
    WITH CHECK (true);

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE stores IS 'Multi-tenant stores/locations for inventory management';
COMMENT ON TABLE user_store_roles IS 'User roles per store for multi-tenant access control';
COMMENT ON TABLE products IS 'Products with multi-store support and stock tracking';
COMMENT ON TABLE sales IS 'Sales transactions with automatic stock deduction';
COMMENT ON TABLE purchases IS 'Purchase orders with automatic stock addition';
COMMENT ON TABLE audit_logs IS 'Audit trail for all critical operations';

-- ============================================
-- COMPLETION MESSAGE
-- ============================================

DO $$
BEGIN
    RAISE NOTICE '✅ Multi-tenant inventory schema created successfully!';
    RAISE NOTICE '📋 Tables: stores, user_store_roles, products, sales, purchases, audit_logs';
    RAISE NOTICE '🔒 RLS policies enabled on all tables';
    RAISE NOTICE '⚡ Triggers: auto stock updates, audit logging, first store creation';
    RAISE NOTICE '🛡️ Ready for multi-tenant SaaS deployment!';
END $$;
