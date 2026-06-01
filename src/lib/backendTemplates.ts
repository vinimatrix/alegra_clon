/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const SUPABASE_SQL_TEMP = `-- ==========================================
-- 1. ESQUEMA DE BASE DE DATOS SUPABASE
-- ==========================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabla de Almacenes / Bodegas
CREATE TABLE warehouses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    location TEXT,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Clientes
CREATE TABLE clients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    rnc VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(50),
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Productos e Inventario
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    sku VARCHAR(100) NOT NULL UNIQUE,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    cost NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    stock INT NOT NULL DEFAULT 0,
    min_stock INT NOT NULL DEFAULT 5,
    category VARCHAR(100) NOT NULL,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    image_url TEXT,
    tax_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.18, -- e.g. 0.18 para ITBIS / IVA
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Tabla de Facturas
CREATE TABLE invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number VARCHAR(100) NOT NULL UNIQUE,
    client_id UUID REFERENCES clients(id) ON DELETE RESTRICT,
    issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    taxes NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pagada', 'pendiente', 'anulada')),
    payment_method VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Detalles de Factura
CREATE TABLE invoice_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id UUID REFERENCES invoices(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL,
    discount NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    tax_rate NUMERIC(4, 2) NOT NULL DEFAULT 0.18,
    total NUMERIC(12, 2) NOT NULL
);

-- Tabla de Cuentas Contables (Catálogo de Cuentas)
CREATE TABLE chart_of_accounts (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('activo', 'pasivo', 'patrimonio', 'ingreso', 'egreso')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    description TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Cabecera de Asientos Contables
CREATE TABLE journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT NOT NULL,
    reference VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Líneas de Asientos Contables (Debe/Haber por cuenta)
CREATE TABLE journal_entry_lines (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    entry_id UUID REFERENCES journal_entries(id) ON DELETE CASCADE,
    account_code VARCHAR(50) REFERENCES chart_of_accounts(code) ON DELETE RESTRICT,
    debit NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (debit >= 0),
    credit NUMERIC(12, 2) NOT NULL DEFAULT 0.00 CHECK (credit >= 0),
    CONSTRAINT chk_debit_credit CHECK (
        (debit > 0 AND credit = 0) OR 
        (debit = 0 AND credit > 0)
    )
);

-- Restaurante: Mesas
CREATE TABLE restaurant_tables (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'libre' CHECK (status IN ('libre', 'ocupada', 'atendiendo', 'por_pagar')),
    capacity INT DEFAULT 4,
    current_order_id UUID
);

-- Restaurante: Comandas / Órdenes
CREATE TABLE restaurant_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_id UUID REFERENCES restaurant_tables(id) ON DELETE SET NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'en_preparacion', 'entregada', 'cobrada')),
    subtotal NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    taxes NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    total NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    waiter_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE restaurant_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES restaurant_orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE RESTRICT,
    quantity INT NOT NULL CHECK (quantity > 0),
    price NUMERIC(12, 2) NOT NULL,
    notes TEXT
);

-- ==========================================
-- 2. DISPARADOR (TRIGGER) CONTRA INVENTARIO
-- ==========================================
-- Reduce el stock físico cuando una de las facturas sea asentada/pagada.

CREATE OR REPLACE FUNCTION adjust_stock_on_invoice()
RETURNS TRIGGER AS $$
DECLARE
    item RECORD;
BEGIN
    IF (TG_OP = 'INSERT') THEN
        -- Si la factura se crea directamente pagada, disminuye stock
        IF (NEW.status = 'pagada') THEN
            FOR item IN SELECT * FROM invoice_items WHERE invoice_id = NEW.id LOOP
                UPDATE products 
                SET stock = stock - item.quantity 
                WHERE id = item.product_id;
            END LOOP;
        END IF;
    ELSIF (TG_OP = 'UPDATE') THEN
        -- Si pasa de pendiente a pagada
        IF (OLD.status = 'pendiente' AND NEW.status = 'pagada') THEN
            FOR item IN SELECT * FROM invoice_items WHERE invoice_id = NEW.id LOOP
                UPDATE products 
                SET stock = stock - item.quantity 
                WHERE id = item.product_id;
            END LOOP;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_invoice_stock_adjust
AFTER INSERT OR UPDATE ON invoices
FOR EACH ROW EXECUTE FUNCTION adjust_stock_on_invoice();

-- ==========================================
-- 3. ROW LEVEL SECURITY (RLS) & POLITICAS
-- ==========================================
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Autorizar lectura pública o de usuario autenticado
CREATE POLICY "Permitir lectura a usuarios de la app" 
ON products FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Permitir escrituras a administradores" 
ON products FOR ALL 
TO authenticated 
USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================================
-- 4. NUEVOS MÓDULOS DE NEGOCIO (CITAS, PACIENTES Y PROYECTOS)
-- ============================================================

-- Estructura de Módulos Activos
CREATE TABLE business_modules_config (
    id VARCHAR(100) PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_enabled BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc''::text, now()) NOT NULL
);

-- Turnos y Citas de Clientes (Salones, Clínicas, Talleres)
CREATE TABLE appointment_turns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255) NOT NULL,
    phone VARCHAR(100),
    service_name VARCHAR(255) NOT NULL,
    price NUMERIC(12, 2) NOT NULL DEFAULT 0.00,
    appointment_date DATE NOT NULL,
    appointment_time VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'programado' CHECK (status IN ('programado', 'atendido', 'cancelado', 'no_asistio')),
    assigned_staff VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc''::text, now()) NOT NULL
);

-- Records Clínicos y Fichas Médicas de Pacientes
CREATE TABLE patient_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    patient_name VARCHAR(255) NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT NOT NULL,
    diagnosis TEXT NOT NULL,
    treatment TEXT NOT NULL,
    prescription TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc''::text, now()) NOT NULL
);

-- Proyectos Corporativos (Agencias, Consultorías, Devs)
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
    client_name VARCHAR(255),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'planeacion' CHECK (status IN ('planeacion', 'en_desarrollo', 'entregado', 'pausado')),
    progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc''::text, now()) NOT NULL
);

-- Tareas de Proyectos (Gantt, Kanban, SCRUM)
CREATE TABLE project_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'todo' CHECK (status IN ('todo', 'doing', 'review', 'done')),
    assignee VARCHAR(255),
    start_date DATE NOT NULL DEFAULT CURRENT_DATE,
    due_date DATE NOT NULL,
    duration_days INT DEFAULT 1
);
`;

