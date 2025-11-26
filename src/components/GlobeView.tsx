import { useRef, useState, useEffect, forwardRef, useImperativeHandle, useMemo } from 'react';
import Globe, { type GlobeMethods } from 'react-globe.gl';

interface GlobeViewProps {
    onLocationSelect: (lat: number, lng: number) => void;
    globeImageUrl?: string;
    bumpImageUrl?: string;
    showHeatmap?: boolean;
    heatmapData?: any[];
    isPaused?: boolean;
}

export interface GlobeViewHandle {
    flyTo: (lat: number, lng: number) => void;
    animateTo: (lat: number, lng: number) => Promise<void>;
    zoomOut: () => void;
}

const GlobeView = forwardRef<GlobeViewHandle, GlobeViewProps>(({
    onLocationSelect,
    globeImageUrl = "//unpkg.com/three-globe/example/img/earth-night.jpg",
    bumpImageUrl,
    showHeatmap = false,
    heatmapData = [],
    isPaused = false
}, ref) => {
    const globeEl = useRef<GlobeMethods | undefined>(undefined);
    const [dimensions, setDimensions] = useState({ width: window.innerWidth, height: window.innerHeight });
    const [isAnimating, setIsAnimating] = useState(false);
    const dragStartPos = useRef<{ x: number, y: number } | null>(null);

    useImperativeHandle(ref, () => ({
        flyTo: (lat: number, lng: number) => {
            if (globeEl.current) {
                setIsAnimating(true);
                globeEl.current.pointOfView({ lat, lng, altitude: 1.5 }, 2000);
                setTimeout(() => setIsAnimating(false), 2000);
            }
        },
        animateTo: async (lat: number, lng: number) => {
            if (!globeEl.current) return;

            setIsAnimating(true); // Disable heatmap during animation

            // Get current position
            const currentPOV = globeEl.current.pointOfView();
            const startLng = currentPOV.lng || 0;
            const startLat = currentPOV.lat || 0;
            const startAltitude = currentPOV.altitude || 2.5;

            // Animation parameters
            const totalRotation = 720; // degrees (2 full spins)
            const targetAltitude = 1.5; // Final zoom level
            const duration = 2000; // Total animation time in ms

            const startTime = performance.now();

            // Use requestAnimationFrame for ultra-smooth 60fps animation
            return new Promise<void>((resolve) => {
                const animate = (currentTime: number) => {
                    if (!globeEl.current) {
                        setIsAnimating(false);
                        resolve();
                        return;
                    }

                    const elapsed = currentTime - startTime;
                    const progress = Math.min(elapsed / duration, 1);

                    // Easing function for smooth acceleration/deceleration
                    const eased = progress < 0.5
                        ? 2 * progress * progress
                        : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                    // Calculate current values based on eased progress
                    const currentRotation = totalRotation * eased;
                    const newLng = startLng + currentRotation;
                    const newLat = startLat + (lat - startLat) * eased;
                    const newAltitude = startAltitude + (targetAltitude - startAltitude) * eased;

                    // Update globe position
                    globeEl.current.pointOfView({
                        lat: newLat,
                        lng: newLng,
                        altitude: newAltitude
                    }, 0); // No transition time, we're handling it ourselves

                    // Continue animation or finish
                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        // Final position adjustment
                        globeEl.current.pointOfView({
                            lat,
                            lng,
                            altitude: targetAltitude
                        }, 200);

                        setIsAnimating(false); // Re-enable heatmap
                        setTimeout(() => resolve(), 200);
                    }
                };

                requestAnimationFrame(animate);
            });
        },
        zoomOut: () => {
            if (!globeEl.current) return;

            setIsAnimating(true);
            // Zoom out to default view
            globeEl.current.pointOfView({
                lat: 0,
                lng: 0,
                altitude: 2.5
            }, 1500);
            setTimeout(() => setIsAnimating(false), 1500);
        }
    }));

    useEffect(() => {
        const handleResize = () => {
            setDimensions({ width: window.innerWidth, height: window.innerHeight });
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const handleMouseDown = (event: React.MouseEvent) => {
        dragStartPos.current = { x: event.clientX, y: event.clientY };
    };

    const handleMouseUp = (event: React.MouseEvent) => {
        if (!globeEl.current || !dragStartPos.current) return;

        const deltaX = Math.abs(event.clientX - dragStartPos.current.x);
        const deltaY = Math.abs(event.clientY - dragStartPos.current.y);
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

        // Only treat as a click if the mouse moved less than 5 pixels
        if (distance < 5) {
            // Use toGlobeCoords to raycast to the globe surface, bypassing overlays like heatmap
            const coords = globeEl.current.toGlobeCoords(event.clientX, event.clientY);
            if (coords) {
                onLocationSelect(coords.lat, coords.lng);
            }
        }

        dragStartPos.current = null;
    };

    // Memoize the heatmapsData array to prevent unnecessary updates in the Globe component
    // Only show heatmap if showHeatmap is true AND we are NOT animating AND NOT paused
    const globeHeatmapsData = useMemo(() => (showHeatmap && !isAnimating && !isPaused) ? [heatmapData] : [], [showHeatmap, heatmapData, isAnimating, isPaused]);

    return (
        <div
            className="w-full h-full"
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
        >
            <Globe
                ref={globeEl}
                width={dimensions.width}
                height={dimensions.height}
                globeImageUrl={globeImageUrl}
                bumpImageUrl={bumpImageUrl}
                backgroundColor="rgba(0,0,0,0)"
                atmosphereColor="#7c3aed"
                atmosphereAltitude={0.2}
                heatmapsData={globeHeatmapsData}
                heatmapPointLat="lat"
                heatmapPointLng="lng"
                heatmapPointWeight="weight"
                heatmapTopAltitude={0}
                heatmapBandwidth={1.5} // Increased for continuous "weather map" look
                heatmapColorSaturation={2.0} // Adjusted for vibrancy
            />
        </div>
    );
});

export default GlobeView;
