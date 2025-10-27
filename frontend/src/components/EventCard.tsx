// import React from 'react'; // Não é necessário para JSX automático
import { Link } from 'react-router-dom';

interface EventCardProps {
  id: string;
  slug?: string | null;
  image: string;
  date: string;
  title: string;
  location: string;
  size?: 'large' | 'small';
  style?: React.CSSProperties;
}

import { getEventPath } from '../lib/eventUrl';
import { useTheme } from '@/context/ThemeContext';

const EventCard: React.FC<EventCardProps> = ({ 
  id,
  slug,
  image, 
  date, 
  title, 
  location, 
  size = 'large',
  style
}) => {
  const isLarge = size === 'large';
  const { isDark } = useTheme();
  const to = getEventPath({ id, slug });
  
  return (
  <Link to={to} style={{ textDecoration: 'none', color: 'inherit' }}>
      <article
        className={`${
          isLarge 
            ? 'w-[245px] max-md:w-full max-md:max-w-[245px] max-md:justify-self-center max-sm:w-full max-sm:max-w-[300px]'
            : 'w-[156px] max-md:w-full max-md:max-w-[156px] max-md:justify-self-center max-sm:w-full'
  } ${isDark ? 'relative bg-card rounded-[14px] hover:shadow-lg transition-shadow cursor-pointer' : 'border relative bg-card rounded-[14px] border-solid border-border hover:shadow-lg transition-shadow cursor-pointer'}`}
        style={style}
      >
  <div className={`${isLarge ? 'w-[245px]' : 'w-[156px]'} rounded-[14px_14px_0_0] overflow-hidden max-sm:w-full`}> 
          {/* image container forced square via inline aspect-ratio utility */}
          <div className="w-full aspect-square bg-gray-100">
            <img
              src={image}
              alt={title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className={`flex flex-col items-start ${
          isLarge ? 'w-[187px] gap-[10px] px-4 py-[19px]' : 'w-[119px] gap-2 px-3 py-3'
        }`}>
          <time className={`${isDark ? 'text-[#EF4118]' : 'text-[#2A2AD7]'} text-xs font-normal`}>
            {date}
          </time>
          <h3 className={`${isDark ? 'text-white' : 'text-[#FF3F00]'} text-lg font-bold leading-tight whitespace-nowrap overflow-hidden text-ellipsis truncate`}>
            {title}
          </h3>
          <div className="flex items-center gap-2">
            <svg width="10" height="13" viewBox="0 0 10 13" fill="none" xmlns="http://www.w3.org/2000/svg" className={`${isDark ? 'text-[#EF4118]' : 'text-[#091747]'}`}>
              <path d="M4.875 13C4.875 13 9.75 9.1 9.75 4.875C9.75 2.1827 7.5673 0 4.875 0C2.1827 0 0 2.1827 0 4.875C0 9.1 4.875 13 4.875 13Z" stroke="currentColor" strokeLinejoin="round"/>
              <path d="M4.875 6.8258C5.1311 6.8258 5.3847 6.7753 5.6213 6.6773C5.8579 6.5793 6.0728 6.4357 6.2539 6.2546C6.435 6.0736 6.5786 5.8586 6.6766 5.622C6.7746 5.3854 6.825 5.1319 6.825 4.8758C6.825 4.6197 6.7746 4.3661 6.6766 4.1295C6.5786 3.893 6.435 3.678 6.2539 3.4969C6.0728 3.3158 5.8579 3.1722 5.6213 3.0742C5.3847 2.9762 5.1311 2.9258 4.875 2.9258C4.3579 2.9258 3.8619 3.1312 3.4962 3.4969C3.1305 3.8626 2.925 4.3586 2.925 4.8758C2.925 5.393 3.1305 5.8889 3.4962 6.2546C3.8619 6.6203 4.3579 6.8258 4.875 6.8258Z" stroke="currentColor" strokeLinejoin="round"/>
            </svg>
            <span className={`${isDark ? 'text-[#EF4118]' : 'text-[#091747]'} text-xs`}>{location}</span>
          </div>
        </div>
      </article>
    </Link>
  );
};

export default EventCard;
