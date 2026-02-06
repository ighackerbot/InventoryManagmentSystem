-- ============================================
-- RLS Testing Queries
-- Run these in Supabase SQL Editor to verify RLS policies
-- ============================================

-- Test 1: Verify user can only see their stores
-- Expected: Returns only stores where user has a role
SELECT * FROM stores;

-- Test 2: Verify store role checking function
-- Expected: Returns true if user has required role, false otherwise
SELECT has_store_role('[store-id-here]'::UUID, ARRAY['admin']);

-- Test 3: Verify get_user_stores function
-- Expected: Returns all stores accessible to current user with their roles
SELECT * FROM get_user_stores();

-- Test 4: Verify products are isolated by store
-- Expected: Returns only products from stores user has access to
SELECT p.*, s.name as store_name
FROM products p
JOIN stores s ON p.store_id = s.id;

-- Test 5: Verify staff cannot see purchases
-- Login as staff user and run:
SELECT * FROM purchases;
-- Expected: Returns empty or error if user is staff

-- Test 6: Verify audit logs are created
-- Insert a product, then check:
SELECT * FROM audit_logs WHERE entity_type = 'products' ORDER BY timestamp DESC LIMIT 5;

-- Test 7: Verify stock updates on sale
-- Create a sale and verify product stock decreases:
SELECT stock FROM products WHERE id = '[product-id]';
-- Create sale, then check again - stock should decrease

-- Test 8: Verify cross-store isolation
-- As User A (store 1), try to access User B's (store 2) data:
SELECT * FROM products WHERE store_id = '[store-2-id]';
-- Expected: Returns empty (RLS blocks access)

-- ============================================
-- Sample Data for Testing
-- ============================================

-- Note: Run these AFTER creating users through the app
-- Replace [user-id] with actual authenticated user IDs

-- Create test stores
INSERT INTO stores (name, type, owner_id) VALUES
('Test Shop 1', 'shop', '[user-1-id]'),
('Test Warehouse', 'godown', '[user-1-id]'),
('Test Branch', 'branch', '[user-2-id]');

-- Assign roles
INSERT INTO user_store_roles (user_id, store_id, role) VALUES
('[user-1-id]', '[store-1-id]', 'admin'),
('[user-2-id]', '[store-3-id]', 'admin'),
('[user-3-id]', '[store-1-id]', 'staff');

-- Create test products
INSERT INTO products (store_id, name, sku, stock, cost_price, selling_price, low_stock_threshold) VALUES
('[store-1-id]', 'Product A', 'SKU001', 100, 50.00, 75.00, 10),
('[store-1-id]', 'Product B', 'SKU002', 5, 30.00, 50.00, 10),
('[store-2-id]', 'Product C', 'SKU003', 200, 20.00, 35.00, 20);

-- ============================================
-- Cleanup (if needed)
-- ============================================

-- WARNING: This will delete ALL data
-- DROP TABLE IF EXISTS audit_logs CASCADE;
-- DROP TABLE IF EXISTS purchases CASCADE;
-- DROP TABLE IF EXISTS sales CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS user_store_roles CASCADE;
-- DROP TABLE IF EXISTS stores CASCADE;
