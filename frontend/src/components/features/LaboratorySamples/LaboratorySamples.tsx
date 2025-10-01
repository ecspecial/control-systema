import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { objectsService } from '../../../services/objects.service';
import styles from './LaboratorySamples.module.scss';

interface LaboratorySamplesProps {
  objectId: string;
  userRole: string;
  onNotification: (message: string, type: 'success' | 'error') => void;
}

export const LaboratorySamples: FC<LaboratorySamplesProps> = ({
  objectId,
  userRole,
  onNotification
}) => {
  const [samples, setSamples] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sampleForm, setSampleForm] = useState({
    materialName: '',
    description: ''
  });

  const fetchSamples = async () => {
    try {
      const data = await objectsService.getLaboratorySamples(objectId);
      setSamples(data);
    } catch (error) {
      console.error('Error fetching samples:', error);
      onNotification('Ошибка при загрузке списка проб', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSamples();
  }, [objectId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await objectsService.createLaboratorySample(objectId, sampleForm);
      onNotification('Запрос на отбор проб создан', 'success');
      setSampleForm({ materialName: '', description: '' });
      fetchSamples();
    } catch (error) {
      console.error('Error creating sample:', error);
      onNotification('Ошибка при создании запроса', 'error');
    }
  };

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className={styles.samplesContent}>
      {userRole === 'inspector' && (
        <form onSubmit={handleSubmit} className={styles.sampleForm}>
          <div className={styles.formGroup}>
            <label>Наименование материала</label>
            <input
              type="text"
              value={sampleForm.materialName}
              onChange={(e) => setSampleForm(prev => ({ ...prev, materialName: e.target.value }))}
              className={styles.input}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label>Описание</label>
            <textarea
              value={sampleForm.description}
              onChange={(e) => setSampleForm(prev => ({ ...prev, description: e.target.value }))}
              className={styles.textarea}
              required
            />
          </div>
          <button type="submit" className={styles.submitButton}>
            Создать запрос
          </button>
        </form>
      )}

      <div className={styles.samplesList}>
        <h3>Список запросов на отбор проб</h3>
        {samples.length === 0 ? (
          <div className={styles.noSamples}>Нет запросов на отбор проб</div>
        ) : (
          samples.map(sample => (
            <div key={sample.id} className={styles.sampleItem}>
              <div className={styles.sampleHeader}>
                <div className={styles.materialName}>{sample.materialName}</div>
                <div className={styles.sampleStatus} data-status={sample.status}>
                  {sample.status === 'pending' && 'Ожидает обработки'}
                  {sample.status === 'in_progress' && 'В работе'}
                  {sample.status === 'completed' && 'Завершено'}
                </div>
              </div>
              <div className={styles.sampleDescription}>{sample.description}</div>
              <div className={styles.sampleDate}>
                {new Date(sample.createdAt).toLocaleString('ru')}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
