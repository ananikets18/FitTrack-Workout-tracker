import { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import { TemplateProvider } from './context/TemplateContext';
import { AuthProvider } from './context/AuthContext';
import { PreferencesProvider } from './context/PreferencesContext';
import { SleepProvider } from './context/SleepContext';
import { NutritionProvider } from './context/NutritionContext';
import { BodyMeasurementsProvider } from './context/BodyMeasurementsContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Lazy load pages for better performance
const Home = lazy(() => import('./pages/Home'));
const WorkoutLogMobile = lazy(() => import('./pages/WorkoutLogMobile'));
const History = lazy(() => import('./pages/History'));
const Statistics = lazy(() => import('./pages/Statistics'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Health = lazy(() => import('./pages/Health'));
const Login = lazy(() => import('./pages/Login'));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600" />
  </div>
);

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <PreferencesProvider>
          <SleepProvider>
            <NutritionProvider>
              <BodyMeasurementsProvider>
                <TemplateProvider>
                  <WorkoutProvider>
                    <Router>
                      <Toaster
                        position="top-center"
                        toastOptions={{
                          duration: 3000,
                          style: {
                            background: '#363636',
                            color: '#fff',
                            fontSize: '16px',
                            padding: '16px',
                            borderRadius: '12px',
                          },
                          success: {
                            duration: 2000,
                            iconTheme: {
                              primary: '#10b981',
                              secondary: '#fff',
                            },
                          },
                          error: {
                            duration: 3000,
                            iconTheme: {
                              primary: '#ef4444',
                              secondary: '#fff',
                            },
                          },
                        }}
                      />

                      <Routes>
                        {/* Public Routes */}
                        <Route
                          path="/login"
                          element={
                            <Suspense fallback={<PageLoader />}>
                              <Login />
                            </Suspense>
                          }
                        />

                        {/* Protected Routes */}
                        <Route
                          path="/"
                          element={
                            <ProtectedRoute>
                              <Layout />
                            </ProtectedRoute>
                          }
                        >
                          <Route
                            index
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <Home />
                              </Suspense>
                            }
                          />
                          <Route
                            path="log"
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <WorkoutLogMobile />
                              </Suspense>
                            }
                          />
                          <Route
                            path="history"
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <History />
                              </Suspense>
                            }
                          />
                          <Route
                            path="stats"
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <Statistics />
                              </Suspense>
                            }
                          />
                          <Route
                            path="calendar"
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <Calendar />
                              </Suspense>
                            }
                          />
                          <Route
                            path="health"
                            element={
                              <Suspense fallback={<PageLoader />}>
                                <Health />
                              </Suspense>
                            }
                          />
                        </Route>
                      </Routes>
                    </Router>
                  </WorkoutProvider>
                </TemplateProvider>
              </BodyMeasurementsProvider>
            </NutritionProvider>
          </SleepProvider>
        </PreferencesProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;

