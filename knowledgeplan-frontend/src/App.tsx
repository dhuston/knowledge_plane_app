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

// Import Layout Component
import MainLayout from './components/layout/MainLayout';

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
      <Routes>
        {/* Routes without the main layout */}
        <Route path="/login" element={<LoginPage />} />

        {/* Routes wrapped by the main layout */}
        <Route path="/" element={<MainLayout />}>
          <Route path="workspace" element={<WorkspacePage />} />
          <Route path="profile" element={<ProfilePage />} />
          <Route path="hub/:hubId" element={<HubPage />} />
          {/* Default route within layout: Redirect to workspace */}
          <Route index element={<Navigate to="workspace" replace />} /> 
        </Route>

        {/* Catch-all for unmatched routes (within layout or outside) */}
        {/* For Slice 0, redirect unknown routes back to login */} 
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
