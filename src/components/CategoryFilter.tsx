import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { cn } from "@/lib/utils";
import { fetchApi } from '@/lib/apiBase';

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface CategoryFilterProps {
  onSelect: (categorySlug: string | null) => void;
  selectedSlug: string | null;
  navigateOnClick?: boolean;
}

const CategoryFilter: React.FC<CategoryFilterProps> = ({ onSelect, selectedSlug, navigateOnClick = false }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const handleSelect = (slug: string | null) => {
    onSelect(slug);
    if (navigateOnClick) {
      if (slug) {
        navigate(`/eventos/${slug}`);
      } else {
        navigate('/');
      }
    }
  };

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await fetchApi('/event-category');
        if (response.ok) {
          const data = await response.json();
          setCategories(data);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategories();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-gray-100 dark:bg-slate-800 animate-pulse rounded-full flex-shrink-0" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 max-w-[1352px] mx-auto">
      <h3 className="text-sm font-bold text-[#091747] dark:text-gray-300 ml-1">Filtre por categoria</h3>
      <div className="flex gap-3 overflow-x-auto pb-4 pt-1 scrollbar-hide -mx-6 px-6 md:mx-0 md:px-0">
      <button
        onClick={() => handleSelect(null)}
        className={cn(
          "px-6 py-2.5 rounded-full text-sm font-bold transition-all border flex-shrink-0",
          selectedSlug === null
            ? "bg-[#091747] text-white border-[#091747] shadow-lg shadow-blue-900/10"
            : "bg-white dark:bg-slate-900 text-gray-500 border-gray-100 dark:border-slate-800 hover:border-gray-200"
        )}
      >
        Todos
      </button>
      {categories.map((cat) => (
        <button
          key={cat.id}
          onClick={() => handleSelect(cat.slug)}
          className={cn(
            "px-6 py-2.5 rounded-full text-sm font-bold transition-all border flex-shrink-0",
            selectedSlug === cat.slug
              ? "bg-orange-500 text-white border-orange-500 shadow-lg shadow-orange-500/20"
              : "bg-white dark:bg-slate-900 text-gray-500 border-gray-100 dark:border-slate-800 hover:border-gray-200"
          )}
        >
          {cat.name}
        </button>
      ))}
      </div>
    </div>
  );
};

export default CategoryFilter;
