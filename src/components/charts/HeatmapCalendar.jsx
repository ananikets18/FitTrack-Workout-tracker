import { useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { calculateTotalActivity } from '../../utils/calculations';

/**
 * GitHub-style Heatmap Calendar for workout activity visualization
 * Shows workout intensity with color-coded cells
 */
const HeatmapCalendar = ({ workouts }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Filter out rest days
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    // Get calendar days for current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    // Calculate activity for each day
    const getActivityForDay = (day) => {
        const dayWorkouts = regularWorkouts.filter((w) => {
            const workoutDate = new Date(w.date);
            return isSameDay(workoutDate, day);
        });

        if (dayWorkouts.length === 0) return { count: 0, activity: 0, workouts: [] };

        const totalActivity = dayWorkouts.reduce((sum, w) => sum + calculateTotalActivity(w), 0);

        return {
            count: dayWorkouts.length,
            activity: Math.round(totalActivity),
            workouts: dayWorkouts,
        };
    };

    // Get max activity for scaling
    const maxActivity = Math.max(
        ...calendarDays.map(day => getActivityForDay(day).activity),
        1
    );

    // Get color intensity based on activity
    const getColorIntensity = (activity) => {
        if (activity === 0) return 'bg-gray-100 border-gray-200';

        const intensity = activity / maxActivity;

        if (intensity >= 0.75) return 'bg-primary-600 border-primary-700 shadow-sm';
        if (intensity >= 0.5) return 'bg-primary-500 border-primary-600';
        if (intensity >= 0.25) return 'bg-primary-300 border-primary-400';
        return 'bg-primary-200 border-primary-300';
    };

    // Navigation handlers
    const goToPreviousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const goToNextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
    const goToToday = () => setCurrentMonth(new Date());

    // Week days
    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Calculate monthly stats
    const monthlyStats = calendarDays
        .filter(day => day.getMonth() === currentMonth.getMonth())
        .reduce((stats, day) => {
            const dayData = getActivityForDay(day);
            return {
                totalWorkouts: stats.totalWorkouts + dayData.count,
                totalActivity: stats.totalActivity + dayData.activity,
                activeDays: stats.activeDays + (dayData.count > 0 ? 1 : 0),
            };
        }, { totalWorkouts: 0, totalActivity: 0, activeDays: 0 });

    const daysInMonth = calendarDays.filter(day => day.getMonth() === currentMonth.getMonth()).length;
    const consistencyRate = ((monthlyStats.activeDays / daysInMonth) * 100).toFixed(0);

    return (
        <div className="space-y-6">
            {/* Header with Navigation */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl shadow-sm">
                        <Calendar className="w-5 h-5 md:w-6 md:h-6 text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg md:text-xl font-bold text-gray-900">
                            {format(currentMonth, 'MMMM yyyy')}
                        </h3>
                        <p className="text-xs md:text-sm text-gray-600">
                            {monthlyStats.activeDays} active days • {consistencyRate}% consistency
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={goToPreviousMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Previous month"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={goToToday}
                        className="px-3 py-1.5 text-xs font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors hidden md:block"
                    >
                        Today
                    </button>
                    <button
                        onClick={goToNextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        aria-label="Next month"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div>
                {/* Week day headers */}
                <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
                    {weekDays.map((day) => (
                        <div
                            key={day}
                            className="text-center text-xs font-semibold text-gray-500 py-1"
                        >
                            {day.slice(0, 3)}
                        </div>
                    ))}
                </div>

                {/* Calendar cells */}
                <div className="grid grid-cols-7 gap-1 md:gap-2">
                    {calendarDays.map((day, index) => {
                        const dayData = getActivityForDay(day);
                        const isCurrentMonth = day.getMonth() === currentMonth.getMonth();
                        const isToday = isSameDay(day, new Date());

                        return (
                            <div
                                key={index}
                                className={`
                  aspect-square rounded-lg border-2 transition-all duration-200
                  ${getColorIntensity(dayData.activity)}
                  ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}
                  ${isToday ? 'ring-2 ring-primary-600 ring-offset-2' : ''}
                  ${dayData.count > 0 ? 'hover:scale-110 cursor-pointer' : ''}
                  group relative
                `}
                                title={`${format(day, 'MMM d')}: ${dayData.count} workout${dayData.count !== 1 ? 's' : ''} (${dayData.activity} pts)`}
                            >
                                {/* Day number */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-xs font-medium ${dayData.activity > maxActivity * 0.5 ? 'text-white' : 'text-gray-700'
                                        }`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {/* Tooltip on hover */}
                                {dayData.count > 0 && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-10 pointer-events-none">
                                        <div className="bg-gray-900 text-white text-xs rounded-lg px-3 py-2 shadow-lifted whitespace-nowrap">
                                            <div className="font-semibold">{format(day, 'MMM d, yyyy')}</div>
                                            <div className="text-gray-300 mt-1">
                                                {dayData.count} workout{dayData.count !== 1 ? 's' : ''}
                                            </div>
                                            <div className="text-primary-300 font-bold">
                                                {dayData.activity} activity points
                                            </div>
                                            {/* Arrow */}
                                            <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                                                <div className="border-4 border-transparent border-t-gray-900" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 font-medium">Less</span>
                    <div className="flex gap-1">
                        <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                        <div className="w-4 h-4 rounded bg-primary-200 border border-primary-300" />
                        <div className="w-4 h-4 rounded bg-primary-300 border border-primary-400" />
                        <div className="w-4 h-4 rounded bg-primary-500 border border-primary-600" />
                        <div className="w-4 h-4 rounded bg-primary-600 border border-primary-700" />
                    </div>
                    <span className="text-xs text-gray-600 font-medium">More</span>
                </div>

                {/* Monthly summary */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="text-gray-600">
                        <span className="font-bold text-gray-900">{monthlyStats.totalWorkouts}</span> workouts
                    </div>
                    <div className="text-gray-600">
                        <span className="font-bold text-primary-600">{monthlyStats.totalActivity.toLocaleString()}</span> points
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeatmapCalendar;
