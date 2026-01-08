import { motion } from 'framer-motion';
import { Trophy, Lock } from 'lucide-react';
import AchievementBadge from './AchievementBadge';
import { ACHIEVEMENTS, getUnlockedAchievements, getAchievementProgress } from '../../utils/achievements';
import { useWorkouts } from '../../context/WorkoutContext';

const AchievementsSection = () => {
    const { workouts } = useWorkouts();
    const unlockedAchievements = getUnlockedAchievements(workouts);
    const progress = getAchievementProgress(workouts);

    const unlockedIds = new Set(unlockedAchievements.map(a => a.id));
    const allAchievements = Object.values(ACHIEVEMENTS);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-yellow-500 to-amber-500 rounded-xl">
                    <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-white">Achievements</h2>
                    <p className="text-white/60 text-sm">
                        {unlockedAchievements.length} of {allAchievements.length} unlocked
                    </p>
                </div>
            </div>

            {/* Unlocked Achievements */}
            {unlockedAchievements.length > 0 && (
                <div>
                    <h3 className="text-lg font-semibold text-white mb-4">🎉 Unlocked</h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {unlockedAchievements.map((achievement, index) => (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                            >
                                <AchievementBadge achievement={achievement} size="md" />
                            </motion.div>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked Achievements with Progress */}
            <div>
                <h3 className="text-lg font-semibold text-white mb-4">🔒 In Progress</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(progress).map(([category, data]) => {
                        if (!data.next) return null; // All unlocked in this category

                        const achievement = data.next;
                        const progressPercent = Math.min((data.current / achievement.requirement) * 100, 100);

                        return (
                            <motion.div
                                key={achievement.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
                            >
                                <div className="flex items-start gap-4">
                                    {/* Locked Badge */}
                                    <div className="relative">
                                        <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl grayscale opacity-50">
                                            {achievement.icon}
                                        </div>
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <Lock className="w-6 h-6 text-white/40" />
                                        </div>
                                    </div>

                                    {/* Progress Info */}
                                    <div className="flex-1">
                                        <h4 className="font-bold text-white mb-1">{achievement.name}</h4>
                                        <p className="text-white/60 text-xs mb-3">{achievement.description}</p>

                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs text-white/60">
                                                <span>
                                                    {typeof data.current === 'number'
                                                        ? data.current.toFixed(category === 'volume' ? 1 : 0)
                                                        : Number(data.current || 0).toFixed(category === 'volume' ? 1 : 0)
                                                    }
                                                </span>
                                                <span>{achievement.requirement}</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${progressPercent}%` }}
                                                    transition={{ duration: 0.5, ease: 'easeOut' }}
                                                    className={`h-full bg-gradient-to-r ${achievement.color}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>

            {/* All Locked Achievements (Optional - can be hidden) */}
            {allAchievements.filter(a => !unlockedIds.has(a.id) && !Object.values(progress).some(p => p.next?.id === a.id)).length > 0 && (
                <details className="group">
                    <summary className="text-white/60 text-sm cursor-pointer hover:text-white transition-colors">
                        Show all locked achievements ({allAchievements.filter(a => !unlockedIds.has(a.id)).length - 4})
                    </summary>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mt-4">
                        {allAchievements
                            .filter(a => !unlockedIds.has(a.id) && !Object.values(progress).some(p => p.next?.id === a.id))
                            .map((achievement) => (
                                <div key={achievement.id} className="flex flex-col items-center gap-2 opacity-40">
                                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center text-3xl grayscale">
                                        {achievement.icon}
                                    </div>
                                    <p className="text-xs text-white/60 text-center">{achievement.name}</p>
                                </div>
                            ))}
                    </div>
                </details>
            )}
        </div>
    );
};

export default AchievementsSection;
