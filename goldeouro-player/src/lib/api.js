import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://goldeouro-backend.onrender.com',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Interceptor de resposta para tratar tokens expirados
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado ou inválido
      localStorage.removeItem("token");
      localStorage.removeItem("userId");
      window.location.href = "/";
    }
    return Promise.reject(error);
  }
);

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
