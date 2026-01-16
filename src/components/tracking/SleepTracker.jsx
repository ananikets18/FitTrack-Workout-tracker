import { useState } from 'react';
import { useSleep } from '../../context/SleepContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { Moon, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const SleepTracker = () => {
    const {
        sleepLogs,
        loading,
        addSleepLog,
        updateSleepLog,
        deleteSleepLog,
        getSleepForDate,
        getAverageSleep,
        getSleepTrend
    } = useSleep();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        hours_slept: '',
        quality: 3,
        sleep_start_time: '',
        sleep_end_time: '',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const sleepData = {
            date: formData.date,
            hours_slept: parseFloat(formData.hours_slept),
            quality: parseInt(formData.quality),
            sleep_start_time: formData.sleep_start_time || null,
            sleep_end_time: formData.sleep_end_time || null,
            notes: formData.notes || null
        };

        try {
            if (editingLog) {
                await updateSleepLog(editingLog.id, sleepData);
            } else {
                await addSleepLog(sleepData);
            }
            handleCloseModal();
        } catch (error) {
            // Error handled in context
        }
    };

    const handleEdit = (log) => {
        setEditingLog(log);
        setFormData({
            date: log.date,
            hours_slept: log.hours_slept.toString(),
            quality: log.quality,
            sleep_start_time: log.sleep_start_time || '',
            sleep_end_time: log.sleep_end_time || '',
            notes: log.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this sleep log?')) {
            await deleteSleepLog(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLog(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            hours_slept: '',
            quality: 3,
            sleep_start_time: '',
            sleep_end_time: '',
            notes: ''
        });
    };

    const averageSleep = getAverageSleep(7);
    const trend = getSleepTrend(7);

    const qualityLabels = {
        1: '😫 Very Poor',
        2: '😔 Poor',
        3: '😐 Average',
        4: '😊 Good',
        5: '😴 Excellent'
    };

    const qualityColors = {
        1: 'bg-red-100 text-red-800',
        2: 'bg-orange-100 text-orange-800',
        3: 'bg-yellow-100 text-yellow-800',
        4: 'bg-green-100 text-green-800',
        5: 'bg-blue-100 text-blue-800'
    };

    if (loading) {
        return (
            <Card>
                <div className="text-center py-8 text-gray-500">Loading sleep data...</div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Moon className="w-6 h-6 text-indigo-600" />
                        Sleep Tracker
                    </h2>
                    {averageSleep && (
                        <p className="text-sm text-gray-600 mt-1">
                            7-day average: {averageSleep.hours}h • Quality: {averageSleep.quality}/5
                            {trend === 'improving' && <TrendingUp className="inline w-4 h-4 ml-2 text-green-600" />}
                            {trend === 'declining' && <TrendingDown className="inline w-4 h-4 ml-2 text-red-600" />}
                            {trend === 'stable' && <Minus className="inline w-4 h-4 ml-2 text-gray-600" />}
                        </p>
                    )}
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Log Sleep
                </Button>
            </div>

            {/* Sleep Logs */}
            {sleepLogs.length === 0 ? (
                <Card className="text-center py-12">
                    <Moon className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">No sleep logs yet. Start tracking your sleep!</p>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-5 h-5 mr-2" />
                        Log Your First Sleep
                    </Button>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {sleepLogs.slice(0, 30).map((log) => (
                        <Card key={log.id} className="hover:shadow-lg transition-shadow">
                            <div className="flex items-start justify-between mb-3">
                                <div>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(log.date).toLocaleDateString('en-US', {
                                            weekday: 'short',
                                            month: 'short',
                                            day: 'numeric'
                                        })}
                                    </p>
                                    <p className="text-2xl font-bold text-indigo-600 mt-1">
                                        {log.hours_slept}h
                                    </p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => handleEdit(log)}
                                        className="p-1.5 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                                    >
                                        <Edit2 className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(log.id)}
                                        className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${qualityColors[log.quality]}`}>
                                {qualityLabels[log.quality]}
                            </div>

                            {(log.sleep_start_time || log.sleep_end_time) && (
                                <p className="text-sm text-gray-600 mt-3">
                                    {log.sleep_start_time && `🌙 ${log.sleep_start_time}`}
                                    {log.sleep_start_time && log.sleep_end_time && ' → '}
                                    {log.sleep_end_time && `☀️ ${log.sleep_end_time}`}
                                </p>
                            )}

                            {log.notes && (
                                <p className="text-sm text-gray-600 mt-2 p-2 bg-gray-50 rounded">
                                    {log.notes}
                                </p>
                            )}
                        </Card>
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingLog ? 'Edit Sleep Log' : 'Log Sleep'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />

                    <Input
                        label="Hours Slept"
                        type="number"
                        step="0.5"
                        min="0"
                        max="24"
                        value={formData.hours_slept}
                        onChange={(e) => setFormData({ ...formData, hours_slept: e.target.value })}
                        placeholder="7.5"
                        required
                    />

                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-2 block">
                            Sleep Quality
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                            {[1, 2, 3, 4, 5].map((quality) => (
                                <button
                                    key={quality}
                                    type="button"
                                    onClick={() => setFormData({ ...formData, quality })}
                                    className={`p-3 rounded-lg border-2 transition-all ${formData.quality === quality
                                            ? 'border-indigo-600 bg-indigo-50'
                                            : 'border-gray-200 hover:border-indigo-300'
                                        }`}
                                >
                                    <div className="text-2xl">{qualityLabels[quality].split(' ')[0]}</div>
                                    <div className="text-xs mt-1">{quality}</div>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Bedtime (Optional)"
                            type="time"
                            value={formData.sleep_start_time}
                            onChange={(e) => setFormData({ ...formData, sleep_start_time: e.target.value })}
                        />
                        <Input
                            label="Wake Time (Optional)"
                            type="time"
                            value={formData.sleep_end_time}
                            onChange={(e) => setFormData({ ...formData, sleep_end_time: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="How did you sleep? Any factors affecting sleep?"
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                            rows={3}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {editingLog ? 'Update' : 'Log Sleep'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};  

export default SleepTracker;
