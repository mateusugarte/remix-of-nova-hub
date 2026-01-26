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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_campaigns: {
        Row: {
          budget: number | null
          created_at: string | null
          end_date: string | null
          group_id: string | null
          id: string
          name: string
          notes: string | null
          platform: string
          start_date: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          budget?: number | null
          created_at?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          name: string
          notes?: string | null
          platform?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          budget?: number | null
          created_at?: string | null
          end_date?: string | null
          group_id?: string | null
          id?: string
          name?: string
          notes?: string | null
          platform?: string
          start_date?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_campaigns_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "campaign_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      bancos: {
        Row: {
          icone: string | null
          id: string
          nome: string
        }
        Insert: {
          icone?: string | null
          id?: string
          nome: string
        }
        Update: {
          icone?: string | null
          id?: string
          nome?: string
        }
        Relationships: []
      }
      campaign_groups: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          planning: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          planning?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          planning?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_metric_definitions: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          unit: string | null
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          unit?: string | null
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          unit?: string | null
          user_id?: string
        }
        Relationships: []
      }
      campaign_metrics: {
        Row: {
          campaign_id: string
          created_at: string | null
          id: string
          metric_date: string
          metrics: Json
          notes: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          id?: string
          metric_date: string
          metrics?: Json
          notes?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          id?: string
          metric_date?: string
          metrics?: Json
          notes?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_metrics_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "ad_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      client_payments: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          due_date: string
          id: string
          is_paid: boolean | null
          notes: string | null
          paid_at: string | null
        }
        Insert: {
          amount?: number
          client_id: string
          created_at?: string | null
          due_date: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_at?: string | null
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          due_date?: string
          id?: string
          is_paid?: boolean | null
          notes?: string | null
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          contract_value: number | null
          created_at: string | null
          current_phase_id: string | null
          email: string | null
          id: string
          instagram: string | null
          name: string
          notes: string | null
          phone: string | null
          product_id: string | null
          recurrence_value: number | null
          start_date: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          contract_value?: number | null
          created_at?: string | null
          current_phase_id?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          product_id?: string | null
          recurrence_value?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          contract_value?: number | null
          created_at?: string | null
          current_phase_id?: string | null
          email?: string | null
          id?: string
          instagram?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          product_id?: string | null
          recurrence_value?: number | null
          start_date?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "clients_current_phase_id_fkey"
            columns: ["current_phase_id"]
            isOneToOne: false
            referencedRelation: "process_tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "clients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      content_ideas: {
        Row: {
          content_type: string
          created_at: string | null
          description: string | null
          id: string
          is_posted: boolean | null
          posted_at: string | null
          reference_link: string | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_posted?: boolean | null
          posted_at?: string | null
          reference_link?: string | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_posted?: boolean | null
          posted_at?: string | null
          reference_link?: string | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          content: string | null
          embedding: string | null
          fts: unknown
          id: number
          metadata: Json | null
        }
        Insert: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: never
          metadata?: Json | null
        }
        Update: {
          content?: string | null
          embedding?: string | null
          fts?: unknown
          id?: never
          metadata?: Json | null
        }
        Relationships: []
      }
      follow_ups: {
        Row: {
          completed_at: string | null
          created_at: string | null
          follow_up_date: string | null
          id: string
          is_completed: boolean | null
          notes: string | null
          prospect_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          prospect_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          follow_up_date?: string | null
          id?: string
          is_completed?: boolean | null
          notes?: string | null
          prospect_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follow_ups_prospect_id_fkey"
            columns: ["prospect_id"]
            isOneToOne: false
            referencedRelation: "prospects"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          current_value: number | null
          id: string
          monthly_plan_id: string
          target_value: number | null
          title: string
          unit: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          monthly_plan_id: string
          target_value?: number | null
          title: string
          unit?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          current_value?: number | null
          id?: string
          monthly_plan_id?: string
          target_value?: number | null
          title?: string
          unit?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "goals_monthly_plan_id_fkey"
            columns: ["monthly_plan_id"]
            isOneToOne: false
            referencedRelation: "monthly_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_attachments: {
        Row: {
          created_at: string | null
          file_name: string
          file_type: string | null
          file_url: string
          id: string
          implementation_id: string
        }
        Insert: {
          created_at?: string | null
          file_name: string
          file_type?: string | null
          file_url: string
          id?: string
          implementation_id: string
        }
        Update: {
          created_at?: string | null
          file_name?: string
          file_type?: string | null
          file_url?: string
          id?: string
          implementation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementation_attachments_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "implementations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_billings: {
        Row: {
          amount: number
          billing_date: string
          created_at: string | null
          id: string
          implementation_id: string
          is_paid: boolean
          notes: string | null
          paid_at: string | null
        }
        Insert: {
          amount: number
          billing_date: string
          created_at?: string | null
          id?: string
          implementation_id: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
        }
        Update: {
          amount?: number
          billing_date?: string
          created_at?: string | null
          id?: string
          implementation_id?: string
          is_paid?: boolean
          notes?: string | null
          paid_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "implementation_billings_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "implementations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_feedbacks: {
        Row: {
          content: string
          created_at: string | null
          id: string
          implementation_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          implementation_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          implementation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "implementation_feedbacks_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "implementations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_prompts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          implementation_id: string
          title: string
          updated_at: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          implementation_id: string
          title: string
          updated_at?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          implementation_id?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "implementation_prompts_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "implementations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementation_stages: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          implementation_id: string
          is_completed: boolean
          name: string
          order_index: number
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          implementation_id: string
          is_completed?: boolean
          name: string
          order_index?: number
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          implementation_id?: string
          is_completed?: boolean
          name?: string
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "implementation_stages_implementation_id_fkey"
            columns: ["implementation_id"]
            isOneToOne: false
            referencedRelation: "implementations"
            referencedColumns: ["id"]
          },
        ]
      }
      implementations: {
        Row: {
          automation_type: string
          client_phone: string
          created_at: string | null
          delivery_completed: boolean
          delivery_completed_at: string | null
          group_link: string | null
          id: string
          implementation_value: number
          instagram: string | null
          recurrence_end_date: string | null
          recurrence_start_date: string | null
          recurrence_value: number | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          automation_type: string
          client_phone: string
          created_at?: string | null
          delivery_completed?: boolean
          delivery_completed_at?: string | null
          group_link?: string | null
          id?: string
          implementation_value?: number
          instagram?: string | null
          recurrence_end_date?: string | null
          recurrence_start_date?: string | null
          recurrence_value?: number | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          automation_type?: string
          client_phone?: string
          created_at?: string | null
          delivery_completed?: boolean
          delivery_completed_at?: string | null
          group_link?: string | null
          id?: string
          implementation_value?: number
          instagram?: string | null
          recurrence_end_date?: string | null
          recurrence_start_date?: string | null
          recurrence_value?: number | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      inbound_leads: {
        Row: {
          channel_id: string | null
          created_at: string | null
          custom_fields: Json | null
          email: string | null
          faturamento: string | null
          id: string
          instagram_link: string | null
          lead_score: number | null
          meeting_date: string | null
          nicho: string | null
          no_show: boolean | null
          nome_dono: string | null
          nome_lead: string | null
          notes: string | null
          phone_number: string | null
          principal_dor: string | null
          socios: Json | null
          source: string | null
          status: string
          template_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          faturamento?: string | null
          id?: string
          instagram_link?: string | null
          lead_score?: number | null
          meeting_date?: string | null
          nicho?: string | null
          no_show?: boolean | null
          nome_dono?: string | null
          nome_lead?: string | null
          notes?: string | null
          phone_number?: string | null
          principal_dor?: string | null
          socios?: Json | null
          source?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel_id?: string | null
          created_at?: string | null
          custom_fields?: Json | null
          email?: string | null
          faturamento?: string | null
          id?: string
          instagram_link?: string | null
          lead_score?: number | null
          meeting_date?: string | null
          nicho?: string | null
          no_show?: boolean | null
          nome_dono?: string | null
          nome_lead?: string | null
          notes?: string | null
          phone_number?: string | null
          principal_dor?: string | null
          socios?: Json | null
          source?: string | null
          status?: string
          template_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbound_leads_channel_id_fkey"
            columns: ["channel_id"]
            isOneToOne: false
            referencedRelation: "lead_channels"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbound_leads_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "lead_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_channels: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      lead_templates: {
        Row: {
          created_at: string | null
          description: string | null
          fields: Json
          id: string
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          fields?: Json
          id?: string
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      monthly_plans: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          month: number
          updated_at: string | null
          user_id: string
          year: number
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          month: number
          updated_at?: string | null
          user_id: string
          year: number
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          month?: number
          updated_at?: string | null
          user_id?: string
          year?: number
        }
        Relationships: []
      }
      operacoes: {
        Row: {
          banco: string
          created_at: string
          data: string
          descricao: string
          hora: string
          id: string
          tipo: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          banco: string
          created_at?: string
          data: string
          descricao: string
          hora?: string
          id?: string
          tipo: string
          updated_at?: string
          user_id: string
          valor: number
        }
        Update: {
          banco?: string
          created_at?: string
          data?: string
          descricao?: string
          hora?: string
          id?: string
          tipo?: string
          updated_at?: string
          user_id?: string
          valor?: number
        }
        Relationships: []
      }
      placas_solares: {
        Row: {
          aceita_financiamento: string | null
          dimensao: string | null
          eficiencia: string | null
          especs: string | null
          garantia: string | null
          id: string
          modelo: string | null
          modelo_instalacao: string | null
          pacote_10_placas: string | null
          pacote_20_placas: string | null
          pacote_5_placas: string | null
          prazo: string | null
          preco_por_placa: string | null
          quantidade: number | null
          status: string | null
        }
        Insert: {
          aceita_financiamento?: string | null
          dimensao?: string | null
          eficiencia?: string | null
          especs?: string | null
          garantia?: string | null
          id?: string
          modelo?: string | null
          modelo_instalacao?: string | null
          pacote_10_placas?: string | null
          pacote_20_placas?: string | null
          pacote_5_placas?: string | null
          prazo?: string | null
          preco_por_placa?: string | null
          quantidade?: number | null
          status?: string | null
        }
        Update: {
          aceita_financiamento?: string | null
          dimensao?: string | null
          eficiencia?: string | null
          especs?: string | null
          garantia?: string | null
          id?: string
          modelo?: string | null
          modelo_instalacao?: string | null
          pacote_10_placas?: string | null
          pacote_20_placas?: string | null
          pacote_5_placas?: string | null
          prazo?: string | null
          preco_por_placa?: string | null
          quantidade?: number | null
          status?: string | null
        }
        Relationships: []
      }
      posted_content: {
        Row: {
          channel: string
          content_idea_id: string | null
          content_type: string
          created_at: string | null
          id: string
          post_link: string
          posted_date: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          channel?: string
          content_idea_id?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          post_link: string
          posted_date: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          channel?: string
          content_idea_id?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          post_link?: string
          posted_date?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "posted_content_content_idea_id_fkey"
            columns: ["content_idea_id"]
            isOneToOne: false
            referencedRelation: "content_ideas"
            referencedColumns: ["id"]
          },
        ]
      }
      process_phases: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          order_index: number | null
          process_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          order_index?: number | null
          process_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          order_index?: number | null
          process_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_phases_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
        ]
      }
      process_tag_relations: {
        Row: {
          id: string
          process_id: string
          tag_id: string
        }
        Insert: {
          id?: string
          process_id: string
          tag_id: string
        }
        Update: {
          id?: string
          process_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "process_tag_relations_process_id_fkey"
            columns: ["process_id"]
            isOneToOne: false
            referencedRelation: "processes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "process_tag_relations_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "process_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      process_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: string
          name: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: string
          name: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      processes: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_client_process: boolean | null
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_client_process?: boolean | null
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_client_process?: boolean | null
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          cost: number | null
          created_at: string | null
          description: string | null
          id: string
          name: string
          notes: string | null
          price: number | null
          profit_margin: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          notes?: string | null
          price?: number | null
          profit_margin?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cost?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          notes?: string | null
          price?: number | null
          profit_margin?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          icp_description: string | null
          id: string
          key: string | null
          nome: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          icp_description?: string | null
          id: string
          key?: string | null
          nome?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          icp_description?: string | null
          id?: string
          key?: string | null
          nome?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      prospects: {
        Row: {
          approach_description: string | null
          contact_summary: string | null
          created_at: string | null
          faturamento: string | null
          has_meeting_scheduled: boolean | null
          id: string
          instagram_link: string | null
          meeting_date: string | null
          needs_follow_up: boolean | null
          nicho: string | null
          nome_dono: string | null
          objections: string | null
          phone_number: string | null
          principal_dor: string | null
          profile_summary: string | null
          prospecting_method: string[] | null
          rejection_reason: string | null
          socios: Json | null
          status: string
          updated_at: string | null
          user_id: string
          was_rejected: boolean | null
        }
        Insert: {
          approach_description?: string | null
          contact_summary?: string | null
          created_at?: string | null
          faturamento?: string | null
          has_meeting_scheduled?: boolean | null
          id?: string
          instagram_link?: string | null
          meeting_date?: string | null
          needs_follow_up?: boolean | null
          nicho?: string | null
          nome_dono?: string | null
          objections?: string | null
          phone_number?: string | null
          principal_dor?: string | null
          profile_summary?: string | null
          prospecting_method?: string[] | null
          rejection_reason?: string | null
          socios?: Json | null
          status?: string
          updated_at?: string | null
          user_id: string
          was_rejected?: boolean | null
        }
        Update: {
          approach_description?: string | null
          contact_summary?: string | null
          created_at?: string | null
          faturamento?: string | null
          has_meeting_scheduled?: boolean | null
          id?: string
          instagram_link?: string | null
          meeting_date?: string | null
          needs_follow_up?: boolean | null
          nicho?: string | null
          nome_dono?: string | null
          objections?: string | null
          phone_number?: string | null
          principal_dor?: string | null
          profile_summary?: string | null
          prospecting_method?: string[] | null
          rejection_reason?: string | null
          socios?: Json | null
          status?: string
          updated_at?: string | null
          user_id?: string
          was_rejected?: boolean | null
        }
        Relationships: []
      }
      sales: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          id: string
          notes: string | null
          product_id: string | null
          sale_date: string
          user_id: string
        }
        Insert: {
          amount?: number
          created_at?: string | null
          description: string
          id?: string
          notes?: string | null
          product_id?: string | null
          sale_date?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          id?: string
          notes?: string | null
          product_id?: string | null
          sale_date?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          color: string | null
          created_at: string | null
          default_duration: number | null
          icon: string | null
          id: string
          name: string
          task_type: string
          user_id: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          default_duration?: number | null
          icon?: string | null
          id?: string
          name: string
          task_type: string
          user_id: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          default_duration?: number | null
          icon?: string | null
          id?: string
          name?: string
          task_type?: string
          user_id?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          completed_at: string | null
          contact_number: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          lead_source: string | null
          meeting_link: string | null
          scheduled_date: string
          scheduled_time: string | null
          status: string
          steps: Json | null
          task_type: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          contact_number?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_source?: string | null
          meeting_link?: string | null
          scheduled_date: string
          scheduled_time?: string | null
          status?: string
          steps?: Json | null
          task_type?: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          contact_number?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_source?: string | null
          meeting_link?: string | null
          scheduled_date?: string
          scheduled_time?: string | null
          status?: string
          steps?: Json | null
          task_type?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      thoughts: {
        Row: {
          content: string
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          cpf: string | null
          criado_em: string | null
          forma_pagamento: string | null
          id: string
          info_proposta: string | null
          motivo_rejeicao: string | null
          nome_completo: string | null
          nome_whatsapp: string | null
          numero: string
          Oportunidade: string | null
          pausar_ia: string | null
          pdf_url: string | null
          prazo_instalacao: string | null
          produto_proposta: string | null
          qualificacao: string | null
          renda: string | null
          resumo: string | null
          ultima_mensagem: string | null
          valor_proposta: string | null
        }
        Insert: {
          cpf?: string | null
          criado_em?: string | null
          forma_pagamento?: string | null
          id?: string
          info_proposta?: string | null
          motivo_rejeicao?: string | null
          nome_completo?: string | null
          nome_whatsapp?: string | null
          numero: string
          Oportunidade?: string | null
          pausar_ia?: string | null
          pdf_url?: string | null
          prazo_instalacao?: string | null
          produto_proposta?: string | null
          qualificacao?: string | null
          renda?: string | null
          resumo?: string | null
          ultima_mensagem?: string | null
          valor_proposta?: string | null
        }
        Update: {
          cpf?: string | null
          criado_em?: string | null
          forma_pagamento?: string | null
          id?: string
          info_proposta?: string | null
          motivo_rejeicao?: string | null
          nome_completo?: string | null
          nome_whatsapp?: string | null
          numero?: string
          Oportunidade?: string | null
          pausar_ia?: string | null
          pdf_url?: string | null
          prazo_instalacao?: string | null
          produto_proposta?: string | null
          qualificacao?: string | null
          renda?: string | null
          resumo?: string | null
          ultima_mensagem?: string | null
          valor_proposta?: string | null
        }
        Relationships: []
      }
      usuarios_crm: {
        Row: {
          criado_em: string | null
          email: string
          id: string
          senha: string
        }
        Insert: {
          criado_em?: string | null
          email: string
          id?: string
          senha: string
        }
        Update: {
          criado_em?: string | null
          email?: string
          id?: string
          senha?: string
        }
        Relationships: []
      }
      weekly_planning: {
        Row: {
          completed_at: string | null
          created_at: string | null
          id: string
          is_completed: boolean | null
          updated_at: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          updated_at?: string | null
          user_id: string
          week_end: string
          week_start: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          id?: string
          is_completed?: boolean | null
          updated_at?: string | null
          user_id?: string
          week_end?: string
          week_start?: string
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
      hybrid_search: {
        Args: {
          full_text_weight?: number
          match_count: number
          query_embedding: string
          query_text: string
          rrf_k?: number
          semantic_weight?: number
        }
        Returns: {
          content: string | null
          embedding: string | null
          fts: unknown
          id: number
          metadata: Json | null
        }[]
        SetofOptions: {
          from: "*"
          to: "documents"
          isOneToOne: false
          isSetofReturn: true
        }
      }
    }
    Enums: {
      app_role: "admin" | "user"
      tipo_seguro:
        | "auto"
        | "fianca"
        | "saude"
        | "incendio"
        | "vida"
        | "empresarial"
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
      app_role: ["admin", "user"],
      tipo_seguro: [
        "auto",
        "fianca",
        "saude",
        "incendio",
        "vida",
        "empresarial",
      ],
    },
  },
} as const
