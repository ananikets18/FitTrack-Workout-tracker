import { useState } from 'react';
import { Activity, Calendar as CalendarIcon, Moon, Scale, Apple } from 'lucide-react';
import Calendar from './Calendar';
import SleepTracker from '../components/tracking/SleepTracker';
import BodyMeasurementsTracker from '../components/tracking/BodyMeasurementsTracker';

const Wellness = () => {
    const [activeTab, setActiveTab] = useState('calendar');

    const tabs = [
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon, color: 'blue' },
        { id: 'sleep', label: 'Sleep', icon: Moon, color: 'indigo' },
        { id: 'measurements', label: 'Body', icon: Scale, color: 'purple' },
        { id: 'nutrition', label: 'Nutrition', icon: Apple, color: 'green' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-8 h-8 text-primary-600" />
                    Wellness Hub
                </h1>
                <p className="text-gray-600 mt-2">
                    Track your workouts, sleep, nutrition, and body measurements
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 overflow-x-auto">
                <div className="flex space-x-1 min-w-max">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 font-semibold border-b-2 transition-colors whitespace-nowrap ${isActive
                                        ? `border-${tab.color}-600 text-${tab.color}-600`
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                <span className="hidden sm:inline">{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div>
                {activeTab === 'calendar' && <Calendar />}
                {activeTab === 'sleep' && <SleepTracker />}
                {activeTab === 'measurements' && <BodyMeasurementsTracker />}
                {activeTab === 'nutrition' && (
                    <div className="text-center py-12 bg-white rounded-lg shadow">
                        <Apple className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">Nutrition Tracker</h3>
                        <p className="text-gray-600">Coming soon! Track calories and macros.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wellness;
