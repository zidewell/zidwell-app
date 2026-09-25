export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          full_name: string;
          email: string;
          phone: string;
          wallet_balance: number;
          zidcoin_balance: number;
          referral_code: string | null;
          bvn_verification: string | null;
          admin_role: string | null;
          city: string | null;
          state: string | null;
          address: string | null;
          date_of_birth: string | null;
          profile_picture: string | null;
          current_login_session: string | null;
          subscription_tier: string | null;
          subscription_expires_at: string | null;
          is_blocked: boolean | null;
          blocked_at: string | null;
          block_reason: string | null;
          transaction_pin: string | null;
          pin_set: boolean | null;
          current_session_id: string | null;
          current_session_ip: string | null;
          current_session_device: string | null;
          current_session_expires_at: string | null;
        };

        Insert: {
          id?: string;
          full_name: string;
          email: string;
          phone: string;
          wallet_balance?: number;
          zidcoin_balance?: number;
          referral_code?: string | null;
          bvn_verification?: string | null;
          admin_role?: string | null;
          city?: string | null;
          state?: string | null;
          address?: string | null;
          date_of_birth?: string | null;
          profile_picture?: string | null;
          current_login_session?: string | null;
          subscription_tier?: string | null;
          subscription_expires_at?: string | null;
          is_blocked?: boolean | null;
          blocked_at?: string | null;
          block_reason?: string | null;
          transaction_pin?: string | null;
          pin_set?: boolean | null;
          current_session_id?: string | null;
          current_session_ip?: string | null;
          current_session_device?: string | null;
          current_session_expires_at?: string | null;
        };

        Update: {
          id?: string;
          full_name?: string;
          email?: string;
          phone?: string;
          wallet_balance?: number;
          zidcoin_balance?: number;
          referral_code?: string | null;
          bvn_verification?: string | null;
          admin_role?: string | null;
          city?: string | null;
          state?: string | null;
          address?: string | null;
          date_of_birth?: string | null;
          profile_picture?: string | null;
          current_login_session?: string | null;
          subscription_tier?: string | null;
          subscription_expires_at?: string | null;
          is_blocked?: boolean | null;
          blocked_at?: string | null;
          block_reason?: string | null;
          transaction_pin?: string | null;
          pin_set?: boolean | null;
          current_session_id?: string | null;
          current_session_ip?: string | null;
          current_session_device?: string | null;
          current_session_expires_at?: string | null;
        };

        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};