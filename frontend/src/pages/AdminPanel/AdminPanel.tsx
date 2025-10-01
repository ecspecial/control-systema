import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { CreateObject } from './CreateObject';
import { objectsService } from '../../services/objects.service';
import type { CityObject } from '../../types/city-object.types';
import { Link } from 'react-router-dom';
import styles from './AdminPanel.module.scss';

type Tab = 'objects' | 'create';

const getStatusDisplay = (status: string): string => {
  const statusMap: Record<string, string> = {
    'planned': 'Ожидает назначения контроля',
    'assigned': 'Ожидает активации',
    'pending_activation': 'Ожидает подтверждения акта открытия',
    'active': 'В работе',
    'suspended': 'Работы приостановлены',
    'pending_fixes': 'Требуется устранение замечаний',
    'fixing': 'Устранение замечаний',
    'pending_approval': 'Ожидает проверки устранения',
    'completed': 'Работы завершены',
    'accepted': 'Работы приняты'
  };

  return statusMap[status] || status;
};

export const AdminPanel: FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('objects');
  const [objects, setObjects] = useState<CityObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const data = await objectsService.getAll();
        setObjects(data);
      } catch (err) {
        setError('Не удалось загрузить список объектов');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (activeTab === 'objects') {
      fetchObjects();
    }
  }, [activeTab]);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Панель администратора</h1>
      </div>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'objects' ? styles.active : ''}`}
          onClick={() => setActiveTab('objects')}
        >
          Список объектов
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'create' ? styles.active : ''}`}
          onClick={() => setActiveTab('create')}
        >
          Создать объект
        </button>
      </div>

      <div className={styles.content}>
        {activeTab === 'objects' ? (
          <div className={styles.objectsList}>
            {loading ? (
              <div className={styles.loading}>Загрузка...</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : objects.length === 0 ? (
              <div className={styles.empty}>Нет объектов</div>
            ) : (
              <div className={styles.objectsGrid}>
                {objects.map((object) => (
                  <Link 
                    to={`/objects/${object.id}`} 
                    key={object.id}
                    className={styles.objectCard}
                  >
                    <h3>{object.name}</h3>
                    <p className={styles.address}>{object.address}</p>
                    <span className={`${styles.status} ${styles[object.status]}`}>
                      {getStatusDisplay(object.status)}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <CreateObject />
        )}
      </div>
    </div>
  );
};
