'use strict';

/**
 * PE.2B — flag de ativação do adapter boundary (default: desligado).
 * Enquanto false, nenhum fluxo produtivo deve usar ports/wrappers novos.
 */
function isTruthyEnv(name) {
  return String(process.env[name] || '').trim().toLowerCase() === 'true';
}

function isAdapterBoundaryEnabled() {
  return isTruthyEnv('PE_ADAPTER_BOUNDARY_ENABLED');
}

module.exports = {
  isAdapterBoundaryEnabled,
  FLAG_NAME: 'PE_ADAPTER_BOUNDARY_ENABLED',
  DEFAULT_VALUE: false
};
