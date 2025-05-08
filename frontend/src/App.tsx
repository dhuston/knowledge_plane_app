import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from "react-router-dom";
// Import Page Components
import LoginPage from './pages/LoginPage';
import ProfilePage from './pages/ProfilePage'; 
import TeamPage from './pages/TeamPage';
import AuthCallbackPage from './pages/AuthCallbackPage';

// Import Layout and ProtectedRoute Components
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './auth/ProtectedRoute';
import { AuthProvider } from "./auth/AuthContext";

/**
 * Main App Component with Routing
 */
function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected Routes */}
          <Route path="/workspace" element={ <ProtectedRoute> <MainLayout /> </ProtectedRoute> } />
          <Route path="/profile/:userId" element={ <ProtectedRoute> <ProfilePage /> </ProtectedRoute>} />
          <Route path="/team/:teamId" element={ <ProtectedRoute> <TeamPage /> </ProtectedRoute>} />
          {/* Temporarily redirect admin console to workspace */}
          <Route path="/admin" element={<Navigate to="/workspace" replace />} />
          {/* Redirect insights page to workspace since we've removed functionality */}
          <Route path="/insights" element={<Navigate to="/workspace" replace />} />

          {/* Default route: Redirect to login if not authenticated,
               ProtectedRoute on /workspace will handle redirecting logged-in users */}
          <Route path="/" element={<Navigate to="/workspace" replace />} />

          {/* Catch-all: Redirect unknown routes to workspace (which will redirect to login if needed) */}
          <Route path="*" element={<Navigate to="/workspace" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
