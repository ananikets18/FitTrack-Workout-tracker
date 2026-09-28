import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import Modal from './Modal';
import Button from './Button';
import {
  format,
  addDays,
  eachDayOfInterval,
  isWeekend,
  getDay,
  addWeeks,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
} from 'date-fns';
import {
  Calendar as CalendarIcon,
  Star,
  Layers,
  Repeat,
  CalendarDays,
  AlertCircle,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useWorkouts } from '../../context/WorkoutContext';
import { getLocalDateInputValue } from '../../utils/date';

const BulkRestDayModal = ({
  isOpen,
  onClose,
  onSaveBulk,
  onSwitchToSingle = null
}) => {
  const { workouts } = useWorkouts();
  const todayStr = getLocalDateInputValue();
  const todayDate = new Date();

  // Mode: 'range' | 'recurring' | 'custom'
  const [mode, setMode] = useState('range');

  // Range Mode States
  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(getLocalDateInputValue(addDays(todayDate, 6)));
  const [rangeDayFilter, setRangeDayFilter] = useState('all'); // 'all' | 'weekdays' | 'weekends' | 'custom_days'
  const [rangeSelectedDays, setRangeSelectedDays] = useState([0, 1, 2, 3, 4, 5, 6]); // 0=Sun, 6=Sat

  // Recurring Mode States
  const [recurringDays, setRecurringDays] = useState([0, 3]); // Sun & Wed by default
  const [recurringHorizonWeeks, setRecurringHorizonWeeks] = useState(4); // 2, 4, 8, 12 weeks
  const [recurringStartDate, setRecurringStartDate] = useState(todayStr);

  // Custom Multi-Date Picker States
  const [customSelectedDates, setCustomSelectedDates] = useState(new Set());
  const [customCalendarMonth, setCustomCalendarMonth] = useState(new Date());

  // Conflict Resolution Toggles
  const [skipExistingWorkouts, setSkipExistingWorkouts] = useState(true);
  const [skipExistingRestDays, setSkipExistingRestDays] = useState(true);

  // Excluded specific dates from preview
  const [manuallyExcludedDates, setManuallyExcludedDates] = useState(new Set());

  // Shared Rest Day Metadata
  const [recoveryQuality, setRecoveryQuality] = useState(3);
  const [hoverRating, setHoverRating] = useState(0);
  const [activities, setActivities] = useState([]);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const daysOfWeek = [
    { id: 0, label: 'Sun', full: 'Sunday' },
    { id: 1, label: 'Mon', full: 'Monday' },
    { id: 2, label: 'Tue', full: 'Tuesday' },
    { id: 3, label: 'Wed', full: 'Wednesday' },
    { id: 4, label: 'Thu', full: 'Thursday' },
    { id: 5, label: 'Fri', full: 'Friday' },
    { id: 6, label: 'Sat', full: 'Saturday' },
  ];

  const activityOptions = [
    { id: 'stretching', label: 'Stretching', emoji: '🧘' },
    { id: 'walking', label: 'Walking', emoji: '🚶' },
    { id: 'yoga', label: 'Yoga', emoji: '🧘‍♀️' },
    { id: 'massage', label: 'Massage', emoji: '💆' },
    { id: 'swimming', label: 'Swimming', emoji: '🏊' },
    { id: 'cycling', label: 'Light Cycling', emoji: '🚴' },
    { id: 'meditation', label: 'Meditation', emoji: '🧘‍♂️' },
    { id: 'foam_rolling', label: 'Foam Rolling', emoji: '📍' }
  ];

  const handleActivityToggle = (activityId) => {
    setActivities(prev =>
      prev.includes(activityId)
        ? prev.filter(id => id !== activityId)
        : [...prev, activityId]
    );
  };

  // Map of existing workouts and rest days by 'yyyy-MM-dd'
  const existingScheduleMap = useMemo(() => {
    const map = new Map();
    workouts.forEach(w => {
      if (!w.date) return;
      const key = format(new Date(w.date), 'yyyy-MM-dd');
      if (!map.has(key)) {
        map.set(key, { workouts: [], restDays: [] });
      }
      const entry = map.get(key);
      if (w.type === 'rest_day') {
        entry.restDays.push(w);
      } else {
        entry.workouts.push(w);
      }
    });
    return map;
  }, [workouts]);

  // Generate candidate dates based on current mode
  const rawCandidateDates = useMemo(() => {
    const dates = [];

    if (mode === 'range') {
      if (!startDate || !endDate) return [];
      const start = new Date(startDate + 'T00:00:00');
      const end = new Date(endDate + 'T00:00:00');
      if (start > end) return [];

      try {
        const interval = eachDayOfInterval({ start, end });
        interval.forEach(day => {
          const dayOfWeek = getDay(day);
          const isWknd = isWeekend(day);

          if (rangeDayFilter === 'all') {
            dates.push(format(day, 'yyyy-MM-dd'));
          } else if (rangeDayFilter === 'weekdays' && !isWknd) {
            dates.push(format(day, 'yyyy-MM-dd'));
          } else if (rangeDayFilter === 'weekends' && isWknd) {
            dates.push(format(day, 'yyyy-MM-dd'));
          } else if (rangeDayFilter === 'custom_days' && rangeSelectedDays.includes(dayOfWeek)) {
            dates.push(format(day, 'yyyy-MM-dd'));
          }
        });
      } catch (err) {
        console.error('Error calculating date range interval:', err);
        return [];
      }
    } else if (mode === 'recurring') {
      if (!recurringStartDate || recurringDays.length === 0) return [];
      const start = new Date(recurringStartDate + 'T00:00:00');
      const end = addWeeks(start, recurringHorizonWeeks);

      try {
        const interval = eachDayOfInterval({ start, end });
        interval.forEach(day => {
          const dayOfWeek = getDay(day);
          if (recurringDays.includes(dayOfWeek)) {
            dates.push(format(day, 'yyyy-MM-dd'));
          }
        });
      } catch (err) {
        console.error('Error calculating recurring interval:', err);
        return [];
      }
    } else if (mode === 'custom') {
      return Array.from(customSelectedDates).sort();
    }

    return Array.from(new Set(dates)).sort();
  }, [
    mode,
    startDate,
    endDate,
    rangeDayFilter,
    rangeSelectedDays,
    recurringDays,
    recurringHorizonWeeks,
    recurringStartDate,
    customSelectedDates
  ]);

  // Analyze candidate dates against existing schedule
  const { validDates, workoutConflicts, restDayConflicts } = useMemo(() => {
    const valid = [];
    const workoutConf = [];
    const restConf = [];

    rawCandidateDates.forEach(dateStr => {
      // Check if user manually clicked 'x' in the preview
      if (manuallyExcludedDates.has(dateStr)) return;

      const schedule = existingScheduleMap.get(dateStr);
      const hasWorkout = schedule && schedule.workouts.length > 0;
      const hasRestDay = schedule && schedule.restDays.length > 0;

      if (hasWorkout) {
        workoutConf.push({ dateStr, count: schedule.workouts.length, names: schedule.workouts.map(w => w.name || 'Workout') });
      }

      if (hasRestDay) {
        restConf.push({ dateStr, count: schedule.restDays.length });
      }

      // Check conflict resolution flags
      if (hasWorkout && skipExistingWorkouts) return;
      if (hasRestDay && skipExistingRestDays) return;

      valid.push(dateStr);
    });

    return {
      validDates: valid,
      workoutConflicts: workoutConf,
      restDayConflicts: restConf,
    };
  }, [
    rawCandidateDates,
    manuallyExcludedDates,
    existingScheduleMap,
    skipExistingWorkouts,
    skipExistingRestDays
  ]);

  // Presets for Date Range
  const applyPreset = (presetType) => {
    const current = new Date();
    setManuallyExcludedDates(new Set());

    if (presetType === 'weekend') {
      // Find upcoming Saturday & Sunday
      const day = getDay(current);
      const daysUntilSat = (6 - day + 7) % 7;
      const nextSat = addDays(current, daysUntilSat === 0 ? 0 : daysUntilSat);
      const nextSun = addDays(nextSat, 1);
      setStartDate(format(nextSat, 'yyyy-MM-dd'));
      setEndDate(format(nextSun, 'yyyy-MM-dd'));
      setRangeDayFilter('all');
    } else if (presetType === 'deload_7') {
      setStartDate(todayStr);
      setEndDate(format(addDays(current, 6), 'yyyy-MM-dd'));
      setRangeDayFilter('all');
    } else if (presetType === 'next_14') {
      setStartDate(todayStr);
      setEndDate(format(addDays(current, 13), 'yyyy-MM-dd'));
      setRangeDayFilter('all');
    } else if (presetType === 'rest_of_month') {
      setStartDate(todayStr);
      setEndDate(format(endOfMonth(current), 'yyyy-MM-dd'));
      setRangeDayFilter('all');
    }
  };

  // Toggle custom date selection
  const handleToggleCustomDate = (dateStr) => {
    setCustomSelectedDates(prev => {
      const next = new Set(prev);
      if (next.has(dateStr)) {
        next.delete(dateStr);
      } else {
        next.add(dateStr);
      }
      return next;
    });
  };

  // Manually remove a date from preview
  const handleExcludeDate = (dateStr) => {
    setManuallyExcludedDates(prev => new Set(prev).add(dateStr));
  };

  // Submit bulk rest days
  const handleSave = async () => {
    if (validDates.length === 0) return;

    setIsSubmitting(true);
    try {
      await onSaveBulk({
        dates: validDates,
        recoveryQuality,
        activities,
        notes: notes.trim(),
      });
      // Reset state and close
      handleClose();
    } catch (err) {
      console.error('Failed to save bulk rest days:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setManuallyExcludedDates(new Set());
    setNotes('');
    setActivities([]);
    setRecoveryQuality(3);
    onClose();
  };

  // Mini Calendar for Custom Date Multi-Select
  const monthStart = startOfMonth(customCalendarMonth);
  const monthEnd = endOfMonth(customCalendarMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const miniCalendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Bulk Add Rest Days"
      size="lg"
    >
      <div className="space-y-6">
        {/* Top Header Mode / Single Switcher */}
        {onSwitchToSingle && (
          <div className="flex items-center justify-between p-1.5 bg-gray-100 dark:bg-gray-800 rounded-xl">
            <button
              type="button"
              onClick={onSwitchToSingle}
              className="flex-1 py-2 text-sm font-semibold rounded-lg text-gray-600 dark:text-gray-300 hover:text-gray-900 transition-colors"
            >
              Single Day
            </button>
            <button
              type="button"
              className="flex-1 py-2 text-sm font-semibold rounded-lg bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm"
            >
              Bulk Add
            </button>
          </div>
        )}

        {/* Strategy Selection Pills */}
        <div>
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-2">
            Selection Strategy
          </label>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => { setMode('range'); setManuallyExcludedDates(new Set()); }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                mode === 'range'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 text-gray-700 dark:text-gray-300'
              }`}
            >
              <CalendarDays className="w-5 h-5 mb-1 text-primary-500" />
              <span className="text-xs font-bold">Date Range</span>
              <span className="text-[13px] text-gray-500">Deload / Vacation</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('recurring'); setManuallyExcludedDates(new Set()); }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                mode === 'recurring'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Repeat className="w-5 h-5 mb-1 text-purple-500" />
              <span className="text-xs font-bold">Recurring</span>
              <span className="text-[13px] text-gray-500">Weekly Schedule</span>
            </button>

            <button
              type="button"
              onClick={() => { setMode('custom'); setManuallyExcludedDates(new Set()); }}
              className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${
                mode === 'custom'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-950/40 text-primary-700 dark:text-primary-300 shadow-sm'
                  : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 text-gray-700 dark:text-gray-300'
              }`}
            >
              <Layers className="w-5 h-5 mb-1 text-emerald-500" />
              <span className="text-xs font-bold">Multi-Select</span>
              <span className="text-[13px] text-gray-500">Pick on Calendar</span>
            </button>
          </div>
        </div>

        {/* Strategy Specific Controls */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700/60 space-y-4">
          {mode === 'range' && (
            <div className="space-y-4">
              {/* Quick Preset Buttons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Presets:</span>
                <button
                  type="button"
                  onClick={() => applyPreset('deload_7')}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-700 hover:bg-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xs transition-colors"
                >
                  ⚡ Deload Week (7d)
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('weekend')}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-700 hover:bg-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xs transition-colors"
                >
                  🏖️ This Weekend
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('next_14')}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-700 hover:bg-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xs transition-colors"
                >
                  📅 Next 14 Days
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('rest_of_month')}
                  className="px-2.5 py-1 text-xs font-medium bg-white dark:bg-gray-700 hover:bg-gray-100 border border-gray-200 dark:border-gray-600 rounded-lg shadow-2xs transition-colors"
                >
                  🗓️ Rest of Month
                </button>
              </div>

              {/* Start Date & End Date Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Start Date
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => { setStartDate(e.target.value); setManuallyExcludedDates(new Set()); }}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    End Date
                  </label>
                  <input
                    type="date"
                    value={endDate}
                    min={startDate}
                    onChange={(e) => { setEndDate(e.target.value); setManuallyExcludedDates(new Set()); }}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Range Day Filter */}
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Which days in this range?
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'all', label: 'All Days' },
                    { id: 'weekdays', label: 'Weekdays Only' },
                    { id: 'weekends', label: 'Weekends Only' },
                    { id: 'custom_days', label: 'Specific Days' },
                  ].map(f => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setRangeDayFilter(f.id)}
                      className={`py-1.5 px-2 text-xs font-medium rounded-lg border transition-all ${
                        rangeDayFilter === f.id
                          ? 'border-primary-500 bg-primary-100/70 text-primary-700 dark:bg-primary-900/50 dark:text-primary-300'
                          : 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>

                {rangeDayFilter === 'custom_days' && (
                  <div className="flex items-center justify-between gap-1 mt-2.5 pt-2 border-t border-gray-200 dark:border-gray-700">
                    {daysOfWeek.map(d => {
                      const isSelected = rangeSelectedDays.includes(d.id);
                      return (
                        <button
                          key={d.id}
                          type="button"
                          onClick={() => {
                            setRangeSelectedDays(prev =>
                              prev.includes(d.id)
                                ? prev.filter(x => x !== d.id)
                                : [...prev, d.id]
                            );
                          }}
                          className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            isSelected
                              ? 'bg-primary-600 text-white shadow-2xs'
                              : 'bg-white dark:bg-gray-700 text-gray-500 border border-gray-200 dark:border-gray-600'
                          }`}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {mode === 'recurring' && (
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
                  Select Days of Week
                </label>
                <div className="grid grid-cols-7 gap-1">
                  {daysOfWeek.map(d => {
                    const isSelected = recurringDays.includes(d.id);
                    return (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setRecurringDays(prev =>
                            prev.includes(d.id)
                              ? prev.filter(x => x !== d.id)
                              : [...prev, d.id]
                          );
                        }}
                        className={`py-2 rounded-xl text-xs font-bold transition-all ${
                          isSelected
                            ? 'bg-purple-600 text-white shadow-sm'
                            : 'bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600 hover:bg-gray-50'
                        }`}
                      >
                        {d.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Starting From
                  </label>
                  <input
                    type="date"
                    value={recurringStartDate}
                    onChange={(e) => setRecurringStartDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1 block">
                    Duration Horizon
                  </label>
                  <select
                    value={recurringHorizonWeeks}
                    onChange={(e) => setRecurringHorizonWeeks(parseInt(e.target.value))}
                    className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
                  >
                    <option value={2}>Next 2 Weeks</option>
                    <option value={4}>Next 4 Weeks (~1 Month)</option>
                    <option value={8}>Next 8 Weeks (~2 Months)</option>
                    <option value={12}>Next 12 Weeks (Quarter)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {mode === 'custom' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Tap dates on the calendar to mark as rest days
                </span>
                <div className="flex items-center space-x-1">
                  <button
                    type="button"
                    onClick={() => setCustomCalendarMonth(prev => subMonths(prev, 1))}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-semibold px-1">
                    {format(customCalendarMonth, 'MMMM yyyy')}
                  </span>
                  <button
                    type="button"
                    onClick={() => setCustomCalendarMonth(prev => addMonths(prev, 1))}
                    className="p-1 rounded hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mini Calendar Grid */}
              <div className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-700">
                <div className="grid grid-cols-7 gap-1 mb-1 text-center text-[13px] font-bold text-gray-400">
                  {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
                    <div key={idx}>{day}</div>
                  ))}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {miniCalendarDays.map(day => {
                    const dateStr = format(day, 'yyyy-MM-dd');
                    const isCurrent = isSameMonth(day, customCalendarMonth);
                    const isSelected = customSelectedDates.has(dateStr);
                    const schedule = existingScheduleMap.get(dateStr);
                    const hasWorkout = schedule && schedule.workouts.length > 0;
                    const hasExistingRest = schedule && schedule.restDays.length > 0;

                    let btnClass = 'aspect-square rounded-lg flex flex-col items-center justify-center text-xs font-medium transition-all relative ';

                    if (!isCurrent) {
                      btnClass += 'text-gray-300 dark:text-gray-600 ';
                    } else if (isSelected) {
                      btnClass += 'bg-purple-600 text-white font-bold shadow-xs ring-2 ring-purple-300 ';
                    } else if (hasWorkout) {
                      btnClass += 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 ';
                    } else if (hasExistingRest) {
                      btnClass += 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 hover:bg-purple-200 ';
                    } else {
                      btnClass += 'text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 ';
                    }

                    if (isSameDay(day, todayDate)) {
                      btnClass += 'border border-primary-500 ';
                    }

                    return (
                      <button
                        key={dateStr}
                        type="button"
                        onClick={() => handleToggleCustomDate(dateStr)}
                        className={btnClass}
                        title={
                          hasWorkout
                            ? `Has workout: ${schedule.workouts.map(w => w.name).join(', ')}`
                            : hasExistingRest
                            ? 'Already logged as Rest Day'
                            : format(day, 'MMM d')
                        }
                      >
                        <span>{format(day, 'd')}</span>
                        {/* Indicators */}
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {hasWorkout && !isSelected && (
                            <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                          )}
                          {hasExistingRest && !isSelected && (
                            <span className="w-1 h-1 rounded-full bg-purple-500"></span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Conflict Protection & Preferences */}
        <div className="space-y-2 pt-1 border-t border-gray-100 dark:border-gray-800">
          <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block">
            Conflict Handling
          </label>
          <div className="flex flex-col sm:flex-row gap-3">
            <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipExistingWorkouts}
                onChange={(e) => setSkipExistingWorkouts(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span>Skip dates with existing workouts</span>
              {workoutConflicts.length > 0 && (
                <span className="px-1.5 py-0.5 text-[13px] font-bold rounded-full bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300">
                  {workoutConflicts.length}
                </span>
              )}
            </label>

            <label className="flex items-center space-x-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={skipExistingRestDays}
                onChange={(e) => setSkipExistingRestDays(e.target.checked)}
                className="w-4 h-4 rounded text-primary-600 focus:ring-primary-500 border-gray-300"
              />
              <span>Skip dates already marked as rest day</span>
              {restDayConflicts.length > 0 && (
                <span className="px-1.5 py-0.5 text-[13px] font-bold rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300">
                  {restDayConflicts.length}
                </span>
              )}
            </label>
          </div>

          {/* Conflict warnings */}
          {workoutConflicts.length > 0 && skipExistingWorkouts && (
            <div className="flex items-start space-x-2 p-2.5 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-xl text-xs text-amber-800 dark:text-amber-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>
                <strong>{workoutConflicts.length} date(s)</strong> skipped to protect existing workouts.
              </span>
            </div>
          )}
        </div>

        {/* Live Date Preview */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
              Selected Rest Days ({validDates.length})
            </label>
            {validDates.length > 0 && (
              <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                {validDates.length} day{validDates.length > 1 ? 's' : ''} ready to log
              </span>
            )}
          </div>

          {validDates.length === 0 ? (
            <div className="p-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-center text-xs text-gray-400">
              No dates selected yet. Adjust the strategy or date interval above.
            </div>
          ) : (
            <div className="flex flex-wrap gap-1.5 max-h-28 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-800/40 rounded-xl border border-gray-200 dark:border-gray-700">
              {validDates.map(dateStr => (
                <span
                  key={dateStr}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/50 text-purple-800 dark:text-purple-200 rounded-lg border border-purple-200 dark:border-purple-800 animate-in fade-in duration-150"
                >
                  <CalendarIcon className="w-3 h-3 text-purple-500" />
                  {format(new Date(dateStr + 'T00:00:00'), 'EEE, MMM d')}
                  <button
                    type="button"
                    onClick={() => handleExcludeDate(dateStr)}
                    className="hover:bg-purple-200 dark:hover:bg-purple-800 rounded p-0.5 transition-colors"
                    title="Remove this day"
                  >
                    <X className="w-3 h-3 text-purple-600 dark:text-purple-300" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Shared Recovery Metadata */}
        <div className="space-y-4 pt-2 border-t border-gray-100 dark:border-gray-800">
          {/* Recovery Quality Rating */}
          <div>
            <label className="flex items-center space-x-2 text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>Shared Recovery Quality</span>
            </label>
            <div className="flex items-center justify-center space-x-2 py-1">
              {[1, 2, 3, 4, 5].map((rating) => (
                <motion.button
                  key={rating}
                  type="button"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setRecoveryQuality(rating)}
                  onMouseEnter={() => setHoverRating(rating)}
                  onMouseLeave={() => setHoverRating(0)}
                  className="focus:outline-none transition-transform"
                >
                  <Star
                    className={`w-8 h-8 md:w-9 md:h-9 transition-colors ${
                      (hoverRating || recoveryQuality) >= rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300 dark:text-gray-600'
                    }`}
                  />
                </motion.button>
              ))}
            </div>
            <p className="text-center text-xs text-gray-500 mt-1">
              {recoveryQuality === 1 && 'Poor - High fatigue'}
              {recoveryQuality === 2 && 'Fair - Moderate fatigue'}
              {recoveryQuality === 3 && 'Good - Standard recovery'}
              {recoveryQuality === 4 && 'Great - Feeling strong'}
              {recoveryQuality === 5 && 'Excellent - Fully recharged'}
            </p>
          </div>

          {/* Active Recovery Activities */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
              Active Recovery Activities (Optional)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {activityOptions.map((activity) => {
                const isSelected = activities.includes(activity.id);
                return (
                  <button
                    key={activity.id}
                    type="button"
                    onClick={() => handleActivityToggle(activity.id)}
                    className={`flex items-center space-x-1.5 px-2.5 py-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300 shadow-2xs'
                        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    <span>{activity.emoji}</span>
                    <span className="truncate">{activity.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shared Notes */}
          <div>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5 block">
              Shared Notes (Optional)
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Deload week, Vacation, Recovery block"
              className="w-full px-3 py-2 text-sm border-2 border-gray-300 dark:border-gray-700 dark:bg-gray-900 rounded-xl focus:ring-2 focus:ring-primary-500 focus:outline-none"
              maxLength={200}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleClose}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            disabled={validDates.length === 0 || isSubmitting}
            className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                Logging...
              </span>
            ) : (
              `Log ${validDates.length} Rest Day${validDates.length === 1 ? '' : 's'}`
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default BulkRestDayModal;
