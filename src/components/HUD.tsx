import React from 'react';
import { motion } from 'framer-motion';

interface HUDProps {
    totalCount: number;
    onRandom: () => void;
}

const HUD: React.FC<HUDProps> = ({ totalCount, onRandom }) => {
    return (
        <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 1, duration: 0.8 }}
            className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-4 w-full justify-center px-4"
        >
            <div className="glass-panel px-4 py-2 md:px-6 md:py-3 rounded-full flex flex-row items-center gap-3 md:gap-6 w-auto max-w-[95vw] md:max-w-none mx-auto">
                <div className="flex flex-col items-start">
                    <span className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold hidden md:block">Status</span>
                    <span className="text-xs md:text-sm font-medium text-white flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        {totalCount} <span className="hidden sm:inline">Species Mapped</span>
                    </span>
                </div>

                <div className="h-6 w-px bg-white/10" />

                <button
                    onClick={onRandom}
                    className="glass-button px-3 py-1.5 md:px-5 md:py-2 rounded-full text-xs md:text-sm font-medium text-white hover:text-cyan-300 flex items-center gap-2 group whitespace-nowrap"
                >
                    <span>🎲</span>
                    <span className="hidden xs:inline">Discover</span> Random
                    <span className="group-hover:translate-x-1 transition-transform hidden sm:inline">→</span>
                </button>
            </div>
        </motion.div>
    );
};

export default HUD;
