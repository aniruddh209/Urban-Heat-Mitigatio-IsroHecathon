import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/auth/LoginPage';
import SignupPage from './pages/auth/SignupPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import SimulationPage from './pages/features/SimulationPage';
import VulnerabilityPage from './pages/features/VulnerabilityPage';
import AssistantPage from './pages/features/AssistantPage';
import AlertsPage from './pages/features/AlertsPage';
import CityDetailPage from './pages/features/CityDetailPage';
import AdminPage from './pages/admin/AdminPage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/simulation" element={<SimulationPage />} />
        <Route path="/vulnerability" element={<VulnerabilityPage />} />
        <Route path="/assistant" element={<AssistantPage />} />
        <Route path="/alerts" element={<AlertsPage />} />
        <Route path="/city" element={<CityDetailPage />} />
        <Route path="/admin" element={<AdminPage />} />
      </Routes>
    </Router>
  );
}

export default App;