export const NESTJS_CONTROLLER_TEMP = `// =========================================================
// NESTJS CONTROLLER, MODULE AND SERVICE FOR ALEGRA CLONE ERP
// =========================================================

// 1. PRODUCT ENTITY (TypeORM / Class-Validator)
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from 'typeorm';
import { IsString, IsNumber, IsOptional, Max, Min } from 'class-validator';

@Entity('products')
export class ProductEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @IsString()
  name: string;

  @Column({ unique: true })
  @IsString()
  sku: string;

  @Column('decimal', { precision: 12, scale: 2, default: 0.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @Column('decimal', { precision: 12, scale: 2, default: 0.00 })
  @IsNumber()
  @Min(0)
  cost: number;

  @Column({ default: 0 })
  @IsNumber()
  stock: number;

  @Column({ name: 'min_stock', default: 5 })
  @IsNumber()
  minStock: number;

  @Column()
  @IsString()
  category: string;

  @Column({ name: 'warehouse_id', nullable: true })
  @IsOptional()
  warehouseId: string;

  @Column({ name: 'tax_rate', type: 'decimal', precision: 4, scale: 2, default: 0.18 })
  @IsNumber()
  @Max(1)
  taxRate: number;

  @Column({ type: 'text', nullable: true })
  @IsOptional()
  description: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

// 2. PRODUCTS SERVICE (Business logic)
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: Repository<ProductEntity>,
  ) {}

  async findAll(): Promise<ProductEntity[]> {
    return this.productRepository.find();
  }

  async findOne(id: string): Promise<ProductEntity> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product) throw new NotFoundException(\`Producto con ID \${id} no encontrado\`);
    return product;
  }

  async create(data: Partial<ProductEntity>): Promise<ProductEntity> {
    const newProduct = this.productRepository.create(data);
    return this.productRepository.save(newProduct);
  }

  async update(id: string, data: Partial<ProductEntity>): Promise<ProductEntity> {
    const product = await this.findOne(id);
    Object.assign(product, data);
    return this.productRepository.save(product);
  }

  async decreaseStock(id: string, qty: number): Promise<ProductEntity> {
    const product = await this.findOne(id);
    product.stock -= qty;
    return this.productRepository.save(product);
  }
}

// 3. PRODUCTS CONTROLLER (REST API Interface)
import { Controller, Get, Post, Put, Body, Param, UseGuards } from '@nestjs/common';
// Opcional: AuthGuard para validar JWT
// import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'; 

@Controller('api/products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  async getAllProducts() {
    return this.productsService.findAll();
  }

  @Get(':id')
  async getProduct(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  @Post()
  async createProduct(@Body() createDto: Partial<ProductEntity>) {
    return this.productsService.create(createDto);
  }

  @Put(':id')
  async updateProduct(
    @Param('id') id: string,
    @Body() updateDto: Partial<ProductEntity>
  ) {
    return this.productsService.update(id, updateDto);
  }
}

// 4. MODULE ARCHITECTURE CONFIGURATION
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
  imports: [TypeOrmModule.forFeature([ProductEntity])],
  controllers: [ProductsController],
  providers: [ProductsService],
  exports: [ProductsService]
})
export class ProductsModule {}
`;

export const SUPABASE_JS_CLIENT = `// Configuración del Cliente Supabase en React (src/lib/supabaseClient.ts)
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://suproyectoid.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'su-anon-public-key-here';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/*
Guía rápida de consultas en React:

// Obtener productos
export async function getProducts() {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('name', { ascending: true });
  return { data, error };
}

// Escuchar cambios en vivo (Real-time para Modo Restaurante / POS)
export function subscribeToOrders(onUpdate: (payload: any) => void) {
  return supabase
    .channel('custom-all-channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'restaurant_orders' }, onUpdate)
    .subscribe();
}
*/
`;
