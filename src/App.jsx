import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { WorkoutProvider } from './context/WorkoutContext';
import { Toaster } from 'react-hot-toast';
import ErrorBoundary from './components/common/ErrorBoundary';
import Layout from './components/layout/Layout';
import Home from './pages/Home';
import WorkoutLogMobile from './pages/WorkoutLogMobile';
import History from './pages/History';
import Statistics from './pages/Statistics';

function App() {
  return (
    <ErrorBoundary>
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
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="log" element={<WorkoutLogMobile />} />
            <Route path="history" element={<History />} />
            <Route path="stats" element={<Statistics />} />
          </Route>
        </Routes>
      </Router>
    </WorkoutProvider>
    </ErrorBoundary>
  );
}

export default App;
