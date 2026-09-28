import { Component } from 'react';

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log to console in development
    if (import.meta.env.MODE === 'development') {
      console.error('Error caught by boundary:', error, errorInfo);
    }

    // Store error info for display
    this.setState(prevState => ({
      errorInfo,
      errorCount: prevState.errorCount + 1
    }));

    // In production, you would send this to an error tracking service
    // Example: Sentry.captureException(error, { extra: errorDetails });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 p-4 transition-colors">
          <div className="max-w-md w-full bg-white dark:bg-gray-900 rounded-2xl shadow-lifted border border-gray-100 dark:border-gray-800 p-6">
            <div className="text-6xl mb-4 text-center" aria-hidden="true">⚠️</div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2 text-center">
              Oops! Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6 text-center">
              We encountered an unexpected error. Your data is safe.
            </p>

            {import.meta.env.MODE === 'development' && this.state.error && (
              <div className="mb-4 p-3 bg-danger-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm font-mono text-danger-600 dark:text-red-300 break-all">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleReset}
                className="flex-1 px-4 py-3 min-h-[48px] bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-100 font-semibold rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 px-4 py-3 min-h-[48px] bg-primary-600 text-white font-semibold rounded-lg hover:bg-primary-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>

            <p className="text-[13px] text-gray-500 dark:text-gray-400 text-center mt-4">
              If this persists, try clearing your browser cache
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

