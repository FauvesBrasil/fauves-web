import LegalPageLayout, { type LegalPageSection } from '@/components/LegalPageLayout';

const sections: LegalPageSection[] = [
  {
    paragraphs: [
      'Esta Política de Privacidade explica como a Fauves coleta, utiliza, compartilha e protege dados pessoais durante o uso da plataforma.',
      'Tratamos dados pessoais para prestar e melhorar nossos serviços, cumprir obrigações legais, proteger usuários e viabilizar a criação, gestão e participação em eventos.',
    ],
  },
  {
    title: 'Dados que podemos coletar',
    bullets: [
      'dados de cadastro, como nome, e-mail, telefone e informações de perfil;',
      'dados necessários à compra, emissão e validação de ingressos;',
      'informações sobre eventos criados, inscrições e interações na plataforma;',
      'dados técnicos, como dispositivo, endereço IP, registros de acesso e cookies.',
    ],
  },
  {
    title: 'Como utilizamos os dados',
    paragraphs: ['Utilizamos os dados pessoais apenas para finalidades legítimas e compatíveis com a relação mantida com você.'],
    bullets: [
      'operar contas, inscrições, pagamentos e ingressos;',
      'prestar suporte e enviar comunicações relacionadas ao serviço;',
      'prevenir fraudes, abusos e incidentes de segurança;',
      'cumprir obrigações legais e exercer direitos;',
      'melhorar a experiência e, quando permitido, personalizar comunicações.',
    ],
  },
  {
    title: 'Compartilhamento',
    paragraphs: [
      'Podemos compartilhar os dados necessários com organizadores dos eventos dos quais você participa, provedores de pagamento, hospedagem, comunicação, análise e prevenção a fraudes, sempre de acordo com a finalidade do serviço.',
      'Também podemos fornecer informações quando houver obrigação legal, ordem de autoridade competente ou necessidade de proteger direitos e segurança.',
    ],
  },
  {
    title: 'Seus direitos',
    paragraphs: [
      'Nos termos da LGPD, você pode solicitar confirmação do tratamento, acesso, correção, portabilidade quando aplicável, informações sobre compartilhamento, revisão de decisões automatizadas e eliminação ou anonimização nos casos previstos em lei.',
    ],
  },
  {
    title: 'Retenção e segurança',
    paragraphs: [
      'Mantemos os dados pelo período necessário às finalidades informadas e às obrigações legais. Adotamos medidas técnicas e administrativas proporcionais aos riscos para reduzir acessos não autorizados, perda, alteração ou divulgação indevida.',
    ],
  },
  {
    title: 'Contato sobre privacidade',
    paragraphs: [
      <>Para exercer seus direitos ou esclarecer dúvidas, escreva para <a href="mailto:contato@fauves.com.br">contato@fauves.com.br</a>.</>,
    ],
  },
];

const PrivacyPolicy = () => (
  <LegalPageLayout
    title="Política de Privacidade"
    updatedAt="19 de julho de 2026"
    description="Saiba como a Fauves trata e protege seus dados pessoais."
    sections={sections}
  />
);

export default PrivacyPolicy;
