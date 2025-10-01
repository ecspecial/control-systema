import { useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import type { FC } from 'react';
import type { UserProfile } from '../../../types/auth.types';
import { authService } from '../../../services/auth.service';
import mainLogo from '../../../assets/images/main_logo.png';
import styles from './MainMenu.module.scss';

export const MainMenu: FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [user, setUser] = useState<UserProfile | null>(null);
  const navigate = useNavigate();
  const location = useLocation(); // Add this

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setUser(JSON.parse(userStr));
    } else {
      setUser(null);
    }
  }, [location.pathname]); // Re-run when route changes

  const handleLogout = () => {
    authService.logout(); // Use the new logout method that clears both token and user
    setUser(null); // Clear the local state as well
    navigate('/login');
  };

  const getRoleDisplay = (role: string) => {
    const roleMap: Record<string, string> = {
      'admin': 'Администратор',
      'control': 'Контроль строительства',
      'contractor': 'Подрядчик',
      'inspector': 'Инспектор'
    };
    return roleMap[role] || role;
  };

  return (
    <nav className={styles.menu}>
      <div className={styles.container}>
        <div className={styles.logo}>
          <img src={mainLogo} alt="City Service Logo" />
          <span>Система контроля благоустройства</span>
        </div>

        <div className={styles.rightSection}>
          <div className={`${styles.links} ${isMenuOpen ? styles.open : ''}`}>
            <NavLink 
              to="/" 
              className={({ isActive }) => isActive ? styles.active : ''}
              onClick={() => setIsMenuOpen(false)}
            >
              Объекты благоустройства
            </NavLink>
            {user?.role === 'admin' && (
              <NavLink 
                to="/admin" 
                className={({ isActive }) => isActive ? styles.active : ''}
                onClick={() => setIsMenuOpen(false)}
              >
                Панель администратора
              </NavLink>
            )}
          </div>

          {user && (
            <div className={styles.profile} onClick={() => setShowProfile(!showProfile)}>
              <div className={styles.profileIcon}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                </svg>
              </div>
              {showProfile && (
                <div className={styles.profileDropdown}>
                  <div className={styles.userName}>
                    {user.lastName} {user.firstName} {user.middleName}
                  </div>
                  <div className={styles.userRole}>
                    {getRoleDisplay(user.role)}
                  </div>
                  <button onClick={handleLogout} className={styles.logoutButton}>
                    Выйти
                  </button>
                </div>
              )}
            </div>
          )}

          <button 
            className={styles.menuButton} 
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M3 6h18M3 18h18" />
            </svg>
          </button>
        </div>
      </div>
    </nav>
  );
};
