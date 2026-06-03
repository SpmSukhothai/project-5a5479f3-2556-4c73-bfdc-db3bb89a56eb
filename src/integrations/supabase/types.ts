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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          id: string
          record_id: string | null
          table_name: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          id?: string
          record_id?: string | null
          table_name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      child_education_history: {
        Row: {
          academic_year: number | null
          child_id: string
          created_at: string
          education_level: Database["public"]["Enums"]["education_level"] | null
          end_date: string | null
          id: string
          is_current: boolean
          school_type: Database["public"]["Enums"]["school_type"]
          start_date: string
          study_place: string
          updated_at: string
        }
        Insert: {
          academic_year?: number | null
          child_id: string
          created_at?: string
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          school_type?: Database["public"]["Enums"]["school_type"]
          start_date?: string
          study_place: string
          updated_at?: string
        }
        Update: {
          academic_year?: number | null
          child_id?: string
          created_at?: string
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          end_date?: string | null
          id?: string
          is_current?: boolean
          school_type?: Database["public"]["Enums"]["school_type"]
          start_date?: string
          study_place?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "child_education_history_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
        ]
      }
      children: {
        Row: {
          birth_date: string
          child_name: string
          created_at: string
          education_level: Database["public"]["Enums"]["education_level"] | null
          guardian_id: string
          id: string
          is_active: boolean
          school_type: Database["public"]["Enums"]["school_type"]
          study_place: string | null
          updated_at: string
        }
        Insert: {
          birth_date: string
          child_name: string
          created_at?: string
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          guardian_id: string
          id?: string
          is_active?: boolean
          school_type?: Database["public"]["Enums"]["school_type"]
          study_place?: string | null
          updated_at?: string
        }
        Update: {
          birth_date?: string
          child_name?: string
          created_at?: string
          education_level?:
            | Database["public"]["Enums"]["education_level"]
            | null
          guardian_id?: string
          id?: string
          is_active?: boolean
          school_type?: Database["public"]["Enums"]["school_type"]
          study_place?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "children_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
        ]
      }
      guardian_affiliation_history: {
        Row: {
          created_at: string
          end_date: string | null
          guardian_id: string
          id: string
          is_current: boolean
          note: string | null
          position: string | null
          school_id: string | null
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          guardian_id: string
          id?: string
          is_current?: boolean
          note?: string | null
          position?: string | null
          school_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          guardian_id?: string
          id?: string
          is_current?: boolean
          note?: string | null
          position?: string | null
          school_id?: string | null
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardian_affiliation_history_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guardian_affiliation_history_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      guardians: {
        Row: {
          created_at: string
          employee_code: string
          first_name: string
          id: string
          last_name: string
          national_id: string | null
          phone: string | null
          position: string | null
          prefix: string
          school_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_code: string
          first_name: string
          id?: string
          last_name: string
          national_id?: string | null
          phone?: string | null
          position?: string | null
          prefix: string
          school_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_code?: string
          first_name?: string
          id?: string
          last_name?: string
          national_id?: string | null
          phone?: string | null
          position?: string | null
          prefix?: string
          school_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "guardians_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          full_name: string | null
          id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
        }
        Relationships: []
      }
      reimbursement_rates: {
        Row: {
          academic_year: number
          created_at: string
          education_level: Database["public"]["Enums"]["education_level"]
          id: string
          max_amount: number
          school_type: Database["public"]["Enums"]["school_type"]
        }
        Insert: {
          academic_year?: number
          created_at?: string
          education_level: Database["public"]["Enums"]["education_level"]
          id?: string
          max_amount: number
          school_type: Database["public"]["Enums"]["school_type"]
        }
        Update: {
          academic_year?: number
          created_at?: string
          education_level?: Database["public"]["Enums"]["education_level"]
          id?: string
          max_amount?: number
          school_type?: Database["public"]["Enums"]["school_type"]
        }
        Relationships: []
      }
      reimbursements: {
        Row: {
          academic_year: number
          child_id: string
          created_at: string
          created_by: string | null
          education_level: Database["public"]["Enums"]["education_level"]
          entitled_amount: number
          guardian_id: string
          id: string
          registration_no: string
          remark: string | null
          school_id: string | null
          school_type: Database["public"]["Enums"]["school_type"]
          sem1_amount: number
          sem1_doc_no: string | null
          sem1_pay_date: string | null
          sem1_receipt_date: string | null
          sem1_receipt_no: string | null
          sem2_amount: number
          sem2_doc_no: string | null
          sem2_pay_date: string | null
          sem2_receipt_date: string | null
          sem2_receipt_no: string | null
          updated_at: string
        }
        Insert: {
          academic_year: number
          child_id: string
          created_at?: string
          created_by?: string | null
          education_level: Database["public"]["Enums"]["education_level"]
          entitled_amount?: number
          guardian_id: string
          id?: string
          registration_no: string
          remark?: string | null
          school_id?: string | null
          school_type: Database["public"]["Enums"]["school_type"]
          sem1_amount?: number
          sem1_doc_no?: string | null
          sem1_pay_date?: string | null
          sem1_receipt_date?: string | null
          sem1_receipt_no?: string | null
          sem2_amount?: number
          sem2_doc_no?: string | null
          sem2_pay_date?: string | null
          sem2_receipt_date?: string | null
          sem2_receipt_no?: string | null
          updated_at?: string
        }
        Update: {
          academic_year?: number
          child_id?: string
          created_at?: string
          created_by?: string | null
          education_level?: Database["public"]["Enums"]["education_level"]
          entitled_amount?: number
          guardian_id?: string
          id?: string
          registration_no?: string
          remark?: string | null
          school_id?: string | null
          school_type?: Database["public"]["Enums"]["school_type"]
          sem1_amount?: number
          sem1_doc_no?: string | null
          sem1_pay_date?: string | null
          sem1_receipt_date?: string | null
          sem1_receipt_no?: string | null
          sem2_amount?: number
          sem2_doc_no?: string | null
          sem2_pay_date?: string | null
          sem2_receipt_date?: string | null
          sem2_receipt_no?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reimbursements_child_id_fkey"
            columns: ["child_id"]
            isOneToOne: false
            referencedRelation: "children"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursements_guardian_id_fkey"
            columns: ["guardian_id"]
            isOneToOne: false
            referencedRelation: "guardians"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reimbursements_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          created_at: string
          id: string
          province: string | null
          school_code: string
          school_name: string
          school_type: Database["public"]["Enums"]["school_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          province?: string | null
          school_code: string
          school_name: string
          school_type?: Database["public"]["Enums"]["school_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          province?: string | null
          school_code?: string
          school_name?: string
          school_type?: Database["public"]["Enums"]["school_type"]
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "finance"
      education_level:
        | "kindergarten"
        | "primary"
        | "lower_secondary"
        | "upper_secondary"
        | "vocational"
        | "bachelor"
      school_type: "government" | "private"
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
    Enums: {
      app_role: ["admin", "finance"],
      education_level: [
        "kindergarten",
        "primary",
        "lower_secondary",
        "upper_secondary",
        "vocational",
        "bachelor",
      ],
      school_type: ["government", "private"],
    },
  },
} as const
