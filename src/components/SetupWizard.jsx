import { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Check, Dumbbell, Calendar, Target } from 'lucide-react';
import { TRAINING_SPLITS, DEFAULT_VOLUME_TARGETS } from '../utils/smartRecommendations';
import Button from './common/Button';
import Card from './common/Card';

const SetupWizard = ({ isOpen, onClose, onComplete }) => {
    const [step, setStep] = useState(1);
    const [preferences, setPreferences] = useState({
        split: 'custom',
        weeklyFrequency: 4,
        volumeTargets: { ...DEFAULT_VOLUME_TARGETS }
    });

    if (!isOpen) return null;

    const handleNext = () => {
        if (step < 3) {
            setStep(step + 1);
        } else {
            onComplete(preferences);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSplitSelect = (splitKey) => {
        const split = TRAINING_SPLITS[splitKey];
        setPreferences(prev => ({
            ...prev,
            split: splitKey,
            weeklyFrequency: split.frequency || prev.weeklyFrequency
        }));
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                        <div className="bg-gradient-primary rounded-xl p-2.5">
                            <Dumbbell className="w-6 h-6 text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900">Welcome to FitTrack!</h2>
                            <p className="text-sm text-gray-500">Let's personalize your workout experience</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Progress Indicator */}
                <div className="flex items-center justify-center mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div
                                className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${s === step
                                        ? 'bg-gradient-primary text-white shadow-lg scale-110'
                                        : s < step
                                            ? 'bg-green-500 text-white'
                                            : 'bg-gray-200 text-gray-500'
                                    }`}
                            >
                                {s < step ? <Check className="w-5 h-5" /> : s}
                            </div>
                            {s < 3 && (
                                <div
                                    className={`w-16 h-1 mx-2 rounded-full transition-all ${s < step ? 'bg-green-500' : 'bg-gray-200'
                                        }`}
                                />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="mb-8">
                    {/* STEP 1: Training Split */}
                    {step === 1 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-2xl mb-3">
                                    <Dumbbell className="w-8 h-8 text-blue-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Choose Your Training Split</h3>
                                <p className="text-gray-600">How do you like to organize your workouts?</p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(TRAINING_SPLITS).map(([key, split]) => (
                                    <button
                                        key={key}
                                        onClick={() => handleSplitSelect(key)}
                                        className={`p-4 rounded-xl border-2 text-left transition-all ${preferences.split === key
                                                ? 'border-blue-500 bg-blue-50 shadow-md'
                                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <h4 className="font-bold text-gray-900">{split.name}</h4>
                                            {preferences.split === key && (
                                                <div className="bg-blue-500 rounded-full p-1">
                                                    <Check className="w-4 h-4 text-white" />
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mb-2">{split.description}</p>
                                        {split.frequency && (
                                            <div className="text-xs text-blue-600 font-semibold">
                                                {split.frequency} days/week
                                            </div>
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* STEP 2: Weekly Frequency */}
                    {step === 2 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-3">
                                    <Calendar className="w-8 h-8 text-purple-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Workout Frequency</h3>
                                <p className="text-gray-600">How many days per week do you want to train?</p>
                            </div>

                            <div className="max-w-md mx-auto">
                                <div className="grid grid-cols-7 gap-2 mb-4">
                                    {[1, 2, 3, 4, 5, 6, 7].map((days) => (
                                        <button
                                            key={days}
                                            onClick={() => setPreferences(prev => ({ ...prev, weeklyFrequency: days }))}
                                            className={`aspect-square rounded-xl font-bold text-lg transition-all ${preferences.weeklyFrequency === days
                                                    ? 'bg-gradient-primary text-white shadow-lg scale-110'
                                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                                }`}
                                        >
                                            {days}
                                        </button>
                                    ))}
                                </div>

                                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 border border-purple-200">
                                    <p className="text-center text-gray-700">
                                        <span className="text-3xl font-bold text-purple-600">{preferences.weeklyFrequency}</span>
                                        <span className="text-gray-600 ml-2">days per week</span>
                                    </p>
                                    <p className="text-sm text-gray-600 text-center mt-2">
                                        {preferences.weeklyFrequency <= 2 && 'Perfect for beginners or busy schedules'}
                                        {preferences.weeklyFrequency >= 3 && preferences.weeklyFrequency <= 4 && 'Great balance for most people'}
                                        {preferences.weeklyFrequency >= 5 && preferences.weeklyFrequency <= 6 && 'Ideal for serious lifters'}
                                        {preferences.weeklyFrequency === 7 && 'Elite athlete mode! Don\'t forget rest days'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* STEP 3: Volume Targets */}
                    {step === 3 && (
                        <div className="space-y-4">
                            <div className="text-center mb-6">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-2xl mb-3">
                                    <Target className="w-8 h-8 text-green-600" />
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 mb-2">Volume Targets</h3>
                                <p className="text-gray-600">We've set science-based defaults for you</p>
                            </div>

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                                <p className="text-sm text-blue-800">
                                    <strong>💡 Tip:</strong> These are recommended weekly sets per muscle group. You can customize these later in settings.
                                </p>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {Object.entries(DEFAULT_VOLUME_TARGETS).map(([muscle, target]) => (
                                    <div
                                        key={muscle}
                                        className="bg-white border border-gray-200 rounded-xl p-4"
                                    >
                                        <div className="flex items-center justify-between mb-2">
                                            <span className="font-semibold text-gray-900 capitalize">{muscle}</span>
                                            <span className="text-sm text-gray-500">
                                                {muscle === 'cardio' ? 'sessions/week' : 'sets/week'}
                                            </span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                                                <div
                                                    className="bg-gradient-primary h-2 rounded-full"
                                                    style={{ width: `${(target.min / target.max) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-sm font-bold text-gray-700">
                                                {target.min}-{target.max}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-4">
                                <p className="text-sm text-green-800 text-center">
                                    ✅ You're all set! FitTrack will now provide intelligent workout recommendations based on your preferences.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={step === 1}
                        className="flex items-center space-x-2"
                    >
                        <ChevronLeft className="w-5 h-5" />
                        <span>Back</span>
                    </Button>

                    <div className="text-sm text-gray-500">
                        Step {step} of 3
                    </div>

                    <Button
                        variant="primary"
                        onClick={handleNext}
                        className="flex items-center space-x-2"
                    >
                        <span>{step === 3 ? 'Complete Setup' : 'Next'}</span>
                        {step === 3 ? <Check className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default SetupWizard;
