import LegalPageLayout, { type LegalPageSection } from '@/components/LegalPageLayout';

const sections: LegalPageSection[] = [
  {
    paragraphs: [
      'Esta página apresenta uma visão geral das práticas adotadas pela Fauves para proteger a plataforma, os eventos e os dados tratados em nossos serviços.',
      'Segurança é um processo contínuo. Nossas medidas são revistas de acordo com a evolução da plataforma, dos riscos identificados e das orientações aplicáveis.',
    ],
  },
  {
    title: 'Proteção de dados',
    paragraphs: [
      'Adotamos controles técnicos e administrativos proporcionais à natureza dos dados e aos riscos do tratamento, com o objetivo de prevenir acessos não autorizados, perda, alteração ou divulgação indevida.',
    ],
  },
  {
    title: 'Pagamentos',
    paragraphs: [
      'Transações podem ser processadas por provedores especializados. As informações apresentadas durante o pagamento são tratadas de acordo com os controles e responsabilidades aplicáveis a cada participante dessa operação.',
    ],
  },
  {
    title: 'Acesso e desenvolvimento',
    bullets: [
      'restrição de acesso a sistemas e dados conforme a necessidade operacional;',
      'monitoramento e registro de atividades relevantes para segurança;',
      'revisão de componentes e dependências utilizados pela plataforma;',
      'correção de vulnerabilidades de acordo com sua criticidade e impacto.',
    ],
  },
  {
    title: 'Incidentes de segurança',
    paragraphs: [
      'Quando identificamos um incidente, avaliamos seu alcance, buscamos conter seus efeitos e adotamos medidas de correção. Comunicações a titulares e autoridades são realizadas quando exigidas pela legislação aplicável.',
    ],
  },
  {
    title: 'Reporte uma vulnerabilidade',
    paragraphs: [
      <>Se você acredita ter encontrado uma vulnerabilidade, envie uma descrição responsável para <a href="mailto:contato@fauves.com.br">contato@fauves.com.br</a>. Inclua os passos para reprodução e evite acessar, alterar ou divulgar dados de terceiros.</>,
    ],
  },
];

const SecurityPolicy = () => (
  <LegalPageLayout
    title="Segurança"
    updatedAt="19 de julho de 2026"
    description="Conheça as práticas de segurança adotadas pela Fauves."
    sections={sections}
  />
);

export default SecurityPolicy;
