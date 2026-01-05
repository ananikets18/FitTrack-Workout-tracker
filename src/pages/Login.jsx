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
  const [error, setError] = useState('');

  // Redirect if logged in
  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    } else {
      setLoading(false); // prevents loading lock
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const normalizedEmail = email.trim().toLowerCase();
    const limiter = view === 'sign_up' ? signupRateLimiter : loginRateLimiter;

    // Rate limit check (UX only)
    const rateLimitCheck = limiter.isAllowed(normalizedEmail);
    if (!rateLimitCheck.allowed) {
      setError(rateLimitCheck.reason);
      setLoading(false);
      return;
    }

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
        const { data, error: signupError } = await signUp(
          normalizedEmail,
          password,
          { name: name.trim() }
        );

        if (signupError) throw signupError;

        limiter.recordAttempt(normalizedEmail, true);

        if (data?.user && !data?.session) {
          toast.success('Check your email to verify your account!', {
            duration: 6000,
            icon: '📧'
          });
        } else if (data?.session) {
          toast.success('Account created successfully!', { duration: 3000 });
        }

        setView('sign_in');
        setEmail('');
        setPassword('');
        setName('');
        setLoading(false);
      } else {
        await signIn(normalizedEmail, password);

        limiter.recordAttempt(normalizedEmail, true);

        toast.success('Welcome back!', { duration: 2000 });
        return; // let useEffect handle redirect
      }
    } catch (err) {
      limiter.recordAttempt(normalizedEmail, false);

      const remaining = limiter.getRemainingAttempts(normalizedEmail);
      setError(
        remaining > 0 && remaining <= 3
          ? `Invalid credentials. (${remaining} attempts remaining)`
          : 'Invalid credentials.'
      );

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
              {['sign_in', 'sign_up'].map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    setView(type);
                    setError('');
                  }}
                  className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${view === type
                      ? 'bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                    }`}
                >
                  {type === 'sign_in' ? 'Sign In' : 'Sign Up'}
                </button>
              ))}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {view === 'sign_up' && (
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
                required
                className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
              />
            )}

            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />

            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              minLength={view === 'sign_up' ? 8 : undefined}
              pattern={
                view === 'sign_up'
                  ? '(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).*'
                  : undefined
              }
              className="w-full px-4 py-2 border rounded-lg dark:bg-gray-700 dark:text-white"
            />

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg disabled:opacity-50"
            >
              {loading ? 'Loading...' : view === 'sign_in' ? 'Sign In' : 'Sign Up'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
