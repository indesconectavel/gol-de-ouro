// API Route para autenticação - Vercel Functions
export default async function handler(req, res) {
  // Configurar CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'POST') {
    try {
      const { email, password } = req.body;
      
      console.log('🔍 API Route - Dados recebidos:', { email, password });

      // Fazer requisição para o backend real
      const backendResponse = await fetch('https://goldeouro-backend.fly.dev/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await backendResponse.json();
      
      console.log('🔍 API Route - Resposta do backend:', data);
      
      res.status(backendResponse.status).json(data);
    } catch (error) {
      console.error('Erro na API de login:', error);
      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  } else {
    res.status(404).json({ error: 'Endpoint não encontrado' });
  }
}
