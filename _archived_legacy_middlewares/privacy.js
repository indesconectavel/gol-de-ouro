const privacy = (req, res, next) => {
  // Remover headers que expõem informações do servidor
  res.removeHeader('X-Powered-By')
  res.removeHeader('Server')
  
  // Adicionar headers de privacidade
  res.setHeader('X-Content-Type-Options', 'nosniff')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-XSS-Protection', '1; mode=block')
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin')
  
  // Mascarar informações sensíveis em logs
  const originalLog = console.log
  console.log = (...args) => {
    const maskedArgs = args.map(arg => {
      if (typeof arg === 'string') {
        return arg
          .replace(/Frederico Santos e Silva/gi, '[DEVELOPER]')
          .replace(/frederico\.santos/gi, '[EMAIL]')
          .replace(/CPF: \d{3}\.\d{3}\.\d{3}-\d{2}/g, 'CPF: [MASKED]')
          .replace(/CNPJ: \d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g, 'CNPJ: [MASKED]')
      }
      return arg
    })
    originalLog(...maskedArgs)
  }
  
  next()
}

module.exports = privacy
