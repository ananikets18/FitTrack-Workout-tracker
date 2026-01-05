import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { DumbbellIcon, SparklesIcon } from 'lucide-react';
import { loginRateLimiter, signupRateLimiter } from '../utils/rateLimiter';
import toast from 'react-hot-toast';

const Login = () => {
  const navigate = useNavigate();
  const { user, signIn, signUp } = useAuth();
  const [view, setView] = useState('sign_in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Redirect if already logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Check rate limiting
    const limiter = view === 'sign_up' ? signupRateLimiter : loginRateLimiter;
    const rateLimitCheck = limiter.isAllowed(email.toLowerCase());

    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.reason);
      setLoading(false);
      return;
    }

    // Client-side validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    // Password validation - stricter for signup, lenient for signin
    if (view === 'sign_up') {
      // Strict validation for new signups
      if (password.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      // Additional password strength check for signup
      const hasUpperCase = /[A-Z]/.test(password);
      const hasLowerCase = /[a-z]/.test(password);
      const hasNumber = /[0-9]/.test(password);

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
      // For sign in, just check it's not empty (allow legacy passwords)
      if (!password || password.length === 0) {
        setError('Password is required');
        setLoading(false);
        return;
      }
    }

    try {
      if (view === 'sign_up') {
        await signUp(email.trim().toLowerCase(), password, { name: name.trim() });

        // Record successful attempt
        limiter.recordAttempt(email.toLowerCase(), true);

        // Show success message
        toast.success('Check your email to verify your account!', {
          duration: 6000,
          icon: '📧'
        });

        // Switch to sign-in view and clear form
        setView('sign_in');
        setEmail('');
        setPassword('');
        setName('');
        setLoading(false);

      } else {
        // Sign in
        await signIn(email.trim().toLowerCase(), password);

        // Record successful attempt
        limiter.recordAttempt(email.toLowerCase(), true);

        // Keep loading state - navigation will happen via useEffect
        // when user state is updated
      }
    } catch (err) {
      // Record failed attempt
      limiter.recordAttempt(email.toLowerCase(), false);

      const remaining = limiter.getRemainingAttempts(email.toLowerCase());
      if (remaining > 0 && remaining <= 3) {
        setError(`${err.message} (${remaining} attempts remaining)`);
      } else {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 px-4">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="relative">
              <DumbbellIcon className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              <SparklesIcon className="w-6 h-6 text-yellow-400 absolute -top-1 -right-1 animate-pulse" />
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
            FitTrack
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Track your fitness journey with ease
          </p>
        </div>

        {/* Auth Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">
          <div className="mb-6">
            <div className="flex space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              <button
                onClick={() => {
                  setView('sign_in');
                  setError(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${view === 'sign_in'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                Sign In
              </button>
              <button
                onClick={() => {
                  setView('sign_up');
                  setError(null);
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${view === 'sign_up'
                    ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                  }`}
              >
                Sign Up
              </button>
            </div>
          </div>

          {/* Custom Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'sign_up' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  placeholder="Your name"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                placeholder="••••••••"
              />
              {view === 'sign_up' && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Min 8 chars with uppercase, lowercase, and numbers
                </p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : view === 'sign_in' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-gray-600 dark:text-gray-400">
          By continuing, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default Login;
