-- =====================================================
-- MAINTENANCE SCHEDULER TABLES
-- =====================================================

-- Maintenance Tasks Table
CREATE TABLE public.maintenance_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  vehicle_reg_no TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('preventive', 'corrective', 'inspection', 'emergency')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'overdue')),
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  scheduled_date TIMESTAMPTZ NOT NULL,
  completed_date TIMESTAMPTZ,
  estimated_cost DECIMAL(12,2) DEFAULT 0,
  actual_cost DECIMAL(12,2),
  technician TEXT,
  notes TEXT,
  next_due_date DATE,
  next_due_odometer INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance Parts Table
CREATE TABLE public.maintenance_parts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  task_id UUID REFERENCES public.maintenance_tasks(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  part_number TEXT,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Maintenance Schedules Table
CREATE TABLE public.maintenance_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_id TEXT NOT NULL,
  vehicle_reg_no TEXT NOT NULL,
  task_name TEXT NOT NULL,
  interval_km INTEGER,
  interval_days INTEGER,
  last_performed DATE,
  last_odometer INTEGER,
  next_due_date DATE NOT NULL,
  next_due_odometer INTEGER,
  is_overdue BOOLEAN DEFAULT false,
  days_until_due INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Parts Inventory Table
CREATE TABLE public.parts_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  part_number TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  supplier TEXT,
  location TEXT,
  last_restocked DATE,
  is_low_stock BOOLEAN GENERATED ALWAYS AS (quantity < min_stock) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- BILLING & INVOICING TABLES
-- =====================================================

-- Invoices Table
CREATE TABLE public.invoices (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_number TEXT UNIQUE NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  customer_address TEXT,
  customer_email TEXT,
  customer_phone TEXT,
  customer_gst TEXT,
  trip_ids TEXT[],
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  paid_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  balance_amount DECIMAL(12,2) GENERATED ALWAYS AS (total_amount - paid_amount) STORED,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'pending', 'paid', 'overdue', 'cancelled')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_date DATE,
  notes TEXT,
  terms TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Invoice Items Table
CREATE TABLE public.invoice_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  quantity DECIMAL(12,2) NOT NULL DEFAULT 1,
  unit TEXT NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  tax_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_amount DECIMAL(12,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payments Table
CREATE TABLE public.payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  customer_id TEXT NOT NULL,
  customer_name TEXT NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('cash', 'cheque', 'bank_transfer', 'upi', 'card', 'other')),
  reference_number TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- INVENTORY MANAGEMENT TABLES
-- =====================================================

-- Inventory Items Table
CREATE TABLE public.inventory_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('cement', 'aggregate', 'sand', 'admixture', 'water', 'other')),
  unit TEXT NOT NULL,
  current_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  min_stock DECIMAL(12,2) NOT NULL DEFAULT 0,
  max_stock DECIMAL(12,2) NOT NULL DEFAULT 1000,
  reorder_level DECIMAL(12,2) NOT NULL DEFAULT 0,
  reorder_quantity DECIMAL(12,2) NOT NULL DEFAULT 0,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_value DECIMAL(12,2) GENERATED ALWAYS AS (current_stock * unit_cost) STORED,
  location TEXT,
  supplier TEXT,
  supplier_contact TEXT,
  last_received DATE,
  last_consumed DATE,
  is_low_stock BOOLEAN GENERATED ALWAYS AS (current_stock < reorder_level) STORED,
  is_overstock BOOLEAN GENERATED ALWAYS AS (current_stock > max_stock) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Stock Movements Table
CREATE TABLE public.stock_movements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_sku TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('receipt', 'consumption', 'transfer', 'adjustment', 'return')),
  quantity DECIMAL(12,2) NOT NULL,
  previous_stock DECIMAL(12,2) NOT NULL,
  new_stock DECIMAL(12,2) NOT NULL,
  unit_cost DECIMAL(12,2) NOT NULL DEFAULT 0,
  total_cost DECIMAL(12,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,
  reference_number TEXT,
  trip_id TEXT,
  notes TEXT,
  performed_by TEXT,
  date TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Reorder Alerts Table
CREATE TABLE public.reorder_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  item_id UUID REFERENCES public.inventory_items(id) ON DELETE CASCADE,
  item_name TEXT NOT NULL,
  item_sku TEXT NOT NULL,
  current_stock DECIMAL(12,2) NOT NULL,
  reorder_level DECIMAL(12,2) NOT NULL,
  reorder_quantity DECIMAL(12,2) NOT NULL,
  supplier TEXT,
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'acknowledged', 'ordered', 'received', 'cancelled')),
  acknowledged_at TIMESTAMPTZ,
  ordered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- REPORTS TABLES
-- =====================================================

-- Generated Reports Table
CREATE TABLE public.generated_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv')),
  parameters JSONB,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  generated_by TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  file_size INTEGER,
  file_url TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Scheduled Reports Table
CREATE TABLE public.scheduled_reports (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  format TEXT NOT NULL CHECK (format IN ('pdf', 'excel', 'csv')),
  frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'monthly', 'quarterly')),
  parameters JSONB,
  recipients TEXT[],
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_run TIMESTAMPTZ,
  next_run TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.maintenance_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.maintenance_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parts_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reorder_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (for now, can be restricted later with auth)
CREATE POLICY "Allow public read access" ON public.maintenance_tasks FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.maintenance_tasks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.maintenance_tasks FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.maintenance_tasks FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.maintenance_parts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.maintenance_parts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.maintenance_parts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.maintenance_parts FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.maintenance_schedules FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.maintenance_schedules FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.maintenance_schedules FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.maintenance_schedules FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.parts_inventory FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.parts_inventory FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.parts_inventory FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.parts_inventory FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.invoices FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.invoices FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.invoices FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.invoices FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.invoice_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.invoice_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.invoice_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.invoice_items FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.payments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.payments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.payments FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.inventory_items FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.inventory_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.inventory_items FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.inventory_items FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.stock_movements FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.stock_movements FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.stock_movements FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.stock_movements FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.reorder_alerts FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.reorder_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.reorder_alerts FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.reorder_alerts FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.generated_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.generated_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.generated_reports FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.generated_reports FOR DELETE USING (true);

CREATE POLICY "Allow public read access" ON public.scheduled_reports FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.scheduled_reports FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.scheduled_reports FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.scheduled_reports FOR DELETE USING (true);

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_maintenance_tasks_updated_at BEFORE UPDATE ON public.maintenance_tasks FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_maintenance_schedules_updated_at BEFORE UPDATE ON public.maintenance_schedules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_parts_inventory_updated_at BEFORE UPDATE ON public.parts_inventory FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON public.invoices FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON public.inventory_items FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_scheduled_reports_updated_at BEFORE UPDATE ON public.scheduled_reports FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();