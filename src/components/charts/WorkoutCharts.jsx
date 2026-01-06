import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { calculateTotalVolume } from '../../utils/calculations';

// Custom tooltip styling
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white p-3 rounded-lg shadow-lifted border border-gray-200 ">
        <p className="text-sm font-semibold text-gray-900 ">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} className="text-sm text-gray-600 ">
            {entry.name}: <span className="font-bold">{entry.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// Volume Over Time Chart (Last 30 Days)
export const VolumeChart = ({ workouts }) => {
  // Filter out rest days
  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');
  
  const last30Days = eachDayOfInterval({
    start: subDays(new Date(), 29),
    end: new Date(),
  });

  const data = last30Days.map((day) => {
    const dayWorkouts = regularWorkouts.filter((w) => {
      const workoutDate = new Date(w.date);
      return format(workoutDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    });

    const totalVolume = dayWorkouts.reduce((sum, w) => sum + calculateTotalVolume(w), 0);

    return {
      date: format(day, 'MMM d'),
      volume: Math.round(totalVolume),
    };
  });

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          interval="preserveStartEnd"
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          label={{ value: 'Volume (kg)', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Line 
          type="monotone" 
          dataKey="volume" 
          stroke="#0284c7" 
          strokeWidth={2}
          dot={{ fill: '#0284c7', r: 4 }}
          activeDot={{ r: 6 }}
          name="Volume (kg)"
        />
      </LineChart>
    </ResponsiveContainer>
  );
};

// Workout Frequency Chart (Last 7 Days)
export const FrequencyChart = ({ workouts }) => {
  // Filter out rest days
  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');
  
  const last7Days = eachDayOfInterval({
    start: subDays(new Date(), 6),
    end: new Date(),
  });

  const data = last7Days.map((day) => {
    const count = regularWorkouts.filter((w) => {
      const workoutDate = new Date(w.date);
      return format(workoutDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
    }).length;

    return {
      day: format(day, 'EEE'),
      workouts: count,
    };
  });

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="day" tick={{ fontSize: 12 }} />
        <YAxis 
          tick={{ fontSize: 12 }}
          allowDecimals={false}
          label={{ value: 'Workouts', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar 
          dataKey="workouts" 
          fill="#0284c7" 
          radius={[8, 8, 0, 0]}
          name="Workouts"
        />
      </BarChart>
    </ResponsiveContainer>
  );
};

// PR Progression Chart (Top 5 Exercises)
export const PRProgressionChart = ({ workouts }) => {
  // Filter out rest days
  const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');
  
  // Get all exercises with their max weights over time
  const exercisePRs = {};

  regularWorkouts.forEach((workout) => {
    const date = format(new Date(workout.date), 'MMM d');
    workout.exercises?.forEach((exercise) => {
      const maxWeight = Math.max(...exercise.sets.map((set) => set.weight), 0);
      if (maxWeight > 0) {
        if (!exercisePRs[exercise.name]) {
          exercisePRs[exercise.name] = [];
        }
        exercisePRs[exercise.name].push({
          date,
          weight: maxWeight,
          timestamp: new Date(workout.date).getTime(),
        });
      }
    });
  });

  // Get top 5 exercises by max weight
  const topExercises = Object.entries(exercisePRs)
    .map(([name, records]) => ({
      name,
      maxWeight: Math.max(...records.map((r) => r.weight)),
    }))
    .sort((a, b) => b.maxWeight - a.maxWeight)
    .slice(0, 5)
    .map((ex) => ex.name);

  if (topExercises.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-500 ">
        <p>No PR data available yet</p>
      </div>
    );
  }

  // Prepare data for chart (last 10 entries per exercise)
  const chartData = topExercises.map((exerciseName) => {
    const records = exercisePRs[exerciseName]
      .sort((a, b) => a.timestamp - b.timestamp)
      .slice(-10);

    return {
      name: exerciseName,
      data: records.map((r) => ({
        date: r.date,
        weight: r.weight,
      })),
    };
  });

  const colors = ['#0284c7', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis 
          dataKey="date" 
          tick={{ fontSize: 12 }}
          type="category"
          allowDuplicatedCategory={false}
        />
        <YAxis 
          tick={{ fontSize: 12 }}
          label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft', fontSize: 12 }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend wrapperStyle={{ fontSize: '12px' }} />
        {chartData.map((exercise, index) => (
          <Line
            key={exercise.name}
            data={exercise.data}
            dataKey="weight"
            name={exercise.name}
            stroke={colors[index]}
            strokeWidth={2}
            dot={{ r: 3 }}
            type="monotone"
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
};

