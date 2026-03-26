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
  showButton?: boolean;
  badge?: string;
  isTrending?: boolean;
}

import { getEventPath } from '../lib/eventUrl';
import { useTheme } from '@/context/ThemeContext';
import InterestButton from './InterestButton';
import { getEventHypeLevel, getHypeBadge } from '../lib/hype';
import { Eye, Users, Flame } from 'lucide-react';

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
  interests = 0,
  showButton = false,
  badge,
  isTrending = false
}) => {
  const isLarge = size === 'large';
  const { isDark } = useTheme();
  const to = getEventPath({ id, slug });
  const displayDate = dateShort || date;
  
  const hypeLevel = getEventHypeLevel({ views, interests });
  const hypeBadge = getHypeBadge(hypeLevel);

  return (
    <div 
      className={`group flex bg-white dark:bg-[#1a1b1e] rounded-2xl border border-[rgba(9,23,71,0.08)] dark:border-[#2a2b2e] overflow-hidden hover:shadow-2xl transition-all duration-300 ${
        isLarge 
          ? `w-[245px] max-sm:w-full max-sm:min-h-[140px] flex-col ${isTrending ? '' : 'max-sm:flex-row'}` 
          : `w-[156px] max-sm:w-full max-sm:min-h-[110px] flex-col ${isTrending ? '' : 'max-sm:flex-row'}`
      }`}
      style={style}
    >
      <Link to={to} className={`relative aspect-square overflow-hidden block shrink-0 ${isTrending ? '' : 'max-sm:w-[130px] max-sm:h-full'}`}>
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Badges/Overlays */}
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1.5">
          {categories && categories.length > 0 && (
            <span className="px-1.5 py-0.5 bg-white/95 dark:bg-slate-900/90 text-[8px] font-black uppercase tracking-wider rounded-md text-[#091747] dark:text-white shadow-sm">
              {categories[0].name}
            </span>
          )}
          {badge && (
            <span className="bg-orange-600 text-white text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md shadow-lg tracking-wider">
              {badge}
            </span>
          )}
          {isTrending && (
             <span className="bg-orange-600 text-white text-[8px] uppercase font-black px-1.5 py-0.5 rounded-md shadow-lg tracking-wider flex items-center gap-1">
                <Flame size={9} /> Em alta
             </span>
          )}
        </div>

        <div className="absolute top-2 right-2 z-10">
          <InterestButton eventId={id} variant="card" />
        </div>

        {hypeBadge && (
          <div className={`absolute bottom-2 left-2 z-10 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-white text-[8px] font-black uppercase tracking-wider ${hypeBadge.color} shadow-lg backdrop-blur-sm`}>
            <span>{hypeBadge.icon}</span>
            <span>{hypeBadge.label}</span>
          </div>
        )}
      </Link>

      <div className="p-3 md:p-5 flex flex-col flex-grow min-w-0">
        <div className="flex items-center gap-2 mb-1.5">
            <span className={`w-1.5 h-1.5 rounded-full ${isTrending ? 'bg-orange-600 animate-pulse' : 'bg-indigo-600'}`}></span>
            <time className={`${isTrending ? 'text-orange-600' : 'text-indigo-600'} text-[10px] md:text-xs font-bold uppercase tracking-wide truncate`}>
              {displayDate}
            </time>
        </div>

        <Link to={to} className="hover:text-orange-600 transition-colors">
          <h3 className="text-[#091747] dark:text-white text-sm md:text-lg font-bold mb-2 line-clamp-2 leading-tight min-h-[2.5rem] md:min-h-[3rem]">
            {title}
          </h3>
        </Link>

        <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 mb-2 mt-auto">
          <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0">
            <path d="M7 13C7 13 12 9.4 12 5.5C12 2.73858 9.76142 0.5 7 0.5C4.23858 0.5 2 2.73858 2 5.5C2 9.4 7 13 7 13Z" stroke="currentColor" strokeLinejoin="round"/>
            <circle cx="7" cy="5.5" r="1.5" stroke="currentColor"/>
          </svg>
          <span className="text-[9px] md:text-xs font-medium truncate">{location}</span>
        </div>

        {/* Metrics Section */}
        {!showButton && (
          <div className="flex items-center gap-3 py-1.5 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1 text-[9px] font-bold text-gray-400 dark:text-slate-500">
              <Eye size={10} />
              <span>{views}</span>
            </div>
            <div className="flex items-center gap-1 text-[9px] font-bold text-orange-600/80 dark:text-orange-500/80">
              <Users size={10} />
              <span>{interests}</span>
            </div>
          </div>
        )}
        
        {showButton && (
          <Link 
            to={to}
            className="w-full bg-[#091747] hover:bg-[#FF3F00] text-white font-bold py-2 md:py-3 px-4 rounded-xl text-center text-[10px] md:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-auto"
          >
            Ver evento
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" className="transition-transform group-hover:translate-x-1">
              <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </Link>
        )}
      </div>
    </div>
  );
};

export default React.memo(EventCard);
