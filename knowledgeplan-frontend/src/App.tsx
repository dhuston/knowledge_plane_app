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
import WorkspacePage from './pages/WorkspacePage';
import ProfilePage from './pages/ProfilePage';
import HubPage from './pages/HubPage';
import GoalsPage from './pages/GoalsPage';
import TeamPage from './pages/TeamPage';
import DepartmentPage from './pages/DepartmentPage';
import ExplorePage from './pages/ExplorePage';
import AuthCallbackPage from './pages/AuthCallbackPage';

// Import Layout Component
import MainLayout from './components/layout/MainLayout';
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
          {/* Routes without the main layout */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/auth/callback" element={<AuthCallbackPage />} />

          {/* Routes wrapped by the main layout */}
          <Route path="/" element={<MainLayout />}>
            <Route path="workspace" element={<WorkspacePage />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="hub/:hubId" element={<HubPage />} />
            <Route path="goals" element={<GoalsPage />} />
            <Route path="team/:teamId" element={<TeamPage />} />
            <Route path="profile/:userId" element={<ProfilePage />} />
            <Route path="department/:deptId" element={<DepartmentPage />} />
            <Route path="explore" element={<ExplorePage />} />
            {/* Default route within layout: Redirect to workspace */}
            <Route index element={<Navigate to="workspace" replace />} /> 
          </Route>

          {/* Catch-all for unmatched routes (within layout or outside) */}
          {/* For Slice 0, redirect unknown routes back to login */} 
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
