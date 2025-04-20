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
// import TeamPage from './pages/TeamPage'; // Removed - Handled by BriefingPanel
// import DepartmentPage from './pages/DepartmentPage'; // Removed - Handled by BriefingPanel
// import ExplorePage from './pages/ExplorePage'; // Removed - Handled by Map/BriefingPanel
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

          {/* Main route rendering the Layout which contains the Map */}
          <Route path="/map" element={<MainLayout />} />
          
          {/* Specific entity views - might be removed if BriefingPanel handles all */}
          <Route path="/profile/:userId" element={<ProfilePage />} />
          {/* <Route path="/hub/:hubId" element={<HubPage />} /> */} 
          {/* <Route path="/goals" element={<GoalsPage />} /> */} 
          {/* <Route path="/team/:teamId" element={<TeamPage />} /> */} 
          {/* <Route path="/department/:deptId" element={<DepartmentPage />} /> */}
          {/* <Route path="/explore" element={<ExplorePage />} /> */}

          {/* Default route: Redirect to map view */}
          <Route path="/" element={<Navigate to="/map" replace />} /> 

          {/* Catch-all: Redirect unknown routes to map or login? For now, map */}
          <Route path="*" element={<Navigate to="/map" replace />} /> 
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
