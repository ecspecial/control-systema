import { useState, useRef } from 'react';
import type { FC } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { ru } from 'date-fns/locale/ru';
import { MapView } from '../../components/common/MapView/MapView';
import { objectsService } from '../../services/objects.service';
import { filesService } from '../../services/files.service';
import { WorkStatus, type CreateObjectRequest, type WorkType, type ObjectDocument } from '../../types/city-object.types';
import styles from './CreateObject.module.scss';
import { Notification } from '../../components/common/Notification/Notification';
import { useNavigate } from 'react-router-dom';

// Регистрируем русскую локаль
registerLocale('ru', ru);

// Add this interface for temporary document state
interface TempDocument extends Omit<ObjectDocument, 'path'> {
  file: File;
  status: 'pending' | 'uploading' | 'error';
}

const INITIAL_STATE: Omit<CreateObjectRequest, 'documents'> & { documents: TempDocument[] } = {
  name: '',
  address: '',
  description: '',
  polygon: {
    type: 'Polygon',
    coordinates: []
  },
  workSchedule: {
    startDate: '',
    endDate: '',
    workTypes: []
  },
  documents: []
};

// Add error type interface
interface ApiError {
  message?: string;
  response?: {
    data?: {
      message?: string;
    };
  };
}

export const CreateObject: FC = () => {
  // Update the state type to include temporary documents
  const [formData, setFormData] = useState<Omit<CreateObjectRequest, 'documents'> & { documents: TempDocument[] }>(INITIAL_STATE);
  const [points, setPoints] = useState<Array<[number, number]>>([]);
  const [newPoint, setNewPoint] = useState<{ lat: number; lng: number }>({ lat: 0, lng: 0 });
  const [showMap, setShowMap] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [newWorkType, setNewWorkType] = useState<Partial<WorkType>>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    unit: '',
    amount: 0
  });

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for notification
  const [notification, setNotification] = useState<{
    show: boolean;
    message: string;
    type: 'success' | 'error';
  } | null>(null);

  const navigate = useNavigate();

  const handleAddPoint = () => {
    if (newPoint.lat && newPoint.lng) {
      // Create point in [lat, lng] format
      const newCoordinate: [number, number] = [newPoint.lat, newPoint.lng];
      const updatedPoints = [...points, newCoordinate];
      setPoints(updatedPoints);
      setNewPoint({ lat: 0, lng: 0 });

      setFormData(prev => ({
        ...prev,
        polygon: {
          type: 'Polygon',
          coordinates: updatedPoints
        }
      }));
    }
  };

  const handleShowOnMap = () => {
    if (points.length >= 3) {
      setShowMap(true);
      setShowWarning(false);
    } else {
      setShowWarning(true);
    }
  };

  const handleMapPointsChange = (newCoordinates: Array<[number, number]>) => {
    setPoints(newCoordinates);
    setFormData(prev => ({
      ...prev,
      polygon: {
        type: 'Polygon',
        coordinates: newCoordinates
      }
    }));
  };

  const handleRemovePoint = (index: number) => {
    const updatedPoints = points.filter((_, i) => i !== index);
    setPoints(updatedPoints);
    setFormData(prev => ({
      ...prev,
      polygon: {
        type: 'Polygon',
        coordinates: updatedPoints
      }
    }));

    // Если точек меньше 3, скрываем карту
    if (updatedPoints.length < 3) {
      setShowMap(false);
      setShowWarning(true);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const formatDateForBackend = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleStartDateChange = (date: Date | null) => {
    setStartDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        workSchedule: {
          ...prev.workSchedule,
          startDate: formatDateForBackend(date)
        }
      }));
    }
  };

  const handleEndDateChange = (date: Date | null) => {
    setEndDate(date);
    if (date) {
      setFormData(prev => ({
        ...prev,
        workSchedule: {
          ...prev.workSchedule,
          endDate: formatDateForBackend(date)
        }
      }));
    }
  };

  const handleAddWorkType = () => {
    if (newWorkType.name && newWorkType.startDate && newWorkType.endDate) {
      const workType: WorkType = {
        id: Date.now().toString(),
        name: newWorkType.name,
        description: newWorkType.description,
        startDate: newWorkType.startDate,
        endDate: newWorkType.endDate,
        unit: newWorkType.unit || 'шт',
        amount: newWorkType.amount || 1,
        status: WorkStatus.NOT_STARTED 
      };

      setFormData(prev => ({
        ...prev,
        workSchedule: {
          ...prev.workSchedule,
          workTypes: [...prev.workSchedule.workTypes, workType]
        }
      }));

      setNewWorkType({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        unit: '',
        amount: 0
      });
    }
  };

  const handleRemoveWorkType = (id: string) => {
    setFormData(prev => ({
      ...prev,
      workSchedule: {
        ...prev.workSchedule,
        workTypes: prev.workSchedule.workTypes.filter(wt => wt.id !== id)
      }
    }));
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    setUploadError(null);

    try {
      const uploadedFiles: TempDocument[] = Array.from(files).map(file => {
        // Get filename without extension
        const nameWithoutExt = file.name.replace(/\.[^/.]+$/, "");
        
        return {
          id: Date.now().toString(),
          type: 'document', 
          name: nameWithoutExt, 
          file: file,
          status: 'pending'
        };
      });

      setFormData(prev => ({
        ...prev,
        documents: [...prev.documents, ...uploadedFiles]
      }));

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      console.error('Error preparing files:', error);
      setUploadError('Ошибка при подготовке файлов');
    } finally {
      setUploading(false);
    }
  };

  const handleRemoveDocument = (id: string) => {
    setFormData(prev => ({
      ...prev,
      documents: prev.documents.filter(doc => doc.id !== id)
    }));
  };

  // Add function to reset form
  const resetForm = () => {
    setFormData(INITIAL_STATE);
    setStartDate(null);
    setEndDate(null);
    setPoints([]);
    setShowMap(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Update the form submission handler
  const handleSubmit = (e: React.FormEvent) => {
    // Always prevent default form submission
    e.preventDefault();
  };

  // Create a new function for object creation
  const handleCreateObject = async () => {
    setUploading(true);
    setUploadError(null);

    try {
      const createdObject = await objectsService.create({
        name: formData.name,
        address: formData.address,
        description: formData.description,
        polygon: formData.polygon,
        workSchedule: {
          ...formData.workSchedule,
          workTypes: formData.workSchedule.workTypes.map(workType => ({
            ...workType,
            status: WorkStatus.NOT_STARTED
          }))
        },
        documents: []
      });

      if (formData.documents.length > 0) {
        await Promise.all(
          formData.documents.map(async (doc) => {
            try {
              await filesService.uploadFile(
                createdObject.id,
                doc.type,
                doc.file,
                doc.name
              );
            } catch (error) {
              console.error(`Error uploading file ${doc.name}:`, error);
              throw new Error('Ошибка при загрузке файлов');
            }
          })
        );
      }

      setNotification({
        show: true,
        message: 'Объект успешно создан',
        type: 'success'
      });

      resetForm();

      setTimeout(() => {
        navigate(`/objects/${createdObject.id}`);
      }, 2000);

    } catch (error: unknown) {
      console.error('Error creating object:', error);
      
      // Type guard for our ApiError interface
      const apiError = error as ApiError;
      const errorMessage = apiError.message || 
        apiError.response?.data?.message ||
        'Ошибка при создании объекта';

      setNotification({
        show: true,
        message: errorMessage,
        type: 'error'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.container} noValidate>
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
      
      <section className={styles.section}>
        <h2>Основная информация</h2>
        <div className={styles.basicInfo}>
          <div className={styles.field}>
            <label>Название объекта</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Например: Благоустройство парка Центральный"
              required
              title="Пожалуйста, заполните это поле"
            />
          </div>
          
          <div className={styles.field}>
            <label>Адрес</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              placeholder="Например: ул. Ленина, 1"
              required
              title="Пожалуйста, заполните это поле"
            />
          </div>
          
          <div className={styles.field}>
            <label>Описание</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Опишите планируемые работы"
              required
              title="Пожалуйста, заполните это поле"
            />
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Область проведения работ</h2>
        
        <div className={styles.polygonInput}>
          <div className={styles.inputHeader}>
            <h3>Добавить точку полигона</h3>
          </div>
          
          {/* Добавляем описание сразу после заголовка */}
          <div className={styles.description}>
            Для создания области необходимо добавить минимум 3 точки, формирующие полигон на карте
          </div>

          <div className={styles.pointInputs}>
            <div className={styles.field}>
              <label>Широта</label>
              <input
                type="number"
                step="0.000001"
                value={newPoint.lat || ''}
                onChange={(e) => setNewPoint(prev => ({ 
                  ...prev, 
                  lat: parseFloat(e.target.value) 
                }))}
                placeholder="55.751369"
                title="Пожалуйста, заполните это поле"
              />
            </div>
            <div className={styles.field}>
              <label>Долгота</label>
              <input
                type="number"
                step="0.000001"
                value={newPoint.lng || ''}
                onChange={(e) => setNewPoint(prev => ({ 
                  ...prev, 
                  lng: parseFloat(e.target.value) 
                }))}
                placeholder="37.628694"
                title="Пожалуйста, заполните это поле"
              />
            </div>
            <button 
              type="button" 
              className={styles.addButton}
              onClick={handleAddPoint}
              disabled={uploading}
            >
              Добавить точку
            </button>
          </div>
        </div>

        {/* Отображаем текущие координаты */}
        <div className={styles.polygonInfo}>
          <h3>Координаты полигона:</h3>
          {points.map((point, index) => (
            <div key={index} className={styles.pointItem}>
              <span>Точка {index + 1}:</span>
              <span>{point[0].toFixed(6)}, {point[1].toFixed(6)}</span>
              <button
                type="button"
                className={styles.removeButton}
                onClick={() => handleRemovePoint(index)}
                title="Удалить точку"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <div className={styles.mapControls}>
          {points.length > 0 && (
            <>
              <button 
                type="button"
                className={styles.showMapButton}
                onClick={handleShowOnMap}
                disabled={points.length < 3 || uploading}
              >
                Показать на карте
              </button>
              
              {showWarning && (
                <div className={styles.warning}>
                  {points.length === 0 
                    ? 'Добавьте точки для создания полигона'
                    : points.length === 1 
                    ? 'Добавьте еще 2 точки для создания полигона'
                    : points.length === 2 
                    ? 'Добавьте еще 1 точку для создания полигона'
                    : 'Для отображения полигона необходимо минимум 3 точки'}
                </div>
              )}
            </>
          )}
        </div>

        {showMap && points.length >= 3 && (
          <MapView
            center={[points[0][1], points[0][0]] as [number, number]} // Type assertion for tuple
            coordinates={points.map(point => [point[1], point[0]] as [number, number])} // Type assertion for each coordinate tuple
            editable={true}
            onChange={(newCoordinates) => {
              // Convert back from [lng, lat] to [lat, lng] when receiving changes
              const convertedCoords = newCoordinates.map(coord => [coord[1], coord[0]] as [number, number]);
              handleMapPointsChange(convertedCoords);
            }}
          />
        )}
      </section>

      <section className={styles.section}>
        <h2>График работ</h2>
        <div className={styles.schedule}>
          <div className={styles.dates}>
            <div className={styles.field}>
              <label>Дата начала</label>
              <DatePicker
                selected={startDate}
                onChange={handleStartDateChange}
                dateFormat="dd.MM.yyyy"
                locale="ru"
                placeholderText="Выберите дату"
                className={styles.datePicker}
                minDate={new Date()}
                required
                title="Пожалуйста, заполните это поле"
              />
            </div>
            
            <div className={styles.field}>
              <label>Дата окончания</label>
              <DatePicker
                selected={endDate}
                onChange={handleEndDateChange}
                dateFormat="dd.MM.yyyy"
                locale="ru"
                placeholderText="Выберите дату"
                className={styles.datePicker}
                minDate={startDate || new Date()}
                required
                title="Пожалуйста, заполните это поле"
              />
            </div>
          </div>

          <div className={styles.workTypes}>
            <h3>Типы работ</h3>
            <div className={styles.description}>
              Укажите основные виды работ, которые планируется выполнить на объекте
            </div>
            
            <div className={styles.workTypeForm}>
              <div className={styles.field}>
                <label>Название работы</label>
                <input
                  type="text"
                  value={newWorkType.name}
                  onChange={(e) => setNewWorkType(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Например: Установка скамеек"
                  title="Пожалуйста, заполните это поле"
                />
              </div>
              
              <div className={styles.field}>
                <label>Описание (необязательно)</label>
                <textarea
                  value={newWorkType.description}
                  onChange={(e) => setNewWorkType(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Дополнительные детали о работе"
                />
              </div>
              
              <div className={styles.dates}>
                <div className={styles.field}>
                  <label>Дата начала</label>
                  <DatePicker
                    selected={newWorkType.startDate ? new Date(newWorkType.startDate) : null}
                    onChange={(date: Date | null) => setNewWorkType(prev => ({
                      ...prev,
                      startDate: date ? formatDateForBackend(date) : ''
                    }))}
                    dateFormat="dd.MM.yyyy"
                    locale="ru"
                    placeholderText="Выберите дату"
                    className={styles.datePicker}
                    minDate={new Date()}
                    title="Пожалуйста, заполните это поле"
                  />
                </div>
                
                <div className={styles.field}>
                  <label>Дата окончания</label>
                  <DatePicker
                    selected={newWorkType.endDate ? new Date(newWorkType.endDate) : null}
                    onChange={(date: Date | null) => setNewWorkType(prev => ({
                      ...prev,
                      endDate: date ? formatDateForBackend(date) : ''
                    }))}
                    dateFormat="dd.MM.yyyy"
                    locale="ru"
                    placeholderText="Выберите дату"
                    className={styles.datePicker}
                    minDate={newWorkType.startDate ? new Date(newWorkType.startDate) : new Date()}
                    title="Пожалуйста, заполните это поле"
                  />
                </div>
              </div>
              
              <button
                type="button"
                className={styles.addButton}
                onClick={handleAddWorkType}
                disabled={!newWorkType.name || !newWorkType.startDate || !newWorkType.endDate || uploading}
              >
                Добавить работу
              </button>
            </div>

            {formData.workSchedule.workTypes.length > 0 && (
              <div className={styles.workTypeList}>
                {formData.workSchedule.workTypes.map(workType => (
                  <div key={workType.id} className={styles.workTypeItem}>
                    <div className={styles.workTypeHeader}>
                      <h4>{workType.name}</h4>
                      <button
                        type="button"
                        className={styles.removeButton}
                        onClick={() => handleRemoveWorkType(workType.id)}
                      >
                        ✕
                      </button>
                    </div>
                    {workType.description && (
                      <p className={styles.workTypeDescription}>{workType.description}</p>
                    )}
                    <div className={styles.workTypeDates}>
                      <span>{workType.startDate}</span>
                      <span>—</span>
                      <span>{workType.endDate}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className={styles.section}>
        <h2>Документы</h2>
        <div className={styles.documents}>
          <div className={styles.description}>
            Загрузите необходимые документы (проектная документация, разрешения и т.д.)
          </div>
          
          <div className={styles.uploadContainer}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx"
              onChange={handleFileUpload}
              disabled={uploading}
              className={styles.fileInput}
              id="documents"
              multiple
              title="Пожалуйста, выберите файлы"
            />
            <label htmlFor="documents" className={styles.uploadLabel}>
              {uploading ? 'Загрузка...' : 'Выберите файлы'}
            </label>
            
            {uploadError && (
              <div className={styles.uploadError}>
                {uploadError}
              </div>
            )}
          </div>

          {formData.documents.length > 0 && (
            <div className={styles.documentsList}>
              <h3>Выбранные документы:</h3>
              {formData.documents.map((doc) => (
                <div key={doc.id} className={styles.documentItem}>
                  <span className={styles.documentName}>{doc.name}</span>
                  <button 
                    onClick={() => handleRemoveDocument(doc.id)}
                    className={styles.removeButton}
                    type="button"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <div className={styles.actions}>
        <button 
          type="button" // Change to type="button" to prevent form submission
          className={styles.submitButton}
          onClick={handleCreateObject}
          disabled={points.length < 3 || !formData.name || !formData.address || uploading}
        >
          {uploading ? 'Создание...' : 'Создать объект'}
        </button>
      </div>
    </form>
  );
};