// React import no longer needed with React 17+ JSX transform
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  // Outlet, // Now handled within MainLayout
  // useNavigate, // Now handled within LoginPage
  // Link as RouterLink, // Now handled within specific components
  // useParams // Now handled within HubPage
} from "react-router-dom";
// Remove Chakra UI component imports - they belong in page/component files
// import { ... } from "@chakra-ui/react";
// import { ... } from '@chakra-ui/icons';

// Import Page Components
import LoginPage from './pages/LoginPage';
// import WorkspacePage from './pages/WorkspacePage'; // Removed
import ProfilePage from './pages/ProfilePage'; // Keep for now, might be removed later
// import HubPage from './pages/HubPage'; // Removed - Handled by BriefingPanel
// import GoalsPage from './pages/GoalsPage'; // Removed - Handled by BriefingPanel/Map
import TeamPage from './pages/TeamPage'; // Added back for dedicated team pages
// import DepartmentPage from './pages/DepartmentPage'; // Removed - Handled by BriefingPanel
// import ExplorePage from './pages/ExplorePage'; // Removed - Handled by Map/BriefingPanel
import AuthCallbackPage from './pages/AuthCallbackPage';

// Import Layout and ProtectedRoute Components
import MainLayout from './components/layout/MainLayout';
import ProtectedRoute from './components/auth/ProtectedRoute';
import { AuthProvider } from "./context/AuthContext";

// --- Placeholder Page Components (REMOVED) ---
// function LoginPage() { ... }
// function WorkspacePage() { ... }
// function ProfilePage() { ... }
// function HubPage() { ... }

// --- Core App Layout Component (REMOVED) ---
// function MainLayout() { ... }

// --- Main App Component with Routing ---

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Protected Routes */}
          <Route path="/map" element={ <ProtectedRoute> <MainLayout /> </ProtectedRoute> } />

          {/* Example of another protected route */}
          <Route path="/profile/:userId" element={ <ProtectedRoute> <ProfilePage /> </ProtectedRoute>} />

          {/* Team page route */}
          <Route path="/team/:teamId" element={ <ProtectedRoute> <TeamPage /> </ProtectedRoute>} />

          {/* Other routes that could be added later */}
          {/* <Route path="/hub/:hubId" element={<HubPage />} /> */}
          {/* <Route path="/goals" element={<GoalsPage />} /> */}
          {/* <Route path="/department/:deptId" element={<DepartmentPage />} /> */}
          {/* <Route path="/explore" element={<ExplorePage />} /> */}

          {/* Default route: Redirect to login if not authenticated,
               ProtectedRoute on /map will handle redirecting logged-in users */}
          <Route path="/" element={<Navigate to="/map" replace />} />

          {/* Catch-all: Redirect unknown routes to map (which will redirect to login if needed) */}
          <Route path="*" element={<Navigate to="/map" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
