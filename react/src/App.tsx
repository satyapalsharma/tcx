import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { OverlayProvider } from './components/Overlay';
import { ToastProvider } from './components/Toast';
import Launcher from './pages/Launcher';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Jobs from './pages/Jobs';
import Dashboard from './pages/Dashboard';
import Analysis from './pages/Analysis';
import Design from './pages/Design';
import Develop from './pages/Develop';
import Connectors from './pages/Connectors';
import Rbac from './pages/Rbac';
import Settings from './pages/Settings';
import AuditLog from './pages/AuditLog';

export default function App() {
  return (
    <ToastProvider>
      <OverlayProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Launcher />} />
            <Route path="/login" element={<Login />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/jobs" element={<Jobs />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analysis" element={<Analysis />} />
            <Route path="/design" element={<Design />} />
            <Route path="/develop" element={<Develop />} />
            <Route path="/connectors" element={<Connectors />} />
            <Route path="/rbac" element={<Rbac />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/audit-log" element={<AuditLog />} />
          </Routes>
        </BrowserRouter>
      </OverlayProvider>
    </ToastProvider>
  );
}
