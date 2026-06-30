import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home.jsx';
import BookingPage from './pages/BookingPage.jsx';
import BookingSuccess from './pages/BookingSuccess.jsx';
import NotFound from './pages/NotFound.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';

// Admin + login are owner-only — keep them out of the public bundle.
const Login = lazy(() => import('./pages/Login.jsx'));
const Admin = lazy(() => import('./pages/Admin.jsx'));

const Loader = () => (
  <div className="grid min-h-screen place-items-center bg-forest-50">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest/20 border-t-forest" />
  </div>
);

const App = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/book" element={<BookingPage />} />
      <Route path="/booking-success" element={<BookingSuccess />} />
      <Route
        path="/login"
        element={
          <Suspense fallback={<Loader />}>
            <Login />
          </Suspense>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <Suspense fallback={<Loader />}>
              <Admin />
            </Suspense>
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
