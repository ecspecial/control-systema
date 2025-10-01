import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import type { FC } from 'react';
import { Login } from './pages/Login/Login';
import { ObjectList } from './pages/ObjectList/ObjectList';
import { AdminPanel } from './pages/AdminPanel/AdminPanel';
import { MainMenu } from './components/layout/MainMenu/MainMenu';
import { authService } from './services/auth.service';
import { UserRole } from './types/user.types';
import { ObjectDetails } from './pages/ObjectDetails/ObjectDetails';

const PrivateRoute: FC<{ children: React.ReactNode; roles?: UserRole[] }> = ({ children, roles }) => {
  const location = useLocation();
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && user && !roles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: FC<{ children: React.ReactNode }> = ({ children }) => {
  if (authService.isAuthenticated()) {
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    
    if (user?.role === UserRole.ADMIN) {
      return <Navigate to="/admin" replace />;
    }
    
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <BrowserRouter>
      <MainMenu />
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/" element={<PrivateRoute><ObjectList /></PrivateRoute>} />
        <Route path="/objects/:id" element={<PrivateRoute><ObjectDetails /></PrivateRoute>} />
        <Route path="/admin" element={<PrivateRoute roles={[UserRole.ADMIN]}><AdminPanel /></PrivateRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;