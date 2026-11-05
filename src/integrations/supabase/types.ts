export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      exit_verifications: {
        Row: {
          anomaly_reason: string | null
          created_at: string
          entry_weight: number | null
          exit_timestamp: string
          exit_weight: number
          id: string
          incident_id: string | null
          loading_weight: number | null
          operator_id: string
          operator_name: string
          remarks: string | null
          status: string
          vehicle_reg_no: string
          verification_id: string
          weight_difference: number
        }
        Insert: {
          anomaly_reason?: string | null
          created_at?: string
          entry_weight?: number | null
          exit_timestamp?: string
          exit_weight: number
          id?: string
          incident_id?: string | null
          loading_weight?: number | null
          operator_id: string
          operator_name: string
          remarks?: string | null
          status: string
          vehicle_reg_no: string
          verification_id: string
          weight_difference: number
        }
        Update: {
          anomaly_reason?: string | null
          created_at?: string
          entry_weight?: number | null
          exit_timestamp?: string
          exit_weight?: number
          id?: string
          incident_id?: string | null
          loading_weight?: number | null
          operator_id?: string
          operator_name?: string
          remarks?: string | null
          status?: string
          vehicle_reg_no?: string
          verification_id?: string
          weight_difference?: number
        }
        Relationships: [
          {
            foreignKeyName: "exit_verifications_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_reports: {
        Row: {
          created_at: string
          error_message: string | null
          file_size: number | null
          file_url: string | null
          format: string
          generated_at: string
          generated_by: string | null
          id: string
          name: string
          parameters: Json | null
          status: string
          type: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          file_size?: number | null
          file_url?: string | null
          format: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          name: string
          parameters?: Json | null
          status?: string
          type: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          file_size?: number | null
          file_url?: string | null
          format?: string
          generated_at?: string
          generated_by?: string | null
          id?: string
          name?: string
          parameters?: Json | null
          status?: string
          type?: string
        }
        Relationships: []
      }
      incident_comments: {
        Row: {
          comment: string
          id: string
          incident_id: string
          timestamp: string
          user_id: string
          user_name: string
        }
        Insert: {
          comment: string
          id?: string
          incident_id: string
          timestamp?: string
          user_id: string
          user_name: string
        }
        Update: {
          comment?: string
          id?: string
          incident_id?: string
          timestamp?: string
          user_id?: string
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_comments_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incident_evidence: {
        Row: {
          description: string | null
          file_name: string
          id: string
          incident_id: string
          thumbnail: string | null
          type: string
          uploaded_at: string
          uploaded_by: string
          url: string
        }
        Insert: {
          description?: string | null
          file_name: string
          id?: string
          incident_id: string
          thumbnail?: string | null
          type: string
          uploaded_at?: string
          uploaded_by: string
          url: string
        }
        Update: {
          description?: string | null
          file_name?: string
          id?: string
          incident_id?: string
          thumbnail?: string | null
          type?: string
          uploaded_at?: string
          uploaded_by?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "incident_evidence_incident_id_fkey"
            columns: ["incident_id"]
            isOneToOne: false
            referencedRelation: "incidents"
            referencedColumns: ["id"]
          },
        ]
      }
      incidents: {
        Row: {
          assigned_at: string | null
          assigned_to: string | null
          created_at: string
          description: string
          id: string
          incident_number: string
          investigation_notes: string | null
          location: string
          related_module: string | null
          reported_at: string
          reported_by: string
          resolution: string | null
          resolved_at: string | null
          severity: string
          source: string | null
          source_reference_id: string | null
          status: string
          tags: string[] | null
          title: string
          type: string
          updated_at: string
          vehicle_reg_no: string | null
        }
        Insert: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          description: string
          id?: string
          incident_number: string
          investigation_notes?: string | null
          location: string
          related_module?: string | null
          reported_at?: string
          reported_by: string
          resolution?: string | null
          resolved_at?: string | null
          severity: string
          source?: string | null
          source_reference_id?: string | null
          status?: string
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string
          vehicle_reg_no?: string | null
        }
        Update: {
          assigned_at?: string | null
          assigned_to?: string | null
          created_at?: string
          description?: string
          id?: string
          incident_number?: string
          investigation_notes?: string | null
          location?: string
          related_module?: string | null
          reported_at?: string
          reported_by?: string
          resolution?: string | null
          resolved_at?: string | null
          severity?: string
          source?: string | null
          source_reference_id?: string | null
          status?: string
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string
          vehicle_reg_no?: string | null
        }
        Relationships: []
      }
      inventory_items: {
        Row: {
          category: string
          created_at: string
          current_stock: number
          id: string
          is_low_stock: boolean | null
          is_overstock: boolean | null
          last_consumed: string | null
          last_received: string | null
          location: string | null
          max_stock: number
          min_stock: number
          name: string
          reorder_level: number
          reorder_quantity: number
          sku: string
          supplier: string | null
          supplier_contact: string | null
          total_value: number | null
          unit: string
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          current_stock?: number
          id?: string
          is_low_stock?: boolean | null
          is_overstock?: boolean | null
          last_consumed?: string | null
          last_received?: string | null
          location?: string | null
          max_stock?: number
          min_stock?: number
          name: string
          reorder_level?: number
          reorder_quantity?: number
          sku: string
          supplier?: string | null
          supplier_contact?: string | null
          total_value?: number | null
          unit: string
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          current_stock?: number
          id?: string
          is_low_stock?: boolean | null
          is_overstock?: boolean | null
          last_consumed?: string | null
          last_received?: string | null
          location?: string | null
          max_stock?: number
          min_stock?: number
          name?: string
          reorder_level?: number
          reorder_quantity?: number
          sku?: string
          supplier?: string | null
          supplier_contact?: string | null
          total_value?: number | null
          unit?: string
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          id: string
          invoice_id: string | null
          quantity: number
          tax_amount: number
          tax_rate: number
          total_amount: number
          unit: string
          unit_price: number
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description: string
          id?: string
          invoice_id?: string | null
          quantity?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          unit: string
          unit_price?: number
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string | null
          quantity?: number
          tax_amount?: number
          tax_rate?: number
          total_amount?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          balance_amount: number | null
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_gst: string | null
          customer_id: string
          customer_name: string
          customer_phone: string | null
          discount_amount: number
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          paid_amount: number
          paid_date: string | null
          status: string
          subtotal: number
          tax_amount: number
          terms: string | null
          total_amount: number
          trip_ids: string[] | null
          updated_at: string
        }
        Insert: {
          balance_amount?: number | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gst?: string | null
          customer_id: string
          customer_name: string
          customer_phone?: string | null
          discount_amount?: number
          due_date: string
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          paid_date?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total_amount?: number
          trip_ids?: string[] | null
          updated_at?: string
        }
        Update: {
          balance_amount?: number | null
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gst?: string | null
          customer_id?: string
          customer_name?: string
          customer_phone?: string | null
          discount_amount?: number
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          paid_amount?: number
          paid_date?: string | null
          status?: string
          subtotal?: number
          tax_amount?: number
          terms?: string | null
          total_amount?: number
          trip_ids?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_parts: {
        Row: {
          created_at: string
          id: string
          name: string
          part_number: string | null
          quantity: number
          task_id: string | null
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          part_number?: string | null
          quantity?: number
          task_id?: string | null
          total_cost?: number | null
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          part_number?: string | null
          quantity?: number
          task_id?: string | null
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_parts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_schedules: {
        Row: {
          created_at: string
          days_until_due: number | null
          id: string
          interval_days: number | null
          interval_km: number | null
          is_overdue: boolean | null
          last_odometer: number | null
          last_performed: string | null
          next_due_date: string
          next_due_odometer: number | null
          task_name: string
          updated_at: string
          vehicle_id: string
          vehicle_reg_no: string
        }
        Insert: {
          created_at?: string
          days_until_due?: number | null
          id?: string
          interval_days?: number | null
          interval_km?: number | null
          is_overdue?: boolean | null
          last_odometer?: number | null
          last_performed?: string | null
          next_due_date: string
          next_due_odometer?: number | null
          task_name: string
          updated_at?: string
          vehicle_id: string
          vehicle_reg_no: string
        }
        Update: {
          created_at?: string
          days_until_due?: number | null
          id?: string
          interval_days?: number | null
          interval_km?: number | null
          is_overdue?: boolean | null
          last_odometer?: number | null
          last_performed?: string | null
          next_due_date?: string
          next_due_odometer?: number | null
          task_name?: string
          updated_at?: string
          vehicle_id?: string
          vehicle_reg_no?: string
        }
        Relationships: []
      }
      maintenance_tasks: {
        Row: {
          actual_cost: number | null
          completed_date: string | null
          created_at: string
          description: string | null
          estimated_cost: number | null
          id: string
          next_due_date: string | null
          next_due_odometer: number | null
          notes: string | null
          priority: string
          scheduled_date: string
          status: string
          technician: string | null
          title: string
          type: string
          updated_at: string
          vehicle_id: string
          vehicle_reg_no: string
        }
        Insert: {
          actual_cost?: number | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          next_due_date?: string | null
          next_due_odometer?: number | null
          notes?: string | null
          priority?: string
          scheduled_date: string
          status?: string
          technician?: string | null
          title: string
          type: string
          updated_at?: string
          vehicle_id: string
          vehicle_reg_no: string
        }
        Update: {
          actual_cost?: number | null
          completed_date?: string | null
          created_at?: string
          description?: string | null
          estimated_cost?: number | null
          id?: string
          next_due_date?: string | null
          next_due_odometer?: number | null
          notes?: string | null
          priority?: string
          scheduled_date?: string
          status?: string
          technician?: string | null
          title?: string
          type?: string
          updated_at?: string
          vehicle_id?: string
          vehicle_reg_no?: string
        }
        Relationships: []
      }
      parts_inventory: {
        Row: {
          category: string
          created_at: string
          id: string
          is_low_stock: boolean | null
          last_restocked: string | null
          location: string | null
          min_stock: number
          name: string
          part_number: string
          quantity: number
          supplier: string | null
          unit_cost: number
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          is_low_stock?: boolean | null
          last_restocked?: string | null
          location?: string | null
          min_stock?: number
          name: string
          part_number: string
          quantity?: number
          supplier?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          is_low_stock?: boolean | null
          last_restocked?: string | null
          location?: string | null
          min_stock?: number
          name?: string
          part_number?: string
          quantity?: number
          supplier?: string | null
          unit_cost?: number
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          customer_id: string
          customer_name: string
          date: string
          id: string
          invoice_id: string | null
          invoice_number: string
          method: string
          notes: string | null
          reference_number: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          customer_id: string
          customer_name: string
          date?: string
          id?: string
          invoice_id?: string | null
          invoice_number: string
          method: string
          notes?: string | null
          reference_number?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          customer_id?: string
          customer_name?: string
          date?: string
          id?: string
          invoice_id?: string | null
          invoice_number?: string
          method?: string
          notes?: string | null
          reference_number?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      reorder_alerts: {
        Row: {
          acknowledged_at: string | null
          created_at: string
          current_stock: number
          id: string
          item_id: string | null
          item_name: string
          item_sku: string
          ordered_at: string | null
          priority: string
          reorder_level: number
          reorder_quantity: number
          status: string
          supplier: string | null
        }
        Insert: {
          acknowledged_at?: string | null
          created_at?: string
          current_stock: number
          id?: string
          item_id?: string | null
          item_name: string
          item_sku: string
          ordered_at?: string | null
          priority?: string
          reorder_level: number
          reorder_quantity: number
          status?: string
          supplier?: string | null
        }
        Update: {
          acknowledged_at?: string | null
          created_at?: string
          current_stock?: number
          id?: string
          item_id?: string | null
          item_name?: string
          item_sku?: string
          ordered_at?: string | null
          priority?: string
          reorder_level?: number
          reorder_quantity?: number
          status?: string
          supplier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reorder_alerts_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_reports: {
        Row: {
          created_at: string
          format: string
          frequency: string
          id: string
          is_active: boolean
          last_run: string | null
          name: string
          next_run: string
          parameters: Json | null
          recipients: string[] | null
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          format: string
          frequency: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          name: string
          next_run: string
          parameters?: Json | null
          recipients?: string[] | null
          type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          format?: string
          frequency?: string
          id?: string
          is_active?: boolean
          last_run?: string | null
          name?: string
          next_run?: string
          parameters?: Json | null
          recipients?: string[] | null
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      stock_movements: {
        Row: {
          created_at: string
          date: string
          id: string
          item_id: string | null
          item_name: string
          item_sku: string
          new_stock: number
          notes: string | null
          performed_by: string | null
          previous_stock: number
          quantity: number
          reference_number: string | null
          total_cost: number | null
          trip_id: string | null
          type: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          date?: string
          id?: string
          item_id?: string | null
          item_name: string
          item_sku: string
          new_stock: number
          notes?: string | null
          performed_by?: string | null
          previous_stock: number
          quantity: number
          reference_number?: string | null
          total_cost?: number | null
          trip_id?: string | null
          type: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          item_id?: string | null
          item_name?: string
          item_sku?: string
          new_stock?: number
          notes?: string | null
          performed_by?: string | null
          previous_stock?: number
          quantity?: number
          reference_number?: string | null
          total_cost?: number | null
          trip_id?: string | null
          type?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "inventory_items"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_incident_number: { Args: never; Returns: string }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
