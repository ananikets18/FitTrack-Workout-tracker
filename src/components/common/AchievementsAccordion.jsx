import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, ChevronDown } from 'lucide-react';
import { useState } from 'react';
import AchievementBadge from './AchievementBadge';
import { getUnlockedAchievements, getAchievementProgress } from '../../utils/achievements';
import { useWorkouts } from '../../context/WorkoutContext';

const AchievementsAccordion = () => {
    const { workouts } = useWorkouts();
    const [isOpen, setIsOpen] = useState(false);
    const unlockedAchievements = getUnlockedAchievements(workouts);
    const progress = getAchievementProgress(workouts);

    // Get the most recent unlocked achievements (last 3)
    const recentUnlocked = unlockedAchievements.slice(0, 3);

    // Get next achievements to unlock
    const nextAchievements = Object.values(progress)
        .filter(p => p.next)
        .map(p => ({
            ...p.next,
            current: p.current,
            progressPercent: Math.min((p.current / p.next.requirement) * 100, 100)
        }))
        .sort((a, b) => b.progressPercent - a.progressPercent)
        .slice(0, 2);

    if (workouts.length === 0) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 rounded-2xl overflow-hidden shadow-card"
        >
            {/* Accordion Header - Always Visible */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-4 md:p-6 flex items-center justify-between hover:bg-white/5 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl shadow-card">
                        <Trophy className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div className="text-left">
                        <h3 className="text-lg md:text-xl font-bold text-white">Achievements</h3>
                        <p className="text-xs md:text-sm text-white/60">
                            {unlockedAchievements.length} unlocked • {nextAchievements.length} in progress
                        </p>
                        {!isOpen && (
                            <p className="text-xs text-white/40 mt-0.5">Tap to expand</p>
                        )}
                    </div>
                </div>

                {/* Recent Badges Preview (when closed) */}
                {!isOpen && recentUnlocked.length > 0 && (
                    <div className="hidden sm:flex items-center gap-2 mr-4">
                        {recentUnlocked.map((achievement) => (
                            <div
                                key={achievement.id}
                                className={`w-10 h-10 rounded-full bg-gradient-to-br ${achievement.color} flex items-center justify-center text-xl shadow-card`}
                            >
                                {achievement.icon}
                            </div>
                        ))}
                    </div>
                )}

                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <ChevronDown className="w-5 h-5 text-white/60" />
                </motion.div>
            </button>

            {/* Accordion Content - Expandable */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="px-4 md:px-6 pb-6 space-y-6 border-t border-white/10">
                            {/* Unlocked Achievements */}
                            {unlockedAchievements.length > 0 && (
                                <div className="pt-6">
                                    <h4 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wide">
                                        🎉 Unlocked ({unlockedAchievements.length})
                                    </h4>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4">
                                        {unlockedAchievements.map((achievement, index) => (
                                            <motion.div
                                                key={achievement.id}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: index * 0.05 }}
                                            >
                                                <AchievementBadge achievement={achievement} size="sm" showDetails={false} />
                                                <p className="text-xs text-white/80 text-center mt-2 font-medium truncate">
                                                    {achievement.name}
                                                </p>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Next to Unlock */}
                            {nextAchievements.length > 0 && (
                                <div>
                                    <h4 className="text-sm font-semibold text-white/80 mb-4 uppercase tracking-wide">
                                        🎯 Almost There
                                    </h4>
                                    <div className="space-y-3">
                                        {nextAchievements.map((achievement) => (
                                            <motion.div
                                                key={achievement.id}
                                                initial={{ opacity: 0, x: -20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                className="bg-white/5 backdrop-blur-sm rounded-xl p-3 border border-white/10"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {/* Icon */}
                                                    <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center text-2xl grayscale opacity-60">
                                                        {achievement.icon}
                                                    </div>

                                                    {/* Info */}
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-bold text-white text-sm mb-1 truncate">
                                                            {achievement.name}
                                                        </h5>
                                                        <div className="flex items-center gap-2 text-xs text-white/60 mb-2">
                                                            <span>
                                                                {typeof achievement.current === 'number'
                                                                    ? achievement.current.toFixed(achievement.category === 'volume' ? 1 : 0)
                                                                    : achievement.current}
                                                            </span>
                                                            <span>/</span>
                                                            <span>{achievement.requirement}</span>
                                                        </div>
                                                        {/* Progress Bar */}
                                                        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                            <motion.div
                                                                initial={{ width: 0 }}
                                                                animate={{ width: `${achievement.progressPercent}%` }}
                                                                transition={{ duration: 0.5, ease: 'easeOut' }}
                                                                className={`h-full bg-gradient-to-r ${achievement.color}`}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* Percentage */}
                                                    <div className="text-right">
                                                        <span className="text-lg font-bold text-white">
                                                            {Math.round(achievement.progressPercent)}%
                                                        </span>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Empty State */}
                            {unlockedAchievements.length === 0 && nextAchievements.length === 0 && (
                                <div className="text-center py-8">
                                    <p className="text-white/60 text-sm">Complete workouts to unlock achievements!</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
};

export default AchievementsAccordion;
