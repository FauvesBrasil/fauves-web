import React, { useState, useEffect } from 'react';

interface OptimizedImageProps {
    src: string;
    alt: string;
    className?: string;
    width?: number;
    height?: number;
    priority?: boolean;
    onLoad?: () => void;
}

/**
 * OptimizedImage component with progressive loading
 * Shows a blur placeholder while the image loads for better perceived performance
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
    src,
    alt,
    className = '',
    width,
    height,
    priority = false,
    onLoad,
}) => {
    const [isLoaded, setIsLoaded] = useState(false);
    const [currentSrc, setCurrentSrc] = useState<string>('');

    useEffect(() => {
        // Preload the image
        const img = new Image();
        img.src = src;

        img.onload = () => {
            setCurrentSrc(src);
            setIsLoaded(true);
            onLoad?.();
        };

        img.onerror = () => {
            // Fallback on error
            setCurrentSrc(src);
            setIsLoaded(true);
        };

        return () => {
            img.onload = null;
            img.onerror = null;
        };
    }, [src, onLoad]);

    return (
        <div className={`relative overflow-hidden ${className}`} style={{ width, height }}>
            {/* Placeholder blur effect while loading */}
            {!isLoaded && (
                <div
                    className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 animate-pulse"
                    aria-hidden="true"
                />
            )}

            {/* Actual image */}
            {currentSrc && (
                <img
                    src={currentSrc}
                    alt={alt}
                    className={`w-full h-full object-cover transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'
                        }`}
                    loading={priority ? 'eager' : 'lazy'}
                    fetchPriority={priority ? 'high' : 'auto'}
                    width={width}
                    height={height}
                    decoding="async"
                />
            )}
        </div>
    );
};

export default OptimizedImage;
