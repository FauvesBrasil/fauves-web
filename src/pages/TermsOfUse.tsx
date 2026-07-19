import LegalPageLayout, { type LegalPageSection } from '@/components/LegalPageLayout';

const sections: LegalPageSection[] = [
  {
    paragraphs: [
      'Leia estes Termos de Uso com atenção antes de acessar ou utilizar a Fauves. Eles regulam o uso da plataforma, dos recursos de criação e divulgação de eventos e dos serviços relacionados.',
      <strong>Ao acessar ou utilizar a Fauves, você declara que leu e concorda com estes Termos. Caso não concorde, não utilize a plataforma.</strong>,
    ],
  },
  {
    title: 'Nosso papel nos eventos',
    paragraphs: [
      'A Fauves fornece tecnologia para que organizadores criem, divulguem e gerenciem eventos. Salvo quando indicado expressamente, a Fauves não é a organizadora, promotora ou responsável pela realização dos eventos publicados por terceiros.',
      'Dúvidas sobre programação, local, acesso, alterações ou características específicas de um evento devem ser direcionadas ao respectivo organizador.',
    ],
  },
  {
    title: 'Contas e uso da plataforma',
    paragraphs: [
      'Você deve fornecer informações corretas, manter suas credenciais protegidas e nos comunicar caso identifique uso não autorizado da sua conta.',
    ],
    bullets: [
      'não utilizar a plataforma para atividades ilícitas, fraudulentas ou abusivas;',
      'não tentar acessar sistemas, contas ou dados sem autorização;',
      'não publicar conteúdo que viole direitos de terceiros;',
      'respeitar as regras do evento, do organizador e a legislação aplicável.',
    ],
  },
  {
    title: 'Ingressos, pagamentos e reembolsos',
    paragraphs: [
      'Preços, taxas, formas de pagamento e condições aplicáveis são informados antes da conclusão da compra. Os pagamentos podem ser processados por provedores especializados.',
      'Solicitações de cancelamento ou reembolso são analisadas conforme a legislação aplicável, a política apresentada no momento da compra e as condições definidas pelo organizador do evento.',
    ],
  },
  {
    title: 'Conteúdo e propriedade intelectual',
    paragraphs: [
      'A identidade, o software, os textos e os elementos próprios da Fauves são protegidos pelas normas de propriedade intelectual. O conteúdo enviado por usuários e organizadores permanece sob responsabilidade de quem o publica.',
      'Ao publicar conteúdo necessário à operação de um evento, você autoriza a Fauves a exibi-lo e processá-lo na medida necessária para prestar o serviço.',
    ],
  },
  {
    title: 'Suspensão e encerramento',
    paragraphs: [
      'Podemos limitar ou suspender contas em caso de violação destes Termos, risco à segurança, fraude, ordem legal ou necessidade de proteção da plataforma e de seus usuários.',
    ],
  },
  {
    title: 'Alterações e contato',
    paragraphs: [
      'Estes Termos podem ser atualizados para refletir mudanças legais, operacionais ou nos serviços. A data da versão vigente será sempre indicada nesta página.',
      <>Em caso de dúvida, entre em contato pelo e-mail <a href="mailto:contato@fauves.com.br">contato@fauves.com.br</a>.</>,
    ],
  },
];

const TermsOfUse = () => (
  <LegalPageLayout
    title="Termos de Uso"
    updatedAt="19 de julho de 2026"
    description="Termos aplicáveis ao uso da plataforma Fauves."
    sections={sections}
  />
);

export default TermsOfUse;
