import { useNavigate } from 'react-router-dom'

const Terms = () => {
  const navigate = useNavigate()

  return (
    <div 
      className="min-h-screen relative overflow-hidden p-4"
      style={{
        backgroundImage: 'url(/images/Gol_de_Ouro_Bg02.jpg)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed'
      }}
    >
      {/* Overlay escuro para melhorar legibilidade */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm"></div>
      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <button
          onClick={() => navigate(-1)}
          className="text-white/70 hover:text-white text-2xl"
        >
          ←
        </button>
        <h1 className="text-2xl font-bold text-white">Termos de Uso</h1>
        <div className="w-8"></div>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-4xl mx-auto border border-white/20 shadow-2xl">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-xl font-bold text-white mb-4">1. Aceitação dos Termos</h2>
          <p className="text-white/80 mb-4">
            Ao acessar e utilizar a plataforma Gol de Ouro, você concorda em cumprir e estar vinculado aos presentes Termos de Uso. 
            Se você não concordar com qualquer parte destes termos, não deve utilizar nossa plataforma.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">2. Descrição do Serviço</h2>
          <p className="text-white/80 mb-4">
            O Gol de Ouro é uma plataforma de entretenimento que oferece jogos de habilidade baseados em futebol. 
            Nossos serviços incluem jogos de penalty shootout e outras modalidades relacionadas ao futebol.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">3. Elegibilidade</h2>
          <p className="text-white/80 mb-4">
            Para utilizar nossa plataforma, você deve:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li>Ter pelo menos 18 anos de idade</li>
            <li>Ser residente no Brasil</li>
            <li>Fornecer informações verdadeiras e precisas</li>
            <li>Manter a confidencialidade de sua conta</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">4. Conta do Usuário</h2>
          <p className="text-white/80 mb-4">
            Você é responsável por manter a segurança de sua conta e senha. 
            Todas as atividades que ocorrem sob sua conta são de sua responsabilidade.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">5. Pagamentos e Transações</h2>
          <p className="text-white/80 mb-4">
            Todas as transações são processadas de forma segura através de nossos parceiros de pagamento. 
            Os valores são em reais (BRL) e estão sujeitos às taxas aplicáveis.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">6. Conduta do Usuário</h2>
          <p className="text-white/80 mb-4">
            Você concorda em não:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li>Utilizar a plataforma para atividades ilegais</li>
            <li>Tentar burlar ou manipular o sistema</li>
            <li>Criar múltiplas contas</li>
            <li>Compartilhar sua conta com terceiros</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">7. Propriedade Intelectual</h2>
          <p className="text-white/80 mb-4">
            Todo o conteúdo da plataforma, incluindo textos, gráficos, logos, imagens e software, 
            é propriedade do Gol de Ouro e está protegido por leis de direitos autorais.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">8. Limitação de Responsabilidade</h2>
          <p className="text-white/80 mb-4">
            O Gol de Ouro não se responsabiliza por perdas ou danos decorrentes do uso da plataforma, 
            incluindo, mas não se limitando a, perdas de dados ou interrupções de serviço.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">9. Modificações dos Termos</h2>
          <p className="text-white/80 mb-4">
            Reservamo-nos o direito de modificar estes termos a qualquer momento. 
            As alterações entrarão em vigor imediatamente após a publicação na plataforma.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">10. Lei Aplicável</h2>
          <p className="text-white/80 mb-4">
            Estes termos são regidos pelas leis brasileiras. 
            Qualquer disputa será resolvida nos tribunais competentes do Brasil.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">11. Contato</h2>
          <p className="text-white/80 mb-4">
            Para questões relacionadas a estes termos, entre em contato conosco através dos canais oficiais da plataforma.
          </p>

          <div className="mt-8 p-4 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
            <p className="text-yellow-400 text-sm">
              <strong>Última atualização:</strong> 03 de setembro de 2025
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Terms
