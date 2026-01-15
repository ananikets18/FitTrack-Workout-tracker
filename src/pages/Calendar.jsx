import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '../context/WorkoutContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import BottomSheet from '../components/common/BottomSheet';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isToday,
  isFuture,
  addMonths,
  subMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight, Hotel, Star, Weight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { calculateTotalVolume, kgToTons, groupWorkoutsByDate } from '../utils/calculations';

const Calendar = () => {
  const { workouts } = useWorkouts();
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  // Get calendar dates
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 }); // Start on Sunday
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const workoutsByDate = groupWorkoutsByDate(workouts);

  // Get workout density for color intensity
  const getWorkoutDensity = (date) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    const dayWorkouts = workoutsByDate[dateKey] || [];
    const regularWorkouts = dayWorkouts.filter(w => w.type !== 'rest_day');
    const restDays = dayWorkouts.filter(w => w.type === 'rest_day');

    return {
      count: regularWorkouts.length,
      hasRestDay: restDays.length > 0,
      workouts: dayWorkouts,
      regularWorkouts,
      restDays
    };
  };

  const handleDateClick = (date) => {
    const density = getWorkoutDensity(date);
    if (density.count > 0 || density.hasRestDay) {
      setSelectedDate({ date, ...density });
      setIsSheetOpen(true);
    } else if (isFuture(date)) {
      // Future date - prompt to schedule workout
      if (window.confirm('Would you like to schedule a workout for this date?')) {
        navigate('/log');
      }
    }
  };

  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const handleToday = () => {
    setCurrentMonth(new Date());
  };

  const getDayClassName = (date) => {
    const density = getWorkoutDensity(date);
    const isCurrentMonth = isSameMonth(date, currentMonth);
    const isTodayDate = isToday(date);
    const isFutureDate = isFuture(date) && !isTodayDate;

    let className = 'aspect-square rounded-xl flex flex-col items-center justify-center text-sm font-medium transition-all cursor-pointer ';

    // Base styling
    if (!isCurrentMonth) {
      className += 'text-gray-300 ';
    } else {
      className += 'text-gray-900 ';
    }

    // Today highlight
    if (isTodayDate) {
      className += 'ring-2 ring-primary-500 ';
    }

    // Dynamic workout density colors based on actual data
    if (density.hasRestDay && density.count === 0) {
      className += 'bg-purple-100 hover:bg-purple-200 ';
    } else if (density.count === 0) {
      className += 'hover:bg-gray-100 ';
    } else if (intensityStats.hasData) {
      // Use dynamic scaling based on user's actual range
      const { min, max } = intensityStats;
      const range = max - min;

      // Calculate intensity level (0-8) based on position in user's range
      let intensityLevel;
      if (range === 0) {
        intensityLevel = 4; // Middle intensity if all workouts are the same
      } else {
        const normalizedPosition = (density.count - min) / range;
        intensityLevel = Math.round(normalizedPosition * 8);
      }

      // Apply color based on intensity level
      const colorClasses = [
        'bg-green-50 hover:bg-green-100',           // 0 - Lightest
        'bg-green-100 hover:bg-green-200',          // 1
        'bg-green-200 hover:bg-green-300',          // 2
        'bg-green-300 hover:bg-green-400',          // 3
        'bg-green-400 hover:bg-green-500 text-white', // 4 - Start white text
        'bg-green-500 hover:bg-green-600 text-white', // 5
        'bg-green-600 hover:bg-green-700 text-white', // 6
        'bg-green-700 hover:bg-green-800 text-white', // 7
        'bg-green-800 hover:bg-green-900 text-white'  // 8 - Darkest
      ];

      className += colorClasses[intensityLevel] + ' ';

      // Special highlight for peak days (9+ exercises or max in range)
      if (density.count >= 9 || (density.count === max && max >= 7)) {
        className += 'ring-2 ring-yellow-400 ring-offset-1 ';
      }
    } else {
      // Fallback to static scale if no data
      if (density.count === 1) {
        className += 'bg-green-50 hover:bg-green-100 ';
      } else if (density.count === 2) {
        className += 'bg-green-100 hover:bg-green-200 ';
      } else if (density.count === 3) {
        className += 'bg-green-200 hover:bg-green-300 ';
      } else if (density.count === 4) {
        className += 'bg-green-300 hover:bg-green-400 ';
      } else if (density.count === 5) {
        className += 'bg-green-400 hover:bg-green-500 text-white ';
      } else if (density.count === 6) {
        className += 'bg-green-500 hover:bg-green-600 text-white ';
      } else if (density.count === 7) {
        className += 'bg-green-600 hover:bg-green-700 text-white ';
      } else if (density.count === 8) {
        className += 'bg-green-700 hover:bg-green-800 text-white ';
      } else {
        className += 'bg-green-800 hover:bg-green-900 text-white ring-2 ring-yellow-400 ';
      }
    }

    // Future dates
    if (isFutureDate) {
      className += 'opacity-50 ';
    }

    return className;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  // Smart legend calculation - analyze actual workout data
  const getIntensityStats = () => {
    const counts = workouts
      .filter(w => w.type !== 'rest_day')
      .map(w => {
        const dateKey = format(new Date(w.date), 'yyyy-MM-dd');
        const dayWorkouts = workoutsByDate[dateKey] || [];
        return dayWorkouts.filter(dw => dw.type !== 'rest_day').length;
      });

    if (counts.length === 0) {
      return { min: 0, max: 9, avg: 0, hasData: false };
    }

    const min = Math.min(...counts);
    const max = Math.max(...counts);
    const avg = Math.round(counts.reduce((a, b) => a + b, 0) / counts.length);

    return { min, max, avg, hasData: true };
  };

  const intensityStats = getIntensityStats();

  // Generate dynamic gradient stops based on actual data
  const getGradientStops = () => {
    if (!intensityStats.hasData) {
      return [1, 2, 3, 4, 5, 6, 7, 8, 9];
    }

    const { min, max } = intensityStats;
    const range = max - min;

    if (range <= 3) {
      // Small range - show fine-grained scale
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    } else if (range <= 6) {
      // Medium range - show every level
      return Array.from({ length: max - min + 1 }, (_, i) => min + i);
    } else {
      // Large range - show key points
      const step = Math.ceil(range / 5);
      return [min, min + step, min + step * 2, min + step * 3, min + step * 4, max];
    }
  };

  const gradientStops = getGradientStops();

  return (
    <div className="space-y-6 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 ">Calendar</h1>
          <p className="text-gray-600 mt-1">View your workout schedule</p>
        </div>
      </div>

      {/* Smart Dynamic Legend */}
      <Card>
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-700">Workout Intensity</h3>
          {intensityStats.hasData && (
            <div className="text-xs text-gray-500">
              <span className="font-medium">Avg: {intensityStats.avg}</span>
              <span className="mx-1">•</span>
              <span>Peak: {intensityStats.max}</span>
            </div>
          )}
        </div>

        {intensityStats.hasData ? (
          <div className="space-y-3">
            {/* Dynamic Gradient Bar */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium w-12">{intensityStats.min}</span>
              <div className="flex-1 h-8 rounded-lg overflow-hidden flex shadow-inner">
                {gradientStops.map((stop, idx) => {
                  const intensity = Math.min(Math.round((stop / 9) * 8), 8);
                  const colors = [
                    'bg-green-50',
                    'bg-green-100',
                    'bg-green-200',
                    'bg-green-300',
                    'bg-green-400',
                    'bg-green-500',
                    'bg-green-600',
                    'bg-green-700',
                    'bg-green-800'
                  ];
                  return (
                    <div
                      key={idx}
                      className={`flex-1 ${colors[intensity]} transition-all`}
                      title={`${stop} exercise${stop !== 1 ? 's' : ''}`}
                    ></div>
                  );
                })}
              </div>
              <span className="text-xs text-gray-500 font-medium w-12 text-right">{intensityStats.max}+</span>
            </div>

            {/* Dynamic Labels */}
            <div className="flex items-center justify-between text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-100"></span>
                Light
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-400"></span>
                Moderate
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-700"></span>
                Intense
              </span>
              {intensityStats.max >= 9 && (
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-800 ring-2 ring-yellow-400"></span>
                  Beast Mode
                </span>
              )}
            </div>

            {/* Rest Day Indicator */}
            <div className="flex items-center space-x-2 pt-2 border-t">
              <div className="w-6 h-6 rounded bg-purple-100 border border-purple-200 flex items-center justify-center">
                <Hotel className="w-3 h-3 text-purple-600" />
              </div>
              <span className="text-gray-600 text-sm">Rest Day</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-6 text-gray-500">
            <p className="text-sm">Start logging workouts to see your intensity scale!</p>
          </div>
        )}
      </Card>

      {/* Calendar */}
      <Card>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 " />
          </button>

          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900 ">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 " />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((day) => {
            const density = getWorkoutDensity(day);
            return (
              <div
                key={day.toString()}
                onClick={() => handleDateClick(day)}
                className={getDayClassName(day)}
              >
                <span className="mb-1">{format(day, 'd')}</span>
                {density.count > 0 && (
                  <div className="flex items-center space-x-0.5">
                    <div className="w-1 h-1 rounded-full bg-current"></div>
                    {density.count > 1 && <div className="w-1 h-1 rounded-full bg-current"></div>}
                    {density.count > 2 && <div className="w-1 h-1 rounded-full bg-current"></div>}
                  </div>
                )}
                {density.hasRestDay && density.count === 0 && (
                  <Hotel className="w-3 h-3" />
                )}
              </div>
            );
          })}
        </div>
      </Card>

      {/* Monthly Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card elevated className="text-center">
          <CalendarIcon className="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 ">
            {workouts.filter(w => {
              const workoutDate = new Date(w.date);
              return isSameMonth(workoutDate, currentMonth) && w.type !== 'rest_day';
            }).length}
          </div>
          <div className="text-sm text-gray-600 ">Workouts This Month</div>
        </Card>

        <Card elevated className="text-center">
          <Hotel className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 ">
            {workouts.filter(w => {
              const workoutDate = new Date(w.date);
              return isSameMonth(workoutDate, currentMonth) && w.type === 'rest_day';
            }).length}
          </div>
          <div className="text-sm text-gray-600 ">Rest Days</div>
        </Card>

        <Card elevated className="text-center">
          <Weight className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 ">
            {kgToTons(
              workouts
                .filter(w => {
                  const workoutDate = new Date(w.date);
                  return isSameMonth(workoutDate, currentMonth) && w.type !== 'rest_day';
                })
                .reduce((sum, w) => sum + calculateTotalVolume(w), 0)
            )}T
          </div>
          <div className="text-sm text-gray-600 ">Volume Lifted</div>
        </Card>

        <Card elevated className="text-center">
          <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 ">
            {workouts
              .filter(w => {
                const workoutDate = new Date(w.date);
                return isSameMonth(workoutDate, currentMonth) && w.type !== 'rest_day';
              })
              .reduce((sum, w) => sum + (w.duration || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 ">Minutes Trained</div>
        </Card>
      </div>

      {/* Day Details Bottom Sheet */}
      <BottomSheet
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        title={selectedDate ? format(selectedDate.date, 'EEEE, MMMM d, yyyy') : ''}
      >
        {selectedDate && (
          <div className="space-y-4">
            {selectedDate.workouts.map((workout, idx) => (
              <div key={idx} className={`rounded-xl p-4 space-y-3 ${workout.type === 'rest_day'
                ? 'bg-purple-50 border-2 border-purple-200 '
                : 'bg-gray-50 '
                }`}>
                {workout.type === 'rest_day' ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-200 rounded-xl p-2">
                          <Hotel className="w-5 h-5 text-purple-600 " />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 ">Rest Day</h4>
                          <p className="text-sm text-gray-500 mt-1">
                            {new Date(workout.date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-200 ">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-600 ">Recovery:</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < workout.recoveryQuality ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 '}`}
                            />
                          ))}
                        </div>
                      </div>

                      {workout.activities && workout.activities.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600 block mb-2">Activities:</span>
                          <div className="flex flex-wrap gap-2">
                            {workout.activities.map((activity, actIdx) => (
                              <span
                                key={actIdx}
                                className="px-2 py-1 text-xs font-semibold bg-purple-200 text-purple-700 rounded-lg"
                              >
                                {activity.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {workout.notes && (
                      <p className="text-sm text-gray-600 italic pt-2 border-t border-purple-200 ">
                        {workout.notes}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 ">{workout.name}</h4>
                        <p className="text-sm text-gray-500 mt-1">
                          {new Date(workout.date).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                      <div className="bg-primary-100 text-primary-700 px-3 py-1 rounded-lg text-sm font-semibold">
                        {workout.exercises?.length || 0} exercises
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 ">
                      {workout.duration > 0 && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 ">{workout.duration} min</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Weight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 ">
                          {kgToTons(calculateTotalVolume(workout))}T moved
                        </span>
                      </div>
                    </div>

                    {workout.notes && (
                      <p className="text-sm text-gray-600 italic pt-2 border-t border-gray-200 ">
                        {workout.notes}
                      </p>
                    )}
                  </>
                )}
              </div>
            ))}

            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setIsSheetOpen(false);
                navigate('/history');
              }}
              className="w-full"
            >
              View Full Details
            </Button>
          </div>
        )}
      </BottomSheet>
    </div>
  );
};

export default Calendar;

