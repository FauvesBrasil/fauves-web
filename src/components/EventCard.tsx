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

  if (isTrending) {
    return (
      <div 
        className="group relative rounded-2xl overflow-hidden border border-[rgba(9,23,71,0.08)] dark:border-[#2a2b2e] shadow-sm hover:shadow-2xl transition-all duration-500 bg-slate-100 dark:bg-slate-900 aspect-[3.2/4]"
        style={style}
      >
        <Link to={to} className="absolute inset-0 block">
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
          
          {/* Rank Badge - Stylized */}
          {badge && (
            <div className="absolute top-0 left-0 p-3 z-20">
              <div className="relative">
                <span className="text-4xl md:text-5xl font-black italic text-white/20 absolute -top-1 -left-1 select-none">
                   {badge.replace('#', '')}
                </span>
                <span className="relative text-xl md:text-2xl font-black italic text-orange-500 drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]">
                   {badge}
                </span>
              </div>
            </div>
          )}

          {/* Interest Button - In corner */}
          <div className="absolute top-3 right-3 z-30">
            <InterestButton eventId={id} variant="card" />
          </div>

          {/* Hype Badge - Subtle on top */}
          {hypeBadge && (
            <div className={`absolute top-12 left-3 z-20 flex items-center gap-1 px-1.5 py-0.5 rounded-md text-white text-[7px] font-black uppercase tracking-wider ${hypeBadge.color.replace('backdrop-blur-sm', '')} bg-opacity-80`}>
              <span>{hypeBadge.icon}</span>
              <span>{hypeBadge.label}</span>
            </div>
          )}

          {/* Hover / Always-on Gradient Overlay Info */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4 z-10">
            <div className="flex items-center gap-2 mb-1">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                <time className="text-orange-400 text-[10px] font-black uppercase tracking-widest leading-none">
                  {displayDate}
                </time>
            </div>
            
            <h3 className="text-white text-sm md:text-base font-black leading-tight mb-2 drop-shadow-md">
              {title}
            </h3>
            
            <div className="flex items-center gap-1.5 text-white/80 text-[10px] font-medium">
              <svg width="10" height="10" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" className="shrink-0 text-orange-500">
                <path d="M7 13C7 13 12 9.4 12 5.5C12 2.73858 9.76142 0.5 7 0.5C4.23858 0.5 2 2.73858 2 5.5C2 9.4 7 13 7 13Z" stroke="currentColor" strokeLinejoin="round"/>
                <circle cx="7" cy="5.5" r="1.5" stroke="currentColor"/>
              </svg>
              <span className="truncate">{location}</span>
            </div>

            <div className="flex items-center gap-3 mt-3 pt-3 border-t border-white/10">
              <div className="flex items-center gap-1 text-[8px] font-black text-white/50">
                <Eye size={10} />
                <span>{views} views</span>
              </div>
              <div className="flex items-center gap-1 text-[8px] font-black text-orange-400">
                <Users size={10} />
                <span>{interests} interessados</span>
              </div>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Standard listing layout
  return (
    <div 
      className={`group flex bg-white dark:bg-[#1a1b1e] rounded-2xl border border-[rgba(9,23,71,0.08)] dark:border-[#2a2b2e] overflow-hidden hover:shadow-2xl transition-all duration-300 ${
        isLarge 
          ? 'w-[245px] max-sm:w-full max-sm:min-h-[140px] flex-col max-sm:flex-row' 
          : 'w-[156px] max-sm:w-full max-sm:min-h-[110px] flex-col max-sm:flex-row'
      }`}
      style={style}
    >
      <Link to={to} className="relative aspect-square overflow-hidden block shrink-0 max-sm:w-[130px] max-sm:h-full">
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

      <div className="p-3 md:p-5 flex flex-col flex-grow min-w-0 pointer-events-none group-hover:pointer-events-auto">
        <div className="flex items-center gap-2 mb-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600"></span>
            <time className="text-indigo-600 text-[10px] md:text-xs font-bold uppercase tracking-wide truncate">
              {displayDate}
            </time>
        </div>

        <Link to={to} className="hover:text-orange-600 transition-colors pointer-events-auto">
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
            className="w-full bg-[#091747] hover:bg-[#FF3F00] text-white font-bold py-2 md:py-3 px-4 rounded-xl text-center text-[10px] md:text-sm transition-all duration-300 flex items-center justify-center gap-2 shadow-md hover:shadow-lg mt-auto pointer-events-auto"
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
