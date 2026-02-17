import { useState, useMemo } from 'react';
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
    Brush,
} from 'recharts';
import { format, subDays, eachDayOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { Download, ZoomIn, ZoomOut, Filter, BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon } from 'lucide-react';
import { calculateTotalVolume, calculateTotalActivity } from '../../utils/calculations';

/**
 * Enhanced Interactive Chart with zoom, pan, filter, and export capabilities
 */
const InteractiveChart = ({ workouts, title = 'Workout Progress', metric = 'activity' }) => {
    const [chartType, setChartType] = useState('line'); // 'line', 'bar', 'area'
    const [timeRange, setTimeRange] = useState(30); // days
    const [showBrush, setShowBrush] = useState(true);
    const [dataGranularity, setDataGranularity] = useState('daily'); // 'daily', 'weekly'

    // Filter out rest days
    const regularWorkouts = workouts.filter(w => w.type !== 'rest_day');

    // Prepare chart data based on time range and granularity
    const chartData = useMemo(() => {
        const endDate = new Date();
        const startDate = subDays(endDate, timeRange - 1);

        if (dataGranularity === 'daily') {
            const days = eachDayOfInterval({ start: startDate, end: endDate });

            return days.map((day) => {
                const dayWorkouts = regularWorkouts.filter((w) => {
                    const workoutDate = new Date(w.date);
                    return format(workoutDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
                });

                const volume = dayWorkouts.reduce((sum, w) => sum + calculateTotalVolume(w), 0);
                const activity = dayWorkouts.reduce((sum, w) => sum + calculateTotalActivity(w), 0);
                const workoutCount = dayWorkouts.length;

                return {
                    date: format(day, 'MMM d'),
                    fullDate: format(day, 'yyyy-MM-dd'),
                    volume: Math.round(volume),
                    activity: Math.round(activity),
                    workouts: workoutCount,
                };
            });
        } else {
            // Weekly aggregation
            const weeks = [];
            let currentDate = startDate;

            while (currentDate <= endDate) {
                const weekStart = startOfWeek(currentDate);
                const weekEnd = endOfWeek(currentDate);

                const weekWorkouts = regularWorkouts.filter((w) => {
                    const workoutDate = new Date(w.date);
                    return workoutDate >= weekStart && workoutDate <= weekEnd;
                });

                const volume = weekWorkouts.reduce((sum, w) => sum + calculateTotalVolume(w), 0);
                const activity = weekWorkouts.reduce((sum, w) => sum + calculateTotalActivity(w), 0);

                weeks.push({
                    date: `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d')}`,
                    fullDate: format(weekStart, 'yyyy-MM-dd'),
                    volume: Math.round(volume),
                    activity: Math.round(activity),
                    workouts: weekWorkouts.length,
                });

                currentDate = new Date(weekEnd.getTime() + 86400000); // Next week
            }

            return weeks;
        }
    }, [regularWorkouts, timeRange, dataGranularity]);

    // Get metric configuration
    const getMetricConfig = () => {
        switch (metric) {
            case 'volume':
                return {
                    dataKey: 'volume',
                    label: 'Volume (kg)',
                    color: '#0284c7',
                    gradientId: 'volumeGradient',
                };
            case 'workouts':
                return {
                    dataKey: 'workouts',
                    label: 'Workouts',
                    color: '#10b981',
                    gradientId: 'workoutsGradient',
                };
            default: // activity
                return {
                    dataKey: 'activity',
                    label: 'Activity Points',
                    color: '#06b6d4',
                    gradientId: 'activityGradient',
                };
        }
    };

    const metricConfig = getMetricConfig();

    // Custom tooltip
    const CustomTooltip = ({ active, payload }) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div className="bg-white p-4 rounded-lg shadow-lifted border-2 border-gray-200">
                    <p className="text-sm font-bold text-gray-900 mb-2">{data.date}</p>
                    <div className="space-y-1">
                        <p className="text-sm text-gray-600">
                            <span className="font-semibold" style={{ color: metricConfig.color }}>
                                {metricConfig.label}:
                            </span>{' '}
                            {data[metricConfig.dataKey].toLocaleString()}
                        </p>
                        {metric !== 'workouts' && (
                            <p className="text-xs text-gray-500">
                                Workouts: {data.workouts}
                            </p>
                        )}
                    </div>
                </div>
            );
        }
        return null;
    };

    // Export chart data as CSV
    const exportData = () => {
        const csv = [
            ['Date', metricConfig.label, 'Workouts'].join(','),
            ...chartData.map(d => [d.fullDate, d[metricConfig.dataKey], d.workouts].join(',')),
        ].join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `workout-data-${format(new Date(), 'yyyy-MM-dd')}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
    };

    // Calculate stats
    const stats = useMemo(() => {
        const values = chartData.map(d => d[metricConfig.dataKey]);
        const total = values.reduce((sum, v) => sum + v, 0);
        const avg = values.length > 0 ? total / values.length : 0;
        const max = Math.max(...values, 0);
        const min = Math.min(...values.filter(v => v > 0), 0);

        return {
            total: Math.round(total),
            average: Math.round(avg),
            max,
            min: min === Infinity ? 0 : min,
        };
    }, [chartData, metricConfig.dataKey]);

    // Render chart based on type
    const renderChart = () => {
        const commonProps = {
            data: chartData,
            margin: { top: 10, right: 10, left: 0, bottom: 0 },
        };

        const commonElements = (
            <>
                <defs>
                    <linearGradient id={metricConfig.gradientId} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={metricConfig.color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={metricConfig.color} stopOpacity={0.1} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                    dataKey="date"
                    tick={{ fontSize: 11 }}
                    interval="preserveStartEnd"
                />
                <YAxis
                    tick={{ fontSize: 11 }}
                    label={{
                        value: metricConfig.label,
                        angle: -90,
                        position: 'insideLeft',
                        fontSize: 11,
                    }}
                />
                <Tooltip content={<CustomTooltip />} />
                {showBrush && chartData.length > 10 && (
                    <Brush
                        dataKey="date"
                        height={30}
                        stroke={metricConfig.color}
                        fill="#f3f4f6"
                    />
                )}
            </>
        );

        switch (chartType) {
            case 'bar':
                return (
                    <BarChart {...commonProps}>
                        {commonElements}
                        <Bar
                            dataKey={metricConfig.dataKey}
                            fill={metricConfig.color}
                            radius={[8, 8, 0, 0]}
                        />
                    </BarChart>
                );

            case 'area':
                return (
                    <AreaChart {...commonProps}>
                        {commonElements}
                        <Area
                            type="monotone"
                            dataKey={metricConfig.dataKey}
                            stroke={metricConfig.color}
                            strokeWidth={2}
                            fill={`url(#${metricConfig.gradientId})`}
                        />
                    </AreaChart>
                );

            default: // line
                return (
                    <LineChart {...commonProps}>
                        {commonElements}
                        <Line
                            type="monotone"
                            dataKey={metricConfig.dataKey}
                            stroke={metricConfig.color}
                            strokeWidth={3}
                            dot={{ fill: metricConfig.color, r: 4 }}
                            activeDot={{ r: 6 }}
                        />
                    </LineChart>
                );
        }
    };

    return (
        <div className="space-y-4">
            {/* Header with controls */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900">{title}</h3>
                    <p className="text-sm text-gray-600">
                        {dataGranularity === 'daily' ? 'Daily' : 'Weekly'} view • Last {timeRange} days
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Chart type selector */}
                    <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
                        <button
                            onClick={() => setChartType('line')}
                            className={`p-2 rounded transition-all ${chartType === 'line'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                            title="Line Chart"
                        >
                            <LineChartIcon className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setChartType('bar')}
                            className={`p-2 rounded transition-all ${chartType === 'bar'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                            title="Bar Chart"
                        >
                            <BarChart3 className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => setChartType('area')}
                            className={`p-2 rounded transition-all ${chartType === 'area'
                                    ? 'bg-white text-primary-600 shadow-sm'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                            title="Area Chart"
                        >
                            <AreaChartIcon className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Time range selector */}
                    <select
                        value={timeRange}
                        onChange={(e) => setTimeRange(Number(e.target.value))}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value={7}>7 days</option>
                        <option value={14}>14 days</option>
                        <option value={30}>30 days</option>
                        <option value={60}>60 days</option>
                        <option value={90}>90 days</option>
                    </select>

                    {/* Granularity selector */}
                    <select
                        value={dataGranularity}
                        onChange={(e) => setDataGranularity(e.target.value)}
                        className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    >
                        <option value="daily">Daily</option>
                        <option value="weekly">Weekly</option>
                    </select>

                    {/* Brush toggle */}
                    <button
                        onClick={() => setShowBrush(!showBrush)}
                        className={`p-2 rounded-lg transition-all ${showBrush
                                ? 'bg-primary-100 text-primary-600'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                        title="Toggle zoom brush"
                    >
                        {showBrush ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                    </button>

                    {/* Export button */}
                    <button
                        onClick={exportData}
                        className="p-2 bg-gray-100 text-gray-600 hover:bg-gray-200 rounded-lg transition-all"
                        title="Export data as CSV"
                    >
                        <Download className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {/* Stats summary */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="bg-blue-50 rounded-lg p-3 border border-blue-200">
                    <div className="text-xs font-semibold text-blue-600 mb-1">Total</div>
                    <div className="text-xl font-bold text-blue-900">
                        {stats.total.toLocaleString()}
                    </div>
                </div>
                <div className="bg-green-50 rounded-lg p-3 border border-green-200">
                    <div className="text-xs font-semibold text-green-600 mb-1">Average</div>
                    <div className="text-xl font-bold text-green-900">
                        {stats.average.toLocaleString()}
                    </div>
                </div>
                <div className="bg-purple-50 rounded-lg p-3 border border-purple-200">
                    <div className="text-xs font-semibold text-purple-600 mb-1">Peak</div>
                    <div className="text-xl font-bold text-purple-900">
                        {stats.max.toLocaleString()}
                    </div>
                </div>
                <div className="bg-orange-50 rounded-lg p-3 border border-orange-200">
                    <div className="text-xs font-semibold text-orange-600 mb-1">Lowest</div>
                    <div className="text-xl font-bold text-orange-900">
                        {stats.min.toLocaleString()}
                    </div>
                </div>
            </div>

            {/* Chart */}
            <div className="bg-gray-50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height={350}>
                    {renderChart()}
                </ResponsiveContainer>
            </div>

            {/* Help text */}
            {showBrush && chartData.length > 10 && (
                <p className="text-xs text-gray-500 text-center">
                    💡 Drag the brush at the bottom to zoom into specific time periods
                </p>
            )}
        </div>
    );
};

export default InteractiveChart;
