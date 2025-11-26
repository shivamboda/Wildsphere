import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import GlobeView, { type GlobeViewHandle } from './components/GlobeView';
import FactCard from './components/FactCard';
import Starfield from './components/Starfield';
import HUD from './components/HUD';
import WelcomeOverlay from './components/WelcomeOverlay';
import { buildIndex, findNearest, type Point } from './lib/spatial';
import animalsDataRaw from './data/animals.json';
import whichCountry from 'which-country';
import iso3166 from 'iso-3166-1';
import { detectOcean } from './lib/oceanDetector';

import GlobeControls, { type GlobeStyle } from './components/GlobeControls';

function App() {
  const [selectedAnimals, setSelectedAnimals] = useState<Point[]>([]);
  const [lastShownAnimal, setLastShownAnimal] = useState<Point | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const [globeStyle, setGlobeStyle] = useState<GlobeStyle>('day'); // Default to Day view
  const globeRef = useRef<GlobeViewHandle>(null);

  // Cast the raw JSON to Point[] to satisfy TypeScript
  const animalsData = animalsDataRaw as unknown as Point[];

  useEffect(() => {
    buildIndex(animalsData);
  }, []);

  // Memoize heatmap data to prevent recalculation on every render
  const heatmapData = useMemo(() => {
    // Aggregate points to reduce rendering load (grid size: 1 degree)
    const aggregated = new Map<string, { lat: number; lng: number; weight: number }>();

    animalsData.forEach(animal => {
      const lat = Math.round(animal.lat);
      const lng = Math.round(animal.lng);
      const key = `${lat},${lng}`;

      if (aggregated.has(key)) {
        aggregated.get(key)!.weight += 1;
      } else {
        aggregated.set(key, { lat, lng, weight: 1 });
      }
    });

    return Array.from(aggregated.values());
  }, [animalsData]);

  // Determine globe texture based on style
  const getGlobeTexture = () => {
    switch (globeStyle) {
      case 'day': return '//unpkg.com/three-globe/example/img/earth-blue-marble.jpg';
      case 'heatmap': return '//unpkg.com/three-globe/example/img/earth-night.jpg'; // Heatmap uses night base
      case 'night':
      default: return '//unpkg.com/three-globe/example/img/earth-night.jpg';
    }
  };

  const getBumpTexture = () => {
    switch (globeStyle) {
      case 'day': return '//unpkg.com/three-globe/example/img/earth-topology.png';
      case 'night': return '//unpkg.com/three-globe/example/img/earth-topology.png';
      default: return undefined;
    }
  };

  const handleLocationSelect = async (lat: number, lng: number) => {
    // 1. Identify Country or Ocean
    const iso3 = whichCountry([lng, lat]);

    let locationName: string;

    if (!iso3) {
      // Clicked on ocean - detect which one
      const ocean = detectOcean(lat, lng);
      locationName = ocean || 'International Waters';
    } else {
      const countryData = iso3166.whereAlpha3(iso3);
      if (!countryData) {
        const ocean = detectOcean(lat, lng);
        locationName = ocean || 'International Waters';
      } else {
        locationName = countryData.country;
      }
    }

    // 2. Filter Animals by Location (Country or Ocean)
    let animalsAtLocation = animalsData.filter(
      (animal) => animal.country === locationName
    );

    // 3. Exclude the last shown animal if there are multiple options
    if (animalsAtLocation.length > 1 && lastShownAnimal) {
      animalsAtLocation = animalsAtLocation.filter(
        (animal) => animal.name !== lastShownAnimal.name
      );
    }

    // 4. Select a random animal from that location, or fall back to nearest
    let selectedAnimal: Point[];
    if (animalsAtLocation.length > 0) {
      const randomIndex = Math.floor(Math.random() * animalsAtLocation.length);
      selectedAnimal = [animalsAtLocation[randomIndex]];
    } else {
      // Fallback: show nearest animal if region has none
      // Get 5 nearest animals and pick one randomly to ensure variety
      const nearest = findNearest(lat, lng, 5);
      const randomNearestIndex = Math.floor(Math.random() * nearest.length);
      selectedAnimal = [nearest[randomNearestIndex]];
    }

    // 5. Trigger globe animation and show fact card
    if (globeRef.current) {
      await globeRef.current.animateTo(lat, lng);
    }

    // 6. Show fact card after animation completes and track this animal
    setLastShownAnimal(selectedAnimal[0]);
    setSelectedAnimals(selectedAnimal);
  };

  const handleRandomDiscovery = () => {
    if (animalsData.length === 0) return;

    // Pick a random animal
    const randomAnimal = animalsData[Math.floor(Math.random() * animalsData.length)];

    // Simulate a click at its location
    handleLocationSelect(randomAnimal.lat, randomAnimal.lng);
  };

  const handleClose = () => {
    // Zoom out globe
    if (globeRef.current) {
      globeRef.current.zoomOut();
    }
    // Clear selected animals
    setSelectedAnimals([]);
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      <Starfield />

      <GlobeView
        ref={globeRef}
        onLocationSelect={handleLocationSelect}
        globeImageUrl={getGlobeTexture()}
        bumpImageUrl={getBumpTexture()}
        showHeatmap={globeStyle === 'heatmap'}
        heatmapData={heatmapData}
        isPaused={selectedAnimals.length > 0}
      />

      {/* Branding Overlay */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute top-8 left-8 z-10 pointer-events-none select-none"
      >
        <div className="glass-panel px-6 py-3 rounded-full flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-gradient-to-r from-cyan-400 to-purple-500 animate-pulse" />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent tracking-tight">
            Wild Sphere
          </h1>
        </div>
      </motion.div>

      <AnimatePresence>
        {showWelcome && (
          <WelcomeOverlay onStart={() => setShowWelcome(false)} />
        )}
      </AnimatePresence>

      {!showWelcome && (
        <>
          <HUD
            totalCount={animalsData.length}
            onRandom={handleRandomDiscovery}
          />
          <GlobeControls
            currentStyle={globeStyle}
            onStyleChange={setGlobeStyle}
          />
        </>
      )}

      {selectedAnimals.length > 0 && (
        <FactCard
          animals={selectedAnimals}
          onClose={handleClose}
        />
      )}
    </div>
  );
}

export default App;
