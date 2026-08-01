import { useState } from 'react';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, startOfWeek, endOfWeek, isSameDay, subMonths, addMonths } from 'date-fns';
import { ChevronLeft, ChevronRight, Calendar, Hotel } from 'lucide-react';
import { calculateTotalActivity } from '../../utils/calculations';

/**
 * GitHub-style Heatmap Calendar for workout activity visualization
 * Shows workout intensity with color-coded cells & distinct Rest Day badges
 */
const HeatmapCalendar = ({ workouts }) => {
    const [currentMonth, setCurrentMonth] = useState(new Date());

    // Get calendar days for current month
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const calendarStart = startOfWeek(monthStart);
    const calendarEnd = endOfWeek(monthEnd);

    const calendarDays = eachDayOfInterval({
        start: calendarStart,
        end: calendarEnd,
    });

    // Calculate activity & rest day state for each day
    const getActivityForDay = (day) => {
        const dayWorkouts = workouts.filter((w) => {
            const workoutDate = new Date(w.date);
            return isSameDay(workoutDate, day);
        });

        const regularDays = dayWorkouts.filter(w => w.type !== 'rest_day');
        const restDays = dayWorkouts.filter(w => w.type === 'rest_day');

        const totalActivity = regularDays.reduce((sum, w) => sum + calculateTotalActivity(w), 0);
        const restDayLog = restDays.length > 0 ? restDays[0] : null;

        return {
            count: regularDays.length,
            activity: Math.round(totalActivity),
            workouts: regularDays,
            hasRestDay: restDays.length > 0,
            restDay: restDayLog,
        };
    };

    // Get max activity for scaling (only from days with regular workouts)
    const maxActivity = Math.max(
        ...calendarDays.map(day => getActivityForDay(day).activity),
        1
    );

    // Get color intensity based on activity & rest day status
    const getColorIntensity = (dayData) => {
        const { activity, hasRestDay, count } = dayData;

        // Pure rest day (logged rest day with no active workout)
        if (hasRestDay && count === 0) {
            return 'bg-purple-100 border-purple-300 text-purple-900 hover:bg-purple-200';
        }

        // Empty unlogged day
        if (activity === 0) return 'bg-gray-100 border-gray-200';

        // Active workout day
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
                restDays: stats.restDays + (dayData.hasRestDay && dayData.count === 0 ? 1 : 0),
            };
        }, { totalWorkouts: 0, totalActivity: 0, activeDays: 0, restDays: 0 });

    const daysInMonth = calendarDays.filter(day => day.getMonth() === currentMonth.getMonth()).length;
    const consistencyRate = (((monthlyStats.activeDays + monthlyStats.restDays) / daysInMonth) * 100).toFixed(0);

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
                            {monthlyStats.activeDays} active days • {monthlyStats.restDays} rest days • {consistencyRate}% consistency
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
                        const isRestDayOnly = dayData.hasRestDay && dayData.count === 0;
                        const hasLoggedActivity = dayData.count > 0 || dayData.hasRestDay;

                        return (
                            <div
                                key={index}
                                className={`
                  aspect-square rounded-lg border-2 transition-all duration-200
                  ${getColorIntensity(dayData)}
                  ${!isCurrentMonth ? 'opacity-30' : 'opacity-100'}
                  ${isToday ? 'ring-2 ring-primary-600 ring-offset-2' : ''}
                  ${hasLoggedActivity ? 'hover:scale-110 cursor-pointer' : ''}
                  group relative
                `}
                            >
                                {/* Day number */}
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <span className={`text-xs font-medium ${
                                        dayData.activity > maxActivity * 0.5
                                            ? 'text-white'
                                            : isRestDayOnly
                                            ? 'text-purple-900 font-semibold'
                                            : 'text-gray-700'
                                    }`}>
                                        {format(day, 'd')}
                                    </span>
                                </div>

                                {/* Rest Day visual indicator dot */}
                                {isRestDayOnly && (
                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-purple-500" />
                                )}

                                {/* Tooltip on hover */}
                                {hasLoggedActivity && (
                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-20 pointer-events-none">
                                        <div className="bg-gray-900 text-white text-xs rounded-xl px-3 py-2.5 shadow-lifted whitespace-nowrap space-y-1">
                                            <div className="font-semibold text-gray-200">{format(day, 'MMM d, yyyy')}</div>

                                            {dayData.count > 0 && (
                                                <>
                                                    <div className="text-gray-300">
                                                        {dayData.count} workout{dayData.count !== 1 ? 's' : ''}
                                                    </div>
                                                    <div className="text-primary-300 font-bold">
                                                        {dayData.activity} activity points
                                                    </div>
                                                </>
                                            )}

                                            {dayData.hasRestDay && (
                                                <div className="pt-0.5 text-purple-300 font-medium flex items-center gap-1.5">
                                                    <Hotel className="w-3.5 h-3.5 inline text-purple-400" />
                                                    <span>Rest & Recovery Day</span>
                                                    {dayData.restDay?.recoveryQuality && (
                                                        <span className="text-purple-200 text-[10px] bg-purple-900/60 px-1.5 py-0.5 rounded">
                                                            {dayData.restDay.recoveryQuality}/5 Quality
                                                        </span>
                                                    )}
                                                </div>
                                            )}

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
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <span className="text-xs text-gray-600 font-medium">Less</span>
                        <div className="flex gap-1 items-center">
                            <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" title="No activity" />
                            <div className="w-4 h-4 rounded bg-primary-200 border border-primary-300" title="Low activity" />
                            <div className="w-4 h-4 rounded bg-primary-300 border border-primary-400" title="Moderate activity" />
                            <div className="w-4 h-4 rounded bg-primary-500 border border-primary-600" title="High activity" />
                            <div className="w-4 h-4 rounded bg-primary-600 border border-primary-700" title="Peak activity" />
                        </div>
                        <span className="text-xs text-gray-600 font-medium">More</span>
                    </div>

                    <div className="flex items-center gap-1.5 pl-2 border-l border-gray-200">
                        <div className="w-4 h-4 rounded bg-purple-100 border border-purple-300 flex items-center justify-center">
                            <Hotel className="w-2.5 h-2.5 text-purple-600" />
                        </div>
                        <span className="text-xs text-purple-700 font-semibold">Rest Day</span>
                    </div>
                </div>

                {/* Monthly summary */}
                <div className="flex items-center gap-4 text-xs">
                    <div className="text-gray-600">
                        <span className="font-bold text-gray-900">{monthlyStats.totalWorkouts}</span> workouts
                    </div>
                    <div className="text-gray-600">
                        <span className="font-bold text-purple-700">{monthlyStats.restDays}</span> rest days
                    </div>
                    <div className="text-gray-600">
                        <span className="font-bold text-primary-600">{monthlyStats.totalActivity.toLocaleString()}</span> pts
                    </div>
                </div>
            </div>
        </div>
    );
};

export default HeatmapCalendar;

