-- ============================================================
-- ALEGRA+ ERP - Supabase Database Schema
-- ============================================================
-- Ejecuta este script en el SQL Editor de tu proyecto de Supabase:
-- Dashboard → SQL Editor → New Query → Paste → Run
-- ============================================================

-- Habilitar extensiones requeridas
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- TABLA: products (Catálogo de Productos e Inventario)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.products (
  id          TEXT PRIMARY KEY DEFAULT ('p-' || gen_random_uuid()::text),
  name        TEXT NOT NULL,
  sku         TEXT UNIQUE NOT NULL,
  price       NUMERIC(12,2) NOT NULL DEFAULT 0,
  cost        NUMERIC(12,2) NOT NULL DEFAULT 0,
  stock       INTEGER NOT NULL DEFAULT 0,
  min_stock   INTEGER NOT NULL DEFAULT 5,
  category    TEXT NOT NULL DEFAULT 'General',
  warehouse_id TEXT,
  tax_rate    NUMERIC(5,4) NOT NULL DEFAULT 0.18,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: clients (Contactos / Clientes)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.clients (
  id        TEXT PRIMARY KEY DEFAULT ('c-' || gen_random_uuid()::text),
  name      TEXT NOT NULL,
  rnc       TEXT,
  email     TEXT,
  phone     TEXT,
  address   TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: invoices (Facturas de Venta)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id              TEXT PRIMARY KEY DEFAULT ('f-' || gen_random_uuid()::text),
  invoice_number  TEXT UNIQUE NOT NULL,
  client_id       TEXT REFERENCES public.clients(id),
  client_name     TEXT NOT NULL,
  client_rnc      TEXT,
  issue_date      DATE NOT NULL,
  due_date        DATE,
  subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
  taxes           NUMERIC(12,2) NOT NULL DEFAULT 0,
  discount        NUMERIC(12,2) NOT NULL DEFAULT 0,
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagada', 'anulada', 'vencida')),
  payment_method  TEXT,
  notes           TEXT,
  ncf             TEXT,
  ncf_type        TEXT,
  items           JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: expenses (Gastos y Compras)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id            TEXT PRIMARY KEY DEFAULT ('exp-' || gen_random_uuid()::text),
  number        TEXT UNIQUE NOT NULL,
  supplier_id   TEXT REFERENCES public.clients(id),
  supplier_name TEXT NOT NULL,
  supplier_rnc  TEXT,
  date          DATE NOT NULL,
  ncf           TEXT,
  ncf_type      TEXT,
  subtotal      NUMERIC(12,2) NOT NULL DEFAULT 0,
  itbis         NUMERIC(12,2) NOT NULL DEFAULT 0,
  total         NUMERIC(12,2) NOT NULL DEFAULT 0,
  status        TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado')),
  category      TEXT,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: accounts (Catálogo de Cuentas Contables)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.accounts (
  code        TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('activo', 'pasivo', 'patrimonio', 'ingreso', 'egreso')),
  balance     NUMERIC(14,2) NOT NULL DEFAULT 0,
  description TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: journal_entries (Asientos Contables)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.journal_entries (
  id          TEXT PRIMARY KEY DEFAULT ('as-' || gen_random_uuid()::text),
  date        DATE NOT NULL,
  description TEXT NOT NULL,
  reference   TEXT,
  lines       JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: tables (Mesas del Restaurante)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.tables (
  id        TEXT PRIMARY KEY DEFAULT ('t-' || gen_random_uuid()::text),
  name      TEXT NOT NULL,
  status    TEXT NOT NULL DEFAULT 'libre' CHECK (status IN ('libre', 'ocupada', 'atendiendo', 'por_pagar')),
  capacity  INTEGER NOT NULL DEFAULT 4,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: orders (Comandas del Restaurante)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.orders (
  id          TEXT PRIMARY KEY DEFAULT ('ord-' || gen_random_uuid()::text),
  table_id    TEXT REFERENCES public.tables(id),
  table_name  TEXT NOT NULL,
  items       JSONB NOT NULL DEFAULT '[]'::jsonb,
  status      TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_preparacion', 'entregada', 'cancelada')),
  subtotal    NUMERIC(12,2) NOT NULL DEFAULT 0,
  taxes       NUMERIC(12,2) NOT NULL DEFAULT 0,
  total       NUMERIC(12,2) NOT NULL DEFAULT 0,
  waiter_name TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: employees (Empleados / RRHH)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.employees (
  id          TEXT PRIMARY KEY DEFAULT ('emp-' || gen_random_uuid()::text),
  name        TEXT NOT NULL,
  cedula      TEXT UNIQUE NOT NULL,
  position    TEXT NOT NULL,
  department  TEXT NOT NULL,
  salary      NUMERIC(12,2) NOT NULL DEFAULT 0,
  start_date  DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'activo' CHECK (status IN ('activo', 'inactivo')),
  email       TEXT,
  phone       TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: payrolls (Nóminas Generadas)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payrolls (
  id              TEXT PRIMARY KEY DEFAULT ('pay-' || gen_random_uuid()::text),
  employee_id     TEXT REFERENCES public.employees(id),
  employee_name   TEXT NOT NULL,
  period          TEXT NOT NULL,
  gross_salary    NUMERIC(12,2) NOT NULL DEFAULT 0,
  deductions      JSONB NOT NULL DEFAULT '[]'::jsonb,
  total_deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
  net_salary      NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagada')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- POLÍTICAS DE SEGURIDAD (Row Level Security - RLS)
-- ============================================================
-- Habilitar RLS en todas las tablas
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payrolls ENABLE ROW LEVEL SECURITY;

-- Política de acceso público para desarrollo (ajustar en producción con auth.uid())
-- En producción, reemplaza estas policies con: USING (auth.uid() = user_id)
CREATE POLICY "allow_all_for_now" ON public.products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_for_now" ON public.clients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_for_now" ON public.invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_for_now" ON public.expenses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_for_now" ON public.accounts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_for_now" ON public.journal_entries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_for_now" ON public.tables FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_for_now" ON public.orders FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_for_now" ON public.employees FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_for_now" ON public.payrolls FOR ALL USING (true) WITH CHECK (true);

-- ============================================================
-- TRIGGERS: auto-update de updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER accounts_updated_at BEFORE UPDATE ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ============================================================
-- DATOS SEMILLA (Seed Data) - Opcional
-- ============================================================
-- Descomenta y ejecuta para poblar la base de datos con datos iniciales.
-- INSERT INTO public.clients (id, name, rnc, email, phone) VALUES
--   ('c-gen', 'Cliente de Contado / Consumidor Final', '224-0012344-5', 'ventas@alegraclone.com', 'N/A');
--
-- INSERT INTO public.products (id, name, sku, price, cost, stock, min_stock, category, tax_rate) VALUES
--   ('p-01', 'Mofongo con Chicharrón', 'REST-001', 450.00, 180.00, 120, 20, 'Platos', 0.18),
--   ('p-02', 'Pechuga de Pollo a la Plancha', 'REST-002', 390.00, 150.00, 95, 15, 'Platos', 0.18),
--   ('p-08', 'Audífonos Bluetooth Wireless Pro', 'RET-001', 1800.00, 850.00, 24, 5, 'Tecnología', 0.18);
