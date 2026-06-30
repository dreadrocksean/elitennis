import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.jsx';

const ProtectedRoute = ({ children }) => {
  const { isOwner, loading } = useAuth();

  if (loading) {
    return (
      <div className="grid min-h-screen place-items-center bg-forest-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-forest/20 border-t-forest" />
      </div>
    );
  }

  if (!isOwner) return <Navigate to="/login" replace />;
  return children;
};

export default ProtectedRoute;
