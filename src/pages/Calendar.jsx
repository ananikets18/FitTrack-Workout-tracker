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
      className += 'text-gray-300 dark:text-gray-700 ';
    } else {
      className += 'text-gray-900 dark:text-white ';
    }

    // Today highlight
    if (isTodayDate) {
      className += 'ring-2 ring-primary-500 ';
    }

    // Workout density colors
    if (density.hasRestDay && density.count === 0) {
      className += 'bg-purple-100 dark:bg-purple-900/30 hover:bg-purple-200 dark:hover:bg-purple-900/40 ';
    } else if (density.count === 0) {
      className += 'hover:bg-gray-100 dark:hover:bg-gray-800 ';
    } else if (density.count === 1) {
      className += 'bg-green-100 dark:bg-green-900/30 hover:bg-green-200 dark:hover:bg-green-900/40 ';
    } else if (density.count === 2) {
      className += 'bg-green-300 dark:bg-green-800/40 hover:bg-green-400 dark:hover:bg-green-800/50 ';
    } else {
      className += 'bg-green-500 dark:bg-green-700 text-white hover:bg-green-600 dark:hover:bg-green-600 ';
    }

    // Future dates
    if (isFutureDate) {
      className += 'opacity-50 ';
    }

    return className;
  };

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="space-y-6 pb-safe">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Calendar</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">View your workout schedule</p>
        </div>
      </div>

      {/* Legend */}
      <Card>
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800"></div>
            <span className="text-gray-600 dark:text-gray-400">1 Workout</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-green-300 dark:bg-green-800/40 border border-green-400 dark:border-green-700"></div>
            <span className="text-gray-600 dark:text-gray-400">2 Workouts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-green-500 dark:bg-green-700 border border-green-600"></div>
            <span className="text-gray-600 dark:text-gray-400">3+ Workouts</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-6 h-6 rounded bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800"></div>
            <span className="text-gray-600 dark:text-gray-400">Rest Day</span>
          </div>
        </div>
      </Card>

      {/* Calendar */}
      <Card>
        {/* Month Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={handlePrevMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronLeft className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
          
          <div className="flex items-center space-x-3">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <Button variant="outline" size="sm" onClick={handleToday}>
              Today
            </Button>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <ChevronRight className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>
        </div>

        {/* Week Days */}
        <div className="grid grid-cols-7 gap-2 mb-2">
          {weekDays.map((day) => (
            <div key={day} className="text-center text-sm font-semibold text-gray-600 dark:text-gray-400 py-2">
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
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {workouts.filter(w => {
              const workoutDate = new Date(w.date);
              return isSameMonth(workoutDate, currentMonth) && w.type !== 'rest_day';
            }).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Workouts This Month</div>
        </Card>

        <Card elevated className="text-center">
          <Hotel className="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {workouts.filter(w => {
              const workoutDate = new Date(w.date);
              return isSameMonth(workoutDate, currentMonth) && w.type === 'rest_day';
            }).length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Rest Days</div>
        </Card>

        <Card elevated className="text-center">
          <Weight className="w-8 h-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {kgToTons(
              workouts
                .filter(w => {
                  const workoutDate = new Date(w.date);
                  return isSameMonth(workoutDate, currentMonth) && w.type !== 'rest_day';
                })
                .reduce((sum, w) => sum + calculateTotalVolume(w), 0)
            )}T
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Volume Lifted</div>
        </Card>

        <Card elevated className="text-center">
          <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-gray-900 dark:text-white">
            {workouts
              .filter(w => {
                const workoutDate = new Date(w.date);
                return isSameMonth(workoutDate, currentMonth) && w.type !== 'rest_day';
              })
              .reduce((sum, w) => sum + (w.duration || 0), 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Minutes Trained</div>
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
              <div key={idx} className={`rounded-xl p-4 space-y-3 ${
                workout.type === 'rest_day' 
                  ? 'bg-purple-50 dark:bg-purple-900/20 border-2 border-purple-200 dark:border-purple-800' 
                  : 'bg-gray-50 dark:bg-gray-800'
              }`}>
                {workout.type === 'rest_day' ? (
                  <>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="bg-purple-200 dark:bg-purple-900/50 rounded-xl p-2">
                          <Hotel className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div>
                          <h4 className="font-bold text-lg text-gray-900 dark:text-white">Rest Day</h4>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {new Date(workout.date).toLocaleTimeString('en-US', {
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-purple-200 dark:border-purple-800">
                      <div className="flex items-center space-x-2 mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Recovery:</span>
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < workout.recoveryQuality ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
                            />
                          ))}
                        </div>
                      </div>

                      {workout.activities && workout.activities.length > 0 && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400 block mb-2">Activities:</span>
                          <div className="flex flex-wrap gap-2">
                            {workout.activities.map((activity, actIdx) => (
                              <span
                                key={actIdx}
                                className="px-2 py-1 text-xs font-semibold bg-purple-200 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 rounded-lg"
                              >
                                {activity.replace('_', ' ')}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {workout.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic pt-2 border-t border-purple-200 dark:border-purple-800">
                        {workout.notes}
                      </p>
                    )}
                  </>
                ) : (
                  <>
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-lg text-gray-900 dark:text-white">{workout.name}</h4>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                          {new Date(workout.date).toLocaleTimeString('en-US', {
                            hour: 'numeric',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </p>
                      </div>
                      <div className="bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 px-3 py-1 rounded-lg text-sm font-semibold">
                        {workout.exercises?.length || 0} exercises
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                      {workout.duration > 0 && (
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{workout.duration} min</span>
                        </div>
                      )}
                      <div className="flex items-center space-x-2">
                        <Weight className="w-4 h-4 text-gray-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {kgToTons(calculateTotalVolume(workout))}T moved
                        </span>
                      </div>
                    </div>

                    {workout.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 italic pt-2 border-t border-gray-200 dark:border-gray-700">
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
