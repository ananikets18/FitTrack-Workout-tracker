import { useState } from 'react';
import { Activity, Moon, Scale, Apple } from 'lucide-react';
import SleepTracker from '../components/tracking/SleepTracker';
import BodyMeasurementsTracker from '../components/tracking/BodyMeasurementsTracker';

const Health = () => {
    const [activeTab, setActiveTab] = useState('sleep');

    const tabs = [
        { id: 'sleep', label: 'Sleep', icon: Moon, color: 'indigo' },
        { id: 'measurements', label: 'Body Measurements', icon: Scale, color: 'purple' },
        { id: 'nutrition', label: 'Nutrition', icon: Apple, color: 'green' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                    <Activity className="w-8 h-8 text-primary-600" />
                    Health & Recovery
                </h1>
                <p className="text-gray-600 mt-2">
                    Track sleep, nutrition, and body measurements for better AI insights
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <div className="flex space-x-1">
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-6 py-3 font-semibold border-b-2 transition-colors ${activeTab === tab.id
                                        ? `border-${tab.color}-600 text-${tab.color}-600`
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {tab.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div>
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

export default Health;
