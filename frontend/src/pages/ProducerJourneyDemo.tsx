import React from 'react';
import ProducerJourneyCard from '@/components/ProducerJourneyCard';

const ProducerJourneyDemo: React.FC = () => {
  const currentLevel = { id: 'EXPLORADOR', title: 'Explorador', threshold: 0 };
  const nextLevel = { id: 'INFLUENTE', title: 'Influente', threshold: 25000, benefits: ['Kit Fauves','destaque no app'] };
  return (
    <div className="p-8 bg-gray-50 min-h-screen">
      <h1 className="text-2xl mb-4">Producer Journey Demo</h1>
      <ProducerJourneyCard currentLevel={currentLevel} sold={15} progressPercent={5} nextLevel={nextLevel} />
    </div>
  );
};

export default ProducerJourneyDemo;
