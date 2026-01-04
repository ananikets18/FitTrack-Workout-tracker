import { useState } from 'react';
// eslint-disable-next-line no-unused-vars
import { motion } from 'framer-motion';
import Modal from './Modal';
import Button from './Button';
import { Star, Calendar } from 'lucide-react';

const RestDayModal = ({ isOpen, onClose, onSave, initialData = null }) => {
  const today = new Date().toISOString().split('T')[0];
  
  const [restDayData, setRestDayData] = useState({
    date: initialData?.date || today,
    recoveryQuality: initialData?.recoveryQuality || 3,
    activities: initialData?.activities || [],
    notes: initialData?.notes || ''
  });

  const [hoverRating, setHoverRating] = useState(0);

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
    setRestDayData(prev => ({
      ...prev,
      activities: prev.activities.includes(activityId)
        ? prev.activities.filter(id => id !== activityId)
        : [...prev.activities, activityId]
    }));
  };

  const handleSave = () => {
    if (!restDayData.date) {
      return;
    }

    onSave({
      ...restDayData,
      type: 'rest_day'
    });
    
    // Reset form
    setRestDayData({
      date: today,
      recoveryQuality: 3,
      activities: [],
      notes: ''
    });
  };

  const handleClose = () => {
    setRestDayData({
      date: today,
      recoveryQuality: 3,
      activities: [],
      notes: ''
    });
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Log Rest Day">
      <div className="space-y-6">
        {/* Date Picker */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            <Calendar className="w-4 h-4" />
            <span>Date</span>
          </label>
          <input
            type="date"
            value={restDayData.date}
            onChange={(e) => setRestDayData({ ...restDayData, date: e.target.value })}
            max={today}
            className="w-full px-4 py-3 text-lg border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Recovery Quality Rating */}
        <div>
          <label className="flex items-center space-x-2 text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
            <Star className="w-4 h-4" />
            <span>Recovery Quality</span>
          </label>
          <div className="flex items-center justify-center space-x-2 py-2">
            {[1, 2, 3, 4, 5].map((rating) => (
              <motion.button
                key={rating}
                whileTap={{ scale: 0.9 }}
                onClick={() => setRestDayData({ ...restDayData, recoveryQuality: rating })}
                onMouseEnter={() => setHoverRating(rating)}
                onMouseLeave={() => setHoverRating(0)}
                className="focus:outline-none transition-transform"
              >
                <Star
                  className={`w-10 h-10 md:w-12 md:h-12 transition-colors ${
                    (hoverRating || restDayData.recoveryQuality) >= rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </motion.button>
            ))}
          </div>
          <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-2">
            {restDayData.recoveryQuality === 1 && "Poor - Need more rest"}
            {restDayData.recoveryQuality === 2 && "Fair - Still recovering"}
            {restDayData.recoveryQuality === 3 && "Good - Normal recovery"}
            {restDayData.recoveryQuality === 4 && "Great - Feeling strong"}
            {restDayData.recoveryQuality === 5 && "Excellent - Fully recovered"}
          </p>
        </div>

        {/* Activity Tags */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 block">
            Active Recovery (Optional)
          </label>
          <div className="grid grid-cols-2 gap-2">
            {activityOptions.map((activity) => (
              <motion.button
                key={activity.id}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleActivityToggle(activity.id)}
                className={`flex items-center space-x-2 px-3 py-2.5 rounded-xl border-2 transition-all ${
                  restDayData.activities.includes(activity.id)
                    ? 'bg-green-50 dark:bg-green-900/20 border-green-500 text-green-700 dark:text-green-400'
                    : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <span className="text-xl">{activity.emoji}</span>
                <span className="text-sm font-medium">{activity.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
            Notes (Optional)
          </label>
          <textarea
            value={restDayData.notes}
            onChange={(e) => setRestDayData({ ...restDayData, notes: e.target.value })}
            placeholder="How are you feeling? Any soreness?"
            rows={3}
            className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3 pt-2">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleClose}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handleSave}
            className="flex-1"
          >
            {initialData ? 'Update' : 'Save'} Rest Day
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default RestDayModal;
