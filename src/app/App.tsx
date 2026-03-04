import { RouterProvider } from 'react-router';
import { router } from './routes';
import { AppProvider } from './data/AppContext';

export default function App() {
  return (
    <AppProvider>
      <RouterProvider router={router} />
    </AppProvider>
  );
}
