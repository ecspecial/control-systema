import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { FC } from 'react';
import Select from 'react-select';
import { usersService } from '../../services/users.service';
import { objectsService } from '../../services/objects.service';
import { filesService } from '../../services/files.service';
import { MapView } from '../../components/common/MapView/MapView';
import { UserRole } from '../../types/user.types';
import { 
  ObjectStatus,
  WorkStatus,
  type CityObject,
  type WorkType,
  type ObjectDocument as BaseObjectDocument,
  type WorkStatusType,
  WorkStatusDisplay
} from '../../types/city-object.types';
import styles from './ObjectDetails.module.scss';
import TimelineChart from '../../components/features/TimelineChart/TimelineChart';
import api from '../../services/api';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Notification } from '../../components/common/Notification/Notification';
import { ElectronicJournal } from '../../components/features/ElectronicJournal/ElectronicJournal';
import { verifyUserAtObject } from '../../utils/geolocation';
import { LaboratorySamples } from '../../components/features/LaboratorySamples/LaboratorySamples';
import { TTNDocuments } from '../../components/features/TTNDocuments/TTNDocuments';

interface ContractorOption {
  value: string;
  label: string;
}

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

export const ObjectDetails: FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [object, setObject] = useState<CityObject | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Add new states for contractor selection
  const [contractors, setContractors] = useState<ContractorOption[]>([]);
  const [selectedContractor, setSelectedContractor] = useState<ContractorOption | null>(null);
  const [isActivating, setIsActivating] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTab, setActiveTab] = useState<'main' | 'ttn' | 'journal' | 'samples'>('main');

  // Add state for work type editing
  const [editingWorkTypeId, setEditingWorkTypeId] = useState<string | null>(null);
  const [editedWorkDates, setEditedWorkDates] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState<{ show: boolean; message: string; type: 'success' | 'error' } | null>(null);

  // Add new state for schedule editing
  const [editingSchedule, setEditingSchedule] = useState(false);
  const [editedSchedule, setEditedSchedule] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate: null, endDate: null });

  // Add function to handle full schedule update
  const handleScheduleUpdate = async () => {
    if (!editedSchedule.startDate || !editedSchedule.endDate || !object) return;

    setIsSubmitting(true);
    try {
      await objectsService.updateSchedule(object.id, {
        startDate: editedSchedule.startDate.toISOString().split('T')[0],
        endDate: editedSchedule.endDate.toISOString().split('T')[0]
      });

      // Refresh object data
      const updatedObject = await objectsService.getOne(object.id);
      setObject(updatedObject);
      setEditingSchedule(false);
      setEditedSchedule({ startDate: null, endDate: null });
      
      setNotification({
        show: true,
        message: isControl ? 'График работ обновлен' : 'Изменения графика отправлены на одобрение',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating schedule:', error);
      setNotification({
        show: true,
        message: 'Ошибка при обновлении графика работ',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get current user
  const userStr = localStorage.getItem('user');
  const user = userStr ? JSON.parse(userStr) : null;
  const isControl = user?.role === UserRole.CONTROL;

  // Add state for location verification
  const [isAtLocation, setIsAtLocation] = useState<boolean>(false);
  const [checkingLocation, setCheckingLocation] = useState<boolean>(false);

  // Add location verification function
  const verifyLocation = async () => {
    if (!object?.polygon) return;
    
    setCheckingLocation(true);
    try {
      const [verified] = await verifyUserAtObject(object.polygon); // Destructure only the boolean value
      setIsAtLocation(verified); // Now we're setting just the boolean
      if (!verified) {
        setNotification({
          show: true,
          message: 'Вы должны находиться на объекте для обновления статуса работ',
          type: 'error'
        });
      }
    } catch (error: any) {
      console.error('Location verification error:', error);
      setNotification({
        show: true,
        message: error.message || 'Ошибка проверки местоположения',
        type: 'error'
      });
    } finally {
      setCheckingLocation(false);
    }
  };

  // Only fetch contractors
  useEffect(() => {
    const fetchContractors = async () => {
      try {
        const data = await usersService.getContractors();
        setContractors(data.map((contractor: any) => ({
          value: contractor.id,
          label: `${contractor.lastName} ${contractor.firstName} ${contractor.middleName || ''} (${contractor.organization || ''})`
        })));
      } catch (error) {
        console.error('Error fetching contractors:', error);
      }
    };

    if (isControl && object?.status === 'planned') {
      fetchContractors();
    }
  }, [isControl, object?.status]);

  useEffect(() => {
    const fetchObject = async () => {
      try {
        if (!id) return;
        const data = await objectsService.getOne(id);
        setObject(data);
      } catch (err) {
        setError('Не удалось загрузить данные объекта');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchObject();
  }, [id]);

  // First, let's log the documents to debug
  useEffect(() => {
    if (object?.documents) {
      console.log('Documents:', object.documents);
    }
  }, [object?.documents]);

  // Check location when component mounts if user is contractor
  useEffect(() => {
    if (user?.role === UserRole.CONTRACTOR && object?.polygon) {
      verifyLocation();
    }
  }, [object?.polygon, user?.role]);

  const handleActivate = async () => {
    if (!object || !selectedContractor || !user) return;
    
    setIsActivating(true);
    try {
      await objectsService.activateWithContractor(
        object.id,
        selectedContractor.value,
        user.id // Use logged in user's ID as control user
      );
      // Refresh object data
      const updatedObject = await objectsService.getOne(object.id);
      setObject(updatedObject);
    } catch (error) {
      console.error('Error activating object:', error);
    } finally {
      setIsActivating(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadStatus(null); // Clear previous status
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !object) return;

    setUploading(true);
    setUploadStatus(null);

    try {
      await filesService.uploadFile(object.id, 'opening_act', selectedFile);
      // Refresh object data to show new document
      const updatedObject = await objectsService.getOne(object.id);
      setObject(updatedObject);
      setUploadStatus({
        type: 'success',
        message: 'Акт открытия объекта успешно загружен'
      });
      // Clear selected file
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      setUploadStatus({
        type: 'error',
        message: 'Ошибка при загрузке файла. Пожалуйста, попробуйте еще раз.'
      });
      console.error('File upload error:', error);
    } finally {
      setUploading(false);
    }
  };

  const handleDownload = async (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    e.preventDefault();
    
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Extract objectId and fileId from path
      const pathParts = path.split('/');
      const fileId = pathParts.pop(); // Get the last part (filename)
      const objectId = pathParts[1]; // Get the objectId part

      if (!objectId || !fileId) {
        throw new Error('Invalid file path');
      }

      const response = await api.get(`/files/download/${objectId}/${fileId}`, {
        responseType: 'blob',
        headers: {
          'Accept': 'application/octet-stream',
        }
      });

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = fileId;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Download error:', error);
      setUploadStatus({
        type: 'error',
        message: 'Ошибка при скачивании файла. Пожалуйста, попробуйте еще раз.'
      });
    }
  };

  // Add function to handle work type schedule update
  const handleWorkTypeScheduleUpdate = async (workTypeId: string) => {
    if (!editedWorkDates.startDate || !editedWorkDates.endDate || !object) return;

    setIsSubmitting(true);
    try {
      await objectsService.updateWorkTypeSchedule(object.id, {
        workTypeId,
        startDate: editedWorkDates.startDate.toISOString().split('T')[0],
        endDate: editedWorkDates.endDate.toISOString().split('T')[0]
      });

      // Refresh object data
      const updatedObject = await objectsService.getOne(object.id);
      setObject(updatedObject);
      setEditingWorkTypeId(null);
      setEditedWorkDates({ startDate: null, endDate: null });
      
      setNotification({
        show: true,
        message: isControl ? 'График работы обновлен' : 'Изменения графика отправлены на одобрение',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating work schedule:', error);
      setNotification({
        show: true,
        message: 'Ошибка при обновлении графика работы',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add new handlers
  const handleScheduleApproval = async (approved: boolean) => {
    if (!object) return;

    setIsSubmitting(true);
    try {
      await objectsService.approveSchedule(object.id, approved);
      // Refresh object data
      const updatedObject = await objectsService.getOne(object.id);
      setObject(updatedObject);
      
      setNotification({
        show: true,
        message: approved ? 'Изменения графика одобрены' : 'Изменения графика отклонены',
        type: 'success'
      });
    } catch (error) {
      console.error('Error approving schedule:', error);
      setNotification({
        show: true,
        message: 'Ошибка при обработке изменений графика',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleWorkTypeApproval = async (workTypeId: string, approved: boolean) => {
    if (!object) return;

    setIsSubmitting(true);
    try {
      await objectsService.approveWorkTypeSchedule(object.id, workTypeId, approved);
      // Refresh object data
      const updatedObject = await objectsService.getOne(object.id);
      setObject(updatedObject);
      
      setNotification({
        show: true,
        message: approved ? 'Изменения графика работы одобрены' : 'Изменения графика работы отклонены',
        type: 'success'
      });
    } catch (error) {
      console.error('Error approving work type schedule:', error);
      setNotification({
        show: true,
        message: 'Ошибка при обработке изменений графика работы',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add the missing handler function
  const handleOpeningActApproval = async (documentId: string, approved: boolean) => {
    if (!object) return;

    setIsSubmitting(true);
    try {
      await objectsService.approveOpeningAct(object.id, documentId, approved);
      // Refresh object data
      const updatedObject = await objectsService.getOne(object.id);
      setObject(updatedObject);
      
      setNotification({
        show: true,
        message: approved ? 'Объект активирован' : 'Акт открытия отклонен',
        type: 'success'
      });
    } catch (error) {
      console.error('Error approving opening act:', error);
      setNotification({
        show: true,
        message: 'Ошибка при обработке акта открытия',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add status options based on user role
  const getAvailableStatuses = () => {
    if (user?.role === UserRole.CONTRACTOR) {
      return [
        { value: WorkStatus.IN_PROGRESS, label: 'В работе' },
        { value: WorkStatus.COMPLETED, label: 'Выполнено' },
        { value: WorkStatus.VIOLATION_FIXED, label: 'Нарушение исправлено' },
        { value: WorkStatus.SEVERE_VIOLATION_FIXED, label: 'Серьезное нарушение исправлено' }
      ];
    } else if (user?.role === UserRole.CONTROL || user?.role === UserRole.INSPECTOR) {
      return [
        { value: WorkStatus.IN_PROGRESS, label: 'В работе' },
        { value: WorkStatus.ACCEPTED, label: 'Принято' },
        { value: WorkStatus.VIOLATION, label: 'Обнаружено нарушение' },
        { value: WorkStatus.SEVERE_VIOLATION, label: 'Серьезное нарушение' },
        { value: WorkStatus.VIOLATION_FIXED, label: 'Одобрено исправление нарушения' },
        { value: WorkStatus.SEVERE_VIOLATION_FIXED, label: 'Одобрено исправление серьезного нарушения' }
      ];
    }
    return [];
  };

  // Modify the handleStatusUpdate to check location first
  const handleStatusUpdate = async (workTypeId: string, newStatus: string) => {
    if (!object) return;

    // For contractors, verify location before allowing status update
    if (user?.role === UserRole.CONTRACTOR) {
      try {
        const verified = await verifyUserAtObject(object.polygon);
        if (!verified) {
          setNotification({
            show: true,
            message: 'Вы должны находиться на объекте для обновления статуса работ',
            type: 'error'
          });
          return;
        }
      } catch (error) {
        console.error('Location verification error:', error);
        setNotification({
          show: true,
          message: 'Ошибка проверки местоположения',
          type: 'error'
        });
        return;
      }
    }

    setIsSubmitting(true);
    try {
      await objectsService.updateWorkTypeStatus(object.id, workTypeId, newStatus);
      const updatedObject = await objectsService.getOne(object.id);
      setObject(updatedObject);
      
      setNotification({
        show: true,
        message: 'Статус работы обновлен',
        type: 'success'
      });
    } catch (error) {
      console.error('Error updating work status:', error);
      setNotification({
        show: true,
        message: 'Ошибка при обновлении статуса',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div>Загрузка...</div>;
  if (error) return <div>{error}</div>;
  if (!object) return <div>Объект не найден</div>;

  console.log('Work Schedule:', object?.workSchedule); // Debug log

  return (
    <div className={styles.page}>
      <div className="container">
        <div className={styles.header}>
          <button 
            className={styles.backButton}
            onClick={() => navigate(-1)}
          >
            ← Назад к списку
          </button>
          <h1>{object.name}</h1>
        </div>

        <div className={styles.tabs}>
          <button 
            className={`${styles.tabButton} ${activeTab === 'main' ? styles.active : ''}`}
            onClick={() => setActiveTab('main')}
          >
            Основная информация
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'journal' ? styles.active : ''}`}
            onClick={() => setActiveTab('journal')}
          >
            Электронный журнал
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'ttn' ? styles.active : ''}`}
            onClick={() => setActiveTab('ttn')}
          >
            ТТН
          </button>
          <button 
            className={`${styles.tabButton} ${activeTab === 'samples' ? styles.active : ''}`}
            onClick={() => setActiveTab('samples')}
          >
            Лабораторные пробы
          </button>
        </div>

        <div className={styles.content}>
          {/* Main Info Tab */}
          {activeTab === 'main' && (
            <>
              <div className={styles.mainInfo}>
                <div className={styles.section}>
                  <h2>Основная информация</h2>
                  <div className={styles.infoGrid}>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Адрес:</span>
                      <span className={styles.value}>{object.address}</span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Статус:</span>
                      <span className={`${styles.value} ${styles.status} ${styles[object.status]}`}>
                        {getStatusDisplay(object.status)}
                      </span>
                    </div>
                    <div className={styles.infoItem}>
                      <span className={styles.label}>Описание:</span>
                      <span className={styles.value}>{object.description}</span>
                    </div>
                  </div>
                </div>

                <div className={styles.section}>
                  <div className={styles.sectionHeader}>
                    <h2>График работ</h2>
                    {(isControl || user?.role === UserRole.CONTRACTOR) && (
                      <button
                        type="button"
                        className={styles.editButton}
                        onClick={() => {
                          if (editingSchedule) {
                            setEditingSchedule(false);
                            setEditedSchedule({ startDate: null, endDate: null });
                          } else {
                            setEditingSchedule(true);
                            setEditedSchedule({
                              startDate: object.workSchedule ? new Date(object.workSchedule.startDate) : null,
                              endDate: object.workSchedule ? new Date(object.workSchedule.endDate) : null
                            });
                          }
                        }}
                      >
                        {editingSchedule ? 'Отменить' : 'Изменить общие сроки'}
                      </button>
                    )}
                  </div>

                  {/* Overall Project Schedule */}
                  {object.workSchedule && (
                    <div className={styles.overallSchedule}>
                      <div className={styles.overallScheduleHeader}>
                        <h3>Общий график проекта</h3>
                        <div className={`${styles.scheduleStatus} ${styles[object.workSchedule.status || '']}`}>
                          {object.workSchedule.status && WorkStatusDisplay[object.workSchedule.status as WorkStatusType]}
                        </div>
                      </div>

                      <div className={styles.scheduleDates}>
                        <div className={styles.dateBlock}>
                          <span className={styles.dateLabel}>Дата начала:</span>
                          <span className={styles.dateValue}>
                            {new Date(object.workSchedule.startDate).toLocaleDateString('ru')}
                          </span>
                        </div>
                        <div className={styles.separator}>—</div>
                        <div className={styles.dateBlock}>
                          <span className={styles.dateLabel}>Дата окончания:</span>
                          <span className={styles.dateValue}>
                            {new Date(object.workSchedule.endDate).toLocaleDateString('ru')}
                          </span>
                        </div>
                      </div>

                      {editingSchedule && (
                        <div className={styles.workScheduleForm}>
                          <div className={styles.dateInputs}>
                            <div className={styles.dateField}>
                              <label>Общая дата начала</label>
                              <DatePicker
                                selected={editedSchedule.startDate}
                                onChange={(date) => setEditedSchedule(prev => ({ ...prev, startDate: date }))}
                                dateFormat="dd.MM.yyyy"
                                locale="ru"
                                placeholderText="Выберите дату"
                                className={styles.datePicker}
                                minDate={new Date()}
                              />
                            </div>
                            
                            <div className={styles.dateField}>
                              <label>Общая дата окончания</label>
                              <DatePicker
                                selected={editedSchedule.endDate}
                                onChange={(date) => setEditedSchedule(prev => ({ ...prev, endDate: date }))}
                                dateFormat="dd.MM.yyyy"
                                locale="ru"
                                placeholderText="Выберите дату"
                                className={styles.datePicker}
                                minDate={editedSchedule.startDate || new Date()}
                              />
                            </div>
                          </div>

                          <button
                            type="button"
                            className={styles.submitButton}
                            onClick={handleScheduleUpdate}
                            disabled={!editedSchedule.startDate || !editedSchedule.endDate || isSubmitting}
                          >
                            {isSubmitting ? 'Сохранение...' : 
                             isControl ? 'Обновить сроки' : 'Отправить изменения на одобрение'}
                          </button>
                        </div>
                      )}

                      {object.workSchedule?.status === WorkStatus.PENDING_RESCHEDULE_APPROVE && isControl && (
                        <div className={styles.scheduleApproval}>
                          <div className={styles.pendingChanges}>
                            <h4>Запрошенные изменения:</h4>
                            <div className={styles.dateComparison}>
                              <div className={styles.dateBlock}>
                                <span className={styles.dateLabel}>Текущие даты:</span>
                                <div className={styles.dates}>
                                  {new Date(object.workSchedule.startDate).toLocaleDateString('ru')} - {new Date(object.workSchedule.endDate).toLocaleDateString('ru')}
                                </div>
                              </div>
                              <div className={styles.dateBlock}>
                                <span className={styles.dateLabel}>Новые даты:</span>
                                <div className={styles.dates}>
                                  {new Date(object.workSchedule.updatedStartDate!).toLocaleDateString('ru')} - {new Date(object.workSchedule.updatedEndDate!).toLocaleDateString('ru')}
                                </div>
                              </div>
                            </div>
                            <div className={styles.approvalButtons}>
                              <button
                                className={`${styles.approveButton} ${styles.accept}`}
                                onClick={() => handleScheduleApproval(true)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? 'Обработка...' : 'Одобрить изменения'}
                              </button>
                              <button
                                className={`${styles.approveButton} ${styles.reject}`}
                                onClick={() => handleScheduleApproval(false)}
                                disabled={isSubmitting}
                              >
                                {isSubmitting ? 'Обработка...' : 'Отклонить изменения'}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  <div className={styles.scheduleTypesSeparator}>Виды работ</div>

                  {/* Schedule List */}
                  {object?.workSchedule?.workTypes && object.workSchedule.workTypes.length > 0 && (
                    <div className={styles.scheduleList}>
                      {/* Add location status indicator for contractors */}
                      {user?.role === UserRole.CONTRACTOR && (
                        <div className={styles.locationStatus}>
                          {checkingLocation ? (
                            <span className={styles.checkingLocation}>
                              Проверка местоположения...
                            </span>
                          ) : isAtLocation ? (
                            <div className={styles.locationVerified}>
                              <span>✓ Местоположение подтверждено</span>
                              <button 
                                onClick={verifyLocation}
                                className={styles.retryButton}
                                title="Обновить проверку местоположения"
                              >
                                Проверить снова
                              </button>
                            </div>
                          ) : (
                            <div className={styles.locationWarning}>
                              <span>⚠️ Вы должны находиться на объекте для обновления статуса работ</span>
                              <button 
                                onClick={verifyLocation}
                                className={styles.retryButton}
                              >
                                Проверить местоположение
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {object.workSchedule.workTypes.map((work: WorkType) => (
                        <div key={work.id} className={styles.scheduleItem}>
                          <div className={styles.scheduleItemHeader}>
                            <div className={styles.scheduleItemTitle}>
                              <h3>{work.name}</h3>
                              <span className={`${styles.workStatus} ${styles[work.status]}`}>
                                {WorkStatusDisplay[work.status as WorkStatusType]}
                              </span>
                            </div>
                            {(isControl || user?.role === UserRole.CONTRACTOR) && (
                              <button
                                type="button"
                                className={styles.editButton}
                                onClick={() => {
                                  if (editingWorkTypeId === work.id) {
                                    setEditingWorkTypeId(null);
                                    setEditedWorkDates({ startDate: null, endDate: null });
                                  } else {
                                    setEditingWorkTypeId(work.id);
                                    setEditedWorkDates({
                                      startDate: new Date(work.startDate),
                                      endDate: new Date(work.endDate)
                                    });
                                  }
                                }}
                              >
                                {editingWorkTypeId === work.id ? 'Отменить' : 'Изменить сроки'}
                              </button>
                            )}
                          </div>

                          {editingWorkTypeId === work.id ? (
                            <div className={styles.workScheduleForm}>
                              <div className={styles.dateInputs}>
                                <div className={styles.dateField}>
                                  <label>Дата начала</label>
                                  <DatePicker
                                    selected={editedWorkDates.startDate}
                                    onChange={(date) => setEditedWorkDates(prev => ({ ...prev, startDate: date }))}
                                    dateFormat="dd.MM.yyyy"
                                    locale="ru"
                                    placeholderText="Выберите дату"
                                    className={styles.datePicker}
                                    minDate={new Date()}
                                  />
                                </div>
                                
                                <div className={styles.dateField}>
                                  <label>Дата окончания</label>
                                  <DatePicker
                                    selected={editedWorkDates.endDate}
                                    onChange={(date) => setEditedWorkDates(prev => ({ ...prev, endDate: date }))}
                                    dateFormat="dd.MM.yyyy"
                                    locale="ru"
                                    placeholderText="Выберите дату"
                                    className={styles.datePicker}
                                    minDate={editedWorkDates.startDate || new Date()}
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                className={styles.submitButton}
                                onClick={() => handleWorkTypeScheduleUpdate(work.id)}
                                disabled={!editedWorkDates.startDate || !editedWorkDates.endDate || isSubmitting}
                              >
                                {isSubmitting ? 'Сохранение...' : 
                                 isControl ? 'Обновить сроки' : 'Отправить изменения на одобрение'}
                              </button>
                            </div>
                          ) : (
                            <>
                              <div className={styles.scheduleItemDates}>
                                {new Date(work.startDate).toLocaleDateString('ru')} - {new Date(work.endDate).toLocaleDateString('ru')}
                              </div>
                              {work.status === WorkStatus.PENDING_RESCHEDULE_APPROVE && isControl && (
                                <div className={styles.workTypeApproval}>
                                  <div className={styles.pendingChanges}>
                                    <h4>Запрошенные изменения:</h4>
                                    <div className={styles.dateComparison}>
                                      <div className={styles.dateBlock}>
                                        <span className={styles.dateLabel}>Текущие даты:</span>
                                        <div className={styles.dates}>
                                          {new Date(work.startDate).toLocaleDateString('ru')} - {new Date(work.endDate).toLocaleDateString('ru')}
                                        </div>
                                      </div>
                                      <div className={styles.dateBlock}>
                                        <span className={styles.dateLabel}>Новые даты:</span>
                                        <div className={styles.dates}>
                                          {new Date(work.updatedStartDate!).toLocaleDateString('ru')} - {new Date(work.updatedEndDate!).toLocaleDateString('ru')}
                                        </div>
                                      </div>
                                    </div>
                                    <div className={styles.approvalButtons}>
                                      <button
                                        className={`${styles.approveButton} ${styles.accept}`}
                                        onClick={() => handleWorkTypeApproval(work.id, true)}
                                        disabled={isSubmitting}
                                      >
                                        {isSubmitting ? 'Обработка...' : 'Одобрить изменения'}
                                      </button>
                                      <button
                                        className={`${styles.approveButton} ${styles.reject}`}
                                        onClick={() => handleWorkTypeApproval(work.id, false)}
                                        disabled={isSubmitting}
                                      >
                                        {isSubmitting ? 'Обработка...' : 'Отклонить изменения'}
                                      </button>
                                    </div>
                                  </div>
                                </div>
                              )}
                              {work.description && (
                                <p className={styles.scheduleItemDescription}>{work.description}</p>
                              )}
                              {(user?.role === UserRole.CONTRACTOR || 
                                user?.role === UserRole.CONTROL || 
                                user?.role === UserRole.INSPECTOR) && (
                                <div className={styles.statusUpdate}>
                                  <Select
                                    options={getAvailableStatuses()}
                                    value={{ 
                                      value: work.status, 
                                      label: WorkStatusDisplay[work.status as WorkStatusType] 
                                    }}
                                    onChange={(option) => option && handleStatusUpdate(work.id, option.value)}
                                    isDisabled={
                                      isSubmitting || 
                                      (user?.role === UserRole.CONTRACTOR && !isAtLocation)
                                    }
                                    placeholder={
                                      user?.role === UserRole.CONTRACTOR && !isAtLocation
                                        ? "Необходимо находиться на объекте"
                                        : "Изменить статус"
                                    }
                                  />
                                </div>
                              )}
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Timeline Chart */}
                  <div className={styles.timelineContainer}>
                    {object?.workSchedule?.workTypes && object.workSchedule.workTypes.length > 0 ? (
                      <TimelineChart workTypes={object.workSchedule.workTypes} />
                    ) : (
                      <div className={styles.noData}>Нет данных о работах</div>
                    )}
                  </div>
                </div>

                {object.polygon && (
                  <div className={styles.section}>
                    <h2>Расположение объекта</h2>
                    <div className={styles.map}>
                      <MapView
                        center={[object.polygon.coordinates[0][1], object.polygon.coordinates[0][0]]} // [lat, lng]
                        coordinates={object.polygon.coordinates.map(coord => [coord[1], coord[0]])} // Convert all coordinates to [lat, lng]
                      />
                    </div>
                  </div>
                )}

                {object.documents && object.documents.filter(doc => doc.type === 'document').length > 0 && (
                  <div className={styles.section}>
                    <h2>Документы объекта</h2>
                    <div className={styles.documentsList}>
                      {object.documents
                        .filter(doc => doc.type === 'document')
                        .map((doc: BaseObjectDocument) => (
                          <div key={doc.id} className={styles.documentItem}>
                            <div className={styles.documentInfo}>
                              <span className={styles.documentName}>{doc.name}</span>
                              {doc.createdAt && (
                                <span className={styles.documentDate}>
                                  {new Date(doc.createdAt).toLocaleDateString('ru')}
                                </span>
                              )}
                            </div>
                            <button 
                              onClick={(e) => handleDownload(e as any, doc.path)}
                              className={styles.downloadButton}
                            >
                              Скачать
                            </button>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </div>
              <div className={styles.sidebar}>
                <div className={styles.section}>
                  <h2>Ответственные</h2>
                  <div className={styles.responsible}>
                    {object.controlUser && (
                      <div className={styles.responsibleItem}>
                        <span className={styles.label}>Контроль:</span>
                        <span className={styles.value}>
                          {object.controlUser.lastName} {object.controlUser.firstName}
                        </span>
                        <span className={styles.contact}>{object.controlUser.phone}</span>
                      </div>
                    )}
                    {object.contractorUser && (
                      <div className={styles.responsibleItem}>
                        <span className={styles.label}>Подрядчик:</span>
                        <span className={styles.value}>
                          {object.contractorUser.lastName} {object.contractorUser.firstName}
                        </span>
                        <span className={styles.contact}>{object.contractorUser.phone}</span>
                      </div>
                    )}
                    {object.inspectorUser && (
                      <div className={styles.responsibleItem}>
                        <span className={styles.label}>Инспектор:</span>
                        <span className={styles.value}>
                          {object.inspectorUser.lastName} {object.inspectorUser.firstName}
                        </span>
                        <span className={styles.contact}>{object.inspectorUser.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                {isControl && object.status === 'planned' && (
                  <div className={styles.section}>
                    <h2>Назначение ответственных</h2>
                    <div className={styles.selectContainer}>
                      <Select
                        options={contractors}
                        value={selectedContractor}
                        onChange={setSelectedContractor}
                        isLoading={loading}
                        isDisabled={isActivating}
                        placeholder="Выберите подрядчика"
                        noOptionsMessage={() => "Нет доступных подрядчиков"}
                        className={styles.select}
                        classNamePrefix="select"
                        styles={{
                          control: (base) => ({
                            ...base,
                            minHeight: 42,
                            borderColor: '#dee2e6',
                            borderRadius: '8px',
                            boxShadow: 'none',
                            '&:hover': {
                              borderColor: '#adb5bd'
                            },
                            '&:focus-within': {
                              borderColor: '#0d6efd',
                              boxShadow: '0 0 0 3px rgba(13, 110, 253, 0.15)'
                            }
                          }),
                          option: (base, state) => ({
                            ...base,
                            padding: '10px 16px',
                            backgroundColor: state.isSelected 
                              ? '#0d6efd' 
                              : state.isFocused 
                                ? '#f8f9fa' 
                                : 'white',
                            color: state.isSelected ? 'white' : '#495057',
                            cursor: 'pointer',
                            '&:active': {
                              backgroundColor: state.isSelected ? '#0d6efd' : '#e9ecef'
                            }
                          }),
                          menu: (base) => ({
                            ...base,
                            marginTop: 4,
                            borderRadius: '8px',
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                            overflow: 'hidden'
                          }),
                          menuList: (base) => ({
                            ...base,
                            padding: 0,
                            '::-webkit-scrollbar': {
                              width: '8px'
                            },
                            '::-webkit-scrollbar-track': {
                              background: '#f1f1f1',
                              borderRadius: '4px'
                            },
                            '::-webkit-scrollbar-thumb': {
                              background: '#ccc',
                              borderRadius: '4px',
                              '&:hover': {
                                background: '#bbb'
                              }
                            }
                          }),
                          valueContainer: (base) => ({
                            ...base,
                            padding: '2px 16px'
                          }),
                          dropdownIndicator: (base) => ({
                            ...base,
                            color: '#495057',
                            '&:hover': {
                              color: '#212529'
                            }
                          }),
                          indicatorSeparator: () => ({
                            display: 'none'
                          })
                        }}
                      />
                      <button
                        className={`button primary ${selectedContractor ? 'active' : ''}`}
                        onClick={handleActivate}
                        disabled={!selectedContractor || isActivating}
                      >
                        {isActivating ? 'Активация...' : 'Активировать объект'}
                      </button>
                    </div>
                  </div>
                )}

                {/* Update the condition to show opening act section */}
                {(object.status === ObjectStatus.ASSIGNED || object.status === ObjectStatus.PENDING_ACTIVATION) && (
                  <div className={styles.section}>
                    <h2>Акт открытия объекта</h2>
                    <div className={styles.uploadContainer}>
                      {object.status === ObjectStatus.ASSIGNED && (
                        <>
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={handleFileSelect}
                            disabled={uploading}
                            className={styles.fileInput}
                            id="openingAct"
                          />
                          <label htmlFor="openingAct" className={styles.uploadLabel}>
                            {selectedFile ? selectedFile.name : 'Выберите акт открытия объекта'}
                          </label>
                          
                          {selectedFile && (
                            <button
                              className={`button primary ${styles.uploadButton}`}
                              onClick={handleFileUpload}
                              disabled={uploading}
                            >
                              {uploading ? 'Загрузка...' : 'Загрузить файл'}
                            </button>
                          )}

                          {uploadStatus && (
                            <div className={`${styles.uploadStatus} ${styles[uploadStatus.type]}`}>
                              {uploadStatus.message}
                            </div>
                          )}
                        </>
                      )}

                      {object.documents?.length > 0 && (
                        <div className={styles.documentsList}>
                          <h3>Загруженные документы:</h3>
                          {object.documents
                            .filter(doc => doc.type === 'opening_act')
                            .map((doc: BaseObjectDocument) => (
                              <div key={doc.id} className={styles.documentItem}>
                                <div className={styles.documentContent}>
                                  <div className={styles.documentInfo}>
                                    <span className={styles.documentName}>Акт открытия объекта</span>
                                    {object.status === ObjectStatus.PENDING_ACTIVATION && (
                                      <span className={styles.pendingStatus}>
                                        Ожидает подтверждения
                                      </span>
                                    )}
                                  </div>
                                  <div className={styles.documentActions}>
                                    <button 
                                      onClick={(e) => handleDownload(e as any, doc.path)}
                                      className={styles.downloadButton}
                                    >
                                      Скачать
                                    </button>
                                    {user?.role === UserRole.INSPECTOR && 
                                     object.status === ObjectStatus.PENDING_ACTIVATION && 
                                     doc.status === 'awaiting_approval' && (
                                      <>
                                        <button
                                          className={styles.activateButton}
                                          onClick={() => handleOpeningActApproval(doc.id, true)}
                                          disabled={isSubmitting}
                                        >
                                          {isSubmitting ? 'Обработка...' : 'Активировать объект'}
                                        </button>
                                        <button
                                          className={styles.rejectButton}
                                          onClick={() => handleOpeningActApproval(doc.id, false)}
                                          disabled={isSubmitting}
                                        >
                                          {isSubmitting ? 'Обработка...' : 'Отклонить'}
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {/* Journal Tab */}
          {activeTab === 'journal' && (
            <ElectronicJournal 
              objectId={object.id}
              userRole={user?.role}
              polygon={object.polygon}
              onNotification={(message, type) => setNotification({
                show: true,
                message,
                type
              })}
            />
          )}

          {/* TTN Tab */}
          {activeTab === 'ttn' && (
            <TTNDocuments
              objectId={object.id}
              onNotification={(message, type) => setNotification({
                show: true,
                message,
                type
              })}
            />
          )}

          {/* Laboratory Samples Tab */}
          {activeTab === 'samples' && (
            <LaboratorySamples
              objectId={object.id}
              userRole={user?.role}
              onNotification={(message, type) => setNotification({
                show: true,
                message,
                type
              })}
            />
          )}
        </div>
      </div>
      {notification && <Notification {...notification} onClose={() => setNotification(null)} />}
    </div>
  );
};
