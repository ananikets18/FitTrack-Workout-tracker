import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const ResetPassword = () => {
  const navigate = useNavigate();
  const { user, updatePassword } = useAuth();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) {
      toast('Please use the password reset link from your email first.', {
        duration: 4000,
      });
    }
  }, [user]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await updatePassword(password);
      toast.success('Password updated successfully');
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err?.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 px-4 transition-colors">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-2">Reset Password</h1>
          <p className="text-gray-600 dark:text-gray-400">Choose a new password for your FitTrack account.</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-lifted border border-gray-100 dark:border-gray-800 p-6 md:p-8 transition-colors">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="reset-password" className="sr-only">New password</label>
              <input
                id="reset-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="New password"
                autoComplete="new-password"
                minLength={8}
                className="w-full px-4 py-2 min-h-[44px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label htmlFor="reset-confirm" className="sr-only">Confirm new password</label>
              <input
                id="reset-confirm"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                autoComplete="new-password"
                minLength={8}
                className="w-full px-4 py-2 min-h-[44px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white"
              />
            </div>

            {error && (
              <div role="alert" className="bg-danger-50 dark:bg-red-900/30 text-danger-600 dark:text-red-300 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-primary-600 hover:bg-primary-700 text-white py-2.5 min-h-[48px] rounded-lg disabled:opacity-50 font-semibold transition-colors"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
