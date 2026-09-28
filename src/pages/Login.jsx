import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DumbbellIcon, SparklesIcon } from 'lucide-react';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp, resetPassword } = useAuth();

  const [view, setView] = useState('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in (page refresh / direct access)
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.trim().toLowerCase();

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Password validation
    if (view === 'sign_up') {
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /\d/.test(password);

      if (!hasUpperCase || !hasLowerCase || !hasNumber) {
        setError('Password must contain uppercase, lowercase, and numbers');
        setLoading(false);
        return;
      }

      if (!name || name.trim().length < 2) {
        setError('Please enter a valid name (at least 2 characters)');
        setLoading(false);
        return;
      }
    } else {
      if (!password) {
        setError('Password is required');
        setLoading(false);
        return;
      }
    }

    try {
      if (view === 'sign_up') {
        const { error: signupError } = await signUp(
          normalizedEmail,
          password,
          { name: name.trim() }
        );

        if (signupError) throw signupError;

        toast.success('Account created successfully!', { duration: 3000 });
        setLoading(false);
      } else {
        await signIn(normalizedEmail, password);
        toast.success('Welcome back!', { duration: 2000 });
        navigate('/', { replace: true });
      }
      } catch (error) {
        setError(error?.message || 'Invalid credentials. Please try again.');
      setLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      setError('Enter your email address to receive a reset link');
      return;
    }

    setResetLoading(true);
    setError('');

    try {
      await resetPassword(normalizedEmail);
      toast.success('Password reset email sent', { duration: 4000 });
    } catch (error) {
      setError(error?.message || 'Could not send reset email. Please try again.');
    } finally {
      setResetLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 px-4 transition-colors">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="relative">
              <DumbbellIcon className="w-12 h-12 text-primary-600 " aria-hidden="true" />
              <SparklesIcon className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" aria-hidden="true" />
            </div>
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
            FitTrack
          </h1>
          <p className="text-gray-600 dark:text-gray-400 ">
            Track your fitness journey with ease
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 p-6 md:p-8 transition-colors">
          <div className="mb-6">
            <div className="flex space-x-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
              {['sign_in', 'sign_up'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setView(type);
                    setError('');
                  }}
                  aria-pressed={view === type}
                  className={`flex-1 py-2 px-4 min-h-[44px] rounded-md font-medium transition-colors ${view === type
                      ? 'bg-white dark:bg-gray-900 text-primary-600 dark:text-primary-300 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white'
                    }`}
                >
                  {type === 'sign_in' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'sign_up' && (
              <div>
                <label htmlFor="login-name" className="sr-only">Your name</label>
                <input
                  id="login-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                  required
                  className="w-full px-4 py-2 min-h-[44px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white "
                />
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="sr-only">Email address</label>
              <input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                autoComplete="email"
                required
                className="w-full px-4 py-2 min-h-[44px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white "
              />
            </div>

            <div>
              <label htmlFor="login-password" className="sr-only">Password</label>
              <input
                id="login-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={view === 'sign_up' ? 'new-password' : 'current-password'}
                required
                minLength={view === 'sign_up' ? 8 : undefined}
                pattern={
                  view === 'sign_up'
                    ? '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*'
                    : undefined
                }
                className="w-full px-4 py-2 min-h-[44px] border rounded-lg dark:bg-gray-800 dark:border-gray-700 dark:text-white "
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
              {loading ? 'Loading...' : view === 'sign_in' ? 'Sign In' : 'Sign Up'}
            </button>

            {view === 'sign_in' && (
              <button
                type="button"
                onClick={handlePasswordReset}
                disabled={resetLoading}
                className="w-full min-h-[44px] text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-300 disabled:opacity-50"
              >
                {resetLoading ? 'Sending reset email...' : 'Forgot password?'}
              </button>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;

