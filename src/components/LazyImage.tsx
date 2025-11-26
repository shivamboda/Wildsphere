import React, { useState, useEffect, useRef } from 'react';

interface LazyImageProps {
    src?: string;
    alt: string;
    className?: string;
    fallbackSrc?: string;
}

const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className, fallbackSrc = 'https://via.placeholder.com/640x360?text=No+Image' }) => {
    // Handle base URL for GitHub Pages deployment
    const resolvedSrc = src?.startsWith('/')
        ? `${import.meta.env.BASE_URL}${src.slice(1)}`
        : src;

    const [isLoaded, setIsLoaded] = useState(false);
    const [isInView, setIsInView] = useState(false);
    const [hasError, setHasError] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    useEffect(() => {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setIsInView(true);
                    observer.disconnect();
                }
            });
        });

        if (imgRef.current) {
            observer.observe(imgRef.current);
        }

        return () => {
            observer.disconnect();
        };
    }, []);

    const handleLoad = () => {
        setIsLoaded(true);
    };

    const handleError = () => {
        setHasError(true);
    };

    return (
        <div className="relative w-full h-full overflow-hidden bg-gray-800" ref={imgRef as any}>
            {!isLoaded && !hasError && (
                <div className="absolute inset-0 flex items-center justify-center text-gray-500 animate-pulse">
                    Loading...
                </div>
            )}

            {isInView && (
                <img
                    src={hasError || !resolvedSrc ? fallbackSrc : resolvedSrc}
                    alt={alt}
                    className={`transition-opacity duration-500 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className || 'w-full h-full object-cover'}`}
                    onLoad={handleLoad}
                    onError={handleError}
                />
            )}
        </div>
    );
};

export default LazyImage;
