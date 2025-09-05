import axios from "axios";

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = import.meta.env.VITE_API_TOKEN || localStorage.getItem("auth_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

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

export async function getMatch(id) {
  const { data } = await api.get("/api/games/status");
  return data;
}

export async function shoot({ matchId, zone }) {
  const { data } = await api.post("/api/games/chutar", { zone });
  return data;
}
