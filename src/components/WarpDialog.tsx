import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X } from 'lucide-react';

interface WarpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  loading?: boolean;
  children?: React.ReactNode;
}

export function WarpDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  onConfirm,
  onCancel,
  loading = false,
  children,
}: WarpDialogProps) {
  const handleConfirm = () => {
    onConfirm();
  };

  const handleCancel = () => {
    onCancel?.();
    onOpenChange(false);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            {/* Overlay with warp effect */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 z-50 bg-black/80"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
              >
                {/* Warp grid effect */}
                <svg
                  className="absolute inset-0 w-full h-full"
                  style={{ 
                    maskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)',
                    WebkitMaskImage: 'radial-gradient(circle at center, black 20%, transparent 70%)',
                  }}
                >
                  <defs>
                    <pattern
                      id="warp-grid"
                      width="40"
                      height="40"
                      patternUnits="userSpaceOnUse"
                    >
                      <motion.path
                        d="M 40 0 L 0 0 0 40"
                        fill="none"
                        stroke="rgba(239, 68, 68, 0.3)"
                        strokeWidth="1"
                        initial={{ pathLength: 0, opacity: 0 }}
                        animate={{ 
                          pathLength: 1, 
                          opacity: [0, 0.3, 0.3],
                        }}
                        transition={{ 
                          duration: 0.8,
                          ease: [0.16, 1, 0.3, 1],
                        }}
                      />
                    </pattern>
                    
                    {/* Radial distortion filter */}
                    <filter id="warp-distortion">
                      <feTurbulence
                        type="fractalNoise"
                        baseFrequency="0.01"
                        numOctaves="3"
                        result="turbulence"
                      >
                        <animate
                          attributeName="baseFrequency"
                          from="0.01"
                          to="0.02"
                          dur="0.6s"
                          repeatCount="1"
                        />
                      </feTurbulence>
                      <feDisplacementMap
                        in="SourceGraphic"
                        in2="turbulence"
                        scale="20"
                        xChannelSelector="R"
                        yChannelSelector="G"
                      >
                        <animate
                          attributeName="scale"
                          from="0"
                          to="30"
                          dur="0.6s"
                          repeatCount="1"
                        />
                      </feDisplacementMap>
                    </filter>
                  </defs>
                  
                  <motion.rect
                    width="100%"
                    height="100%"
                    fill="url(#warp-grid)"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4, delay: 0.1 }}
                    style={{ filter: 'url(#warp-distortion)' }}
                  />
                </svg>
              </motion.div>
            </Dialog.Overlay>

            {/* Content */}
            <Dialog.Content asChild>
              <motion.div
                className="fixed left-[50%] top-[50%] z-50 w-[calc(100%_-_2rem)] max-w-md"
                initial={{ 
                  opacity: 0, 
                  scale: 0.8, 
                  x: '-50%', 
                  y: 'calc(-50% + 40px)',
                  rotateX: 20,
                }}
                animate={{ 
                  opacity: 1, 
                  scale: 1, 
                  x: '-50%', 
                  y: '-50%',
                  rotateX: 0,
                }}
                exit={{ 
                  opacity: 0, 
                  scale: 0.8, 
                  x: '-50%', 
                  y: 'calc(-50% + 40px)',
                  rotateX: -20,
                }}
                transition={{ 
                  duration: 0.4, 
                  ease: [0.16, 1, 0.3, 1],
                }}
                style={{ perspective: 1000 }}
              >
                <motion.div
                  className="bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl p-6 max-sm:p-5 relative border-2 border-red-500/20"
                  initial={{ boxShadow: '0 0 0 rgba(239, 68, 68, 0)' }}
                  animate={{ 
                    boxShadow: [
                      '0 0 0 rgba(239, 68, 68, 0)',
                      '0 0 40px rgba(239, 68, 68, 0.4)',
                      '0 0 40px rgba(239, 68, 68, 0.2)',
                    ]
                  }}
                  transition={{ duration: 0.6 }}
                >
                  {/* Close button */}
                  <Dialog.Close asChild>
                    <button
                      className="absolute right-4 top-4 rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                      aria-label="Fechar"
                    >
                      <X className="w-4 h-4 text-gray-500" />
                    </button>
                  </Dialog.Close>

                  {/* Icon with pulsing effect */}
                  <motion.div
                    className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center mb-4 relative"
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.3 }}
                  >
                    <motion.div
                      className="absolute inset-0 rounded-full bg-red-500/30"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 0, 0.5],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-500 relative z-10" />
                  </motion.div>

                  {/* Title */}
                  <Dialog.Title className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                  </Dialog.Title>

                  {/* Description */}
                  <Dialog.Description className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                    {description}
                  </Dialog.Description>

                  {/* Custom content (inputs, etc) */}
                  {children && (
                    <div className="mb-6">
                      {children}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-3 max-sm:flex-col-reverse">
                    <motion.button
                      onClick={handleCancel}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      {cancelText}
                    </motion.button>
                    <motion.button
                      onClick={handleConfirm}
                      disabled={loading}
                      className="flex-1 px-4 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative overflow-hidden"
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        initial={{ x: '-100%' }}
                        whileHover={{ x: '100%' }}
                        transition={{ duration: 0.6 }}
                      />
                      <span className="relative z-10">
                        {loading ? 'Processando...' : confirmText}
                      </span>
                    </motion.button>
                  </div>
                </motion.div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
