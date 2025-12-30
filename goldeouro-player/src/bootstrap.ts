// ✅ BOOTSTRAP - BLINDAGEM DEFINITIVA DO BACKEND
// Este arquivo executa ANTES de qualquer outro código
// Garante que o backend correto seja usado em produção

/**
 * Força o backend de produção correto em TODAS as camadas possíveis
 * Executa de forma síncrona, antes de qualquer import funcional
 */
export function forceProductionBackend(): void {
  const CORRECT_BACKEND = 'https://goldeouro-backend-v2.fly.dev';
  const OLD_BACKEND = 'https://goldeouro-backend.fly.dev';
  
  // ✅ CORREÇÃO CRÍTICA: Detectar se estamos em produção
  const isProduction = typeof window !== 'undefined' && (
    window.location.hostname.includes('goldeouro.lol') ||
    window.location.hostname.includes('goldeouro.com') ||
    window.location.hostname === 'www.goldeouro.lol' ||
    window.location.hostname === 'goldeouro.lol'
  );
  
  // Se não for produção, não forçar (deixar ambiente normal funcionar)
  if (!isProduction) {
    return;
  }
  
  // ✅ CORREÇÃO CRÍTICA: Remover qualquer backend antigo de TODAS as camadas
  
  // 1. Limpar localStorage
  try {
    const storedBackend = localStorage.getItem('API_BASE_URL');
    if (storedBackend && storedBackend.includes(OLD_BACKEND)) {
      localStorage.removeItem('API_BASE_URL');
      console.log('[BOOTSTRAP] Removido backend antigo do localStorage');
    }
    // Forçar backend correto no localStorage
    localStorage.setItem('API_BASE_URL', CORRECT_BACKEND);
    localStorage.setItem('FORCED_BACKEND', 'true');
  } catch (e) {
    // Ignorar erros de localStorage (pode estar bloqueado)
  }
  
  // 2. Limpar sessionStorage
  try {
    const sessionBackend = sessionStorage.getItem('API_BASE_URL');
    if (sessionBackend && sessionBackend.includes(OLD_BACKEND)) {
      sessionStorage.removeItem('API_BASE_URL');
      console.log('[BOOTSTRAP] Removido backend antigo do sessionStorage');
    }
    // Forçar backend correto no sessionStorage
    sessionStorage.setItem('API_BASE_URL', CORRECT_BACKEND);
    sessionStorage.setItem('FORCED_BACKEND', 'true');
    // Limpar flags antigas que podem causar cache incorreto
    sessionStorage.removeItem('env_isInitialized');
    sessionStorage.removeItem('env_hasLoggedOnce');
    sessionStorage.removeItem('backend_forced');
  } catch (e) {
    // Ignorar erros de sessionStorage
  }
  
  // 3. Forçar variável global (última linha de defesa)
  if (typeof window !== 'undefined') {
    window.__API_BASE_URL__ = CORRECT_BACKEND;
    window.__FORCED_BACKEND__ = true;
    window.__BOOTSTRAP_EXECUTED__ = true;
  }
  
  // 4. Log para auditoria
  console.log('[BOOTSTRAP] ✅ Backend forçado para produção:', CORRECT_BACKEND);
  console.log('[BOOTSTRAP] Hostname:', window.location.hostname);
  console.log('[BOOTSTRAP] Timestamp:', new Date().toISOString());
}

// ✅ CORREÇÃO CRÍTICA: Executar imediatamente ao importar
// Isso garante que execute ANTES de qualquer outro código
forceProductionBackend();

