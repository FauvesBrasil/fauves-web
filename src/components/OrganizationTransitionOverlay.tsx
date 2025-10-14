import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight } from 'lucide-react';
import { useOrganization } from '@/context/OrganizationContext';

interface Props {
  transitioning: boolean;
  fromName?: string | null;
  toName?: string | null;
}

// Avatar circle that prefers an org logo when available, otherwise initials
const Circle: React.FC<{ label: string; orgId?: string | null }> = ({ label, orgId }) => {
  const { orgs } = useOrganization();
  const org = orgs.find(o => o.id === orgId) || null;
  const [errored, setErrored] = React.useState(false);
  React.useEffect(() => { setErrored(false); }, [org?.logoUrl, orgId]);

  const content = org?.logoUrl && !errored ? (
    // eslint-disable-next-line jsx-a11y/alt-text
    <img src={org!.logoUrl} onError={() => setErrored(true)} className="w-full h-full object-cover" />
  ) : (
    <span className="text-5xl font-bold text-white select-none">{(label || '?').substring(0,1).toUpperCase()}</span>
  );

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.6, opacity: 0, y: -20 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
      className="w-[120px] h-[120px] rounded-full bg-[#D9D9D9] shadow-[0_4px_10px_rgba(0,0,0,0.08)] flex items-center justify-center relative overflow-hidden"
    >
      {content}
    </motion.div>
  );
};

const ArrowSwap: React.FC = () => (
  <motion.div
    initial={{ scale: 0.6, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.6, opacity: 0 }}
    transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    className="w-14 h-14 rounded-full bg-[#EF4118] text-white flex items-center justify-center shadow-lg -my-1 z-10"
  >
    <motion.div
      initial={{ rotate: -90, scale: 0.8 }}
      animate={{ rotate: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 220, damping: 18 }}
      className="flex items-center justify-center"
    >
      <motion.span
        animate={{ rotate: [0, 12, -12, 0] }}
        transition={{ repeat: Infinity, repeatDelay: 1.6, duration: 1.2, ease: 'easeInOut' }}
        className="inline-flex"
      >
        <ArrowLeftRight className="w-7 h-7" strokeWidth={2.25} />
      </motion.span>
    </motion.div>
  </motion.div>
);

export const OrganizationTransitionOverlay: React.FC<Props> = ({ transitioning, fromName, toName }) => {
  const { orgs } = useOrganization();
  // best-effort: find org objects by name to pull logoUrl
  const fromOrg = fromName ? orgs.find(o => o.name === fromName) || orgs.find(o => (o.name || '').toLowerCase().includes((fromName || '').toLowerCase())) || null : null;
  const toOrg = toName ? orgs.find(o => o.name === toName) || orgs.find(o => (o.name || '').toLowerCase().includes((toName || '').toLowerCase())) || null : null;

  return (
    <AnimatePresence>
      {transitioning && (
        <motion.div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-white"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          <div className="flex flex-col items-center">
            <div className="flex flex-col items-center gap-4">
              <div className="flex flex-col items-center gap-3 relative">
                <Circle label={fromName || '?'} orgId={fromOrg?.id || null} />
                <ArrowSwap />
                <Circle label={toName || '?'} orgId={toOrg?.id || null} />
              </div>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: 0.15 }}
                className="text-sm font-medium text-[#091747] text-center max-w-[240px]"
              >
                Estamos levando você para outra organização
              </motion.div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default OrganizationTransitionOverlay;
