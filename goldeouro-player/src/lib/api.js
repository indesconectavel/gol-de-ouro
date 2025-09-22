// Usar o cliente API centralizado
import apiClient from '../services/apiClient';

// Manter compatibilidade com código existente
export const api = apiClient;

/**
 * ENDPOINTS DO BACKEND GOL DE OURO:
 *
 * POST  /api/games/fila/entrar
 *   body: { bet: number }                        // opcional
 *   resp: { id: string, totalShots: number, shotsTaken: number, balance: number }
 *
 * GET   /api/games/status
 *   resp: { id, totalShots, shotsTaken, balance }
 *
 * POST  /api/games/chutar
 *   body: { zone: "TL"|"TR"|"BL"|"BR"|"MID" }
 *   resp: {
 *     result: "goal"|"save",
 *     goalieDirection: "TL"|"TR"|"BL"|"BR"|"MID",
 *     shotsTaken: number,
 *     totalShots: number,
 *     balance: number
 *   }
 */

export async function createMatch({ bet } = {}) {
  const { data } = await api.post("/api/games/fila/entrar", bet ? { bet } : {});
  return data;
}

export async function getMatch() {
  const { data } = await api.get("/api/games/status");
  return data;
}

export async function shoot({ zone }) {
  const { data } = await api.post("/api/games/chutar", { zone });
  return data;
}

// Funções para notificações
export async function getNotifications() {
  const { data } = await api.get("/notifications");
  return data;
}

export async function markNotificationAsRead(id) {
  const { data } = await api.put(`/notifications/${id}/read`);
  return data;
}

export async function getUnreadCount() {
  const { data } = await api.get("/notifications/unread-count");
  return data;
}

// Funções para analytics
export async function getDashboard() {
  const { data } = await api.get("/analytics/dashboard");
  return data;
}
