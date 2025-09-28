import React, { useState } from 'react';

interface CategoryTagsProps {
  categories?: string[];
}

const CategoryTags: React.FC<CategoryTagsProps> = ({ 
  categories = [
    'Shows e Festas',
    'Teatro',
    'Esportes',
    'Cursos',
    'Workshops',
    'Conferências',
    'Exposições'
  ]
}) => {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  return (
    <div className="relative">
      <div className="flex gap-5 overflow-x-scroll scrollbar-hide pb-2" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        {categories.map((category) => (
          <button
            key={category}
            onClick={() => toggleCategory(category)}
            className={`flex min-w-[134px] h-[34px] justify-center items-center px-[11px] py-[7px] rounded-lg flex-shrink-0 transition-colors ${
              selectedCategories.includes(category)
                ? 'bg-[#EF4118] text-white'
                : 'bg-[#EF4118] text-white hover:bg-[#d63614]'
            }`}
          >
            <span className="text-sm font-bold whitespace-nowrap">
              {category}
            </span>
          </button>
        ))}
      </div>
      {/* Fade overlay para indicar mais itens à direita */}
      <div className="absolute right-0 top-0 bottom-2 w-12 bg-gradient-to-l from-white via-white/80 to-transparent pointer-events-none"></div>
    </div>
  );
};

export default CategoryTags;
