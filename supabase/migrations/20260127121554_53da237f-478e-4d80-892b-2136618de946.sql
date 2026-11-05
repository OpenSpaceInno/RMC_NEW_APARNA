-- Create incidents table for incident management
CREATE TABLE public.incidents (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_number text NOT NULL UNIQUE,
    title text NOT NULL,
    description text NOT NULL,
    type text NOT NULL CHECK (type IN ('safety', 'quality', 'operational', 'security', 'environmental', 'equipment')),
    severity text NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    status text NOT NULL DEFAULT 'reported' CHECK (status IN ('reported', 'investigating', 'resolved', 'closed')),
    location text NOT NULL,
    reported_by text NOT NULL,
    reported_at timestamp with time zone NOT NULL DEFAULT now(),
    assigned_to text,
    assigned_at timestamp with time zone,
    investigation_notes text,
    resolved_at timestamp with time zone,
    resolution text,
    vehicle_reg_no text,
    related_module text CHECK (related_module IN ('gate', 'weighbridge', 'loading', 'dispatch', 'trip', 'exit')),
    tags text[],
    source text DEFAULT 'manual' CHECK (source IN ('manual', 'automatic')),
    source_reference_id text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create incident evidence table
CREATE TABLE public.incident_evidence (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id uuid REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
    type text NOT NULL CHECK (type IN ('image', 'video', 'document')),
    url text NOT NULL,
    thumbnail text,
    file_name text NOT NULL,
    uploaded_at timestamp with time zone NOT NULL DEFAULT now(),
    uploaded_by text NOT NULL,
    description text
);

-- Create incident comments table
CREATE TABLE public.incident_comments (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    incident_id uuid REFERENCES public.incidents(id) ON DELETE CASCADE NOT NULL,
    user_id text NOT NULL,
    user_name text NOT NULL,
    comment text NOT NULL,
    timestamp timestamp with time zone NOT NULL DEFAULT now()
);

-- Create exit_verifications table
CREATE TABLE public.exit_verifications (
    id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
    verification_id text NOT NULL UNIQUE,
    vehicle_reg_no text NOT NULL,
    exit_timestamp timestamp with time zone NOT NULL DEFAULT now(),
    exit_weight numeric NOT NULL,
    entry_weight numeric,
    loading_weight numeric,
    weight_difference numeric NOT NULL,
    status text NOT NULL CHECK (status IN ('pending', 'verified', 'anomaly')),
    operator_id text NOT NULL,
    operator_name text NOT NULL,
    remarks text,
    anomaly_reason text,
    incident_id uuid REFERENCES public.incidents(id),
    created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exit_verifications ENABLE ROW LEVEL SECURITY;

-- Create policies for incidents (public access for now, will be secured with auth later)
CREATE POLICY "Allow public read access" ON public.incidents FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.incidents FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.incidents FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.incidents FOR DELETE USING (true);

-- Create policies for incident_evidence
CREATE POLICY "Allow public read access" ON public.incident_evidence FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.incident_evidence FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.incident_evidence FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.incident_evidence FOR DELETE USING (true);

-- Create policies for incident_comments
CREATE POLICY "Allow public read access" ON public.incident_comments FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.incident_comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.incident_comments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.incident_comments FOR DELETE USING (true);

-- Create policies for exit_verifications
CREATE POLICY "Allow public read access" ON public.exit_verifications FOR SELECT USING (true);
CREATE POLICY "Allow public insert access" ON public.exit_verifications FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update access" ON public.exit_verifications FOR UPDATE USING (true);
CREATE POLICY "Allow public delete access" ON public.exit_verifications FOR DELETE USING (true);

-- Create function to generate incident number
CREATE OR REPLACE FUNCTION public.generate_incident_number()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    next_num integer;
BEGIN
    SELECT COALESCE(MAX(CAST(SUBSTRING(incident_number FROM 5) AS integer)), 0) + 1 
    INTO next_num 
    FROM public.incidents;
    
    RETURN 'INC-' || LPAD(next_num::text, 3, '0');
END;
$$;

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates on incidents
CREATE TRIGGER update_incidents_updated_at
    BEFORE UPDATE ON public.incidents
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();