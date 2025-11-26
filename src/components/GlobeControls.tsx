import { motion } from 'framer-motion';
import { Globe, Sun, Flame } from 'lucide-react';

export type GlobeStyle = 'night' | 'day' | 'heatmap';

interface GlobeControlsProps {
    currentStyle: GlobeStyle;
    onStyleChange: (style: GlobeStyle) => void;
}

export default function GlobeControls({ currentStyle, onStyleChange }: GlobeControlsProps) {
    const styles: { id: GlobeStyle; label: string; icon: React.ReactNode }[] = [
        { id: 'day', label: 'Day', icon: <Sun className="w-4 h-4" /> },
        { id: 'heatmap', label: 'Heatmap', icon: <Flame className="w-4 h-4" /> },
        { id: 'night', label: 'Night', icon: <Globe className="w-4 h-4" /> },
    ];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1, duration: 0.5 }}
            className="absolute bottom-8 right-8 z-10 flex flex-col gap-2"
        >
            <div className="glass-panel p-2 rounded-xl flex flex-col gap-1 backdrop-blur-md bg-black/30 border border-white/10">
                {styles.map((style) => (
                    <button
                        key={style.id}
                        onClick={() => onStyleChange(style.id)}
                        className={`
              flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200
              ${currentStyle === style.id
                                ? 'bg-white/20 text-white shadow-lg shadow-purple-500/20'
                                : 'text-white/60 hover:text-white hover:bg-white/10'}
            `}
                    >
                        {style.icon}
                        <span>{style.label}</span>
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
