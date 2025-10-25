// COMPONENTE DE INDICADOR DE FORÇA DA SENHA - GOL DE OURO v1.2.0
// ================================================================
// Data: 24/10/2025
// Status: INDICADOR DE FORÇA DA SENHA IMPLEMENTADO
// Versão: v1.2.0-password-strength-indicator

import React from 'react';

const PasswordStrengthIndicator = ({ password }) => {
  // Calcular força da senha
  const calculateStrength = (password) => {
    if (!password) return { score: 0, label: '', color: '', percentage: 0 };
    
    let score = 0;
    let feedback = [];
    
    // Critérios de força
    if (password.length >= 8) score += 1;
    else feedback.push('Use pelo menos 8 caracteres');
    
    if (/[a-z]/.test(password)) score += 1;
    else feedback.push('Adicione letras minúsculas');
    
    if (/[A-Z]/.test(password)) score += 1;
    else feedback.push('Adicione letras maiúsculas');
    
    if (/[0-9]/.test(password)) score += 1;
    else feedback.push('Adicione números');
    
    if (/[^A-Za-z0-9]/.test(password)) score += 1;
    else feedback.push('Adicione símbolos especiais');
    
    // Determinar nível de força
    let label, color, percentage;
    
    if (score <= 1) {
      label = 'Muito Fraca';
      color = 'text-red-400 bg-red-400/20';
      percentage = 20;
    } else if (score === 2) {
      label = 'Fraca';
      color = 'text-orange-400 bg-orange-400/20';
      percentage = 40;
    } else if (score === 3) {
      label = 'Média';
      color = 'text-yellow-400 bg-yellow-400/20';
      percentage = 60;
    } else if (score === 4) {
      label = 'Forte';
      color = 'text-blue-400 bg-blue-400/20';
      percentage = 80;
    } else {
      label = 'Muito Forte';
      color = 'text-green-400 bg-green-400/20';
      percentage = 100;
    }
    
    return { score, label, color, percentage, feedback };
  };

  const strength = calculateStrength(password);

  if (!password) return null;

  return (
    <div className="mt-2">
      {/* Barra de progresso */}
      <div className="flex items-center space-x-2 mb-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              strength.score <= 1 ? 'bg-red-400' :
              strength.score === 2 ? 'bg-orange-400' :
              strength.score === 3 ? 'bg-yellow-400' :
              strength.score === 4 ? 'bg-blue-400' :
              'bg-green-400'
            }`}
            style={{ width: `${strength.percentage}%` }}
          />
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${strength.color}`}>
          {strength.label}
        </span>
      </div>
      
      {/* Feedback de melhorias */}
      {strength.feedback.length > 0 && strength.score < 4 && (
        <div className="text-xs text-white/60">
          <p className="mb-1">Para melhorar sua senha:</p>
          <ul className="list-disc list-inside space-y-1">
            {strength.feedback.slice(0, 3).map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Dicas de segurança */}
      {strength.score >= 4 && (
        <div className="text-xs text-green-400">
          ✅ Senha forte! Sua conta está bem protegida.
        </div>
      )}
    </div>
  );
};

export default PasswordStrengthIndicator;
