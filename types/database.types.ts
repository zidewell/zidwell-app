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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      _new_users: {
        Row: {
          email: string | null
          first_name: string | null
          last_name: string | null
          password: string | null
          phone: string | null
        }
        Insert: {
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          password?: string | null
          phone?: string | null
        }
        Update: {
          email?: string | null
          first_name?: string | null
          last_name?: string | null
          password?: string | null
          phone?: string | null
        }
        Relationships: []
      }
      _prisma_migrations: {
        Row: {
          applied_steps_count: number
          checksum: string
          finished_at: string | null
          id: string
          logs: string | null
          migration_name: string
          rolled_back_at: string | null
          started_at: string
        }
        Insert: {
          applied_steps_count?: number
          checksum: string
          finished_at?: string | null
          id: string
          logs?: string | null
          migration_name: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Update: {
          applied_steps_count?: number
          checksum?: string
          finished_at?: string | null
          id?: string
          logs?: string | null
          migration_name?: string
          rolled_back_at?: string | null
          started_at?: string
        }
        Relationships: []
      }
      admin_notifications: {
        Row: {
          channels: string[] | null
          created_at: string | null
          created_by: string | null
          error: string | null
          id: string
          is_urgent: boolean | null
          message: string
          scheduled_for: string | null
          sent_at: string | null
          specific_users: string[] | null
          stats: Json | null
          status: string | null
          target_audience: string
          title: string
          type: string | null
          updated_at: string | null
        }
        Insert: {
          channels?: string[] | null
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: string
          is_urgent?: boolean | null
          message: string
          scheduled_for?: string | null
          sent_at?: string | null
          specific_users?: string[] | null
          stats?: Json | null
          status?: string | null
          target_audience?: string
          title: string
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          channels?: string[] | null
          created_at?: string | null
          created_by?: string | null
          error?: string | null
          id?: string
          is_urgent?: boolean | null
          message?: string
          scheduled_for?: string | null
          sent_at?: string | null
          specific_users?: string[] | null
          stats?: Json | null
          status?: string | null
          target_audience?: string
          title?: string
          type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          comments: string | null
          created_at: string | null
          description: string | null
          id: string
          ip_address: string | null
          location: Json | null
          metadata: Json | null
          organization_id: string | null
          resource_id: string | null
          resource_type: string | null
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_name: string
        }
        Insert: {
          action: string
          comments?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: string | null
          location?: Json | null
          metadata?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name: string
        }
        Update: {
          action?: string
          comments?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          ip_address?: string | null
          location?: Json | null
          metadata?: Json | null
          organization_id?: string | null
          resource_id?: string | null
          resource_type?: string | null
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank78_logs: {
        Row: {
          created_at: string | null
          endpoint: string | null
          error_message: string | null
          id: string
          request: Json | null
          response: Json | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          request?: Json | null
          response?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string | null
          error_message?: string | null
          id?: string
          request?: Json | null
          response?: Json | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bank78_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      bank78_webhook_events: {
        Row: {
          created_at: string
          event_id: string | null
          event_type: string
          id: string
          payload: Json
        }
        Insert: {
          created_at?: string
          event_id?: string | null
          event_type: string
          id?: string
          payload: Json
        }
        Update: {
          created_at?: string
          event_id?: string | null
          event_type?: string
          id?: string
          payload?: Json
        }
        Relationships: []
      }
      bank78_webhooks: {
        Row: {
          created_at: string | null
          event_type: string | null
          id: string
          payload: Json | null
          processed: boolean | null
          processed_at: string | null
        }
        Insert: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string | null
          id?: string
          payload?: Json | null
          processed?: boolean | null
          processed_at?: string | null
        }
        Relationships: []
      }
      businesses: {
        Row: {
          authorized_representative_verified: boolean | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_code: string | null
          bank_name: string | null
          bank78_account_id: string | null
          bank78_account_name: string | null
          bank78_account_number: string | null
          bank78_bank_name: string | null
          business_address: string | null
          business_category: string | null
          business_description: string | null
          business_email: string | null
          business_industry: string | null
          business_kyc_completed: boolean | null
          business_name: string
          business_phone: string | null
          business_type: string | null
          business_website: string | null
          cac_data: Json | null
          cac_document_url: string | null
          cac_file_url: string | null
          cac_number: string | null
          cac_verified: boolean | null
          company_name: string | null
          company_status: string | null
          created_at: string | null
          director_verified: boolean | null
          id: string
          is_registered: boolean | null
          map_url: string | null
          name_mismatch: boolean | null
          rc_number: string | null
          registration_date: string | null
          registration_number: string | null
          role: string | null
          signup_business_name: string | null
          tax_id: string | null
          team_size: string | null
          updated_at: string | null
          user_id: string
          verification_completed: boolean | null
          verification_id: string | null
          verification_logs: Json | null
          verification_reference: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          authorized_representative_verified?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          bank78_account_id?: string | null
          bank78_account_name?: string | null
          bank78_account_number?: string | null
          bank78_bank_name?: string | null
          business_address?: string | null
          business_category?: string | null
          business_description?: string | null
          business_email?: string | null
          business_industry?: string | null
          business_kyc_completed?: boolean | null
          business_name: string
          business_phone?: string | null
          business_type?: string | null
          business_website?: string | null
          cac_data?: Json | null
          cac_document_url?: string | null
          cac_file_url?: string | null
          cac_number?: string | null
          cac_verified?: boolean | null
          company_name?: string | null
          company_status?: string | null
          created_at?: string | null
          director_verified?: boolean | null
          id?: string
          is_registered?: boolean | null
          map_url?: string | null
          name_mismatch?: boolean | null
          rc_number?: string | null
          registration_date?: string | null
          registration_number?: string | null
          role?: string | null
          signup_business_name?: string | null
          tax_id?: string | null
          team_size?: string | null
          updated_at?: string | null
          user_id: string
          verification_completed?: boolean | null
          verification_id?: string | null
          verification_logs?: Json | null
          verification_reference?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          authorized_representative_verified?: boolean | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_code?: string | null
          bank_name?: string | null
          bank78_account_id?: string | null
          bank78_account_name?: string | null
          bank78_account_number?: string | null
          bank78_bank_name?: string | null
          business_address?: string | null
          business_category?: string | null
          business_description?: string | null
          business_email?: string | null
          business_industry?: string | null
          business_kyc_completed?: boolean | null
          business_name?: string
          business_phone?: string | null
          business_type?: string | null
          business_website?: string | null
          cac_data?: Json | null
          cac_document_url?: string | null
          cac_file_url?: string | null
          cac_number?: string | null
          cac_verified?: boolean | null
          company_name?: string | null
          company_status?: string | null
          created_at?: string | null
          director_verified?: boolean | null
          id?: string
          is_registered?: boolean | null
          map_url?: string | null
          name_mismatch?: boolean | null
          rc_number?: string | null
          registration_date?: string | null
          registration_number?: string | null
          role?: string | null
          signup_business_name?: string | null
          tax_id?: string | null
          team_size?: string | null
          updated_at?: string | null
          user_id?: string
          verification_completed?: boolean | null
          verification_id?: string | null
          verification_logs?: Json | null
          verification_reference?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "businesses_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_audit_logs: {
        Row: {
          action: string
          contract_id: string
          created_at: string | null
          details: Json | null
          id: string
          performed_by: string
        }
        Insert: {
          action: string
          contract_id: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by: string
        }
        Update: {
          action?: string
          contract_id?: string
          created_at?: string | null
          details?: Json | null
          id?: string
          performed_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "contract_audit_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contract_edits: {
        Row: {
          contract_id: string
          contract_title: string
          contract_token: string
          created_at: string | null
          id: string
          signee_email: string
          status: string | null
          suggested_edits: string
          updated_at: string | null
        }
        Insert: {
          contract_id: string
          contract_title: string
          contract_token: string
          created_at?: string | null
          id?: string
          signee_email: string
          status?: string | null
          suggested_edits: string
          updated_at?: string | null
        }
        Update: {
          contract_id?: string
          contract_title?: string
          contract_token?: string
          created_at?: string | null
          id?: string
          signee_email?: string
          status?: string | null
          suggested_edits?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_edits_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          age_consent: boolean | null
          contract_date: string
          contract_text: string
          contract_title: string
          contract_type: string | null
          created_at: string | null
          creator_name: string | null
          creator_signature: string | null
          expires_at: string | null
          fraud_flag: boolean | null
          fraud_flagged_at: string | null
          fraud_flagged_by: string | null
          fraud_reason: string | null
          id: string
          include_lawyer_signature: boolean | null
          initiator_email: string
          initiator_name: string | null
          is_draft: boolean | null
          last_verification_attempt: string | null
          metadata: Json | null
          phone_number: number | null
          sent_at: string | null
          signature_date: string | null
          signature_image: string | null
          signed_at: string | null
          signee_email: string
          signee_name: string | null
          signee_nin: string | null
          signee_signature: string | null
          signee_signature_image: string | null
          signing_link: string | null
          status: string | null
          terms_consent: boolean | null
          token: string
          updated_at: string | null
          user_id: string | null
          verification_code: string | null
          verification_code_expires_at: string | null
          verification_code_sent_at: string | null
          verification_failed_attempts: number | null
          verification_status: string | null
        }
        Insert: {
          age_consent?: boolean | null
          contract_date?: string
          contract_text: string
          contract_title: string
          contract_type?: string | null
          created_at?: string | null
          creator_name?: string | null
          creator_signature?: string | null
          expires_at?: string | null
          fraud_flag?: boolean | null
          fraud_flagged_at?: string | null
          fraud_flagged_by?: string | null
          fraud_reason?: string | null
          id?: string
          include_lawyer_signature?: boolean | null
          initiator_email: string
          initiator_name?: string | null
          is_draft?: boolean | null
          last_verification_attempt?: string | null
          metadata?: Json | null
          phone_number?: number | null
          sent_at?: string | null
          signature_date?: string | null
          signature_image?: string | null
          signed_at?: string | null
          signee_email: string
          signee_name?: string | null
          signee_nin?: string | null
          signee_signature?: string | null
          signee_signature_image?: string | null
          signing_link?: string | null
          status?: string | null
          terms_consent?: boolean | null
          token: string
          updated_at?: string | null
          user_id?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
          verification_code_sent_at?: string | null
          verification_failed_attempts?: number | null
          verification_status?: string | null
        }
        Update: {
          age_consent?: boolean | null
          contract_date?: string
          contract_text?: string
          contract_title?: string
          contract_type?: string | null
          created_at?: string | null
          creator_name?: string | null
          creator_signature?: string | null
          expires_at?: string | null
          fraud_flag?: boolean | null
          fraud_flagged_at?: string | null
          fraud_flagged_by?: string | null
          fraud_reason?: string | null
          id?: string
          include_lawyer_signature?: boolean | null
          initiator_email?: string
          initiator_name?: string | null
          is_draft?: boolean | null
          last_verification_attempt?: string | null
          metadata?: Json | null
          phone_number?: number | null
          sent_at?: string | null
          signature_date?: string | null
          signature_image?: string | null
          signed_at?: string | null
          signee_email?: string
          signee_name?: string | null
          signee_nin?: string | null
          signee_signature?: string | null
          signee_signature_image?: string | null
          signing_link?: string | null
          status?: string | null
          terms_consent?: boolean | null
          token?: string
          updated_at?: string | null
          user_id?: string | null
          verification_code?: string | null
          verification_code_expires_at?: string | null
          verification_code_sent_at?: string | null
          verification_failed_attempts?: number | null
          verification_status?: string | null
        }
        Relationships: []
      }
      dispute_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_size: number | null
          file_url: string
          id: string
          message_id: string | null
          mime_type: string | null
          ticket_id: string | null
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_size?: number | null
          file_url: string
          id?: string
          message_id?: string | null
          mime_type?: string | null
          ticket_id?: string | null
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_size?: number | null
          file_url?: string
          id?: string
          message_id?: string | null
          mime_type?: string | null
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_attachments_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "dispute_messages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispute_attachments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "dispute_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_messages: {
        Row: {
          created_at: string | null
          id: string
          message: string
          sender_type: string
          ticket_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          sender_type: string
          ticket_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          sender_type?: string
          ticket_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dispute_messages_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "dispute_tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      dispute_tickets: {
        Row: {
          category: string
          closed_at: string | null
          created_at: string | null
          description: string
          id: string
          priority: string
          resolved_at: string | null
          status: string
          subject: string
          ticket_id: string
          updated_at: string | null
          user_email: string
          user_id: string
        }
        Insert: {
          category?: string
          closed_at?: string | null
          created_at?: string | null
          description: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject: string
          ticket_id: string
          updated_at?: string | null
          user_email: string
          user_id: string
        }
        Update: {
          category?: string
          closed_at?: string | null
          created_at?: string | null
          description?: string
          id?: string
          priority?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          ticket_id?: string
          updated_at?: string | null
          user_email?: string
          user_id?: string
        }
        Relationships: []
      }
      failed_login_attempts: {
        Row: {
          attempted_at: string | null
          device_info: Json | null
          email: string | null
          id: string
          ip_address: unknown
          location_info: Json | null
          reason: string | null
        }
        Insert: {
          attempted_at?: string | null
          device_info?: Json | null
          email?: string | null
          id?: string
          ip_address?: unknown
          location_info?: Json | null
          reason?: string | null
        }
        Update: {
          attempted_at?: string | null
          device_info?: Json | null
          email?: string | null
          id?: string
          ip_address?: unknown
          location_info?: Json | null
          reason?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string | null
          id: string
          invoice_id: string
          item_description: string
          quantity: number
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          invoice_id: string
          item_description: string
          quantity?: number
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string | null
          id?: string
          invoice_id?: string
          item_description?: string
          quantity?: number
          total_amount?: number
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
      invoice_payments: {
        Row: {
          amount: number
          bank_account: string | null
          bank_name: string | null
          created_at: string | null
          fee_amount: number | null
          id: string
          invoice_id: string
          is_partial_payment: boolean | null
          is_reusable: boolean | null
          max_attempts: number | null
          narration: string | null
          net_amount: number | null
          nomba_fee: number | null
          nomba_transaction_id: string | null
          order_reference: string
          paid_amount: number | null
          paid_at: string | null
          payer_email: string | null
          payer_name: string | null
          payer_phone: string | null
          payment_attempts: number | null
          payment_link: string
          payment_method: string | null
          platform_fee: number | null
          remaining_balance: number | null
          status: string | null
          updated_at: string | null
          user_id: string
          user_received: number | null
        }
        Insert: {
          amount: number
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          invoice_id: string
          is_partial_payment?: boolean | null
          is_reusable?: boolean | null
          max_attempts?: number | null
          narration?: string | null
          net_amount?: number | null
          nomba_fee?: number | null
          nomba_transaction_id?: string | null
          order_reference: string
          paid_amount?: number | null
          paid_at?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_attempts?: number | null
          payment_link: string
          payment_method?: string | null
          platform_fee?: number | null
          remaining_balance?: number | null
          status?: string | null
          updated_at?: string | null
          user_id: string
          user_received?: number | null
        }
        Update: {
          amount?: number
          bank_account?: string | null
          bank_name?: string | null
          created_at?: string | null
          fee_amount?: number | null
          id?: string
          invoice_id?: string
          is_partial_payment?: boolean | null
          is_reusable?: boolean | null
          max_attempts?: number | null
          narration?: string | null
          net_amount?: number | null
          nomba_fee?: number | null
          nomba_transaction_id?: string | null
          order_reference?: string
          paid_amount?: number | null
          paid_at?: string | null
          payer_email?: string | null
          payer_name?: string | null
          payer_phone?: string | null
          payment_attempts?: number | null
          payment_link?: string
          payment_method?: string | null
          platform_fee?: number | null
          remaining_balance?: number | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
          user_received?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          allow_multiple_payments: boolean | null
          bill_to: string | null
          business_logo: string | null
          business_name: string
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          created_at: string | null
          customer_note: string | null
          fee_amount: number | null
          fee_option: string | null
          followup_amount: number | null
          followup_reference: string | null
          followup_status: string | null
          from_email: string
          from_name: string
          has_followup_payment: boolean | null
          id: string
          initiator_account_name: string | null
          initiator_account_number: string | null
          initiator_bank_name: string | null
          invoice_id: string
          is_draft: boolean | null
          issue_date: string
          message: string | null
          order_reference: string
          paid_amount: number | null
          paid_at: string | null
          paid_quantity: number | null
          payment_link: string
          payment_type: string | null
          public_token: string
          redirect_url: string | null
          signing_link: string
          status: string | null
          subtotal: number
          target_quantity: number | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          allow_multiple_payments?: boolean | null
          bill_to?: string | null
          business_logo?: string | null
          business_name: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          customer_note?: string | null
          fee_amount?: number | null
          fee_option?: string | null
          followup_amount?: number | null
          followup_reference?: string | null
          followup_status?: string | null
          from_email: string
          from_name: string
          has_followup_payment?: boolean | null
          id?: string
          initiator_account_name?: string | null
          initiator_account_number?: string | null
          initiator_bank_name?: string | null
          invoice_id: string
          is_draft?: boolean | null
          issue_date: string
          message?: string | null
          order_reference: string
          paid_amount?: number | null
          paid_at?: string | null
          paid_quantity?: number | null
          payment_link: string
          payment_type?: string | null
          public_token: string
          redirect_url?: string | null
          signing_link: string
          status?: string | null
          subtotal?: number
          target_quantity?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          allow_multiple_payments?: boolean | null
          bill_to?: string | null
          business_logo?: string | null
          business_name?: string
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          created_at?: string | null
          customer_note?: string | null
          fee_amount?: number | null
          fee_option?: string | null
          followup_amount?: number | null
          followup_reference?: string | null
          followup_status?: string | null
          from_email?: string
          from_name?: string
          has_followup_payment?: boolean | null
          id?: string
          initiator_account_name?: string | null
          initiator_account_number?: string | null
          initiator_bank_name?: string | null
          invoice_id?: string
          is_draft?: boolean | null
          issue_date?: string
          message?: string | null
          order_reference?: string
          paid_amount?: number | null
          paid_at?: string | null
          paid_quantity?: number | null
          payment_link?: string
          payment_type?: string | null
          public_token?: string
          redirect_url?: string | null
          signing_link?: string
          status?: string | null
          subtotal?: number
          target_quantity?: number | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      journal_categories: {
        Row: {
          created_at: string
          favorite_order: number | null
          icon: string
          id: string
          is_custom: boolean | null
          is_favorite: boolean | null
          name: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          favorite_order?: number | null
          icon: string
          id: string
          is_custom?: boolean | null
          is_favorite?: boolean | null
          name: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          favorite_order?: number | null
          icon?: string
          id?: string
          is_custom?: boolean | null
          is_favorite?: boolean | null
          name?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      journal_entries: {
        Row: {
          amount: number
          category_id: string
          created_at: string
          date: string
          id: string
          journal_type: string
          note: string | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          category_id: string
          created_at?: string
          date: string
          id?: string
          journal_type: string
          note?: string | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          category_id?: string
          created_at?: string
          date?: string
          id?: string
          journal_type?: string
          note?: string | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      journal_entries_backup_20260913: {
        Row: {
          amount: number | null
          category_id: string | null
          created_at: string | null
          date: string | null
          id: string | null
          journal_type: string | null
          note: string | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          journal_type?: string | null
          note?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          category_id?: string | null
          created_at?: string | null
          date?: string | null
          id?: string | null
          journal_type?: string | null
          note?: string | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      kyc: {
        Row: {
          created_at: string | null
          id: string
          id_card_url: string | null
          nin: string | null
          status: string | null
          user_id: string | null
          utility_bill_url: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          id_card_url?: string | null
          nin?: string | null
          status?: string | null
          user_id?: string | null
          utility_bill_url?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          id_card_url?: string | null
          nin?: string | null
          status?: string | null
          user_id?: string | null
          utility_bill_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "kyc_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      login_history: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          device_fingerprint: string | null
          id: string
          ip_address: string | null
          is_successful: boolean | null
          is_suspicious: boolean | null
          latitude: number | null
          login_time: string | null
          logout_time: string | null
          longitude: number | null
          platform: string | null
          region: string | null
          screen_resolution: string | null
          session_id: string | null
          session_token: string | null
          suspicious_reasons: string[] | null
          timezone: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_successful?: boolean | null
          is_suspicious?: boolean | null
          latitude?: number | null
          login_time?: string | null
          logout_time?: string | null
          longitude?: number | null
          platform?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id?: string | null
          session_token?: string | null
          suspicious_reasons?: string[] | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          device_fingerprint?: string | null
          id?: string
          ip_address?: string | null
          is_successful?: boolean | null
          is_suspicious?: boolean | null
          latitude?: number | null
          login_time?: string | null
          logout_time?: string | null
          longitude?: number | null
          platform?: string | null
          region?: string | null
          screen_resolution?: string | null
          session_id?: string | null
          session_token?: string | null
          suspicious_reasons?: string[] | null
          timezone?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "login_history_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      new_users_accounts: {
        Row: {
          created_at: string
          id: number
        }
        Insert: {
          created_at?: string
          id?: number
        }
        Update: {
          created_at?: string
          id?: number
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          read_at: string | null
          title: string
          type: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          read_at?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          read_at?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      online_stores: {
        Row: {
          activated_at: string | null
          activation_paid: boolean
          activation_reference: string | null
          cac_number: string | null
          city: string
          country: string
          cover_url: string | null
          created_at: string
          delivery_enabled: boolean
          delivery_fee: number
          delivery_free_threshold: number
          delivery_notes: string | null
          description: string
          id: string
          is_active: boolean
          keywords: string[]
          latitude: number | null
          local_pickup_address: string | null
          local_pickup_enabled: boolean
          local_pickup_notes: string | null
          location_accuracy: number | null
          location_enabled: boolean
          logo_url: string | null
          longitude: number | null
          name: string
          owner_id: string
          slug: string
          state: string
          street_address: string
          total_orders: number
          total_revenue: number
          total_views: number
          updated_at: string
          wallet_balance: number
          whatsapp_number: string | null
        }
        Insert: {
          activated_at?: string | null
          activation_paid?: boolean
          activation_reference?: string | null
          cac_number?: string | null
          city: string
          country?: string
          cover_url?: string | null
          created_at?: string
          delivery_enabled?: boolean
          delivery_fee?: number
          delivery_free_threshold?: number
          delivery_notes?: string | null
          description: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          latitude?: number | null
          local_pickup_address?: string | null
          local_pickup_enabled?: boolean
          local_pickup_notes?: string | null
          location_accuracy?: number | null
          location_enabled?: boolean
          logo_url?: string | null
          longitude?: number | null
          name: string
          owner_id: string
          slug: string
          state: string
          street_address: string
          total_orders?: number
          total_revenue?: number
          total_views?: number
          updated_at?: string
          wallet_balance?: number
          whatsapp_number?: string | null
        }
        Update: {
          activated_at?: string | null
          activation_paid?: boolean
          activation_reference?: string | null
          cac_number?: string | null
          city?: string
          country?: string
          cover_url?: string | null
          created_at?: string
          delivery_enabled?: boolean
          delivery_fee?: number
          delivery_free_threshold?: number
          delivery_notes?: string | null
          description?: string
          id?: string
          is_active?: boolean
          keywords?: string[]
          latitude?: number | null
          local_pickup_address?: string | null
          local_pickup_enabled?: boolean
          local_pickup_notes?: string | null
          location_accuracy?: number | null
          location_enabled?: boolean
          logo_url?: string | null
          longitude?: number | null
          name?: string
          owner_id?: string
          slug?: string
          state?: string
          street_address?: string
          total_orders?: number
          total_revenue?: number
          total_views?: number
          updated_at?: string
          wallet_balance?: number
          whatsapp_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "online_stores_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string | null
          id: string
          name: string
          owner_id: string | null
          wallet_balance: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          owner_id?: string | null
          wallet_balance?: number
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          owner_id?: string | null
          wallet_balance?: number
        }
        Relationships: [
          {
            foreignKeyName: "organizations_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      p2p_beneficiaries: {
        Row: {
          account_name: string
          account_number: string
          auto_saved: boolean | null
          created_at: string | null
          id: string
          is_default: boolean | null
          last_used_at: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string
          wallet_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          auto_saved?: boolean | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id: string
          wallet_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          auto_saved?: boolean | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "p2p_beneficiaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      page_withdrawals: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          fee: number
          id: string
          net_amount: number
          payment_page_id: string | null
          reference: string | null
          status: string
          transaction_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string | null
          fee?: number
          id?: string
          net_amount: number
          payment_page_id?: string | null
          reference?: string | null
          status?: string
          transaction_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          fee?: number
          id?: string
          net_amount?: number
          payment_page_id?: string | null
          reference?: string | null
          status?: string
          transaction_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_withdrawals_payment_page_id_fkey"
            columns: ["payment_page_id"]
            isOneToOne: false
            referencedRelation: "payment_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "page_withdrawals_payment_page_id_fkey"
            columns: ["payment_page_id"]
            isOneToOne: false
            referencedRelation: "payment_pages_with_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_page_installment_account: {
        Row: {
          buyer_email: string | null
          buyer_name: string | null
          buyer_phone: string | null
          created_at: string
          first_paid_at: string | null
          id: string
          installment_amount: number | null
          installment_count: number | null
          installment_period: string | null
          installments_paid: number
          last_paid_at: string | null
          payment_page_id: string
          recorded_payment_ids: Json
          remaining_amount: number
          selection: Json
          status: string
          student_name: string | null
          total_amount: number
          total_paid: number
          updated_at: string
          user_id: string
        }
        Insert: {
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          first_paid_at?: string | null
          id?: string
          installment_amount?: number | null
          installment_count?: number | null
          installment_period?: string | null
          installments_paid?: number
          last_paid_at?: string | null
          payment_page_id: string
          recorded_payment_ids?: Json
          remaining_amount?: number
          selection?: Json
          status?: string
          student_name?: string | null
          total_amount?: number
          total_paid?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          buyer_email?: string | null
          buyer_name?: string | null
          buyer_phone?: string | null
          created_at?: string
          first_paid_at?: string | null
          id?: string
          installment_amount?: number | null
          installment_count?: number | null
          installment_period?: string | null
          installments_paid?: number
          last_paid_at?: string | null
          payment_page_id?: string
          recorded_payment_ids?: Json
          remaining_amount?: number
          selection?: Json
          status?: string
          student_name?: string | null
          total_amount?: number
          total_paid?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_page_installment_account_payment_page_id_fkey"
            columns: ["payment_page_id"]
            isOneToOne: false
            referencedRelation: "payment_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_page_installment_account_payment_page_id_fkey"
            columns: ["payment_page_id"]
            isOneToOne: false
            referencedRelation: "payment_pages_with_balance"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_page_payments: {
        Row: {
          amount: number
          app_fee: number | null
          confirmed_at: string | null
          created_at: string | null
          customer_email: string | null
          customer_name: string
          customer_phone: string | null
          delivery_address_snapshot: Json | null
          delivery_fee: number | null
          fee: number | null
          fulfillment_method: string | null
          id: string
          installment_number: number | null
          installment_status: string | null
          is_installment: boolean
          metadata: Json | null
          net_amount: number
          next_installment_due: string | null
          nomba_fee: number | null
          nomba_transaction_id: string | null
          order_reference: string | null
          paid_amount: number | null
          paid_at: string | null
          parent_name: string | null
          payment_method: string | null
          payment_page_id: string
          payment_type: string | null
          receipt_sent: boolean | null
          saving_id: string | null
          selected_students: Json | null
          shopper_id: string | null
          status: string
          student_name: string | null
          total_amount: number | null
          total_fee: number | null
          total_installments: number | null
          transfer_reference: string | null
          user_id: string
        }
        Insert: {
          amount: number
          app_fee?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_address_snapshot?: Json | null
          delivery_fee?: number | null
          fee?: number | null
          fulfillment_method?: string | null
          id?: string
          installment_number?: number | null
          installment_status?: string | null
          is_installment?: boolean
          metadata?: Json | null
          net_amount: number
          next_installment_due?: string | null
          nomba_fee?: number | null
          nomba_transaction_id?: string | null
          order_reference?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          parent_name?: string | null
          payment_method?: string | null
          payment_page_id: string
          payment_type?: string | null
          receipt_sent?: boolean | null
          saving_id?: string | null
          selected_students?: Json | null
          shopper_id?: string | null
          status?: string
          student_name?: string | null
          total_amount?: number | null
          total_fee?: number | null
          total_installments?: number | null
          transfer_reference?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          app_fee?: number | null
          confirmed_at?: string | null
          created_at?: string | null
          customer_email?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_address_snapshot?: Json | null
          delivery_fee?: number | null
          fee?: number | null
          fulfillment_method?: string | null
          id?: string
          installment_number?: number | null
          installment_status?: string | null
          is_installment?: boolean
          metadata?: Json | null
          net_amount?: number
          next_installment_due?: string | null
          nomba_fee?: number | null
          nomba_transaction_id?: string | null
          order_reference?: string | null
          paid_amount?: number | null
          paid_at?: string | null
          parent_name?: string | null
          payment_method?: string | null
          payment_page_id?: string
          payment_type?: string | null
          receipt_sent?: boolean | null
          saving_id?: string | null
          selected_students?: Json | null
          shopper_id?: string | null
          status?: string
          student_name?: string | null
          total_amount?: number | null
          total_fee?: number | null
          total_installments?: number | null
          transfer_reference?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_page_payments_payment_page_id_fkey"
            columns: ["payment_page_id"]
            isOneToOne: false
            referencedRelation: "payment_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_page_payments_payment_page_id_fkey"
            columns: ["payment_page_id"]
            isOneToOne: false
            referencedRelation: "payment_pages_with_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_page_payments_saving_id_fkey"
            columns: ["saving_id"]
            isOneToOne: false
            referencedRelation: "savings_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_pages: {
        Row: {
          cover_image: string | null
          created_at: string | null
          description: string | null
          fee_mode: string
          id: string
          installment_count: number | null
          interview_completed: boolean | null
          interview_scheduled: boolean | null
          is_active: boolean | null
          is_published: boolean | null
          kyb_documents: Json | null
          kyb_status: string | null
          link_config: Json | null
          logo: string | null
          metadata: Json | null
          page_balance: number
          page_type: string
          page_views: number
          price: number | null
          price_type: string
          product_images: string[] | null
          published_at: string | null
          save_to_pay_deadline: string | null
          save_to_pay_enabled: boolean | null
          save_to_pay_options: Json | null
          slug: string
          store_id: string | null
          title: string
          total_payments: number
          total_revenue: number
          total_savings_collected: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          fee_mode?: string
          id?: string
          installment_count?: number | null
          interview_completed?: boolean | null
          interview_scheduled?: boolean | null
          is_active?: boolean | null
          is_published?: boolean | null
          kyb_documents?: Json | null
          kyb_status?: string | null
          link_config?: Json | null
          logo?: string | null
          metadata?: Json | null
          page_balance?: number
          page_type: string
          page_views?: number
          price?: number | null
          price_type?: string
          product_images?: string[] | null
          published_at?: string | null
          save_to_pay_deadline?: string | null
          save_to_pay_enabled?: boolean | null
          save_to_pay_options?: Json | null
          slug: string
          store_id?: string | null
          title: string
          total_payments?: number
          total_revenue?: number
          total_savings_collected?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          fee_mode?: string
          id?: string
          installment_count?: number | null
          interview_completed?: boolean | null
          interview_scheduled?: boolean | null
          is_active?: boolean | null
          is_published?: boolean | null
          kyb_documents?: Json | null
          kyb_status?: string | null
          link_config?: Json | null
          logo?: string | null
          metadata?: Json | null
          page_balance?: number
          page_type?: string
          page_views?: number
          price?: number | null
          price_type?: string
          product_images?: string[] | null
          published_at?: string | null
          save_to_pay_deadline?: string | null
          save_to_pay_enabled?: boolean | null
          save_to_pay_options?: Json | null
          slug?: string
          store_id?: string | null
          title?: string
          total_payments?: number
          total_revenue?: number
          total_savings_collected?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_pages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "online_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      paystack_webhook_events: {
        Row: {
          amount_kobo: number | null
          event_key: string
          event_type: string
          id: number
          payload: Json | null
          received_at: string
          reference: string | null
        }
        Insert: {
          amount_kobo?: number | null
          event_key: string
          event_type: string
          id?: number
          payload?: Json | null
          received_at?: string
          reference?: string | null
        }
        Update: {
          amount_kobo?: number | null
          event_key?: string
          event_type?: string
          id?: number
          payload?: Json | null
          received_at?: string
          reference?: string | null
        }
        Relationships: []
      }
      pending_users: {
        Row: {
          auth_id: string | null
          bvn_verification: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          referral_source: string | null
          referred_by: string | null
          verified: boolean | null
        }
        Insert: {
          auth_id?: string | null
          bvn_verification?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          referral_source?: string | null
          referred_by?: string | null
          verified?: boolean | null
        }
        Update: {
          auth_id?: string | null
          bvn_verification?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          referral_source?: string | null
          referred_by?: string | null
          verified?: boolean | null
        }
        Relationships: []
      }
      receipts: {
        Row: {
          bill_to: string | null
          business_name: string | null
          client_email: string | null
          client_name: string | null
          client_phone: string | null
          client_signature: string | null
          created_at: string | null
          customer_note: string | null
          from_name: string | null
          id: string
          initiator_email: string
          initiator_name: string
          initiator_phone: string | null
          issue_date: string
          metadata: Json | null
          payment_for: string
          payment_method: string | null
          receipt_id: string
          receipt_items: Json
          seller_signature: string | null
          sent_at: string | null
          signed_at: string | null
          signee_email: string | null
          signee_name: string | null
          signing_link: string | null
          status: string | null
          subtotal: number | null
          token: string
          total: number
          updated_at: string | null
          user_id: string
          verification_code: string | null
        }
        Insert: {
          bill_to?: string | null
          business_name?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_signature?: string | null
          created_at?: string | null
          customer_note?: string | null
          from_name?: string | null
          id?: string
          initiator_email: string
          initiator_name: string
          initiator_phone?: string | null
          issue_date?: string
          metadata?: Json | null
          payment_for: string
          payment_method?: string | null
          receipt_id: string
          receipt_items?: Json
          seller_signature?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signee_email?: string | null
          signee_name?: string | null
          signing_link?: string | null
          status?: string | null
          subtotal?: number | null
          token: string
          total: number
          updated_at?: string | null
          user_id: string
          verification_code?: string | null
        }
        Update: {
          bill_to?: string | null
          business_name?: string | null
          client_email?: string | null
          client_name?: string | null
          client_phone?: string | null
          client_signature?: string | null
          created_at?: string | null
          customer_note?: string | null
          from_name?: string | null
          id?: string
          initiator_email?: string
          initiator_name?: string
          initiator_phone?: string | null
          issue_date?: string
          metadata?: Json | null
          payment_for?: string
          payment_method?: string | null
          receipt_id?: string
          receipt_items?: Json
          seller_signature?: string | null
          sent_at?: string | null
          signed_at?: string | null
          signee_email?: string | null
          signee_name?: string | null
          signing_link?: string | null
          status?: string | null
          subtotal?: number | null
          token?: string
          total?: number
          updated_at?: string | null
          user_id?: string
          verification_code?: string | null
        }
        Relationships: []
      }
      referral_rewards: {
        Row: {
          created_at: string | null
          id: string
          reason: string | null
          referred_user_id: string | null
          referrer_id: string | null
          reward_amount: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          reason?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          reward_amount: number
        }
        Update: {
          created_at?: string | null
          id?: string
          reason?: string | null
          referred_user_id?: string | null
          referrer_id?: string | null
          reward_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "referral_rewards_referred_user_id_fkey"
            columns: ["referred_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_rewards_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      save_airtime_beneficiaries: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          is_default: boolean | null
          network: string | null
          network_name: string | null
          phone_number: string | null
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          network?: string | null
          network_name?: string | null
          phone_number?: string | null
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          network?: string | null
          network_name?: string | null
          phone_number?: string | null
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      save_data_beneficiaries: {
        Row: {
          amount: number | null
          created_at: string | null
          id: string
          is_default: boolean | null
          network: string | null
          network_name: string | null
          phone_number: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          network?: string | null
          network_name?: string | null
          phone_number?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          network?: string | null
          network_name?: string | null
          phone_number?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      saved_accounts: {
        Row: {
          account_name: string
          account_number: string
          auto_saved: boolean | null
          bank_code: string
          bank_name: string
          created_at: string | null
          id: string
          is_default: boolean | null
          last_used_at: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string | null
        }
        Insert: {
          account_name: string
          account_number: string
          auto_saved?: boolean | null
          bank_code: string
          bank_name: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Update: {
          account_name?: string
          account_number?: string
          auto_saved?: boolean | null
          bank_code?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_p2p_beneficiaries: {
        Row: {
          account_name: string
          account_number: string
          auto_saved: boolean | null
          created_at: string | null
          id: string
          is_default: boolean | null
          last_used_at: string | null
          updated_at: string | null
          use_count: number | null
          user_id: string | null
          wallet_id: string
        }
        Insert: {
          account_name: string
          account_number: string
          auto_saved?: boolean | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
          wallet_id: string
        }
        Update: {
          account_name?: string
          account_number?: string
          auto_saved?: boolean | null
          created_at?: string | null
          id?: string
          is_default?: boolean | null
          last_used_at?: string | null
          updated_at?: string | null
          use_count?: number | null
          user_id?: string | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_p2p_beneficiaries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      savings_plans: {
        Row: {
          completed_at: string | null
          created_at: string | null
          current_installment: number | null
          deadline: string | null
          id: string
          installment_amount: number
          installment_count: number
          last_contribution_at: string | null
          metadata: Json | null
          page_id: string | null
          penalty_amount: number | null
          product_id: string
          product_image: string | null
          product_name: string
          saved_amount: number | null
          status: string | null
          target_amount: number
          total_contributions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          current_installment?: number | null
          deadline?: string | null
          id?: string
          installment_amount: number
          installment_count: number
          last_contribution_at?: string | null
          metadata?: Json | null
          page_id?: string | null
          penalty_amount?: number | null
          product_id: string
          product_image?: string | null
          product_name: string
          saved_amount?: number | null
          status?: string | null
          target_amount: number
          total_contributions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          current_installment?: number | null
          deadline?: string | null
          id?: string
          installment_amount?: number
          installment_count?: number
          last_contribution_at?: string | null
          metadata?: Json | null
          page_id?: string | null
          penalty_amount?: number | null
          product_id?: string
          product_image?: string | null
          product_name?: string
          saved_amount?: number | null
          status?: string | null
          target_amount?: number
          total_contributions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "savings_plans_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "payment_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_plans_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "payment_pages_with_balance"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "savings_plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      signature_audit_logs: {
        Row: {
          action: string
          audit_id: string
          contract_id: string | null
          contract_token: string | null
          created_at: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          signee_email: string | null
          signee_name: string | null
          user_agent: string | null
          verification_method: string | null
        }
        Insert: {
          action: string
          audit_id: string
          contract_id?: string | null
          contract_token?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          signee_email?: string | null
          signee_name?: string | null
          user_agent?: string | null
          verification_method?: string | null
        }
        Update: {
          action?: string
          audit_id?: string
          contract_id?: string | null
          contract_token?: string | null
          created_at?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          signee_email?: string | null
          signee_name?: string | null
          user_agent?: string | null
          verification_method?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "signature_audit_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      store_activation_payments: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string | null
          id: string
          nomba_transaction_id: string | null
          order_reference: string | null
          paid_at: string | null
          payment_method: string | null
          promo_id: string | null
          reference: string
          status: string
          store_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          nomba_transaction_id?: string | null
          order_reference?: string | null
          paid_at?: string | null
          payment_method?: string | null
          promo_id?: string | null
          reference: string
          status?: string
          store_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string | null
          id?: string
          nomba_transaction_id?: string | null
          order_reference?: string | null
          paid_at?: string | null
          payment_method?: string | null
          promo_id?: string | null
          reference?: string
          status?: string
          store_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_activation_payments_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "store_activation_promos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_activation_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "online_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_activation_promos: {
        Row: {
          created_at: string
          discounted_fee: number
          expires_at: string
          id: string
          original_fee: number
          payment_id: string | null
          promo_code: string
          status: string
          updated_at: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          discounted_fee: number
          expires_at: string
          id?: string
          original_fee: number
          payment_id?: string | null
          promo_code: string
          status?: string
          updated_at?: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          discounted_fee?: number
          expires_at?: string
          id?: string
          original_fee?: number
          payment_id?: string | null
          promo_code?: string
          status?: string
          updated_at?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_activation_promos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      store_create_drafts: {
        Row: {
          cac_number: string | null
          city: string | null
          country: string
          created_at: string
          description: string | null
          id: string
          keywords: string[]
          latitude: number | null
          location_accuracy: number | null
          location_enabled: boolean
          longitude: number | null
          name: string | null
          slug: string | null
          state: string | null
          step: number
          street_address: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          cac_number?: string | null
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[]
          latitude?: number | null
          location_accuracy?: number | null
          location_enabled?: boolean
          longitude?: number | null
          name?: string | null
          slug?: string | null
          state?: string | null
          step?: number
          street_address?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          cac_number?: string | null
          city?: string | null
          country?: string
          created_at?: string
          description?: string | null
          id?: string
          keywords?: string[]
          latitude?: number | null
          location_accuracy?: number | null
          location_enabled?: boolean
          longitude?: number | null
          name?: string | null
          slug?: string | null
          state?: string | null
          step?: number
          street_address?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_delivery_addresses: {
        Row: {
          address: string
          city: string | null
          created_at: string
          fee: number
          free_threshold: number
          id: string
          is_active: boolean
          is_default: boolean
          label: string
          notes: string | null
          state: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          address: string
          city?: string | null
          created_at?: string
          fee?: number
          free_threshold?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          label: string
          notes?: string | null
          state?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string | null
          created_at?: string
          fee?: number
          free_threshold?: number
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
          notes?: string | null
          state?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_delivery_addresses_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "online_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_owner_wallets: {
        Row: {
          available_balance: number
          created_at: string
          id: string
          last_activity_at: string | null
          pending_balance: number
          store_id: string
          total_earned: number
          total_withdrawn: number
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number
          created_at?: string
          id?: string
          last_activity_at?: string | null
          pending_balance?: number
          store_id: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number
          created_at?: string
          id?: string
          last_activity_at?: string | null
          pending_balance?: number
          store_id?: string
          total_earned?: number
          total_withdrawn?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_owner_wallets_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "online_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      store_pickup_locations: {
        Row: {
          address: string
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          label: string
          notes: string | null
          phone: string | null
          store_id: string
          updated_at: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label: string
          notes?: string | null
          phone?: string | null
          store_id: string
          updated_at?: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          label?: string
          notes?: string | null
          phone?: string | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_pickup_locations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "online_stores"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_features: {
        Row: {
          created_at: string | null
          feature_key: string
          feature_limit: number | null
          feature_value: string | null
          id: string
          tier: string
        }
        Insert: {
          created_at?: string | null
          feature_key: string
          feature_limit?: number | null
          feature_value?: string | null
          id?: string
          tier: string
        }
        Update: {
          created_at?: string | null
          feature_key?: string
          feature_limit?: number | null
          feature_value?: string | null
          id?: string
          tier?: string
        }
        Relationships: []
      }
      subscription_payments: {
        Row: {
          amount: number
          created_at: string | null
          currency: string | null
          id: string
          metadata: Json | null
          nomba_transaction_id: string | null
          paid_at: string | null
          payment_method: string | null
          reference: string | null
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          nomba_transaction_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string | null
          id?: string
          metadata?: Json | null
          nomba_transaction_id?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          auto_renew: boolean | null
          cancelled_at: string | null
          created_at: string | null
          expires_at: string
          id: string
          payment_method: string | null
          started_at: string
          status: string
          tier: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          expires_at: string
          id?: string
          payment_method?: string | null
          started_at?: string
          status: string
          tier: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_renew?: boolean | null
          cancelled_at?: string | null
          created_at?: string | null
          expires_at?: string
          id?: string
          payment_method?: string | null
          started_at?: string
          status?: string
          tier?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_faq: {
        Row: {
          answer: string | null
          category: string | null
          id: string
          question: string | null
        }
        Insert: {
          answer?: string | null
          category?: string | null
          id: string
          question?: string | null
        }
        Update: {
          answer?: string | null
          category?: string | null
          id?: string
          question?: string | null
        }
        Relationships: []
      }
      tax_filings: {
        Row: {
          address_proof_url: string | null
          bank_statement_url: string
          business_address: string | null
          company_name: string | null
          created_at: string | null
          filing_type: string
          first_name: string | null
          id: string
          id_card_url: string | null
          last_name: string | null
          middle_name: string | null
          nin: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          address_proof_url?: string | null
          bank_statement_url: string
          business_address?: string | null
          company_name?: string | null
          created_at?: string | null
          filing_type: string
          first_name?: string | null
          id?: string
          id_card_url?: string | null
          last_name?: string | null
          middle_name?: string | null
          nin?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          address_proof_url?: string | null
          bank_statement_url?: string
          business_address?: string | null
          company_name?: string | null
          created_at?: string | null
          filing_type?: string
          first_name?: string | null
          id?: string
          id_card_url?: string | null
          last_name?: string | null
          middle_name?: string | null
          nin?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tax_filings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          balance_after: number | null
          balance_before: number | null
          bank78_fee: number | null
          category: string | null
          category_id: string | null
          channel: string | null
          created_at: string
          deducted_at: string | null
          description: string | null
          external_response: Json | null
          fee: number | null
          gross_amount: number | null
          id: string
          journal_entry_id: string | null
          merchant_tx_ref: string | null
          metadata: Json | null
          narration: string | null
          net_amount: number | null
          network: string | null
          organization_id: string | null
          phone_number: string | null
          provider: string | null
          provider_account_id: string | null
          provider_transaction_id: string | null
          receiver: Json | null
          reference: string | null
          sender: Json | null
          status: string
          synced_at: string | null
          synced_to_journal: boolean | null
          total_deduction: number | null
          type: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount: number
          balance_after?: number | null
          balance_before?: number | null
          bank78_fee?: number | null
          category?: string | null
          category_id?: string | null
          channel?: string | null
          created_at?: string
          deducted_at?: string | null
          description?: string | null
          external_response?: Json | null
          fee?: number | null
          gross_amount?: number | null
          id?: string
          journal_entry_id?: string | null
          merchant_tx_ref?: string | null
          metadata?: Json | null
          narration?: string | null
          net_amount?: number | null
          network?: string | null
          organization_id?: string | null
          phone_number?: string | null
          provider?: string | null
          provider_account_id?: string | null
          provider_transaction_id?: string | null
          receiver?: Json | null
          reference?: string | null
          sender?: Json | null
          status: string
          synced_at?: string | null
          synced_to_journal?: boolean | null
          total_deduction?: number | null
          type: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          balance_after?: number | null
          balance_before?: number | null
          bank78_fee?: number | null
          category?: string | null
          category_id?: string | null
          channel?: string | null
          created_at?: string
          deducted_at?: string | null
          description?: string | null
          external_response?: Json | null
          fee?: number | null
          gross_amount?: number | null
          id?: string
          journal_entry_id?: string | null
          merchant_tx_ref?: string | null
          metadata?: Json | null
          narration?: string | null
          net_amount?: number | null
          network?: string | null
          organization_id?: string | null
          phone_number?: string | null
          provider?: string | null
          provider_account_id?: string | null
          provider_transaction_id?: string | null
          receiver?: Json | null
          reference?: string | null
          sender?: Json | null
          status?: string
          synced_at?: string | null
          synced_to_journal?: boolean | null
          total_deduction?: number | null
          type?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions_backup_20260913: {
        Row: {
          amount: number | null
          balance_after: number | null
          balance_before: number | null
          bank78_fee: number | null
          category: string | null
          category_id: string | null
          channel: string | null
          created_at: string | null
          deducted_at: string | null
          description: string | null
          external_response: Json | null
          fee: number | null
          gross_amount: number | null
          id: string | null
          journal_entry_id: string | null
          merchant_tx_ref: string | null
          metadata: Json | null
          narration: string | null
          net_amount: number | null
          network: string | null
          organization_id: string | null
          phone_number: string | null
          provider: string | null
          provider_account_id: string | null
          provider_transaction_id: string | null
          receiver: Json | null
          reference: string | null
          sender: Json | null
          status: string | null
          synced_at: string | null
          synced_to_journal: boolean | null
          total_deduction: number | null
          type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          balance_after?: number | null
          balance_before?: number | null
          bank78_fee?: number | null
          category?: string | null
          category_id?: string | null
          channel?: string | null
          created_at?: string | null
          deducted_at?: string | null
          description?: string | null
          external_response?: Json | null
          fee?: number | null
          gross_amount?: number | null
          id?: string | null
          journal_entry_id?: string | null
          merchant_tx_ref?: string | null
          metadata?: Json | null
          narration?: string | null
          net_amount?: number | null
          network?: string | null
          organization_id?: string | null
          phone_number?: string | null
          provider?: string | null
          provider_account_id?: string | null
          provider_transaction_id?: string | null
          receiver?: Json | null
          reference?: string | null
          sender?: Json | null
          status?: string | null
          synced_at?: string | null
          synced_to_journal?: boolean | null
          total_deduction?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          balance_after?: number | null
          balance_before?: number | null
          bank78_fee?: number | null
          category?: string | null
          category_id?: string | null
          channel?: string | null
          created_at?: string | null
          deducted_at?: string | null
          description?: string | null
          external_response?: Json | null
          fee?: number | null
          gross_amount?: number | null
          id?: string | null
          journal_entry_id?: string | null
          merchant_tx_ref?: string | null
          metadata?: Json | null
          narration?: string | null
          net_amount?: number | null
          network?: string | null
          organization_id?: string | null
          phone_number?: string | null
          provider?: string | null
          provider_account_id?: string | null
          provider_transaction_id?: string | null
          receiver?: Json | null
          reference?: string | null
          sender?: Json | null
          status?: string | null
          synced_at?: string | null
          synced_to_journal?: boolean | null
          total_deduction?: number | null
          type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      trusted_devices: {
        Row: {
          created_at: string | null
          device_fingerprint: string
          device_name: string | null
          id: string
          is_trusted: boolean | null
          last_ip: string | null
          last_location: string | null
          last_used: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_fingerprint: string
          device_name?: string | null
          id?: string
          is_trusted?: boolean | null
          last_ip?: string | null
          last_location?: string | null
          last_used?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string
          device_name?: string | null
          id?: string
          is_trusted?: boolean | null
          last_ip?: string | null
          last_location?: string | null
          last_used?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "trusted_devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_activity_logs: {
        Row: {
          action: string
          created_at: string | null
          email: string
          id: string
          ip_address: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          email: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          email?: string
          id?: string
          ip_address?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_activity_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bank_accounts: {
        Row: {
          account_id: string
          account_number: string
          bank_name: string
          created_at: string | null
          id: string
          metadata: Json | null
          provider: string
          status: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          account_number: string
          bank_name: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider: string
          status?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          account_number?: string
          bank_name?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          provider?: string
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_bank_accounts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_notification_preferences: {
        Row: {
          contract_updates: boolean | null
          email_notifications: boolean | null
          in_app_notifications: boolean | null
          marketing_emails: boolean | null
          push_notifications: boolean | null
          sms_notifications: boolean | null
          transaction_alerts: boolean | null
          updated_at: string | null
          user_id: string
          wallet_alerts: boolean | null
        }
        Insert: {
          contract_updates?: boolean | null
          email_notifications?: boolean | null
          in_app_notifications?: boolean | null
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          transaction_alerts?: boolean | null
          updated_at?: string | null
          user_id: string
          wallet_alerts?: boolean | null
        }
        Update: {
          contract_updates?: boolean | null
          email_notifications?: boolean | null
          in_app_notifications?: boolean | null
          marketing_emails?: boolean | null
          push_notifications?: boolean | null
          sms_notifications?: boolean | null
          transaction_alerts?: boolean | null
          updated_at?: string | null
          user_id?: string
          wallet_alerts?: boolean | null
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          created_at: string | null
          device_info: string | null
          expires_at: string
          id: string
          ip_address: string | null
          last_active_at: string | null
          session_token: string
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          device_info?: string | null
          expires_at: string
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          session_token: string
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          device_info?: string | null
          expires_at?: string
          id?: string
          ip_address?: string | null
          last_active_at?: string | null
          session_token?: string
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_signatures: {
        Row: {
          created_at: string
          id: string
          signature_data: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          signature_data: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          signature_data?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_trials: {
        Row: {
          created_at: string | null
          ends_at: string
          feature_key: string
          id: string
          starts_at: string
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ends_at: string
          feature_key: string
          id?: string
          starts_at?: string
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ends_at?: string
          feature_key?: string
          id?: string
          starts_at?: string
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_trials_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          account_tier: string
          activated_at: string | null
          activation_paid: boolean | null
          activation_reference: string | null
          address: string | null
          admin_role: string | null
          attractions: string[] | null
          bank_account_name: string | null
          bank_account_number: string | null
          bank_name: string | null
          bank78_business_account_id: string | null
          bank78_business_account_name: string | null
          bank78_business_account_number: string | null
          bank78_business_bank_name: string | null
          bank78_customer_id: string | null
          bank78_personal_account_id: string | null
          bank78_personal_account_name: string | null
          bank78_personal_account_number: string | null
          bank78_personal_bank_name: string | null
          bank78_verified: boolean | null
          bank78_verified_at: string | null
          block_reason: string | null
          blocked_at: string | null
          bvn_data: Json | null
          bvn_verification: string | null
          cac_data: Json | null
          city: string | null
          contract_lifetime_limit: number | null
          contracts_used_lifetime: number | null
          contracts_used_monthly: number | null
          country: string | null
          created_at: string
          current_login_session: string | null
          current_organization_id: string | null
          current_session_device: string | null
          current_session_expires_at: string | null
          current_session_id: string | null
          current_session_ip: string | null
          custom_fee_note: string | null
          custom_outflow_min: number | null
          custom_outflow_percent: number | null
          daily_transaction_limit: number | null
          date_of_birth: string | null
          dob_verified: boolean | null
          email: string
          email_verification_token: string | null
          email_verification_token_expires: string | null
          email_verified: boolean | null
          encrypted_bvn: string | null
          face_comparison_score: number | null
          face_comparison_verified: boolean | null
          face_image_provided: string | null
          face_liveness_score: number | null
          face_liveness_verified: boolean | null
          face_match_verified: boolean | null
          first_name: string | null
          flag_notes: string | null
          flag_reason: string | null
          flagged_at: string | null
          full_name: string
          has_business_account_pro: boolean | null
          heard_from: string | null
          id: string
          id_verified_name: string | null
          identity_verified: boolean | null
          invoice_lifetime_limit: number | null
          invoices_used_lifetime: number | null
          invoices_used_monthly: number | null
          is_blocked: boolean | null
          is_business_registered: boolean | null
          is_flagged: boolean | null
          kyc_approved_at: string | null
          kyc_approved_by: string | null
          kyc_completed_at: string | null
          kyc_level: string | null
          kyc_rejected_at: string | null
          kyc_rejected_by: string | null
          kyc_rejection_reason: string | null
          last_login: string | null
          last_logout: string | null
          last_name: string | null
          last_usage_reset: string | null
          limit_updated_at: string | null
          monthly_transaction_limit: number | null
          name_mismatch: boolean | null
          name_verified: boolean | null
          nin: string | null
          nin_verification: string | null
          notification_preferences: Json | null
          onboarding_completed: boolean | null
          onboarding_step: number | null
          p_account_name: string | null
          p_account_number: string | null
          p_bank_code: string | null
          p_bank_name: string | null
          phone: string
          pin_attempts: number | null
          pin_locked_until: string | null
          pin_reset_token: string | null
          pin_reset_token_expires: string | null
          pin_set: boolean | null
          primary_provider: string | null
          profile_picture: string | null
          purpose: string | null
          receipt_lifetime_limit: number | null
          receipts_used_lifetime: number | null
          receipts_used_monthly: number | null
          referral_code: string | null
          referral_source: string | null
          referred_by: string | null
          region: string | null
          state: string | null
          subscription_expires_at: string | null
          subscription_tier: string | null
          suspension_duration: number | null
          total_invoices_created: number | null
          transaction_pin: string | null
          updated_at: string | null
          verification_completed: boolean | null
          verification_id: string | null
          verification_logs: Json | null
          verification_provider: string | null
          verification_reference: string | null
          verification_response: string | null
          verification_status: string | null
          verification_step: number | null
          verified_at: string | null
          wallet_balance: number
          wallet_freeze_reason: string | null
          wallet_frozen: boolean | null
          wallet_frozen_at: string | null
          wallet_id: string | null
          wallet_provider: string | null
          wallet_updated_at: string | null
          zidcoin_balance: number
          zidstore_plan_expires_at: string | null
          zidstore_plan_tier: string | null
        }
        Insert: {
          account_tier?: string
          activated_at?: string | null
          activation_paid?: boolean | null
          activation_reference?: string | null
          address?: string | null
          admin_role?: string | null
          attractions?: string[] | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank78_business_account_id?: string | null
          bank78_business_account_name?: string | null
          bank78_business_account_number?: string | null
          bank78_business_bank_name?: string | null
          bank78_customer_id?: string | null
          bank78_personal_account_id?: string | null
          bank78_personal_account_name?: string | null
          bank78_personal_account_number?: string | null
          bank78_personal_bank_name?: string | null
          bank78_verified?: boolean | null
          bank78_verified_at?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          bvn_data?: Json | null
          bvn_verification?: string | null
          cac_data?: Json | null
          city?: string | null
          contract_lifetime_limit?: number | null
          contracts_used_lifetime?: number | null
          contracts_used_monthly?: number | null
          country?: string | null
          created_at?: string
          current_login_session?: string | null
          current_organization_id?: string | null
          current_session_device?: string | null
          current_session_expires_at?: string | null
          current_session_id?: string | null
          current_session_ip?: string | null
          custom_fee_note?: string | null
          custom_outflow_min?: number | null
          custom_outflow_percent?: number | null
          daily_transaction_limit?: number | null
          date_of_birth?: string | null
          dob_verified?: boolean | null
          email: string
          email_verification_token?: string | null
          email_verification_token_expires?: string | null
          email_verified?: boolean | null
          encrypted_bvn?: string | null
          face_comparison_score?: number | null
          face_comparison_verified?: boolean | null
          face_image_provided?: string | null
          face_liveness_score?: number | null
          face_liveness_verified?: boolean | null
          face_match_verified?: boolean | null
          first_name?: string | null
          flag_notes?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          full_name: string
          has_business_account_pro?: boolean | null
          heard_from?: string | null
          id: string
          id_verified_name?: string | null
          identity_verified?: boolean | null
          invoice_lifetime_limit?: number | null
          invoices_used_lifetime?: number | null
          invoices_used_monthly?: number | null
          is_blocked?: boolean | null
          is_business_registered?: boolean | null
          is_flagged?: boolean | null
          kyc_approved_at?: string | null
          kyc_approved_by?: string | null
          kyc_completed_at?: string | null
          kyc_level?: string | null
          kyc_rejected_at?: string | null
          kyc_rejected_by?: string | null
          kyc_rejection_reason?: string | null
          last_login?: string | null
          last_logout?: string | null
          last_name?: string | null
          last_usage_reset?: string | null
          limit_updated_at?: string | null
          monthly_transaction_limit?: number | null
          name_mismatch?: boolean | null
          name_verified?: boolean | null
          nin?: string | null
          nin_verification?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          p_account_name?: string | null
          p_account_number?: string | null
          p_bank_code?: string | null
          p_bank_name?: string | null
          phone: string
          pin_attempts?: number | null
          pin_locked_until?: string | null
          pin_reset_token?: string | null
          pin_reset_token_expires?: string | null
          pin_set?: boolean | null
          primary_provider?: string | null
          profile_picture?: string | null
          purpose?: string | null
          receipt_lifetime_limit?: number | null
          receipts_used_lifetime?: number | null
          receipts_used_monthly?: number | null
          referral_code?: string | null
          referral_source?: string | null
          referred_by?: string | null
          region?: string | null
          state?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          suspension_duration?: number | null
          total_invoices_created?: number | null
          transaction_pin?: string | null
          updated_at?: string | null
          verification_completed?: boolean | null
          verification_id?: string | null
          verification_logs?: Json | null
          verification_provider?: string | null
          verification_reference?: string | null
          verification_response?: string | null
          verification_status?: string | null
          verification_step?: number | null
          verified_at?: string | null
          wallet_balance: number
          wallet_freeze_reason?: string | null
          wallet_frozen?: boolean | null
          wallet_frozen_at?: string | null
          wallet_id?: string | null
          wallet_provider?: string | null
          wallet_updated_at?: string | null
          zidcoin_balance?: number
          zidstore_plan_expires_at?: string | null
          zidstore_plan_tier?: string | null
        }
        Update: {
          account_tier?: string
          activated_at?: string | null
          activation_paid?: boolean | null
          activation_reference?: string | null
          address?: string | null
          admin_role?: string | null
          attractions?: string[] | null
          bank_account_name?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          bank78_business_account_id?: string | null
          bank78_business_account_name?: string | null
          bank78_business_account_number?: string | null
          bank78_business_bank_name?: string | null
          bank78_customer_id?: string | null
          bank78_personal_account_id?: string | null
          bank78_personal_account_name?: string | null
          bank78_personal_account_number?: string | null
          bank78_personal_bank_name?: string | null
          bank78_verified?: boolean | null
          bank78_verified_at?: string | null
          block_reason?: string | null
          blocked_at?: string | null
          bvn_data?: Json | null
          bvn_verification?: string | null
          cac_data?: Json | null
          city?: string | null
          contract_lifetime_limit?: number | null
          contracts_used_lifetime?: number | null
          contracts_used_monthly?: number | null
          country?: string | null
          created_at?: string
          current_login_session?: string | null
          current_organization_id?: string | null
          current_session_device?: string | null
          current_session_expires_at?: string | null
          current_session_id?: string | null
          current_session_ip?: string | null
          custom_fee_note?: string | null
          custom_outflow_min?: number | null
          custom_outflow_percent?: number | null
          daily_transaction_limit?: number | null
          date_of_birth?: string | null
          dob_verified?: boolean | null
          email?: string
          email_verification_token?: string | null
          email_verification_token_expires?: string | null
          email_verified?: boolean | null
          encrypted_bvn?: string | null
          face_comparison_score?: number | null
          face_comparison_verified?: boolean | null
          face_image_provided?: string | null
          face_liveness_score?: number | null
          face_liveness_verified?: boolean | null
          face_match_verified?: boolean | null
          first_name?: string | null
          flag_notes?: string | null
          flag_reason?: string | null
          flagged_at?: string | null
          full_name?: string
          has_business_account_pro?: boolean | null
          heard_from?: string | null
          id?: string
          id_verified_name?: string | null
          identity_verified?: boolean | null
          invoice_lifetime_limit?: number | null
          invoices_used_lifetime?: number | null
          invoices_used_monthly?: number | null
          is_blocked?: boolean | null
          is_business_registered?: boolean | null
          is_flagged?: boolean | null
          kyc_approved_at?: string | null
          kyc_approved_by?: string | null
          kyc_completed_at?: string | null
          kyc_level?: string | null
          kyc_rejected_at?: string | null
          kyc_rejected_by?: string | null
          kyc_rejection_reason?: string | null
          last_login?: string | null
          last_logout?: string | null
          last_name?: string | null
          last_usage_reset?: string | null
          limit_updated_at?: string | null
          monthly_transaction_limit?: number | null
          name_mismatch?: boolean | null
          name_verified?: boolean | null
          nin?: string | null
          nin_verification?: string | null
          notification_preferences?: Json | null
          onboarding_completed?: boolean | null
          onboarding_step?: number | null
          p_account_name?: string | null
          p_account_number?: string | null
          p_bank_code?: string | null
          p_bank_name?: string | null
          phone?: string
          pin_attempts?: number | null
          pin_locked_until?: string | null
          pin_reset_token?: string | null
          pin_reset_token_expires?: string | null
          pin_set?: boolean | null
          primary_provider?: string | null
          profile_picture?: string | null
          purpose?: string | null
          receipt_lifetime_limit?: number | null
          receipts_used_lifetime?: number | null
          receipts_used_monthly?: number | null
          referral_code?: string | null
          referral_source?: string | null
          referred_by?: string | null
          region?: string | null
          state?: string | null
          subscription_expires_at?: string | null
          subscription_tier?: string | null
          suspension_duration?: number | null
          total_invoices_created?: number | null
          transaction_pin?: string | null
          updated_at?: string | null
          verification_completed?: boolean | null
          verification_id?: string | null
          verification_logs?: Json | null
          verification_provider?: string | null
          verification_reference?: string | null
          verification_response?: string | null
          verification_status?: string | null
          verification_step?: number | null
          verified_at?: string | null
          wallet_balance?: number
          wallet_freeze_reason?: string | null
          wallet_frozen?: boolean | null
          wallet_frozen_at?: string | null
          wallet_id?: string | null
          wallet_provider?: string | null
          wallet_updated_at?: string | null
          zidcoin_balance?: number
          zidstore_plan_expires_at?: string | null
          zidstore_plan_tier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_current_organization_id_fkey"
            columns: ["current_organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      verify_rate_limits: {
        Row: {
          count: number
          key: string
          reset_at: string
        }
        Insert: {
          count?: number
          key: string
          reset_at: string
        }
        Update: {
          count?: number
          key?: string
          reset_at?: string
        }
        Relationships: []
      }
      wallet_withdrawal_requests: {
        Row: {
          amount: number
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          completed_at: string | null
          created_at: string | null
          facial_verification_completed_at: string | null
          facial_verification_required: boolean | null
          facial_verification_status: string | null
          failure_reason: string | null
          fee: number | null
          id: string
          net_amount: number
          processed_at: string | null
          reference: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_name: string
          bank_account_number: string
          bank_name: string
          completed_at?: string | null
          created_at?: string | null
          facial_verification_completed_at?: string | null
          facial_verification_required?: boolean | null
          facial_verification_status?: string | null
          failure_reason?: string | null
          fee?: number | null
          id?: string
          net_amount: number
          processed_at?: string | null
          reference?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_name?: string
          bank_account_number?: string
          bank_name?: string
          completed_at?: string | null
          created_at?: string | null
          facial_verification_completed_at?: string | null
          facial_verification_required?: boolean | null
          facial_verification_status?: string | null
          failure_reason?: string | null
          fee?: number | null
          id?: string
          net_amount?: number
          processed_at?: string | null
          reference?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_withdrawal_requests_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_subscriptions: {
        Row: {
          expires_at: string | null
          id: string
          plan: string | null
          user_id: string | null
        }
        Insert: {
          expires_at?: string | null
          id: string
          plan?: string | null
          user_id?: string | null
        }
        Update: {
          expires_at?: string | null
          id?: string
          plan?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "whatsapp_users"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_users: {
        Row: {
          created_at: string | null
          current_state: string | null
          id: string
          phone: string
          subscription_active: boolean | null
        }
        Insert: {
          created_at?: string | null
          current_state?: string | null
          id?: string
          phone: string
          subscription_active?: boolean | null
        }
        Update: {
          created_at?: string | null
          current_state?: string | null
          id?: string
          phone?: string
          subscription_active?: boolean | null
        }
        Relationships: []
      }
      zidcoin_cashback_transactions: {
        Row: {
          awarded_at: string | null
          cashback_rate: number
          id: string
          status: string | null
          transaction_amount: number
          transaction_id: string
          transaction_type: string
          user_id: string
          zidcoins_awarded: number
        }
        Insert: {
          awarded_at?: string | null
          cashback_rate: number
          id?: string
          status?: string | null
          transaction_amount: number
          transaction_id: string
          transaction_type: string
          user_id: string
          zidcoins_awarded: number
        }
        Update: {
          awarded_at?: string | null
          cashback_rate?: number
          id?: string
          status?: string | null
          transaction_amount?: number
          transaction_id?: string
          transaction_type?: string
          user_id?: string
          zidcoins_awarded?: number
        }
        Relationships: [
          {
            foreignKeyName: "zidcoin_cashback_transactions_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zidcoin_cashback_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      zidcoin_transactions: {
        Row: {
          amount: number
          created_at: string | null
          description: string | null
          id: string
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description?: string | null
          id?: string
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string | null
          id?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "zidcoin_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      zidstore_plans: {
        Row: {
          amount_monthly: number
          amount_yearly: number
          created_at: string
          currency: string
          display_order: number
          features: Json
          id: string
          is_active: boolean
          name: string
          tagline: string | null
          tier: string
          updated_at: string
        }
        Insert: {
          amount_monthly?: number
          amount_yearly?: number
          created_at?: string
          currency?: string
          display_order?: number
          features?: Json
          id?: string
          is_active?: boolean
          name: string
          tagline?: string | null
          tier: string
          updated_at?: string
        }
        Update: {
          amount_monthly?: number
          amount_yearly?: number
          created_at?: string
          currency?: string
          display_order?: number
          features?: Json
          id?: string
          is_active?: boolean
          name?: string
          tagline?: string | null
          tier?: string
          updated_at?: string
        }
        Relationships: []
      }
      zidstore_subscription_payments: {
        Row: {
          amount: number
          authorization_url: string | null
          billing_period: string
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          metadata: Json
          paid_at: string | null
          plan_tier: string
          provider: string
          provider_transaction_id: string | null
          reference: string
          status: string
          subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          authorization_url?: string | null
          billing_period: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_tier: string
          provider?: string
          provider_transaction_id?: string | null
          reference: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          authorization_url?: string | null
          billing_period?: string
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          metadata?: Json
          paid_at?: string | null
          plan_tier?: string
          provider?: string
          provider_transaction_id?: string | null
          reference?: string
          status?: string
          subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zidstore_subscription_payments_plan_tier_fkey"
            columns: ["plan_tier"]
            isOneToOne: false
            referencedRelation: "zidstore_plans"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "zidstore_subscription_payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "zidstore_subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "zidstore_subscription_payments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      zidstore_subscriptions: {
        Row: {
          billing_period: string
          cancel_at_period_end: boolean
          cancelled_at: string | null
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          plan_tier: string
          started_at: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          billing_period: string
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end: string
          current_period_start?: string
          id?: string
          plan_tier: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          billing_period?: string
          cancel_at_period_end?: boolean
          cancelled_at?: string | null
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          plan_tier?: string
          started_at?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "zidstore_subscriptions_plan_tier_fkey"
            columns: ["plan_tier"]
            isOneToOne: false
            referencedRelation: "zidstore_plans"
            referencedColumns: ["tier"]
          },
          {
            foreignKeyName: "zidstore_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      payment_pages_with_balance: {
        Row: {
          computed_balance: number | null
          cover_image: string | null
          created_at: string | null
          description: string | null
          fee_mode: string | null
          id: string | null
          installment_count: number | null
          interview_completed: boolean | null
          interview_scheduled: boolean | null
          is_active: boolean | null
          is_published: boolean | null
          kyb_documents: Json | null
          kyb_status: string | null
          link_config: Json | null
          logo: string | null
          metadata: Json | null
          page_balance: number | null
          page_type: string | null
          page_views: number | null
          price: number | null
          price_type: string | null
          product_images: string[] | null
          published_at: string | null
          save_to_pay_deadline: string | null
          save_to_pay_enabled: boolean | null
          save_to_pay_options: Json | null
          slug: string | null
          title: string | null
          total_payments: number | null
          total_revenue: number | null
          total_savings_collected: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          computed_balance?: never
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          fee_mode?: string | null
          id?: string | null
          installment_count?: number | null
          interview_completed?: boolean | null
          interview_scheduled?: boolean | null
          is_active?: boolean | null
          is_published?: boolean | null
          kyb_documents?: Json | null
          kyb_status?: string | null
          link_config?: Json | null
          logo?: string | null
          metadata?: Json | null
          page_balance?: number | null
          page_type?: string | null
          page_views?: number | null
          price?: number | null
          price_type?: string | null
          product_images?: string[] | null
          published_at?: string | null
          save_to_pay_deadline?: string | null
          save_to_pay_enabled?: boolean | null
          save_to_pay_options?: Json | null
          slug?: string | null
          title?: string | null
          total_payments?: number | null
          total_revenue?: number | null
          total_savings_collected?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          computed_balance?: never
          cover_image?: string | null
          created_at?: string | null
          description?: string | null
          fee_mode?: string | null
          id?: string | null
          installment_count?: number | null
          interview_completed?: boolean | null
          interview_scheduled?: boolean | null
          is_active?: boolean | null
          is_published?: boolean | null
          kyb_documents?: Json | null
          kyb_status?: string | null
          link_config?: Json | null
          logo?: string | null
          metadata?: Json | null
          page_balance?: number | null
          page_type?: string | null
          page_views?: number | null
          price?: number | null
          price_type?: string | null
          product_images?: string[] | null
          published_at?: string | null
          save_to_pay_deadline?: string | null
          save_to_pay_enabled?: boolean | null
          save_to_pay_options?: Json | null
          slug?: string | null
          title?: string | null
          total_payments?: number | null
          total_revenue?: number | null
          total_savings_collected?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      award_zidcoin_cashback: {
        Args: {
          p_amount: number
          p_transaction_id: string
          p_transaction_type: string
          p_user_id: string
        }
        Returns: Json
      }
      credit_store_owner_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_source?: string
          p_source_id?: string
          p_user_id: string
        }
        Returns: Json
      }
      debit_store_owner_wallet: {
        Args: {
          p_amount: number
          p_description?: string
          p_purpose?: string
          p_reference?: string
          p_user_id: string
        }
        Returns: Json
      }
      decrement_page_balance: {
        Args: { p_amount: number; p_page_id: string }
        Returns: number
      }
      deduct_wallet_balance: {
        Args: {
          amt: number
          description: string
          reference: string
          transaction_type: string
          user_id: string
        }
        Returns: {
          new_balance: number
          status: string
          tx_id: string
        }[]
      }
      deduct_wallet_balance_with_lock: {
        Args: { p_amount: number; p_transaction_id: string; p_user_id: string }
        Returns: number
      }
      expire_user_trials: { Args: never; Returns: undefined }
      get_page_balance: { Args: { p_page_id: string }; Returns: number }
      get_store_owner_wallet_balance: {
        Args: { p_user_id: string }
        Returns: {
          available_balance: number
          pending_balance: number
          total_earned: number
          total_withdrawn: number
        }[]
      }
      get_user_admin_role: { Args: never; Returns: string }
      increment_online_store_balance: {
        Args: { p_amount: number; p_store_id: string }
        Returns: number
      }
      increment_page_balance: {
        Args: { p_amount: number; p_page_id: string }
        Returns: number
      }
      increment_store_views: {
        Args: { p_store_id: string }
        Returns: undefined
      }
      increment_wallet_balance: {
        Args: { amt: number; user_id: string }
        Returns: undefined
      }
      mutate_wallet_balance: {
        Args: {
          p_amount: number
          p_reason?: string
          p_transaction_id: string
          p_user_id: string
        }
        Returns: number
      }
      record_pp_installment_payment: {
        Args: {
          p_amount_net: number
          p_buyer_email: string
          p_buyer_name: string
          p_buyer_phone: string
          p_installment_amt: number
          p_installment_count: number
          p_installment_period: string
          p_payment_id: string
          p_payment_page_id: string
          p_selection: Json
          p_student_name?: string
          p_total_amount: number
          p_user_id: string
        }
        Returns: Json
      }
      refund_wallet_balance: {
        Args: { amt: number; user_id: string }
        Returns: string
      }
      reset_monthly_usage: { Args: never; Returns: undefined }
      sync_store_owner_wallets: { Args: never; Returns: undefined }
      withdraw_from_store_wallet: {
        Args: { p_amount: number; p_fee?: number; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      status: "pending" | "Active" | "Failed"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      status: ["pending", "Active", "Failed"],
    },
  },
} as const
