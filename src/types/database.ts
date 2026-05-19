import type {
  BillingStatus,
  NotificationChannel,
  NotificationStatus,
  PlanTier,
  SlotStatus,
  Sport
} from "./domain";

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      app_users: {
        Row: {
          id: string;
          auth_user_id: string | null;
          email: string;
          phone: string | null;
          plan_tier: PlanTier;
          created_at: string;
        };
        Insert: {
          id?: string;
          auth_user_id?: string | null;
          email: string;
          phone?: string | null;
          plan_tier?: PlanTier;
          created_at?: string;
        };
        Update: {
          auth_user_id?: string | null;
          email?: string;
          phone?: string | null;
          plan_tier?: PlanTier;
        };
      };
      venues: {
        Row: {
          id: string;
          name: string;
          slug: string;
          address: string;
          city: string;
          neighborhood: string;
          latitude: number;
          longitude: number;
          booking_url: string;
          source_url: string;
          sports: Sport[];
          number_of_courts: number;
          indoor_outdoor: string;
          lights: boolean;
          public_private: string;
          live_status: string;
          source_platform: string;
          notes: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug: string;
          address: string;
          city: string;
          neighborhood: string;
          latitude: number;
          longitude: number;
          booking_url: string;
          source_url: string;
          sports: Sport[];
          number_of_courts: number;
          indoor_outdoor: string;
          lights: boolean;
          public_private: string;
          live_status: string;
          source_platform: string;
          notes?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          address?: string;
          city?: string;
          neighborhood?: string;
          latitude?: number;
          longitude?: number;
          booking_url?: string;
          source_url?: string;
          sports?: Sport[];
          number_of_courts?: number;
          indoor_outdoor?: string;
          lights?: boolean;
          public_private?: string;
          live_status?: string;
          source_platform?: string;
          notes?: string;
          created_at?: string;
        };
      };
      courts: {
        Row: {
          id: string;
          venue_id: string;
          name: string;
          sport: Sport;
          surface: string;
          indoor: boolean;
          active: boolean;
        };
        Insert: {
          id?: string;
          venue_id: string;
          name: string;
          sport: Sport;
          surface: string;
          indoor?: boolean;
          active?: boolean;
        };
        Update: {
          id?: string;
          venue_id?: string;
          name?: string;
          sport?: Sport;
          surface?: string;
          indoor?: boolean;
          active?: boolean;
        };
      };
      alert_preferences: {
        Row: {
          id: string;
          user_id: string;
          venue_id: string;
          court_id: string;
          sport: Sport;
          days_of_week: number[];
          start_time: string;
          end_time: string;
          channels: NotificationChannel[];
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          venue_id: string;
          court_id: string;
          sport: Sport;
          days_of_week: number[];
          start_time: string;
          end_time: string;
          channels: NotificationChannel[];
          active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          venue_id?: string;
          court_id?: string;
          sport?: Sport;
          days_of_week?: number[];
          start_time?: string;
          end_time?: string;
          channels?: NotificationChannel[];
          active?: boolean;
          created_at?: string;
        };
      };
      availability_snapshots: {
        Row: {
          id: string;
          checked_at: string;
          source: "mock" | "manual";
          open_slot_count: number;
          slots: Json;
        };
        Insert: {
          id?: string;
          checked_at?: string;
          source?: "mock" | "manual";
          open_slot_count?: number;
          slots?: Json;
        };
        Update: never;
      };
      monitoring_requests: {
        Row: {
          id: string;
          facility_id: string;
          sport: Sport;
          preferred_time: string;
          email: string | null;
          phone: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          facility_id: string;
          sport: Sport;
          preferred_time: string;
          email?: string | null;
          phone?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      notification_events: {
        Row: {
          id: string;
          alert_preference_id: string;
          user_id: string;
          channel: NotificationChannel;
          recipient: string;
          slot_fingerprint: string;
          status: NotificationStatus;
          message: string;
          provider_response: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          alert_preference_id: string;
          user_id: string;
          channel: NotificationChannel;
          recipient: string;
          slot_fingerprint: string;
          status: NotificationStatus;
          message: string;
          provider_response?: string | null;
          created_at?: string;
        };
        Update: never;
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_tier: PlanTier;
          status: BillingStatus;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          current_period_end: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_tier?: PlanTier;
          status?: BillingStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_tier?: PlanTier;
          status?: BillingStatus;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          current_period_end?: string | null;
        };
      };
    };
    Enums: {
      sport: Sport;
      plan_tier: PlanTier;
      notification_channel: NotificationChannel;
      slot_status: SlotStatus;
      notification_status: NotificationStatus;
      billing_status: BillingStatus;
    };
  };
};
