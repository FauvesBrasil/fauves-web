import { useState, useRef, useEffect } from 'react';

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

  // Ref para o container scrollable
  const scrollRef = useRef<HTMLDivElement>(null);
  // Estado para drag
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = x - startX;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };
  const handleMouseUp = () => setIsDragging(false);
  const handleMouseLeave = () => setIsDragging(false);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setStartX(e.touches[0].pageX - (scrollRef.current?.offsetLeft || 0));
    setScrollLeft(scrollRef.current?.scrollLeft || 0);
  };
  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !scrollRef.current) return;
    const x = e.touches[0].pageX - scrollRef.current.offsetLeft;
    const walk = x - startX;
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };
  const handleTouchEnd = () => setIsDragging(false);

  const toggleCategory = (category: string) => {
    setSelectedCategories(prev => 
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Estado para mostrar fade
  const [showLeftFade, setShowLeftFade] = useState(false);
  const [showRightFade, setShowRightFade] = useState(false);

  // Atualiza fades ao rolar ou ao montar
  const updateFades = () => {
    const el = scrollRef.current;
    if (!el) return;
    setShowLeftFade(el.scrollLeft > 5);
    setShowRightFade(el.scrollLeft + el.clientWidth < el.scrollWidth - 5);
  };

  // Atualiza fades em eventos relevantes
  useEffect(() => {
    updateFades();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateFades);
    window.addEventListener('resize', updateFades);
    return () => {
      el.removeEventListener('scroll', updateFades);
      window.removeEventListener('resize', updateFades);
    };
  }, [categories.length]);

  return (
    <div className="relative">
      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-scroll scrollbar-hide pb-2 cursor-grab active:cursor-grabbing"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {categories.map((category) => {
          return (
            <button
              key={category}
              onClick={() => toggleCategory(category)}
              className={`flex h-[40px] justify-center items-center px-6 py-2 rounded-full flex-shrink-0 transition-colors ${
                selectedCategories.includes(category)
                  ? 'bg-[#FFE5DF] text-[#EF4118] hover:bg-[#d63614] hover:text-white'
                  : 'bg-[#FFE5DF] text-[#EF4118] hover:bg-[#d63614] hover:text-white'
              }`}
            >
              <span className="text-sm font-bold whitespace-nowrap">
                {category}
              </span>
            </button>
          );
        })}
      </div>
      {/* Fade overlays dinâmicos */}
      <div
        className={`absolute left-0 top-0 bottom-2 w-12 pointer-events-none transition-opacity duration-300 bg-gradient-to-r from-white via-white/80 to-transparent ${showLeftFade ? 'opacity-100' : 'opacity-0'}`}
      ></div>
      <div
        className={`absolute right-0 top-0 bottom-2 w-12 pointer-events-none transition-opacity duration-300 bg-gradient-to-l from-white via-white/80 to-transparent ${showRightFade ? 'opacity-100' : 'opacity-0'}`}
      ></div>
    </div>
  );
};

export default CategoryTags;
