import { useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useSleep } from '../../context/SleepContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import {
    Moon,
    Sun,
    Plus,
    Edit2,
    Trash2,
    TrendingUp,
    TrendingDown,
    Minus,
    Clock,
    RotateCcw,
} from 'lucide-react';
import { getLocalDateInputValue } from '../../utils/date';
import {
    computeSleepDuration,
    formatSleepDuration,
    formatSleepDate,
    toTimeInputValue,
    isValidTimeInput,
} from '../../utils/sleep';

const QUALITY_OPTIONS = [
    { value: 1, label: 'Very Poor' },
    { value: 2, label: 'Poor' },
    { value: 3, label: 'Average' },
    { value: 4, label: 'Good' },
    { value: 5, label: 'Excellent' },
];

const QUALITY_PILL = {
    1: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200',
    2: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-200',
    3: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200',
    4: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200',
    5: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200',
};

const emptyForm = () => ({
    date: getLocalDateInputValue(),
    sleep_start_time: '',
    sleep_end_time: '',
    hours_slept: '',
    hoursOverridden: false,
    quality: 3,
    notes: '',
});

const SleepTracker = () => {
    const {
        sleepLogs,
        loading,
        addSleepLog,
        updateSleepLog,
        deleteSleepLog,
        restoreSleepLog,
        getAverageSleep,
        getSleepTrend,
    } = useSleep();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLog, setEditingLog] = useState(null);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState(emptyForm);
    const [deleteTarget, setDeleteTarget] = useState(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [visibleCount, setVisibleCount] = useState(12);

    // Auto-computed duration from bedtime/wake — single source of truth.
    const computed = useMemo(
        () => computeSleepDuration(formData.sleep_start_time, formData.sleep_end_time),
        [formData.sleep_start_time, formData.sleep_end_time]
    );
    const manualHours = Number(formData.hours_slept);
    const mismatch =
        computed &&
        Number.isFinite(manualHours) &&
        Math.abs(manualHours - computed.totalHours) > 1;

    const setField = (field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
        setFormErrors((prev) => {
            if (!prev[field]) return prev;
            const next = { ...prev };
            delete next[field];
            return next;
        });
    };

    const handleBedWakeChange = (field, value) => {
        setFormData((prev) => {
            const next = { ...prev, [field]: value };
            // Keep hours in sync unless the user explicitly overrode it.
            if (!prev.hoursOverridden) {
                const d = computeSleepDuration(
                    field === 'sleep_start_time' ? value : next.sleep_start_time,
                    field === 'sleep_end_time' ? value : next.sleep_end_time
                );
                next.hours_slept = d ? String(d.totalHours) : '';
            }
            return next;
        });
        setFormErrors((prev) => {
            const next = { ...prev };
            delete next[field];
            delete next.hours_slept;
            return next;
        });
    };

    const handleHoursChange = (value) => {
        setFormData((prev) => ({ ...prev, hours_slept: value, hoursOverridden: true }));
        setFormErrors((prev) => {
            if (!prev.hours_slept) return prev;
            const next = { ...prev };
            delete next.hours_slept;
            return next;
        });
    };

    const resetHoursToAuto = () => {
        setFormData((prev) => ({
            ...prev,
            hours_slept: computed ? String(computed.totalHours) : '',
            hoursOverridden: false,
        }));
    };

    const validateForm = (data, { isEdit = false, editId = null } = {}) => {
        const errors = {};

        if (!data.date || !/^\d{4}-\d{2}-\d{2}$/.test(data.date)) {
            errors.date = 'Please select a valid date.';
        } else if (data.date > getLocalDateInputValue()) {
            errors.date = 'Date cannot be in the future.';
        } else if (!isEdit || sleepLogs.find((l) => l.id === editId)?.date !== data.date) {
            const clash = sleepLogs.find((log) => log.date === data.date && log.id !== editId);
            if (clash) errors.date = 'Sleep already logged for this date. Edit that entry instead.';
        }

        if (!data.sleep_start_time) {
            errors.sleep_start_time = 'Bedtime is required.';
        } else if (!isValidTimeInput(data.sleep_start_time)) {
            errors.sleep_start_time = 'Use HH:MM format.';
        }
        if (!data.sleep_end_time) {
            errors.sleep_end_time = 'Wake time is required.';
        } else if (!isValidTimeInput(data.sleep_end_time)) {
            errors.sleep_end_time = 'Use HH:MM format.';
        }
        if (
            isValidTimeInput(data.sleep_start_time) &&
            isValidTimeInput(data.sleep_end_time) &&
            !computeSleepDuration(data.sleep_start_time, data.sleep_end_time)
        ) {
            errors.sleep_end_time = 'Wake time must differ from bedtime.';
        }

        const hours = data.hours_slept === '' ? NaN : Number(data.hours_slept);
        if (!Number.isFinite(hours)) {
            errors.hours_slept = 'Add bedtime and wake time, or enter hours.';
        } else if (hours <= 0 || hours > 24) {
            errors.hours_slept = 'Hours must be between 0 and 24.';
        } else {
            const d = computeSleepDuration(data.sleep_start_time, data.sleep_end_time);
            if (d && Math.abs(hours - d.totalHours) > 1) {
                errors.hours_slept = `Doesn't match bedtime → wake (${d.totalHours}h).`;
            }
        }

        if (!Number.isInteger(Number(data.quality)) || Number(data.quality) < 1 || Number(data.quality) > 5) {
            errors.quality = 'Quality must be 1-5.';
        }
        if (data.notes && data.notes.length > 500) {
            errors.notes = 'Notes must be under 500 characters.';
        }
        return errors;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const errors = validateForm(formData, { isEdit: Boolean(editingLog), editId: editingLog?.id });
        setFormErrors(errors);
        if (Object.keys(errors).length > 0) return;

        const sleepData = {
            date: formData.date,
            hours_slept: Number(formData.hours_slept),
            quality: parseInt(formData.quality, 10),
            sleep_start_time: formData.sleep_start_time || null,
            sleep_end_time: formData.sleep_end_time || null,
            notes: formData.notes?.trim() || null,
        };

        try {
            setIsSubmitting(true);
            if (editingLog) {
                await updateSleepLog(editingLog.id, sleepData);
            } else {
                await addSleepLog(sleepData);
            }
            handleCloseModal();
        } catch {
            // Friendly toast already shown in context
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEdit = (log) => {
        setEditingLog(log);
        setFormErrors({});
        const bed = toTimeInputValue(log.sleep_start_time);
        const wake = toTimeInputValue(log.sleep_end_time);
        const d = bed && wake ? computeSleepDuration(bed, wake) : null;
        const stored = Number(log.hours_slept);
        const overridden = d ? Math.abs(stored - d.totalHours) > 0.1 : true;
        setFormData({
            date: log.date,
            sleep_start_time: bed,
            sleep_end_time: wake,
            hours_slept: log.hours_slept?.toString() ?? '',
            hoursOverridden: overridden,
            quality: log.quality,
            notes: log.notes || '',
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingLog(null);
        setFormErrors({});
        setIsSubmitting(false);
        setFormData(emptyForm());
    };

    const openNewModal = () => {
        setEditingLog(null);
        setFormErrors({});
        setFormData(emptyForm());
        setIsModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!deleteTarget) return;
        setIsDeleting(true);
        try {
            const removed = await deleteSleepLog(deleteTarget.id);
            setDeleteTarget(null);
            toast((t) => (
                <div className="flex items-center gap-3">
                    <span>Sleep log deleted</span>
                    <button
                        className="font-semibold underline"
                        onClick={async () => {
                            try {
                                await restoreSleepLog(removed ?? deleteTarget);
                                toast.success('Sleep log restored');
                            } catch {
                                toast.error('Could not restore log');
                            }
                            toast.dismiss(t.id);
                        }}
                    >
                        Undo
                    </button>
                </div>
            ), { duration: 8000 });
        } catch {
            // Error toasted in context
        } finally {
            setIsDeleting(false);
        }
    };

    const averageSleep = getAverageSleep(7);
    const trend = getSleepTrend(7);

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" aria-label="Loading sleep data">
                {[0, 1, 2].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <div className="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded mb-3" />
                        <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded" />
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <Moon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600 dark:text-primary-300" />
                        Sleep Tracker
                    </h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        Bedtime + wake time auto-calculate your sleep duration.
                    </p>
                </div>
                <Button onClick={openNewModal} className="w-full sm:w-auto">
                    <Plus className="w-5 h-5 mr-2" />
                    Log Sleep
                </Button>
            </div>

            {/* Summary strip */}
            {averageSleep && (
                <div className="grid grid-cols-3 gap-3" aria-live="polite">
                    <Card className="!p-4 text-center">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">7-day avg</p>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">{averageSleep.hours}h</p>
                    </Card>
                    <Card className="!p-4 text-center">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Quality</p>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-300">{averageSleep.quality}/5</p>
                    </Card>
                    <Card className="!p-4 text-center">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Trend</p>
                        <p className="text-2xl font-bold text-primary-600 dark:text-primary-300 flex items-center justify-center gap-1">
                            {trend === 'improving' && <TrendingUp className="w-6 h-6 text-green-600" aria-label="Improving" />}
                            {trend === 'declining' && <TrendingDown className="w-6 h-6 text-red-600" aria-label="Declining" />}
                            {trend === 'stable' && <Minus className="w-6 h-6 text-gray-500" aria-label="Stable" />}
                        </p>
                    </Card>
                </div>
            )}

            {/* Logs */}
            {sleepLogs.length === 0 ? (
                <Card className="text-center py-12">
                    <Moon className="w-16 h-16 mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                    <p className="text-gray-600 dark:text-gray-300 mb-4">No sleep logs yet. Log your bedtime and wake time!</p>
                    <Button onClick={openNewModal}>
                        <Plus className="w-5 h-5 mr-2" />
                        Log Your First Sleep
                    </Button>
                </Card>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {sleepLogs.slice(0, visibleCount).map((log) => {
                            const bed = toTimeInputValue(log.sleep_start_time);
                            const wake = toTimeInputValue(log.sleep_end_time);
                            const d = bed && wake ? computeSleepDuration(bed, wake) : null;
                            return (
                                <Card key={log.id} className="hover:shadow-lg transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div>
                                            <p className="font-semibold text-gray-900 dark:text-white">
                                                {formatSleepDate(log.date)}
                                            </p>
                                            <p className="text-2xl font-bold text-primary-600 dark:text-primary-300 mt-1">
                                                {log.hours_slept}h
                                            </p>
                                        </div>
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => handleEdit(log)}
                                                aria-label={`Edit sleep log for ${log.date}`}
                                                className="min-h-[44px] min-w-[44px] p-2.5 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-gray-700 rounded transition-colors"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => setDeleteTarget(log)}
                                                aria-label={`Delete sleep log for ${log.date}`}
                                                className="min-h-[44px] min-w-[44px] p-2.5 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-red-600 hover:bg-red-50 dark:hover:bg-gray-700 rounded transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${QUALITY_PILL[log.quality] ?? QUALITY_PILL[3]}`}>
                                        {QUALITY_OPTIONS.find((q) => q.value === log.quality)?.label ?? `Quality ${log.quality}`}
                                    </div>

                                    {(bed || wake) && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 flex items-center gap-1.5">
                                            <Moon className="w-4 h-4" aria-hidden="true" />
                                            <span>{bed || '—'} → {wake || '—'}</span>
                                            {d && (
                                                <span className="ml-1 px-2 py-0.5 rounded-full bg-primary-50 dark:bg-gray-700 text-primary-700 dark:text-primary-200 text-xs font-semibold">
                                                    {formatSleepDuration(d)}{d.overnight ? ' • overnight' : ''}
                                                </span>
                                            )}
                                        </p>
                                    )}

                                    {log.notes && (
                                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 p-2 bg-gray-50 dark:bg-gray-700/50 rounded line-clamp-3">
                                            {log.notes}
                                        </p>
                                    )}
                                </Card>
                            );
                        })}
                    </div>
                    {visibleCount < sleepLogs.length && (
                        <div className="text-center pt-2">
                            <Button variant="secondary" onClick={() => setVisibleCount((c) => c + 12)}>
                                Show more ({sleepLogs.length - visibleCount} left)
                            </Button>
                        </div>
                    )}
                </>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingLog ? 'Edit Sleep Log' : 'Log Sleep'}
                size="sm"
                footer={
                    <div className="flex gap-2">
                        <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            form="sleep-log-form"
                            className="flex-1"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Saving...' : editingLog ? 'Update' : 'Log Sleep'}
                        </Button>
                    </div>
                }
            >
                <form id="sleep-log-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
                    <Input
                        label="Night of"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setField('date', e.target.value)}
                        required
                        max={getLocalDateInputValue()}
                        error={formErrors.date}
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Bedtime"
                            type="time"
                            value={formData.sleep_start_time}
                            onChange={(e) => handleBedWakeChange('sleep_start_time', e.target.value)}
                            required
                            error={formErrors.sleep_start_time}
                        />
                        <Input
                            label="Wake time"
                            type="time"
                            value={formData.sleep_end_time}
                            onChange={(e) => handleBedWakeChange('sleep_end_time', e.target.value)}
                            required
                            error={formErrors.sleep_end_time}
                        />
                    </div>

                    {/* Auto-calculated duration */}
                    <div
                        className="flex items-center gap-2 px-4 py-3 rounded-lg bg-primary-50 dark:bg-gray-800 border border-primary-100 dark:border-gray-700"
                        aria-live="polite"
                    >
                        <Clock className="w-5 h-5 text-primary-600 dark:text-primary-300 shrink-0" aria-hidden="true" />
                        {computed ? (
                            <p className="text-sm text-gray-800 dark:text-gray-100">
                                <span className="font-bold">{formatSleepDuration(computed)}</span>
                                <span className="text-gray-600 dark:text-gray-300">
                                    {' '}({formData.sleep_start_time} → {formData.sleep_end_time}
                                    {computed.overnight ? ', overnight' : ''})
                                </span>
                            </p>
                        ) : (
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Enter bedtime and wake time to auto-calculate duration.
                            </p>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label
                                htmlFor="input-hours-slept"
                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                Hours slept {formData.hoursOverridden ? '(adjusted)' : '(auto)'}
                            </label>
                            {formData.hoursOverridden && computed && (
                                <button
                                    type="button"
                                    onClick={resetHoursToAuto}
                                    className="text-xs font-semibold text-primary-600 dark:text-primary-300 hover:underline flex items-center gap-1"
                                >
                                    <RotateCcw className="w-3.5 h-3.5" />
                                    Reset to {computed.totalHours}h
                                </button>
                            )}
                        </div>
                        <Input
                            id="input-hours-slept"
                            type="number"
                            step="0.25"
                            min="0.5"
                            max="24"
                            value={formData.hours_slept}
                            onChange={(e) => handleHoursChange(e.target.value)}
                            placeholder={computed ? String(computed.totalHours) : '7.5'}
                            required
                            error={formErrors.hours_slept}
                        />
                        {mismatch && !formErrors.hours_slept && (
                            <p className="text-amber-600 dark:text-amber-300 text-sm mt-1" role="note">
                                Heads up: this differs from bedtime → wake ({computed.totalHours}h).
                            </p>
                        )}
                    </div>

                    <div>
                        <span id="sleep-quality-label" className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
                            Sleep Quality
                        </span>
                        <div className="grid grid-cols-5 gap-2" role="radiogroup" aria-labelledby="sleep-quality-label">
                            {QUALITY_OPTIONS.map((opt) => {
                                const selected = formData.quality === opt.value;
                                return (
                                    <button
                                        key={opt.value}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        aria-label={`${opt.value}: ${opt.label}`}
                                        title={opt.label}
                                        onClick={() => setField('quality', opt.value)}
                                        className={`p-2 rounded-lg border-2 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                                            selected
                                                ? 'border-primary-600 bg-primary-50 dark:bg-gray-700 dark:border-primary-400'
                                                : 'border-gray-200 dark:border-gray-700 hover:border-primary-300 dark:hover:border-gray-500'
                                        }`}
                                    >
                                        <div className="text-lg font-bold text-gray-900 dark:text-white">{opt.value}</div>
                                        <div className="text-[11px] mt-0.5 text-gray-600 dark:text-gray-300 leading-tight">{opt.label}</div>
                                    </button>
                                );
                            })}
                        </div>
                        {formErrors.quality && (
                            <p className="text-red-500 text-sm mt-1" role="alert">{formErrors.quality}</p>
                        )}
                    </div>

                    <div>
                        <div className="flex items-center justify-between mb-1">
                            <label
                                htmlFor="sleep-notes"
                                className="text-sm font-semibold text-gray-700 dark:text-gray-300"
                            >
                                Notes (Optional)
                            </label>
                            <span className="text-xs text-gray-400">{formData.notes.length}/500</span>
                        </div>
                        <textarea
                            id="sleep-notes"
                            value={formData.notes}
                            onChange={(e) => setField('notes', e.target.value.slice(0, 500))}
                            placeholder="How did you sleep? Any factors affecting sleep?"
                            className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-800 dark:text-white"
                            rows={3}
                            maxLength={500}
                        />
                        {formErrors.notes && (
                            <p className="text-red-500 text-sm mt-1" role="alert">{formErrors.notes}</p>
                        )}
                    </div>
                </form>
            </Modal>

            {/* Delete confirm */}
            <Modal
                isOpen={Boolean(deleteTarget)}
                onClose={() => setDeleteTarget(null)}
                title="Delete sleep log?"
                size="sm"
                footer={
                    <div className="flex gap-2">
                        <Button variant="secondary" onClick={() => setDeleteTarget(null)} className="flex-1">
                            Keep
                        </Button>
                        <Button variant="danger" onClick={confirmDelete} disabled={isDeleting} className="flex-1">
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                }
            >
                {deleteTarget && (
                    <p className="text-gray-600 dark:text-gray-300 flex items-center gap-2">
                        <Sun className="w-5 h-5 text-amber-500" aria-hidden="true" />
                        Delete {formatSleepDate(deleteTarget.date)} ({deleteTarget.hours_slept}h)? You can undo right after.
                    </p>
                )}
            </Modal>
        </div>
    );
};

export default SleepTracker;
