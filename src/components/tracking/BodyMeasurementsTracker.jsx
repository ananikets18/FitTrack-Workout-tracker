import { useState } from 'react';
import { useBodyMeasurements } from '../../context/BodyMeasurementsContext';
import { useAuth } from '../../context/AuthContext';
import Card from '../common/Card';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import { Scale, Plus, Edit2, Trash2, TrendingUp, TrendingDown, Minus } from 'lucide-react';

const BodyMeasurementsTracker = () => {
    const { user } = useAuth();
    const {
        measurements,
        loading,
        addMeasurement,
        updateMeasurement,
        deleteMeasurement,
        getLatestMeasurement,
        getWeightTrend,
        calculateBMI,
        getMeasurementChanges,
        predictWeightChangeRate
    } = useBodyMeasurements();

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingMeasurement, setEditingMeasurement] = useState(null);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        weight: '',
        body_fat_percentage: '',
        chest: '',
        waist: '',
        hips: '',
        left_arm: '',
        right_arm: '',
        left_thigh: '',
        right_thigh: '',
        notes: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        const measurementData = {
            date: formData.date,
            weight: formData.weight ? parseFloat(formData.weight) : null,
            body_fat_percentage: formData.body_fat_percentage ? parseFloat(formData.body_fat_percentage) : null,
            chest: formData.chest ? parseFloat(formData.chest) : null,
            waist: formData.waist ? parseFloat(formData.waist) : null,
            hips: formData.hips ? parseFloat(formData.hips) : null,
            left_arm: formData.left_arm ? parseFloat(formData.left_arm) : null,
            right_arm: formData.right_arm ? parseFloat(formData.right_arm) : null,
            left_thigh: formData.left_thigh ? parseFloat(formData.left_thigh) : null,
            right_thigh: formData.right_thigh ? parseFloat(formData.right_thigh) : null,
            notes: formData.notes || null
        };

        try {
            if (editingMeasurement) {
                await updateMeasurement(editingMeasurement.id, measurementData);
            } else {
                await addMeasurement(measurementData);
            }
            handleCloseModal();
        } catch (error) {
            // Error handled in context
        }
    };

    const handleEdit = (measurement) => {
        setEditingMeasurement(measurement);
        setFormData({
            date: measurement.date,
            weight: measurement.weight?.toString() || '',
            body_fat_percentage: measurement.body_fat_percentage?.toString() || '',
            chest: measurement.chest?.toString() || '',
            waist: measurement.waist?.toString() || '',
            hips: measurement.hips?.toString() || '',
            left_arm: measurement.left_arm?.toString() || '',
            right_arm: measurement.right_arm?.toString() || '',
            left_thigh: measurement.left_thigh?.toString() || '',
            right_thigh: measurement.right_thigh?.toString() || '',
            notes: measurement.notes || ''
        });
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this measurement?')) {
            await deleteMeasurement(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingMeasurement(null);
        setFormData({
            date: new Date().toISOString().split('T')[0],
            weight: '',
            body_fat_percentage: '',
            chest: '',
            waist: '',
            hips: '',
            left_arm: '',
            right_arm: '',
            left_thigh: '',
            right_thigh: '',
            notes: ''
        });
    };

    const latestMeasurement = getLatestMeasurement();
    const weightTrend = getWeightTrend(30);
    const changes = getMeasurementChanges();
    const weightChangeRate = predictWeightChangeRate(4);

    // Get BMI if we have weight and height from profile
    const bmi = latestMeasurement?.weight && user?.height
        ? calculateBMI(latestMeasurement.weight, user.height)
        : null;

    if (loading) {
        return (
            <Card>
                <div className="text-center py-8 text-gray-500">Loading measurements...</div>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <Scale className="w-6 h-6 text-purple-600" />
                        Body Measurements
                    </h2>
                    {latestMeasurement && (
                        <p className="text-sm text-gray-600 mt-1">
                            Latest: {latestMeasurement.weight}kg
                            {weightTrend && (
                                <>
                                    {' • '}
                                    {weightTrend.trend === 'gaining' && <TrendingUp className="inline w-4 h-4 text-green-600" />}
                                    {weightTrend.trend === 'losing' && <TrendingDown className="inline w-4 h-4 text-blue-600" />}
                                    {weightTrend.trend === 'stable' && <Minus className="inline w-4 h-4 text-gray-600" />}
                                    {' '}{weightTrend.change}kg ({weightTrend.percentage}%)
                                </>
                            )}
                        </p>
                    )}
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-5 h-5 mr-2" />
                    Log Measurement
                </Button>
            </div>

            {/* Stats Cards */}
            {latestMeasurement && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Current Weight */}
                    <Card>
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">Current Weight</h3>
                        <p className="text-3xl font-bold text-purple-600">{latestMeasurement.weight} kg</p>
                        {bmi && (
                            <p className="text-sm text-gray-600 mt-2">
                                BMI: {bmi.value} ({bmi.category})
                            </p>
                        )}
                    </Card>

                    {/* Weight Change */}
                    {weightChangeRate && (
                        <Card>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Change Rate</h3>
                            <p className="text-3xl font-bold text-blue-600">
                                {weightChangeRate.changePerWeek > 0 ? '+' : ''}
                                {weightChangeRate.changePerWeek} kg/week
                            </p>
                            <p className="text-sm text-gray-600 mt-2">
                                Over {weightChangeRate.weeks} weeks
                            </p>
                        </Card>
                    )}

                    {/* Body Fat */}
                    {latestMeasurement.body_fat_percentage && (
                        <Card>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">Body Fat</h3>
                            <p className="text-3xl font-bold text-orange-600">
                                {latestMeasurement.body_fat_percentage}%
                            </p>
                        </Card>
                    )}
                </div>
            )}

            {/* Measurement History */}
            {measurements.length === 0 ? (
                <Card className="text-center py-12">
                    <Scale className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-600 mb-4">No measurements yet. Start tracking your progress!</p>
                    <Button onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-5 h-5 mr-2" />
                        Log Your First Measurement
                    </Button>
                </Card>
            ) : (
                <Card>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Measurement History</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-2 px-3 text-sm font-semibold text-gray-700">Date</th>
                                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Weight</th>
                                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">BF%</th>
                                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Chest</th>
                                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Waist</th>
                                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Arms</th>
                                    <th className="text-right py-2 px-3 text-sm font-semibold text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {measurements.slice(0, 20).map((m) => (
                                    <tr key={m.id} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-3 text-sm text-gray-900">
                                            {new Date(m.date).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                        </td>
                                        <td className="py-3 px-3 text-sm text-right font-semibold text-gray-900">
                                            {m.weight ? `${m.weight} kg` : '-'}
                                        </td>
                                        <td className="py-3 px-3 text-sm text-right text-gray-700">
                                            {m.body_fat_percentage ? `${m.body_fat_percentage}%` : '-'}
                                        </td>
                                        <td className="py-3 px-3 text-sm text-right text-gray-700">
                                            {m.chest ? `${m.chest} cm` : '-'}
                                        </td>
                                        <td className="py-3 px-3 text-sm text-right text-gray-700">
                                            {m.waist ? `${m.waist} cm` : '-'}
                                        </td>
                                        <td className="py-3 px-3 text-sm text-right text-gray-700">
                                            {m.left_arm || m.right_arm ? `${m.left_arm || m.right_arm} cm` : '-'}
                                        </td>
                                        <td className="py-3 px-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleEdit(m)}
                                                    className="p-1.5 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                >
                                                    <Edit2 className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(m.id)}
                                                    className="p-1.5 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Card>
            )}

            {/* Add/Edit Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingMeasurement ? 'Edit Measurement' : 'Log Measurement'}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Date"
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                        required
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Weight (kg)"
                            type="number"
                            step="0.1"
                            value={formData.weight}
                            onChange={(e) => setFormData({ ...formData, weight: e.target.value })}
                            placeholder="75.5"
                        />
                        <Input
                            label="Body Fat %"
                            type="number"
                            step="0.1"
                            value={formData.body_fat_percentage}
                            onChange={(e) => setFormData({ ...formData, body_fat_percentage: e.target.value })}
                            placeholder="15.5"
                        />
                    </div>

                    <div className="border-t pt-4">
                        <h4 className="text-sm font-semibold text-gray-700 mb-3">Body Measurements (cm)</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Chest"
                                type="number"
                                step="0.1"
                                value={formData.chest}
                                onChange={(e) => setFormData({ ...formData, chest: e.target.value })}
                                placeholder="100"
                            />
                            <Input
                                label="Waist"
                                type="number"
                                step="0.1"
                                value={formData.waist}
                                onChange={(e) => setFormData({ ...formData, waist: e.target.value })}
                                placeholder="80"
                            />
                            <Input
                                label="Hips"
                                type="number"
                                step="0.1"
                                value={formData.hips}
                                onChange={(e) => setFormData({ ...formData, hips: e.target.value })}
                                placeholder="95"
                            />
                            <Input
                                label="Left Arm"
                                type="number"
                                step="0.1"
                                value={formData.left_arm}
                                onChange={(e) => setFormData({ ...formData, left_arm: e.target.value })}
                                placeholder="35"
                            />
                            <Input
                                label="Right Arm"
                                type="number"
                                step="0.1"
                                value={formData.right_arm}
                                onChange={(e) => setFormData({ ...formData, right_arm: e.target.value })}
                                placeholder="35"
                            />
                            <Input
                                label="Left Thigh"
                                type="number"
                                step="0.1"
                                value={formData.left_thigh}
                                onChange={(e) => setFormData({ ...formData, left_thigh: e.target.value })}
                                placeholder="55"
                            />
                            <Input
                                label="Right Thigh"
                                type="number"
                                step="0.1"
                                value={formData.right_thigh}
                                onChange={(e) => setFormData({ ...formData, right_thigh: e.target.value })}
                                placeholder="55"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="text-sm font-semibold text-gray-700 mb-1 block">
                            Notes (Optional)
                        </label>
                        <textarea
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            placeholder="Any observations or context..."
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                            rows={2}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
                            Cancel
                        </Button>
                        <Button type="submit" className="flex-1">
                            {editingMeasurement ? 'Update' : 'Log Measurement'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
};

export default BodyMeasurementsTracker;
