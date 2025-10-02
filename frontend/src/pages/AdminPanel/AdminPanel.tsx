import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { CreateObject } from './CreateObject';
import { objectsService } from '../../services/objects.service';
import type { CityObject } from '../../types/city-object.types';
import { Link } from 'react-router-dom';
import styles from './AdminPanel.module.scss';

type Tab = 'objects' | 'create';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  objectName: string;
}

const DeleteModal: FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm, objectName }) => {
  if (!isOpen) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h3>Подтверждение удаления</h3>
          <p>
            Вы уверены, что хотите удалить объект "{objectName}"?<br />
            Это действие удалит все связанные данные и не может быть отменено.
          </p>
          <div className={styles.modalActions}>
            <button 
              onClick={onClose}
              className={styles.cancelButton}
            >
              Отмена
            </button>
            <button 
              onClick={onConfirm}
              className={styles.confirmButton}
            >
              Удалить
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

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
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    objectId: string | null;
    objectName: string;
  }>({
    isOpen: false,
    objectId: null,
    objectName: ''
  });

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

  const handleDeleteClick = (e: React.MouseEvent, object: CityObject) => {
    e.preventDefault();
    setDeleteModal({
      isOpen: true,
      objectId: object.id,
      objectName: object.name
    });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModal.objectId) return;

    try {
      setLoading(true);
      await objectsService.deleteObject(deleteModal.objectId);
      const updatedObjects = objects.filter(obj => obj.id !== deleteModal.objectId);
      setObjects(updatedObjects);
    } catch (error) {
      setError('Не удалось удалить объект');
      console.error('Delete error:', error);
    } finally {
      setLoading(false);
      setDeleteModal({ isOpen: false, objectId: null, objectName: '' });
    }
  };

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
                    <button 
                      onClick={(e) => handleDeleteClick(e, object)}
                      className={styles.deleteButton}
                      disabled={loading}
                    >
                      {loading ? '...' : 'Удалить объект'}
                    </button>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : (
          <CreateObject />
        )}
      </div>

      <DeleteModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, objectId: null, objectName: '' })}
        onConfirm={handleDeleteConfirm}
        objectName={deleteModal.objectName}
      />
    </div>
  );
};
