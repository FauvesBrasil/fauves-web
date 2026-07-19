import React from 'react';
import { Link } from 'react-router-dom';

interface TimelineEventCardProps {
  event: {
    id: string;
    slug: string | null;
    title: string;
    date: string;
    dateShort: string;
    location: string;
    image: string;
    categories: any[];
    views: number;
    interests: number;
    _rawDate?: Date | null;
  };
  isFirst?: boolean;
  isLast?: boolean;
}

const TimelineEventCard: React.FC<TimelineEventCardProps> = ({ event, isLast }) => {
  const link = event.slug ? `/${event.slug}` : `/event/${event.id}`;

  let dateText = "Data não definida";
  let weekdayText = "";
  let timeText = "00:00";

  if (event._rawDate) {
    const d = event._rawDate;
    const day = d.getDate();
    const month = d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '');
    dateText = `${day} de ${month}.`;
    weekdayText = d.toLocaleDateString('pt-BR', { weekday: 'long' });
    timeText = d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  }

  return (
    /* Frame 413: full-width row, date col + connector + card */
    <div className="relative w-full flex justify-start items-start gap-14 font-['Inter']">

      {/* Vertical connector line (absolute, behind content, hidden on last card) */}
      {!isLast && (
        <div
          className="absolute left-[119px] top-[24px] bottom-[-32px] w-[1px] bg-neutral-900/20 z-0"
        />
      )}

      {/* Frame 408 – Date Column */}
      <div className="w-[88px] shrink-0 inline-flex flex-col justify-start items-start gap-[5px] pt-[2px] z-10">
        <div className="whitespace-nowrap text-neutral-900 text-base font-medium font-['Inter']">
          {dateText}
        </div>
        <div className="whitespace-nowrap text-neutral-900/40 text-base font-normal font-['Inter']">
          {weekdayText}
        </div>
      </div>

      {/* Frame 412: dot + card side-by-side */}
      <div className="flex justify-start items-start gap-4 pb-8 z-10">

        {/* Ellipse 193 – Dot (vertically offset to align with card top) */}
        <div className="mt-[14px] shrink-0">
          <svg
            width="9" height="9" viewBox="0 0 9 9"
            fill="none" xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="4.11621" cy="4.11621" r="4.11621" fill="#131517" fillOpacity="0.36" />
          </svg>
        </div>

        {/* Frame 411 – Card: justify-between items-end */}
        <Link to={link} className="block group">
          <div className="w-[613.40px] h-48 pl-4 pr-3 py-3 bg-white rounded-xl flex justify-between items-end shadow-[0_0_0_1px_rgba(0,0,0,0.05)] transition-shadow duration-200 group-hover:shadow-md">

            {/* Frame 410 – Info Container */}
            <div className="w-48 inline-flex flex-col justify-start items-start gap-3.5">

              {/* Time */}
              <div className="self-stretch justify-start text-neutral-900/40 text-base font-normal font-['Inter']">
                {timeText}
              </div>

              {/* Title */}
              <div className="self-stretch justify-start text-neutral-900 text-xl font-semibold font-['Inter']">
                {event.title}
              </div>

              {/* Frame 409 */}
              <div className="self-stretch flex flex-col justify-start items-start gap-2.5">

                {/* Frame 376 – Location */}
                <div className="self-stretch h-4 inline-flex justify-start items-center gap-[5px]">
                  <div className="flex justify-start items-center gap-[5px]">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <g clipPath="url(#clip_loc_tec)">
                        <path fillRule="evenodd" clipRule="evenodd" d="M2.125 7.28238C2.125 11.7087 7.48 15.9375 8.5 15.9375C9.52 15.9375 14.875 11.7087 14.875 7.28238C14.875 3.84731 12.0211 1.0625 8.5 1.0625C4.97888 1.0625 2.125 3.84625 2.125 7.28238Z" stroke="#131517" strokeOpacity="0.38" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                        <path fillRule="evenodd" clipRule="evenodd" d="M10.0938 6.90625C10.0937 7.32894 9.92584 7.73432 9.62695 8.0332C9.32807 8.33209 8.92269 8.5 8.5 8.5C8.07731 8.5 7.67193 8.33209 7.37305 8.0332C7.07416 7.73432 6.90625 7.32894 6.90625 6.90625C6.90625 6.48356 7.07416 6.07818 7.37305 5.7793C7.67193 5.48041 8.07731 5.3125 8.5 5.3125C8.92269 5.3125 9.32807 5.48041 9.62695 5.7793C9.92584 6.07818 10.0938 6.48356 10.0938 6.90625Z" stroke="#131517" strokeOpacity="0.38" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </g>
                      <defs>
                        <clipPath id="clip_loc_tec"><rect width="17" height="17" fill="white" /></clipPath>
                      </defs>
                    </svg>
                    <div className="justify-start text-neutral-900/40 text-base font-medium font-['Inter'] leading-4">
                      {event.location}
                    </div>
                  </div>
                </div>

                {/* Frame 374 – Attendees */}
                <div className="inline-flex justify-start items-center gap-[5px]">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <g clipPath="url(#clip_att_tec)">
                      <path fillRule="evenodd" clipRule="evenodd" d="M9.75095 1C9.65246 1 9.55493 1.0194 9.46394 1.05709C9.37295 1.09478 9.29027 1.15003 9.22062 1.21967C9.15098 1.28931 9.09573 1.37199 9.05804 1.46299C9.02035 1.55398 9.00095 1.65151 9.00095 1.75C9.00095 1.84849 9.02035 1.94602 9.05804 2.03701C9.09573 2.12801 9.15098 2.21069 9.22062 2.28033C9.29027 2.34997 9.37295 2.40522 9.46394 2.44291C9.55493 2.4806 9.65246 2.5 9.75095 2.5C10.863 2.5 11.693 3.326 11.693 4.489C11.693 5.05 11.5 5.384 11.262 5.707L11.155 5.847L10.835 6.289C10.6479 6.56698 10.5452 6.89303 10.539 7.228C10.539 7.997 10.905 8.525 11.386 8.878C11.766 9.157 12.246 9.345 12.622 9.492L12.744 9.54C13.188 9.716 13.5 9.858 13.713 10.046C13.881 10.195 14.001 10.384 14.001 10.75C14.001 10.9489 14.08 11.1397 14.2206 11.2803C14.3613 11.421 14.552 11.5 14.751 11.5C14.9499 11.5 15.1406 11.421 15.2813 11.2803C15.4219 11.1397 15.501 10.9489 15.501 10.75C15.501 9.942 15.188 9.348 14.707 8.923C14.27 8.536 13.717 8.312 13.296 8.145L13.206 8.109C12.779 7.94 12.487 7.825 12.275 7.669C12.107 7.545 12.04 7.437 12.04 7.228C12.04 7.225 12.04 7.219 12.046 7.201C12.0614 7.16208 12.0808 7.12488 12.104 7.09C12.158 7.004 12.211 6.936 12.285 6.84L12.47 6.596C12.809 6.136 13.193 5.492 13.193 4.488C13.193 2.522 11.716 1 9.75095 1ZM6.32195 1.75C4.19295 1.75 2.57195 3.372 2.57195 5.5C2.57195 6.583 2.99195 7.275 3.36495 7.771L3.56795 8.034L3.77595 8.316C3.85695 8.442 3.85795 8.487 3.85795 8.5C3.85795 8.75 3.77195 8.888 3.56595 9.037C3.31995 9.215 2.98395 9.345 2.51395 9.528L2.40795 9.569C1.93795 9.752 1.33595 9.993 0.861953 10.405C0.342953 10.856 0.00195312 11.488 0.00195312 12.357C0.00195312 13.038 0.311953 13.581 0.766953 13.979C1.20195 14.359 1.77095 14.613 2.35795 14.789C3.53395 15.142 5.01295 15.249 6.32395 15.249C7.63495 15.249 9.11295 15.142 10.289 14.789C10.876 14.613 11.445 14.359 11.88 13.979C12.335 13.581 12.645 13.037 12.645 12.357C12.645 11.489 12.303 10.857 11.785 10.405C11.311 9.992 10.708 9.751 10.239 9.569L10.133 9.528C9.66295 9.346 9.32695 9.215 9.08095 9.037C8.87495 8.888 8.78895 8.75 8.78895 8.5C8.78895 8.487 8.78995 8.443 8.87095 8.316C8.93613 8.21901 9.00553 8.12492 9.07895 8.034L9.28195 7.771C9.65495 7.274 10.075 6.582 10.075 5.5C10.075 3.372 8.45395 1.75 6.32495 1.75H6.32195ZM4.07195 5.5C4.07195 4.2 5.02195 3.25 6.32195 3.25C7.62195 3.25 8.57195 4.2 8.57195 5.5C8.57195 6.132 8.34895 6.511 8.07895 6.871L7.95595 7.03L7.60595 7.505C7.44595 7.754 7.28595 8.084 7.28595 8.5C7.28595 9.321 7.68195 9.879 8.19995 10.253C8.61295 10.551 9.13695 10.753 9.55695 10.914L9.69395 10.967C10.188 11.159 10.55 11.32 10.799 11.537C11.004 11.715 11.144 11.94 11.144 12.357C11.144 12.534 11.079 12.686 10.891 12.851C10.683 13.033 10.342 13.208 9.85695 13.353C8.88995 13.643 7.58395 13.75 6.32295 13.75C5.06195 13.75 3.75495 13.643 2.78895 13.353C2.30395 13.207 1.96295 13.033 1.75495 12.851C1.56695 12.687 1.50195 12.534 1.50195 12.357C1.50195 11.94 1.64295 11.715 1.84695 11.537C2.09595 11.32 2.45795 11.159 2.95195 10.967L3.08895 10.914C3.50895 10.753 4.03295 10.551 4.44595 10.253C4.96295 9.879 5.35995 9.321 5.35995 8.5C5.35995 8.084 5.19995 7.754 5.03995 7.505C4.93001 7.34182 4.81324 7.18334 4.68995 7.03L4.56695 6.871C4.29695 6.511 4.07395 6.131 4.07395 5.5H4.07195Z" fill="#131517" fillOpacity="0.38" />
                    </g>
                    <defs>
                      <clipPath id="clip_att_tec"><rect width="16" height="16" fill="white" /></clipPath>
                    </defs>
                  </svg>
                  <div className="justify-start text-neutral-900/40 text-base font-medium font-['Inter'] leading-4">
                    {event.interests === 0 ? 'Nenhum convidado' : `${event.interests} convidados`}
                  </div>
                </div>

              </div>

              {/* Rectangle 1274 + Label — Gerenciar Evento button */}
              <button
                className="w-36 h-8 bg-neutral-100 rounded-lg flex items-center justify-start px-3"
                onClick={(e) => e.preventDefault()}
              >
                <span className="text-neutral-900/40 text-sm font-medium font-['Inter'] leading-4">
                  Gerenciar Evento
                </span>
              </button>

            </div>

            {/* Rectangle 1275 – Thumbnail */}
            <div className="w-40 h-40 bg-zinc-300 rounded-xl relative overflow-hidden shrink-0">
              <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
            </div>

          </div>
        </Link>

      </div>
    </div>
  );
};

export default TimelineEventCard;
