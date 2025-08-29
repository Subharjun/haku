export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      invitations: {
        Row: {
          agreement_id: string
          created_at: string | null
          email: string
          expires_at: string | null
          id: string
          invitation_token: string
          phone: string | null
          status: string | null
        }
        Insert: {
          agreement_id: string
          created_at?: string | null
          email: string
          expires_at?: string | null
          id?: string
          invitation_token: string
          phone?: string | null
          status?: string | null
        }
        Update: {
          agreement_id?: string
          created_at?: string | null
          email?: string
          expires_at?: string | null
          id?: string
          invitation_token?: string
          phone?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invitations_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "loan_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      loan_agreements: {
        Row: {
          amount: number
          borrower_email: string | null
          borrower_id: string | null
          borrower_name: string | null
          borrower_signature: string | null
          blockchain_tx_hash: string | null
          conditions: string | null
          contract_ipfs_cid: string | null
          contract_ipfs_url: string | null
          contract_pdf_generated_at: string | null
          contract_pdf_size: number | null
          created_at: string | null
          duration_months: number
          id: string
          interest_rate: number | null
          lender_email: string | null
          lender_id: string | null
          lender_name: string | null
          lender_signature: string | null
          payment_method: string | null
          purpose: string | null
          smart_contract: boolean | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          borrower_email?: string | null
          borrower_id?: string | null
          borrower_name?: string | null
          borrower_signature?: string | null
          blockchain_tx_hash?: string | null
          conditions?: string | null
          contract_ipfs_cid?: string | null
          contract_ipfs_url?: string | null
          contract_pdf_generated_at?: string | null
          contract_pdf_size?: number | null
          created_at?: string | null
          duration_months: number
          id?: string
          interest_rate?: number | null
          lender_email?: string | null
          lender_id?: string | null
          lender_name?: string | null
          lender_signature?: string | null
          payment_method?: string | null
          purpose?: string | null
          smart_contract?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          borrower_email?: string | null
          borrower_id?: string | null
          borrower_name?: string | null
          borrower_signature?: string | null
          blockchain_tx_hash?: string | null
          conditions?: string | null
          contract_ipfs_cid?: string | null
          contract_ipfs_url?: string | null
          contract_pdf_generated_at?: string | null
          contract_pdf_size?: number | null
          created_at?: string | null
          duration_months?: number
          id?: string
          interest_rate?: number | null
          lender_email?: string | null
          lender_id?: string | null
          lender_name?: string | null
          lender_signature?: string | null
          payment_method?: string | null
          purpose?: string | null
          smart_contract?: boolean | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      loan_requests: {
        Row: {
          amount: number
          borrower_id: string | null
          collateral_description: string | null
          created_at: string | null
          credit_score: number | null
          description: string | null
          employment_status: string | null
          expires_at: string | null
          id: string
          interest_rate: number | null
          monthly_income: number | null
          purpose: string
          status: string | null
          term_months: number
          updated_at: string | null
        }
        Insert: {
          amount: number
          borrower_id?: string | null
          collateral_description?: string | null
          created_at?: string | null
          credit_score?: number | null
          description?: string | null
          employment_status?: string | null
          expires_at?: string | null
          id?: string
          interest_rate?: number | null
          monthly_income?: number | null
          purpose: string
          status?: string | null
          term_months: number
          updated_at?: string | null
        }
        Update: {
          amount?: number
          borrower_id?: string | null
          collateral_description?: string | null
          created_at?: string | null
          credit_score?: number | null
          description?: string | null
          employment_status?: string | null
          expires_at?: string | null
          id?: string
          interest_rate?: number | null
          monthly_income?: number | null
          purpose?: string
          status?: string | null
          term_months?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          message: string
          type: string
          read: boolean | null
          data: Json | null
          related_agreement_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          message: string
          type: string
          read?: boolean | null
          data?: Json | null
          related_agreement_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          message?: string
          type?: string
          read?: boolean | null
          data?: Json | null
          related_agreement_id?: string | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_related_agreement_id_fkey"
            columns: ["related_agreement_id"]
            isOneToOne: false
            referencedRelation: "loan_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          id: string
          name: string | null
          phone: string | null
          reputation_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          id: string
          name?: string | null
          phone?: string | null
          reputation_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          reputation_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      phone_verifications: {
        Row: {
          attempts_count: number | null
          created_at: string | null
          expires_at: string | null
          id: string
          is_verified: boolean | null
          last_attempt_at: string | null
          phone_number: string
          user_id: string | null
          verification_code: string | null
          verified_at: string | null
        }
        Insert: {
          attempts_count?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_attempt_at?: string | null
          phone_number: string
          user_id?: string | null
          verification_code?: string | null
          verified_at?: string | null
        }
        Update: {
          attempts_count?: number | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          is_verified?: boolean | null
          last_attempt_at?: string | null
          phone_number?: string
          user_id?: string | null
          verification_code?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          agreement_id: string
          amount: number
          created_at: string | null
          id: string
          payment_method: string
          payment_reference: string | null
          status: string | null
          transaction_type: string
        }
        Insert: {
          agreement_id: string
          amount: number
          created_at?: string | null
          id?: string
          payment_method: string
          payment_reference?: string | null
          status?: string | null
          transaction_type: string
        }
        Update: {
          agreement_id?: string
          amount?: number
          created_at?: string | null
          id?: string
          payment_method?: string
          payment_reference?: string | null
          status?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_agreement_id_fkey"
            columns: ["agreement_id"]
            isOneToOne: false
            referencedRelation: "loan_agreements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_trust_scores: {
        Row: {
          activity_score: number | null
          base_score: number | null
          community_rating_score: number | null
          created_at: string | null
          id: string
          last_calculated_at: string | null
          last_updated: string | null
          loan_performance_score: number | null
          overall_score: number | null
          payment_history_score: number | null
          performance_score: number | null
          repayment_score: number | null
          score_level: string | null
          score_tier: string | null
          social_score: number | null
          total_score: number | null
          updated_at: string | null
          user_id: string | null
          verification_score: number | null
        }
        Insert: {
          activity_score?: number | null
          base_score?: number | null
          community_rating_score?: number | null
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          last_updated?: string | null
          loan_performance_score?: number | null
          overall_score?: number | null
          payment_history_score?: number | null
          performance_score?: number | null
          repayment_score?: number | null
          score_level?: string | null
          score_tier?: string | null
          social_score?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_score?: number | null
        }
        Update: {
          activity_score?: number | null
          base_score?: number | null
          community_rating_score?: number | null
          created_at?: string | null
          id?: string
          last_calculated_at?: string | null
          last_updated?: string | null
          loan_performance_score?: number | null
          overall_score?: number | null
          payment_history_score?: number | null
          performance_score?: number | null
          repayment_score?: number | null
          score_level?: string | null
          score_tier?: string | null
          social_score?: number | null
          total_score?: number | null
          updated_at?: string | null
          user_id?: string | null
          verification_score?: number | null
        }
        Relationships: []
      }
      trust_score_history: {
        Row: {
          change_amount: number | null
          change_reason: string | null
          created_at: string | null
          event_reference_id: string | null
          event_type: string | null
          id: string
          new_score: number | null
          old_score: number | null
          previous_score: number | null
          user_id: string | null
        }
        Insert: {
          change_amount?: number | null
          change_reason?: string | null
          created_at?: string | null
          event_reference_id?: string | null
          event_type?: string | null
          id?: string
          new_score?: number | null
          old_score?: number | null
          previous_score?: number | null
          user_id?: string | null
        }
        Update: {
          change_amount?: number | null
          change_reason?: string | null
          created_at?: string | null
          event_reference_id?: string | null
          event_type?: string | null
          id?: string
          new_score?: number | null
          old_score?: number | null
          previous_score?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      initialize_user_trust_score: {
        Args: {
          user_id: string
        }
        Returns: {
          id: string
          user_id: string
          overall_score: number
          created_at: string
        }
      }
      calculate_trust_score: {
        Args: {
          user_id: string
        }
        Returns: {
          overall_score: number
          repayment_score: number
          performance_score: number
          activity_score: number
          social_score: number
          verification_score: number
          previous_score: number
        }
      }
      record_trust_score_event: {
        Args: {
          user_id: string
          event_type: string
          change_amount: number
          change_reason: string
          event_reference_id?: string
        }
        Returns: {
          id: string
          created_at: string
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
