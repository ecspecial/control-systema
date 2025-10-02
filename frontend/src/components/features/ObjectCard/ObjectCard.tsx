import { useEffect, useRef } from 'react';
import type { FC } from 'react';
import { MapView } from '../../common/MapView/MapView';
// import { YMap } from '../../common/YMap/YMap';
import styles from './ObjectCard.module.scss';
import { CardUserRole } from '../../../types/user.types';
import { useNavigate } from 'react-router-dom';
import { ObjectStatus, ObjectStatusDisplay, type IConstructionObject } from '../../../types/city-object.types';

interface ObjectCardProps {
  object: IConstructionObject;
  userRole: CardUserRole;
  onView?: (id: string) => void;
  onActivate?: (id: string) => void;
  onScheduleChange?: (id: string) => void;
  onMaterialCheck?: (id: string) => void;
  onIssueReview?: (id: string) => void;
}

export const ObjectCard: FC<ObjectCardProps> = ({
  object,
  userRole,
  onView,
  onActivate,
  onScheduleChange,
  onMaterialCheck,
  onIssueReview
}) => {
  const navigate = useNavigate();

  const handleView = (id: string) => {
    navigate(`/objects/${id}`);
  };

  const getStatusText = (status: ObjectStatus): string => {
    return ObjectStatusDisplay[status] || status;
  };

  const getProgressColor = (progress: number) => {
    if (progress < 30) return styles.progressLow;
    if (progress < 70) return styles.progressMedium;
    return styles.progressHigh;
  };

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <h3 className={styles.title}>{object.name}</h3>
        <span className={`${styles.status} ${styles[object.status]}`}>
          {getStatusText(object.status)}
        </span>
      </div>

      <div className={styles.progress}>
        <div 
          className={`${styles.progressBar} ${getProgressColor(object.schedule.progress)}`}
          style={{ width: `${object.schedule.progress}%` }}
        />
        <span className={styles.progressText}>
          {object.schedule.progress}% готовности
        </span>
      </div>

      <div className={styles.info}>
        <div className={styles.row}>
          <span className={styles.label}>Виды работ:</span>
          <span className={styles.value}>{object.workTypes.join(', ')}</span>
        </div>
        
        <div className={styles.row}>
          <span className={styles.label}>Период выполнения:</span>
          <span className={styles.value}>
            {object.schedule.startDate} - {object.schedule.endDate}
            {object.schedule.hasChanges && (
              <span className={styles.changeIndicator}>Есть изменения</span>
            )}
          </span>
        </div>

        <div className={styles.row}>
          <span className={styles.label}>Ответственные:</span>
          <div className={styles.value}>
            <div>Инспектор: {object.responsible.inspector.name}</div>
            {object.responsible.contractor && (
              <div>Подрядчик: {object.responsible.contractor.name}</div>
            )}
          </div>
        </div>

        <div className={styles.statistics}>
          {object.statistics.activeIssues > 0 && (
            <div className={`${styles.stat} ${styles.issues}`}>
              {object.statistics.activeIssues} замечаний
            </div>
          )}
          {object.statistics.materialsToCheck > 0 && (
            <div className={`${styles.stat} ${styles.materials}`}>
              {object.statistics.materialsToCheck} материалов на проверке
            </div>
          )}
        </div>

        {object.lastVisit && (
          <div className={styles.lastVisit}>
            Последнее посещение: {object.lastVisit.date} ({object.lastVisit.user})
          </div>
        )}
      </div>

      {/* <YMap 
        center={[object.coordinates.lat, object.coordinates.lng]}
        coordinates={[
          [object.coordinates.lng, object.coordinates.lat],
          [object.coordinates.lng + 0.001, object.coordinates.lat],
          [object.coordinates.lng + 0.001, object.coordinates.lat + 0.001],
          [object.coordinates.lng, object.coordinates.lat + 0.001]
        ]}
      /> */}

    <MapView 
      center={[object.coordinates.lat, object.coordinates.lng]}
      coordinates={[
        [object.coordinates.lat, object.coordinates.lng],
        [object.coordinates.lat + 0.001, object.coordinates.lng],
        [object.coordinates.lat + 0.001, object.coordinates.lng + 0.001],
        [object.coordinates.lat, object.coordinates.lng + 0.001]
      ]}
    />

      <div className={styles.actions}>
        <button 
          className="button secondary" 
          onClick={() => handleView(object.id)}
        >
          Просмотр
        </button>

        {userRole === 'inspector' && object.status === ObjectStatus.PENDING_ACTIVATION && onActivate && (
          <button 
            className="button primary" 
            onClick={() => onActivate(object.id)}
          >
            Активировать объект
          </button>
        )}

        {userRole === 'inspector' && object.schedule.hasChanges && onScheduleChange && (
          <button 
            className="button warning" 
            onClick={() => onScheduleChange(object.id)}
          >
            Проверить изменения в графике
          </button>
        )}

        {userRole === 'contractor' && object.statistics.materialsToCheck > 0 && onMaterialCheck && (
          <button 
            className="button warning" 
            onClick={() => onMaterialCheck(object.id)}
          >
            Проверить материалы
          </button>
        )}

        {userRole === 'control' && object.statistics.activeIssues > 0 && onIssueReview && (
          <button 
            className="button warning" 
            onClick={() => onIssueReview(object.id)}
          >
            Проверить замечания
          </button>
        )}
      </div>
    </div>
  );
};
