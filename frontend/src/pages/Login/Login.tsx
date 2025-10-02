import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FC } from 'react';
import { authService } from '../../services/auth.service';
import mainLogo from '../../assets/images/main_logo.png';
import styles from './Login.module.scss';
import { UserRole } from '../../types/user.types';

export const Login: FC = () => {
  const navigate = useNavigate();
  const [login, setLogin] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await authService.login({ login, password });
      authService.setToken(response.accessToken);
      authService.setUser(response.user);
      
      // Redirect based on role
      if (response.user.role === UserRole.ADMIN) {
        navigate('/admin');
      } else {
        navigate('/');
      }
    } catch (err) {
      setError('Неверный логин или пароль');
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.container}>
        <div className={styles.header}>
          <img src={mainLogo} alt="Logo" className={styles.logo} />
          <h1>Система контроля благоустройства</h1>
        </div>
        <div className={styles.formWrapper}>
          <form onSubmit={handleSubmit}>
            {error && <div className={styles.error}>{error}</div>}
            <div className={styles.formGroup}>
              <label htmlFor="login">Логин</label>
              <input
                type="text"
                id="login"
                value={login}
                onChange={(e) => setLogin(e.target.value)}
                placeholder="Введите логин"
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="password">Пароль</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Введите пароль"
                required
              />
            </div>
            <button type="submit" className={styles.button}>
              Войти
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
