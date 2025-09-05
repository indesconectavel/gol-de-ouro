import { useNavigate } from 'react-router-dom'

const Privacy = () => {
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
        <h1 className="text-2xl font-bold text-white">Política de Privacidade</h1>
        <div className="w-8"></div>
      </div>

      {/* Conteúdo */}
      <div className="relative z-10 bg-white/10 backdrop-blur-lg rounded-2xl p-6 max-w-4xl mx-auto border border-white/20 shadow-2xl">
        <div className="prose prose-invert max-w-none">
          <h2 className="text-xl font-bold text-white mb-4">1. Introdução</h2>
          <p className="text-white/80 mb-4">
            Esta Política de Privacidade descreve como o Gol de Ouro coleta, usa, armazena e protege suas informações pessoais. 
            Estamos comprometidos em proteger sua privacidade e cumprir a Lei Geral de Proteção de Dados (LGPD).
          </p>

          <h2 className="text-xl font-bold text-white mb-4">2. Informações que Coletamos</h2>
          <p className="text-white/80 mb-4">
            Coletamos as seguintes informações:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li><strong>Dados de Cadastro:</strong> Nome, e-mail, data de nascimento</li>
            <li><strong>Dados de Pagamento:</strong> Informações de PIX e transações</li>
            <li><strong>Dados de Uso:</strong> Histórico de jogos e interações</li>
            <li><strong>Dados Técnicos:</strong> IP, navegador, dispositivo</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">3. Como Usamos suas Informações</h2>
          <p className="text-white/80 mb-4">
            Utilizamos suas informações para:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li>Fornecer e melhorar nossos serviços</li>
            <li>Processar pagamentos e transações</li>
            <li>Comunicar-nos com você</li>
            <li>Cumprir obrigações legais</li>
            <li>Prevenir fraudes e garantir segurança</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">4. Base Legal para o Tratamento</h2>
          <p className="text-white/80 mb-4">
            Tratamos seus dados pessoais com base em:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li><strong>Consentimento:</strong> Quando você nos autoriza expressamente</li>
            <li><strong>Execução de Contrato:</strong> Para cumprir nossos serviços</li>
            <li><strong>Obrigação Legal:</strong> Para cumprir leis aplicáveis</li>
            <li><strong>Legítimo Interesse:</strong> Para melhorar nossos serviços</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">5. Compartilhamento de Informações</h2>
          <p className="text-white/80 mb-4">
            Não vendemos suas informações pessoais. Podemos compartilhar dados apenas com:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li>Parceiros de pagamento (Mercado Pago)</li>
            <li>Prestadores de serviços essenciais</li>
            <li>Autoridades competentes (quando exigido por lei)</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">6. Segurança dos Dados</h2>
          <p className="text-white/80 mb-4">
            Implementamos medidas de segurança técnicas e organizacionais para proteger seus dados:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li>Criptografia de dados sensíveis</li>
            <li>Controle de acesso restrito</li>
            <li>Monitoramento de segurança 24/7</li>
            <li>Backup regular dos dados</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">7. Seus Direitos</h2>
          <p className="text-white/80 mb-4">
            Você tem os seguintes direitos sobre seus dados pessoais:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li><strong>Acesso:</strong> Solicitar informações sobre seus dados</li>
            <li><strong>Correção:</strong> Corrigir dados incorretos</li>
            <li><strong>Exclusão:</strong> Solicitar a remoção de seus dados</li>
            <li><strong>Portabilidade:</strong> Transferir seus dados</li>
            <li><strong>Oposição:</strong> Opor-se ao tratamento</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">8. Retenção de Dados</h2>
          <p className="text-white/80 mb-4">
            Mantemos seus dados pessoais apenas pelo tempo necessário para:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li>Cumprir os propósitos descritos nesta política</li>
            <li>Atender obrigações legais e regulamentares</li>
            <li>Resolver disputas e fazer cumprir acordos</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">9. Cookies e Tecnologias Similares</h2>
          <p className="text-white/80 mb-4">
            Utilizamos cookies e tecnologias similares para:
          </p>
          <ul className="text-white/80 mb-4 list-disc list-inside space-y-2">
            <li>Melhorar a experiência do usuário</li>
            <li>Analisar o uso da plataforma</li>
            <li>Personalizar conteúdo e anúncios</li>
            <li>Garantir a segurança da plataforma</li>
          </ul>

          <h2 className="text-xl font-bold text-white mb-4">10. Menores de Idade</h2>
          <p className="text-white/80 mb-4">
            Nossa plataforma é destinada a usuários com 18 anos ou mais. 
            Não coletamos intencionalmente dados de menores de idade.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">11. Alterações nesta Política</h2>
          <p className="text-white/80 mb-4">
            Podemos atualizar esta política periodicamente. 
            Notificaremos sobre mudanças significativas através da plataforma ou por e-mail.
          </p>

          <h2 className="text-xl font-bold text-white mb-4">12. Contato</h2>
          <p className="text-white/80 mb-4">
            Para exercer seus direitos ou esclarecer dúvidas sobre esta política, 
            entre em contato conosco através dos canais oficiais da plataforma.
          </p>

          <div className="mt-8 p-4 bg-blue-500/20 border border-blue-500/30 rounded-lg">
            <p className="text-blue-400 text-sm">
              <strong>Última atualização:</strong> 03 de setembro de 2025
            </p>
            <p className="text-blue-400 text-sm mt-2">
              <strong>Encarregado de Dados (DPO):</strong> Disponível através dos canais oficiais
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Privacy
