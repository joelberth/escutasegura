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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      denuncias: {
        Row: {
          arquivo_urls: string[] | null
          codigo_acompanhamento: string
          created_at: string
          descricao: string
          escola: string
          id: string
          resolved_at: string | null
          response_text: string | null
          status: Database["public"]["Enums"]["status_denuncia"]
          tipo: Database["public"]["Enums"]["tipo_denuncia"]
          urgencia: Database["public"]["Enums"]["nivel_urgencia"]
        }
        Insert: {
          arquivo_urls?: string[] | null
          codigo_acompanhamento: string
          created_at?: string
          descricao: string
          escola: string
          id?: string
          resolved_at?: string | null
          response_text?: string | null
          status?: Database["public"]["Enums"]["status_denuncia"]
          tipo: Database["public"]["Enums"]["tipo_denuncia"]
          urgencia?: Database["public"]["Enums"]["nivel_urgencia"]
        }
        Update: {
          arquivo_urls?: string[] | null
          codigo_acompanhamento?: string
          created_at?: string
          descricao?: string
          escola?: string
          id?: string
          resolved_at?: string | null
          response_text?: string | null
          status?: Database["public"]["Enums"]["status_denuncia"]
          tipo?: Database["public"]["Enums"]["tipo_denuncia"]
          urgencia?: Database["public"]["Enums"]["nivel_urgencia"]
        }
        Relationships: []
      }
      escolas: {
        Row: {
          cidade: string
          created_at: string
          email: string | null
          endereco: string | null
          estado: string
          id: string
          nome: string
          telefone: string | null
          tipo_instituicao: string | null
        }
        Insert: {
          cidade?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string
          id?: string
          nome: string
          telefone?: string | null
          tipo_instituicao?: string | null
        }
        Update: {
          cidade?: string
          created_at?: string
          email?: string | null
          endereco?: string | null
          estado?: string
          id?: string
          nome?: string
          telefone?: string | null
          tipo_instituicao?: string | null
        }
        Relationships: []
      }
      gestores: {
        Row: {
          created_at: string
          email: string
          escola_id: string
          id: string
          nome: string
          telefone: string | null
          tipo: Database["public"]["Enums"]["tipo_gestor"]
        }
        Insert: {
          created_at?: string
          email: string
          escola_id: string
          id?: string
          nome: string
          telefone?: string | null
          tipo: Database["public"]["Enums"]["tipo_gestor"]
        }
        Update: {
          created_at?: string
          email?: string
          escola_id?: string
          id?: string
          nome?: string
          telefone?: string | null
          tipo?: Database["public"]["Enums"]["tipo_gestor"]
        }
        Relationships: [
          {
            foreignKeyName: "gestores_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
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
    }
    Enums: {
      app_role: "admin" | "user"
      nivel_urgencia: "baixa" | "media" | "alta"
      status_denuncia: "pendente" | "em_analise" | "resolvida"
      tipo_denuncia: "bullying" | "estrutural" | "comunicacao" | "outro"
      tipo_gestor:
        | "geral"
        | "administrativo"
        | "financeiro"
        | "administrativo_financeiro"
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
      nivel_urgencia: ["baixa", "media", "alta"],
      status_denuncia: ["pendente", "em_analise", "resolvida"],
      tipo_denuncia: ["bullying", "estrutural", "comunicacao", "outro"],
      tipo_gestor: [
        "geral",
        "administrativo",
        "financeiro",
        "administrativo_financeiro",
      ],
    },
  },
} as const
