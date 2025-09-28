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
    <div className="flex gap-5 flex-wrap max-md:justify-center max-sm:gap-2.5">
      {categories.map((category) => (
        <button
          key={category}
          onClick={() => toggleCategory(category)}
          className={`flex w-[134px] h-[34px] justify-center items-center px-[11px] py-[7px] rounded-lg max-sm:w-[120px] max-sm:h-[30px] max-sm:px-2 max-sm:py-[5px] transition-colors ${
            selectedCategories.includes(category)
              ? 'bg-[#EF4118] text-white'
              : 'bg-[#EF4118] text-white hover:bg-[#d63614]'
          }`}
        >
          <span className="text-sm font-bold max-sm:text-xs">
            {category}
          </span>
        </button>
      ))}
    </div>
  );
};

export default CategoryTags;
