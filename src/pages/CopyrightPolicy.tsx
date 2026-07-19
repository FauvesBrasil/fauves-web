import LegalPageLayout, { type LegalPageSection } from '@/components/LegalPageLayout';

const sections: LegalPageSection[] = [
  {
    paragraphs: [
      'A Fauves respeita os direitos autorais e espera a mesma conduta de usuários e organizadores. Esta política descreve como comunicar uma possível violação envolvendo conteúdo disponível na plataforma.',
      'Embora o termo “DMCA” seja amplamente reconhecido para esse tipo de procedimento, as solicitações enviadas à Fauves são analisadas conforme a legislação aplicável, incluindo a legislação brasileira de direitos autorais.',
    ],
  },
  {
    title: 'Como enviar uma notificação',
    paragraphs: ['Se você for titular de direitos autorais ou representante autorizado, envie uma comunicação contendo:'],
    ordered: [
      'identificação e informações de contato do solicitante;',
      'identificação da obra protegida que teria sido violada;',
      'URL ou informação suficiente para localizar o conteúdo na Fauves;',
      'descrição objetiva da alegada violação;',
      'declaração de boa-fé de que o uso indicado não foi autorizado;',
      'declaração de que as informações fornecidas são verdadeiras e de que você possui legitimidade para apresentar a solicitação.',
    ],
  },
  {
    title: 'Análise e providências',
    paragraphs: [
      'Podemos solicitar informações adicionais, encaminhar a reclamação ao responsável pelo conteúdo e adotar medidas proporcionais, como restringir o acesso ao material enquanto a situação é analisada.',
      'Notificações incompletas, abusivas ou manifestamente infundadas podem não ser processadas. O envio de informações falsas pode gerar responsabilidade para o remetente.',
    ],
  },
  {
    title: 'Resposta do responsável pelo conteúdo',
    paragraphs: [
      'A pessoa responsável pelo conteúdo poderá apresentar esclarecimentos, comprovação de autorização ou outros documentos relevantes. A Fauves poderá restaurar o conteúdo quando entender que não há fundamento suficiente para mantê-lo indisponível.',
    ],
  },
  {
    title: 'Canal para direitos autorais',
    paragraphs: [
      <>Envie sua notificação para <a href="mailto:contato@fauves.com.br">contato@fauves.com.br</a> com o assunto “Direitos Autorais”.</>,
    ],
  },
];

const CopyrightPolicy = () => (
  <LegalPageLayout
    title="Notificação de Violação de Direitos Autorais (DMCA)"
    updatedAt="19 de julho de 2026"
    description="Saiba como comunicar possíveis violações de direitos autorais à Fauves."
    sections={sections}
  />
);

export default CopyrightPolicy;
