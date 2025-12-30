// ============================================================================
// EDGE FUNCTION: Expirar Pagamentos PIX Stale
// ============================================================================
// Data: 2025-11-24
// Descrição: Edge Function que chama a função RPC expire_stale_pix() para
//            marcar pagamentos pending antigos como expired. Esta função é
//            executada automaticamente via Supabase Scheduler (cron job).
// ============================================================================

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Tratar CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Criar cliente Supabase usando service_role para bypass RLS
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Variáveis de ambiente SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY não configuradas");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Chamar função RPC expire_stale_pix()
    const { data, error } = await supabase.rpc("expire_stale_pix");

    if (error) {
      console.error("❌ [EXPIRE-PIX] Erro ao expirar pagamentos:", error);
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Log de sucesso
    console.log(`✅ [EXPIRE-PIX] ${data.expired_count || 0} pagamentos expirados`);

    // Retornar resultado
    return new Response(
      JSON.stringify({
        success: true,
        ...data,
        timestamp: new Date().toISOString(),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("❌ [EXPIRE-PIX] Erro geral:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message || "Erro desconhecido",
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

