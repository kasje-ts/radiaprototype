import { Navigate } from 'react-router';
import { useApp } from '../data/AppContext';

export function MonthlyPlanRedirect() {
  const { getNow } = useApp();
  const now = getNow();
  return <Navigate to={`/month/${now.getMonth()}/${now.getFullYear()}`} replace />;
}