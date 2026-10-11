import React from 'react';
import { Link } from 'react-router-dom';
import {
  getEventDestination,
  trackExternalEventClick,
  type EventDestinationInput,
} from '@/lib/eventUrl';

type EventDestinationLinkProps = {
  event: EventDestinationInput;
  source: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
  title?: string;
  onClick?: React.MouseEventHandler<HTMLAnchorElement>;
};

const EventDestinationLink: React.FC<EventDestinationLinkProps> = ({
  event,
  source,
  children,
  className,
  style,
  title,
  onClick,
}) => {
  const destination = getEventDestination(event);

  if (destination.external) {
    return (
      <a
        href={destination.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        style={style}
        title={title || 'Abre no site oficial do evento'}
        onClick={(clickEvent) => {
          onClick?.(clickEvent);
          if (!clickEvent.defaultPrevented) trackExternalEventClick(event.id, source);
        }}
      >
        {children}
      </a>
    );
  }

  return (
    <Link to={destination.href} className={className} style={style} title={title} onClick={onClick}>
      {children}
    </Link>
  );
};

export default EventDestinationLink;
