CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY, full_name TEXT NOT NULL, email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'operator', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS suppliers (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, contact_email TEXT,
  status TEXT NOT NULL DEFAULT 'active', created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS categories (
  id SERIAL PRIMARY KEY, name TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS inventory (
  id SERIAL PRIMARY KEY, sku TEXT UNIQUE NOT NULL, name TEXT NOT NULL,
  category_id INTEGER REFERENCES categories(id), supplier_id INTEGER REFERENCES suppliers(id),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  reorder_level INTEGER NOT NULL DEFAULT 10 CHECK (reorder_level >= 0),
  unit_price NUMERIC(12,2) NOT NULL DEFAULT 0, updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS customers (
  id SERIAL PRIMARY KEY, name TEXT NOT NULL, email TEXT, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY, order_number TEXT UNIQUE NOT NULL,
  customer_id INTEGER REFERENCES customers(id), status TEXT NOT NULL DEFAULT 'pending',
  total NUMERIC(12,2) NOT NULL DEFAULT 0, created_at TIMESTAMPTZ DEFAULT now()
);
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  inventory_id INTEGER NOT NULL REFERENCES inventory(id), quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price NUMERIC(12,2) NOT NULL
);
CREATE TABLE IF NOT EXISTS shipments (
  id SERIAL PRIMARY KEY, order_id INTEGER NOT NULL REFERENCES orders(id),
  carrier TEXT, tracking_number TEXT, status TEXT NOT NULL DEFAULT 'queued',
  shipped_at TIMESTAMPTZ
);
CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY, actor TEXT NOT NULL DEFAULT 'system',
  action TEXT NOT NULL, entity_type TEXT NOT NULL, entity_id INTEGER,
  details JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO categories(name) VALUES ('Electronics'), ('Packaging'), ('Components')
ON CONFLICT (name) DO NOTHING;
INSERT INTO suppliers(name, contact_email) VALUES
 ('Northstar Supply', 'supply@example.com'), ('Apex Components', 'orders@example.com')
ON CONFLICT DO NOTHING;
INSERT INTO inventory(sku,name,category_id,supplier_id,quantity,reorder_level,unit_price)
SELECT 'ESP-32', 'ESP32 Development Board', c.id, s.id, 42, 12, 8.50
FROM categories c CROSS JOIN suppliers s
WHERE c.name='Electronics' AND s.name='Northstar Supply'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO inventory(sku,name,category_id,supplier_id,quantity,reorder_level,unit_price)
SELECT 'USB-C-01', 'USB-C Cable', c.id, s.id, 8, 15, 3.25
FROM categories c CROSS JOIN suppliers s
WHERE c.name='Components' AND s.name='Apex Components'
ON CONFLICT (sku) DO NOTHING;
INSERT INTO customers(name,email) VALUES ('Demo Customer','customer@example.com')
ON CONFLICT DO NOTHING;
INSERT INTO orders(order_number, customer_id, status, total)
SELECT 'ORD-1001', id, 'processing', 356.00 FROM customers WHERE email='customer@example.com'
ON CONFLICT (order_number) DO NOTHING;
