import { useContext } from 'react';
import GymSessionContext from '../context/GymSessionContext';

export const formatHMS = (totalSeconds) => {
  const safeSecs = Math.max(0, Math.floor(totalSeconds || 0));
  const hrs = Math.floor(safeSecs / 3600);
  const mins = Math.floor((safeSecs % 3600) / 60);
  const secs = safeSecs % 60;

  if (hrs > 0) {
    return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

export const formatClockTime = (isoString) => {
  if (!isoString) return '--:--';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '--:--';
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const useGymSession = () => {
  const context = useContext(GymSessionContext);
  if (!context) {
    throw new Error('useGymSession must be used within a GymSessionProvider');
  }
  return context;
};

export default useGymSession;
