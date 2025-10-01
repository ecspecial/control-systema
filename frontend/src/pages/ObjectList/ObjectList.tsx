import { useState, useEffect } from 'react';
import type { FC } from 'react';
import { ObjectCard } from '../../components/features/ObjectCard/ObjectCard';
import { objectsService } from '../../services/objects.service';
import { ObjectStatus, type CityObject, type IConstructionObject } from '../../types/city-object.types';
import { ObjectFilters } from '../../components/features/ObjectFilters/ObjectFilters';
import styles from './ObjectList.module.scss';
import { CardUserRole, UserRole } from '../../types/user.types';

export const ObjectList: FC = () => {
  const [objects, setObjects] = useState<IConstructionObject[]>([]);
  const [filteredObjects, setFilteredObjects] = useState<IConstructionObject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const mapToCardData = (obj: CityObject): IConstructionObject => {
    // Calculate progress based on completed work types
    const totalWorkTypes = obj.workSchedule?.workTypes.length || 0;
    const progress = totalWorkTypes ? Math.round((obj.workSchedule?.workTypes.filter(wt => 
      new Date(wt.endDate) < new Date()
    ).length || 0) * 100 / totalWorkTypes) : 0;

    return {
      id: obj.id,
      name: obj.name,
      status: obj.status,
      coordinates: {
        lat: obj.polygon.coordinates[0][1], // Convert from [lng, lat] to {lat, lng}
        lng: obj.polygon.coordinates[0][0],
        radius: 100 // Default radius for visualization
      },
      workTypes: obj.workSchedule?.workTypes.map(wt => wt.name) || [],
      schedule: {
        startDate: obj.workSchedule?.startDate || '',
        endDate: obj.workSchedule?.endDate || '',
        progress,
        hasChanges: false // This would come from change tracking logic
      },
      responsible: {
        inspector: obj.inspectorUser ? {
          name: `${obj.inspectorUser.lastName} ${obj.inspectorUser.firstName}`,
          phone: obj.inspectorUser.phone || ''
        } : {
          name: 'Не назначен',
          phone: ''
        },
        contractor: obj.contractorUser ? {
          name: `${obj.contractorUser.lastName} ${obj.contractorUser.firstName}`,
          phone: obj.contractorUser.phone || ''
        } : null
      },
      statistics: {
        activeIssues: 0, // These would come from additional backend data
        materialsToCheck: 0,
        completedWorks: obj.workSchedule?.workTypes.filter(wt => 
          new Date(wt.endDate) < new Date()
        ).length || 0,
        totalWorks: obj.workSchedule?.workTypes.length || 0
      },
      documents: {
        schedule: {
          url: '', // These would come from document management system
          lastUpdate: new Date().toLocaleDateString('ru'),
          pendingChanges: false
        }
      }
    };
  };

  useEffect(() => {
    const fetchObjects = async () => {
      try {
        const data = await objectsService.getAll();
        const mappedObjects = data.map(mapToCardData);
        setObjects(mappedObjects);
        // For contractors, don't apply any filters
        setFilteredObjects(mappedObjects);
      } catch (error) {
        console.error('Error fetching objects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchObjects();
  }, []);

  const handleFilterChange = (status: ObjectStatus | 'all') => {
    // Don't filter for contractors
    if (user?.role === UserRole.CONTRACTOR) {
      return;
    }

    if (status === 'all') {
      setFilteredObjects(objects);
    } else {
      const filtered = objects.filter(obj => obj.status === status);
      setFilteredObjects(filtered);
    }
  };

  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const cardUserRole = user ? CardUserRole[user.role as UserRole] : 'control';

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <h1>Объекты благоустройства</h1>
          {/* Only show filters for non-contractor users */}
          {user?.role !== UserRole.CONTRACTOR && (
            <ObjectFilters onFilterChange={handleFilterChange} />
          )}
        </div>
        <div className={styles.list}>
          {filteredObjects.map(object => (
            <ObjectCard 
              key={object.id} 
              object={object}
              userRole={user?.role || 'control'}
              onView={(id) => console.log('View:', id)}
            />
          ))}
          {filteredObjects.length === 0 && (
            <div className={styles.noResults}>
              Нет объектов, соответствующих выбранному фильтру
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
