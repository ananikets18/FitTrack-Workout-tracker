import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Activity, Calendar as CalendarIcon, Moon, Scale, Apple } from 'lucide-react';
import Calendar from './Calendar';
import SleepTracker from '../components/tracking/SleepTracker';
import BodyMeasurementsTracker from '../components/tracking/BodyMeasurementsTracker';

const VALID_TABS = ['calendar', 'sleep', 'measurements', 'nutrition'];

const Wellness = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const tabFromUrl = searchParams.get('tab');
    const [activeTab, setActiveTab] = useState(
        VALID_TABS.includes(tabFromUrl) ? tabFromUrl : 'calendar'
    );

    const selectTab = useCallback((id) => {
        setActiveTab(id);
        setSearchParams((prev) => {
            const next = new URLSearchParams(prev);
            if (id === 'calendar') {
                next.delete('tab');
            } else {
                next.set('tab', id);
            }
            return next;
        }, { replace: true });
    }, [setSearchParams]);

    const handleTabKeyDown = (e) => {
        if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
        e.preventDefault();
        const idx = VALID_TABS.indexOf(activeTab);
        const next = e.key === 'ArrowRight'
            ? VALID_TABS[(idx + 1) % VALID_TABS.length]
            : VALID_TABS[(idx - 1 + VALID_TABS.length) % VALID_TABS.length];
        selectTab(next);
        document.getElementById(`wellness-tab-${next}`)?.focus();
    };

    const tabs = [
        { id: 'calendar', label: 'Calendar', icon: CalendarIcon, activeClasses: 'border-primary-600 text-primary-600 dark:text-primary-300 dark:border-primary-400' },
        { id: 'sleep', label: 'Sleep', icon: Moon, activeClasses: 'border-primary-600 text-primary-600 dark:text-primary-300 dark:border-primary-400' },
        { id: 'measurements', label: 'Body', icon: Scale, activeClasses: 'border-primary-600 text-primary-600 dark:text-primary-300 dark:border-primary-400' },
        { id: 'nutrition', label: 'Nutrition', icon: Apple, activeClasses: 'border-primary-600 text-primary-600 dark:text-primary-300 dark:border-primary-400' }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                    <Activity className="w-8 h-8 text-primary-600 dark:text-primary-300" />
                    Wellness Hub
                </h1>
                <p className="text-gray-600 dark:text-gray-300 mt-2">
                    Track your workouts, sleep, nutrition, and body measurements
                </p>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200 dark:border-gray-800 overflow-x-auto">
                <div
                    className="flex space-x-1 min-w-max"
                    role="tablist"
                    aria-label="Wellness sections"
                    onKeyDown={handleTabKeyDown}
                >
                    {tabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive = activeTab === tab.id;
                        return (
                            <button
                                key={tab.id}
                                id={`wellness-tab-${tab.id}`}
                                role="tab"
                                aria-selected={isActive}
                                aria-controls={`wellness-panel-${tab.id}`}
                                tabIndex={isActive ? 0 : -1}
                                onClick={() => selectTab(tab.id)}
                                className={`flex items-center gap-2 px-4 md:px-6 py-3 min-h-[48px] font-semibold border-b-2 transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 rounded-t ${isActive
                                    ? tab.activeClasses
                                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 dark:text-gray-300 dark:hover:text-white'
                                    }`}
                            >
                                <Icon className="w-5 h-5" aria-hidden="true" />
                                <span>{tab.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Tab Content */}
            <div className="min-h-[400px]">
                {activeTab === 'calendar' && (
                    <div
                        id="wellness-panel-calendar"
                        role="tabpanel"
                        aria-labelledby="wellness-tab-calendar"
                        className="wellness-calendar-wrapper"
                    >
                        <Calendar />
                    </div>
                )}
                {activeTab === 'sleep' && (
                    <div id="wellness-panel-sleep" role="tabpanel" aria-labelledby="wellness-tab-sleep">
                        <SleepTracker />
                    </div>
                )}
                {activeTab === 'measurements' && (
                    <div id="wellness-panel-measurements" role="tabpanel" aria-labelledby="wellness-tab-measurements">
                        <BodyMeasurementsTracker />
                    </div>
                )}
                {activeTab === 'nutrition' && (
                    <div
                        id="wellness-panel-nutrition"
                        role="tabpanel"
                        aria-labelledby="wellness-tab-nutrition"
                        className="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow"
                    >
                        <Apple className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Nutrition Tracker</h3>
                        <p className="text-gray-600 dark:text-gray-300">Coming soon! Track calories and macros.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Wellness;
