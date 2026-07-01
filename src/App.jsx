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
// Reached only from confirmation-email links — lazy-load it too.
const ManageBooking = lazy(() => import('./pages/ManageBooking.jsx'));
// Legal pages — rarely visited, keep them out of the main bundle.
const Privacy = lazy(() => import('./pages/Privacy.jsx'));
const Terms = lazy(() => import('./pages/Terms.jsx'));

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
        path="/manage"
        element={
          <Suspense fallback={<Loader />}>
            <ManageBooking />
          </Suspense>
        }
      />
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
      <Route
        path="/privacy"
        element={
          <Suspense fallback={<Loader />}>
            <Privacy />
          </Suspense>
        }
      />
      <Route
        path="/terms"
        element={
          <Suspense fallback={<Loader />}>
            <Terms />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default App;
