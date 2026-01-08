import { motion } from 'framer-motion';

const AchievementBadge = ({ achievement, size = 'md', showDetails = true }) => {
    const sizeClasses = {
        sm: 'w-12 h-12 text-2xl',
        md: 'w-16 h-16 text-3xl',
        lg: 'w-20 h-20 text-4xl',
        xl: 'w-24 h-24 text-5xl'
    };

    const textSizes = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg'
    };

    return (
        <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="flex flex-col items-center gap-2"
        >
            {/* Badge Icon */}
            <div
                className={`
          ${sizeClasses[size]} 
          rounded-full 
          bg-gradient-to-br ${achievement.color}
          flex items-center justify-center
          shadow-lg
          relative
          overflow-hidden
        `}
            >
                {/* Shine effect */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent" />

                {/* Icon */}
                <span className="relative z-10 filter drop-shadow-md">
                    {achievement.icon}
                </span>
            </div>

            {/* Badge Details */}
            {showDetails && (
                <div className="text-center">
                    <p className={`font-bold text-white ${textSizes[size]}`}>
                        {achievement.name}
                    </p>
                    <p className="text-white/60 text-xs max-w-[150px]">
                        {achievement.description}
                    </p>
                </div>
            )}
        </motion.div>
    );
};

export default AchievementBadge;
