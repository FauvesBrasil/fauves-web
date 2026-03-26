import React from 'react';
import { Link } from 'react-router-dom';

interface EventCardProps {
  id: string;
  slug?: string | null;
  image: string;
  date: string;
  dateShort?: string;
  title: string;
  location: string;
  size?: 'large' | 'small';
  style?: React.CSSProperties;
  categories?: Array<{ name: string; slug: string }>;
  views?: number;
  interests?: number;
}

import { getEventPath } from '../lib/eventUrl';
import { useTheme } from '@/context/ThemeContext';
import InterestButton from './InterestButton';
import { getEventHypeLevel, getHypeBadge } from '../lib/hype';
import { Eye, Users } from 'lucide-react';

const EventCard: React.FC<EventCardProps> = ({
  id,
  slug,
  image,
  date,
  dateShort,
  title,
  location,
  size = 'large',
  style,
  categories = [],
  views = 0,
  interests = 0
}) => {
  const isLarge = size === 'large';
  const { isDark } = useTheme();
  const to = getEventPath({ id, slug });
  const displayDate = dateShort || date;
  
  const hypeLevel = getEventHypeLevel({ views, interests });
  const hypeBadge = getHypeBadge(hypeLevel);

  return (
    <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article
        className={`${isLarge
          ? 'w-[245px] max-md:w-full max-md:max-w-[245px] max-md:justify-self-center max-sm:w-full max-sm:max-w-none max-sm:flex max-sm:flex-row max-sm:h-[120px]'
          : 'w-[156px] max-md:w-full max-md:max-w-[156px] max-md:justify-self-center max-sm:w-full max-sm:flex max-sm:flex-row max-sm:h-[100px]'
          } ${isDark ? 'relative bg-card rounded-[14px] hover:shadow-lg transition-shadow cursor-pointer' : 'border relative bg-card rounded-[14px] border-solid border-border hover:shadow-lg transition-shadow cursor-pointer'}`}
        style={style}
      >
        <div className={`${isLarge ? 'w-[245px]' : 'w-[156px]'} rounded-[14px_14px_0_0] overflow-hidden max-sm:w-[120px] max-sm:rounded-[14px_0_0_14px] max-sm:flex-shrink-0 relative`}>
          {/* image container forced square via inline aspect-ratio utility */}
          <div className="w-full aspect-square bg-gray-100 max-sm:h-full max-sm:aspect-auto">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
              loading="lazy"
              decoding="async"
              fetchPriority="low"
              width={isLarge ? 245 : 156}
              height={isLarge ? 245 : 156}
            />
          </div>
          {/* Category Badge */}
          {categories && categories.length > 0 && (
            <div className="absolute top-2 left-2 z-10 flex gap-1">
              <Link
                to={`/eventos/${categories[0].slug}`}
                onClick={(e) => e.stopPropagation()}
                className="px-2 py-0.5 bg-white/90 dark:bg-slate-900/90 text-[10px] font-black uppercase tracking-wider rounded-md text-[#091747] dark:text-white border border-gray-100 dark:border-slate-800 backdrop-blur-sm hover:bg-orange-600 hover:text-white transition-colors"
              >
                {categories[0].name}
              </Link>
            </div>
          )}
          {/* Hype Badge */}
          {hypeBadge && (
            <div className={`absolute bottom-2 left-2 z-10 flex items-center gap-1 px-2 py-1 rounded-md text-white text-[9px] font-black uppercase tracking-wider ${hypeBadge.color} shadow-lg`}>
              <span>{hypeBadge.icon}</span>
              <span>{hypeBadge.label}</span>
            </div>
          )}
          {/* Botão de interesse sobreposto à imagem */}
          <div className="absolute top-2 right-2 z-10">
            <InterestButton eventId={id} variant="card" />
          </div>
        </div>
        <div className={`flex flex-col items-start ${isLarge ? 'gap-[10px] px-4 py-[19px]' : 'gap-2 px-3 py-3'
          } max-sm:flex-1 max-sm:justify-center max-sm:px-3 max-sm:py-3 max-sm:gap-2 flex-1`}>
          <time className={`${isDark ? 'text-[#EF4118]' : 'text-[#2A2AD7]'} text-xs font-normal max-sm:text-sm max-sm:font-semibold w-full`}>
            <span className="hidden max-sm:inline">{displayDate}</span>
            <span className="max-sm:hidden">{date}</span>
          </time>
          <h3 className={`${isDark ? 'text-white' : 'text-[#FF3F00]'} text-lg font-bold leading-tight line-clamp-2 w-full max-sm:text-base max-sm:font-bold overflow-hidden`}>
            {title}
          </h3>
          <div className="flex items-center gap-2 w-full overflow-hidden">
            <svg width="10" height="13" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isDark ? 'text-[#EF4118]' : 'text-[#091747]'} max-sm:w-2 max-sm:h-3 flex-shrink-0`}>
              <path d="M4.875 13C4.875 13 9.75 9.1 9.75 4.875C9.75 2.1827 7.5673 0 4.875 0C2.1827 0 0 2.1827 0 4.875C0 9.1 4.875 13 4.875 13Z" stroke="currentColor" strokeLinejoin="round" />
              <path d="M4.875 6.8258C5.1311 6.8258 5.3847 6.7753 5.6213 6.6773C5.8579 6.5793 6.0728 6.4357 6.2539 6.2546C6.435 6.0736 6.5786 5.8586 6.6766 5.622C6.7746 5.3854 6.825 5.1319 6.825 4.8758C6.825 4.6197 6.7746 4.3661 6.6766 4.1295C6.5786 3.893 6.435 3.678 6.2539 3.4969C6.0728 3.3158 5.8579 3.1722 5.6213 3.0742C5.3847 2.9762 5.1311 2.9258 4.875 2.9258C4.3579 2.9258 3.8619 3.1312 3.4962 3.4969C3.1305 3.8626 2.925 4.3586 2.925 4.8758C2.925 5.393 3.1305 5.8889 3.4962 6.2546C3.8619 6.6203 4.3579 6.8258 4.875 6.8258Z" stroke="currentColor" strokeLinejoin="round" />
            </svg>
            <span className={`${isDark ? 'text-[#EF4118]' : 'text-[#091747]'} text-xs max-sm:text-[11px] truncate flex-1`}>{location}</span>
          </div>
          
          {/* Metrics Section */}
          <div className="flex items-center gap-3 mt-1.5 opacity-80">
            <div className="flex items-center gap-1 text-[10px] font-bold text-gray-500 dark:text-slate-400">
              <Eye size={12} className="text-gray-400" />
              <span>{views}</span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-bold text-orange-600 dark:text-orange-500">
              <Users size={12} className="text-orange-400" />
              <span>{interests}</span>
            </div>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default React.memo(EventCard);
