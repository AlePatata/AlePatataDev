-- Ver plan/08-fase-2.md, paso 1.
-- Tipo de categoría: gasto, reembolso (resta del gasto) o ingreso.
ALTER TABLE categories ADD COLUMN kind TEXT NOT NULL DEFAULT 'expense' CHECK (kind IN ('expense', 'refund', 'income'));

CREATE INDEX idx_transactions_category ON transactions(category_id);

-- Categorías iniciales (se pueden cambiar en Ajustes)
INSERT INTO categories (name, color, kind) VALUES
  ('Comida y salidas', '#ec4899', 'expense'),
  ('Supermercado', '#f97316', 'expense'),
  ('Transporte', '#0ea5e9', 'expense'),
  ('Universidad', '#8b5cf6', 'expense'),
  ('Compras', '#eab308', 'expense'),
  ('Salud', '#14b8a6', 'expense'),
  ('Suscripciones', '#6366f1', 'expense'),
  ('Efectivo', '#84cc16', 'expense'),
  ('Transferencias', '#f43f5e', 'expense'),
  ('Otros', '#94a3b8', 'expense'),
  ('Reembolso', '#10b981', 'refund'),
  ('Ingreso', '#059669', 'income');

-- Reglas genéricas de comercios comunes. Las reglas con nombres de personas se crean desde la app
-- y viven solo en la base (el repo es público).
INSERT INTO category_rules (pattern, category_id) SELECT 'giro cajero', id FROM categories WHERE name = 'Efectivo';
INSERT INTO category_rules (pattern, category_id) SELECT 'uber eats', id FROM categories WHERE name = 'Comida y salidas';
INSERT INTO category_rules (pattern, category_id) SELECT 'rappi', id FROM categories WHERE name = 'Comida y salidas';
INSERT INTO category_rules (pattern, category_id) SELECT 'pedidosya', id FROM categories WHERE name = 'Comida y salidas';
INSERT INTO category_rules (pattern, category_id) SELECT 'uber', id FROM categories WHERE name = 'Transporte';
INSERT INTO category_rules (pattern, category_id) SELECT 'didi', id FROM categories WHERE name = 'Transporte';
INSERT INTO category_rules (pattern, category_id) SELECT 'cabify', id FROM categories WHERE name = 'Transporte';
INSERT INTO category_rules (pattern, category_id) SELECT 'metro', id FROM categories WHERE name = 'Transporte';
INSERT INTO category_rules (pattern, category_id) SELECT 'lider', id FROM categories WHERE name = 'Supermercado';
INSERT INTO category_rules (pattern, category_id) SELECT 'jumbo', id FROM categories WHERE name = 'Supermercado';
INSERT INTO category_rules (pattern, category_id) SELECT 'unimarc', id FROM categories WHERE name = 'Supermercado';
INSERT INTO category_rules (pattern, category_id) SELECT 'santa isabel', id FROM categories WHERE name = 'Supermercado';
INSERT INTO category_rules (pattern, category_id) SELECT 'tottus', id FROM categories WHERE name = 'Supermercado';
INSERT INTO category_rules (pattern, category_id) SELECT 'farmacia', id FROM categories WHERE name = 'Salud';
INSERT INTO category_rules (pattern, category_id) SELECT 'cruz verde', id FROM categories WHERE name = 'Salud';
INSERT INTO category_rules (pattern, category_id) SELECT 'salcobrand', id FROM categories WHERE name = 'Salud';
INSERT INTO category_rules (pattern, category_id) SELECT 'ahumada', id FROM categories WHERE name = 'Salud';
INSERT INTO category_rules (pattern, category_id) SELECT 'netflix', id FROM categories WHERE name = 'Suscripciones';
INSERT INTO category_rules (pattern, category_id) SELECT 'spotify', id FROM categories WHERE name = 'Suscripciones';
INSERT INTO category_rules (pattern, category_id) SELECT 'comision', id FROM categories WHERE name = 'Otros';
