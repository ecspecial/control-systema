import type { FC } from 'react';
import { useState, useEffect, useRef } from 'react';
import Select from 'react-select';
import { UserRole } from '../../../types/user.types';
import styles from './ElectronicJournal.module.scss';
import { objectsService } from '../../../services/objects.service';
import { filesService } from '../../../services/files.service';
import { getCurrentPosition, verifyUserAtObject } from '../../../utils/geolocation';
import { ViolationResponseForm } from './ViolationResponseForm';

interface ElectronicJournalProps {
  objectId: string;
  userRole?: string;
  onNotification: (message: string, type: 'success' | 'error') => void;
  polygon: { type: string; coordinates: Array<[number, number]> };
}

const VIOLATION_CATEGORIES = [
  { value: 'documentation', label: 'Документация' },
  { value: 'production_culture', label: 'Культура производства' },
  { value: 'project_solutions', label: 'Проектные решения' },
  { value: 'production_technology', label: 'Технология производства' },
  { value: 'asphalt_laying', label: 'Технология укладки АБП' }
];

const VIOLATION_TYPES = [
  { value: 'simple', label: 'Простое' },
  { value: 'severe', label: 'Грубое' }
];

const VIOLATION_FIXABILITY = [
  { value: 'fixable', label: 'Устранимое' },
  { value: 'non_fixable', label: 'Неустранимое' }
];

const VIOLATION_NAMES = [
  "Вынос грязи на покрытие с объекта ремонта",
  "Выполнение работ без форменной одежды",
  "Доступ на детскую площадку не ограничен, при этом работы не завершены",
  "Межплиточные швы заполнены не на всю высоту",
  "Мусор в зоне производства работ",
  "Нарушение вертикальных отметок при установке ОЛХ",
  "Нарушение зоны безопасности МАФ",
  "Нарушение конструкции дорожной одежды",
  "Нарушение места складирования строительного материала",
  "Нарушение места складирования строительного мусора",
  "Нарушение проектной высоты от поверхности площадки до элементов МАФ",
  "Нарушение проектных вертикальных и горизонтальных отметок плиточного покрытия",
  "Нарушение технологии установки бортового камня",
  "Нарушение технологии устройства плиточного мощения",
  "Не корректная информация на информационном щите",
  "Не обеспечен безопасный проход пешеходов / проезд транспорта",
  "Не обеспечена защита стволов деревьев",
  "Не оборудованы пути прохода пешеходов",
  "Не произведена установка ограждений",
  "Не соблюдение ширины межплиточного шва",
  "Не удовлетворительное состояние информационного щита",
  "Не укреплена обочина проезжей части",
  "Несвоевременный вывоз строительного мусора",
  "Неудовлетворительный внешний вид ограждения",
  "Осутствуют подстилающие слои из песка",
  "Отсутсвие документации на объекте",
  "Отсутствие Rf-Id меток",
  "Отсутствует аварийное освещение",
  "Отсутствует информационный щит",
  "Отсутствует сигнальная лента",
  "Отсутствует уведомление о начале производства работ",
  "Отсутствуют временные дорожные знаки",
  "Отсутствуют ограждения мест производства работ",
  "Проезжая часть не очищена",
  "Разность высот между смежными камнями/плитами",
  "Складирование скола асфальта более суток",
  "Складирование строительных материалов вне мест",
  "Сколы бортового камня",
  "Укладка асфальтобетонной смеси без разборки",
  "Укладка асфальтобетонной смеси без эмульсии",
  "Укладка асфальтобетонной смеси при плохой погоде",
  "Установка МАФ с дефектом",
  "Установка поврежденного бортового камня",
  "Устройство слоёв из неверных материалов"
].map(name => ({ value: name, label: name }));

// Add these display mappings
const CATEGORY_DISPLAY: Record<string, string> = {
  'documentation': 'Документация',
  'production_culture': 'Культура производства',
  'project_solutions': 'Проектные решения',
  'production_technology': 'Технология производства',
  'asphalt_laying': 'Технология укладки АБП'
};

const STATUS_DISPLAY: Record<string, string> = {
  'open': 'На рассмотрении',
  'in_progress': 'В работе',
  'fixed': 'Исправлено',
  'verified': 'Проверено',
  'rejected': 'Отклонено'
};

interface ViolationDocument {
  id: string;
  name: string;
  path: string;
  type: string;
  originalName?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface ViolationResponse {
  id: string;
  violationId: string;
  description: string;
  status: 'awaiting_approval' | 'approved' | 'needs_revision';
  controllerComment: string | null;
  documents: ViolationDocument[];
  createdAt: string;
  updatedAt: string;
}

interface Violation {
  id: string;
  category: string;
  fixability: string;
  type: string;
  name: string;
  status: string;
  fixDeadline: string;
  documents?: ViolationDocument[];
  locationData?: LocationData;
  createdAt: string;
  updatedAt: string;
  responses: ViolationResponse[];
}

const getDocumentDisplayName = (doc: ViolationDocument, index: number) => {
  if (doc.name && doc.name.trim() !== '') {
    return doc.name;
  }
  // Get file extension from path
  const extension = doc.path.split('.').pop() || '';
  return `Документ ${index + 1}${extension ? `.${extension}` : ''}`;
};

export const ElectronicJournal: FC<ElectronicJournalProps> = ({
  objectId,
  userRole,
  onNotification,
  polygon
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [violationForm, setViolationForm] = useState({
    category: '',
    customCategory: '',
    fixability: '',
    type: '',
    name: '',
    customName: '',
    fixDeadlineDays: 1,
    documents: [] as File[]
  });

  // Add state for violations list
  const [violations, setViolations] = useState<Violation[]>([]);
  const [loadingViolations, setLoadingViolations] = useState(true);

  // Add state for file upload
  const [uploadingViolationId, setUploadingViolationId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Add state for location verification
  const [isAtLocation, setIsAtLocation] = useState<boolean>(false);
  const [checkingLocation, setCheckingLocation] = useState<boolean>(false);

  // Add this state to store the last verified location
  const [lastVerifiedLocation, setLastVerifiedLocation] = useState<GeolocationPosition | null>(null);

  // Add state for modal
  const [isCommentModalOpen, setIsCommentModalOpen] = useState(false);
  const [selectedResponse, setSelectedResponse] = useState<{ violationId: string; responseId: string } | null>(null);
  const [revisionComment, setRevisionComment] = useState('');

  // Function to verify location
  const verifyLocation = async () => {
    setCheckingLocation(true);
    try {
      console.log('Starting location verification...');
      console.log('Object polygon data:', polygon);
      
      const [verified, position] = await verifyUserAtObject(polygon, true);
      setIsAtLocation(verified);
      
      if (verified && position) {
        setLastVerifiedLocation(position);
        onNotification('Местоположение подтверждено', 'success');
      } else {
        setLastVerifiedLocation(null);
        onNotification('Вы должны находиться на объекте для внесения замечаний', 'error');
      }
    } catch (error: any) {
      console.error('Location verification error:', error);
      setLastVerifiedLocation(null);
      onNotification(
        error.message || 'Ошибка проверки местоположения', 
        'error'
      );
    } finally {
      setCheckingLocation(false);
    }
  };

  // Verify location when component mounts
  useEffect(() => {
    verifyLocation();
  }, [polygon]);

  // Add function to fetch violations
  const fetchViolations = async () => {
    try {
      const data = await objectsService.getViolations(objectId);
      console.log('Fetched violations:', data);
      setViolations(data);
    } catch (error) {
      console.error('Error fetching violations:', error);
      onNotification('Ошибка при загрузке нарушений', 'error');
    } finally {
      setLoadingViolations(false);
    }
  };

  // Add useEffect to fetch violations on mount
  useEffect(() => {
    fetchViolations();
  }, [objectId]);

  useEffect(() => {
    if (violationForm.fixability === 'non_fixable') {
      setViolationForm(prev => ({ ...prev, fixDeadlineDays: 0 }));
    } else if (violationForm.fixDeadlineDays === 0) {
      setViolationForm(prev => ({ ...prev, fixDeadlineDays: 1 }));
    }
  }, [violationForm.fixability]);

  // Modify handleSubmit to use the stored location
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objectId) return;

    // Check if we have a recent verified location
    if (!isAtLocation || !lastVerifiedLocation) {
      onNotification('Необходимо подтвердить местоположение', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Use the last verified location instead of getting a new one
      const position = lastVerifiedLocation;
      
      // Create violation with location data
      const violation = await objectsService.createViolation(objectId, {
        category: violationForm.customCategory || violationForm.category,
        fixability: violationForm.fixability,
        type: violationForm.type,
        name: violationForm.customName || violationForm.name,
        fixDeadlineDays: violationForm.fixDeadlineDays,
        locationData: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString()
        }
      });

      // Upload any initial documents if they exist
      if (violationForm.documents.length > 0) {
        for (const file of violationForm.documents) {
          await objectsService.uploadViolationDocument(
            objectId,
            violation.id,
            file
          );
        }
      }

      // Reset form
      setViolationForm({
        category: '',
        customCategory: '',
        fixability: '',
        type: '',
        name: '',
        customName: '',
        fixDeadlineDays: 1,
        documents: []
      });

      onNotification('Нарушение добавлено', 'success');
      fetchViolations();
    } catch (error) {
      console.error('Error creating violation:', error);
      onNotification('Ошибка при добавлении нарушения', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add file upload handler
  const handleViolationDocumentUpload = async (violationId: string) => {
    if (!selectedFile) return;

    try {
      await objectsService.uploadViolationDocument(
        objectId,
        violationId,
        selectedFile
      );

      // Refresh violations list
      await fetchViolations();
      
      // Reset file input
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setUploadingViolationId(null);

      onNotification('Документ добавлен', 'success');
    } catch (error) {
      console.error('Error uploading document:', error);
      onNotification('Ошибка при загрузке документа', 'error');
    }
  };

  const handleDownload = async (
    e: React.MouseEvent<HTMLButtonElement>,
    objectId: string,
    document: ViolationDocument
  ) => {
    e.preventDefault();
    try {
      // Extract just the filename from the path
      const fileId = document.path.split('/').pop() || document.path;
      await filesService.downloadFile(objectId, fileId, document.originalName || document.name);
    } catch (error) {
      console.error('Download error:', error);
      onNotification('Ошибка при скачивании файла', 'error');
    }
  };

  // Function to handle initial document selection
  const handleInitialDocumentsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setViolationForm(prev => ({
      ...prev,
      documents: [...prev.documents, ...files]
    }));
  };

  // Function to remove a document from the initial form
  const removeInitialDocument = (index: number) => {
    setViolationForm(prev => ({
      ...prev,
      documents: prev.documents.filter((_, i) => i !== index)
    }));
  };

  // Functions to handle responses
  const handleResponseSubmit = async (
    violationId: string,
    data: { description: string; documents: File[] }
  ) => {
    try {
      // First create the response
      const response = await objectsService.createViolationResponse(objectId, violationId, {
        description: data.description
      });

      // Then upload documents if any
      if (data.documents.length > 0) {
        for (const document of data.documents) {
          try {
            await objectsService.uploadViolationResponseDocument(
              objectId,
              violationId,
              response.id,
              document
            );
          } catch (error) {
            console.error('Error uploading document:', error);
            // Continue with other documents even if one fails
          }
        }
      }

      onNotification('Ответ отправлен на проверку', 'success');
      await fetchViolations(); // Add await here to ensure list is refreshed
    } catch (error) {
      console.error('Error submitting response:', error);
      onNotification('Ошибка при отправке ответа', 'error');
    }
  };

  const handleResponseStatusUpdate = async (
    violationId: string,
    responseId: string,
    status: 'approved' | 'needs_revision',
    controllerComment?: string
  ) => {
    // Add role check at the function level
    if (userRole !== UserRole.CONTROL && userRole !== UserRole.INSPECTOR) {
      onNotification('У вас нет прав на изменение статуса', 'error');
      return;
    }

    try {
      await objectsService.updateViolationResponseStatus(objectId, violationId, responseId, {
        status,
        controllerComment
      });

      onNotification(
        status === 'approved' ? 'Ответ принят' : 'Ответ отправлен на доработку',
        'success'
      );
      await fetchViolations();
    } catch (error) {
      console.error('Error updating response status:', error);
      onNotification('Ошибка при обновлении статуса', 'error');
    }
  };

  const handleRevisionClick = (violationId: string, responseId: string) => {
    setSelectedResponse({ violationId, responseId });
    setIsCommentModalOpen(true);
  };

  const handleCommentSubmit = () => {
    if (selectedResponse && revisionComment.trim()) {
      handleResponseStatusUpdate(
        selectedResponse.violationId,
        selectedResponse.responseId,
        'needs_revision',
        revisionComment
      );
      setIsCommentModalOpen(false);
      setRevisionComment('');
      setSelectedResponse(null);
    }
  };

  const canAddViolations = userRole === UserRole.CONTROL || userRole === UserRole.INSPECTOR;

  return (
    <div className={styles.journalContent}>
      {/* Show location status only for Control and Inspector roles */}
      {canAddViolations && (
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
              <span>⚠️ Вы должны находиться на объекте для внесения замечаний</span>
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

      {/* Show form only for Control and Inspector roles */}
      {canAddViolations && (
        <form 
          onSubmit={handleSubmit} 
          className={`${styles.violationForm} ${!isAtLocation ? styles.formDisabled : ''}`}
        >
          <div className={styles.formGroup}>
            <label>Категория</label>
            <Select
              options={VIOLATION_CATEGORIES}
              value={VIOLATION_CATEGORIES.find(c => c.value === violationForm.category)}
              onChange={(option) => setViolationForm(prev => ({ ...prev, category: option?.value || '' }))}
              isClearable
              placeholder="Выберите категорию"
              className={styles.select}
            />
            {!violationForm.category && (
              <input
                type="text"
                value={violationForm.customCategory}
                onChange={(e) => setViolationForm(prev => ({ ...prev, customCategory: e.target.value }))}
                placeholder="Или введите свою категорию"
                className={styles.input}
              />
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Вид</label>
            <Select
              options={VIOLATION_FIXABILITY}
              value={VIOLATION_FIXABILITY.find(f => f.value === violationForm.fixability)}
              onChange={(option) => setViolationForm(prev => ({ ...prev, fixability: option?.value || '' }))}
              placeholder="Выберите вид нарушения"
              className={styles.select}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Тип</label>
            <Select
              options={VIOLATION_TYPES}
              value={VIOLATION_TYPES.find(t => t.value === violationForm.type)}
              onChange={(option) => setViolationForm(prev => ({ ...prev, type: option?.value || '' }))}
              placeholder="Выберите тип нарушения"
              className={styles.select}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Наименование</label>
            <Select
              options={VIOLATION_NAMES}
              value={violationForm.name ? { value: violationForm.name, label: violationForm.name } : null}
              onChange={(option) => setViolationForm(prev => ({ ...prev, name: option?.value || '' }))}
              isClearable
              placeholder="Выберите наименование"
              className={styles.select}
            />
            {!violationForm.name && (
              <input
                type="text"
                value={violationForm.customName}
                onChange={(e) => setViolationForm(prev => ({ ...prev, customName: e.target.value }))}
                placeholder="Или введите свое наименование"
                className={styles.input}
              />
            )}
          </div>

          <div className={styles.formGroup}>
            <label>Регламентный срок устранения</label>
            {violationForm.fixability === 'non_fixable' ? (
              <div className={styles.nonFixableText}>Не подлежит устранению</div>
            ) : (
              <div className={styles.fixDeadlineInput}>
                <input
                  type="number"
                  min="1"
                  max="30"
                  value={violationForm.fixDeadlineDays}
                  onChange={(e) => setViolationForm(prev => ({ ...prev, fixDeadlineDays: parseInt(e.target.value) || 1 }))}
                  className={styles.input}
                  required
                />
                <span className={styles.daysLabel}>дней</span>
              </div>
            )}
          </div>

          {/* Add this section for initial document upload */}
          <div className={styles.formGroup}>
            <label>Документы и фотографии</label>
            <div className={styles.documentUploadSection}>
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleInitialDocumentsChange}
                className={styles.fileInput}
                id="initial-violation-documents"
              />
              <label 
                htmlFor="initial-violation-documents"
                className={styles.uploadLabel}
              >
                Выберите файлы
              </label>
              
              {/* Show selected files */}
              {violationForm.documents.length > 0 && (
                <div className={styles.selectedFiles}>
                  {violationForm.documents.map((file, index) => (
                    <div key={index} className={styles.selectedFile}>
                      <span>{file.name || `Документ ${index + 1}`}</span>
                      <button
                        type="button"
                        onClick={() => removeInitialDocument(index)}
                        className={styles.removeFileButton}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <button
            type="submit"
            className={styles.submitButton}
            disabled={isSubmitting || !isAtLocation || 
              (!violationForm.category && !violationForm.customCategory) ||
              !violationForm.fixability ||
              !violationForm.type ||
              (!violationForm.name && !violationForm.customName)}
            title={!isAtLocation ? "Необходимо находиться на объекте" : ""}
          >
            {isSubmitting ? 'Добавление...' : 'Добавить нарушение'}
          </button>
        </form>
      )}

      {/* Show violations list to all roles */}
      <div className={styles.violationsList}>
        <h3>Список нарушений</h3>
        {loadingViolations ? (
          <div className={styles.loading}>Загрузка...</div>
        ) : violations.length === 0 ? (
          <div className={styles.noViolations}>Нарушений не найдено</div>
        ) : (
          <div className={styles.violations}>
            {violations.map((violation: Violation) => {
              console.log('Rendering violation:', violation);
              console.log('Violation responses:', violation.responses);
              return (
                <div key={violation.id} className={styles.violationItem}>
                  <div className={styles.violationHeader}>
                    <div className={styles.violationCategory}>
                      {CATEGORY_DISPLAY[violation.category] || violation.category}
                    </div>
                    <div className={`${styles.violationStatus} ${styles[violation.status]}`}>
                      {STATUS_DISPLAY[violation.status] || violation.status}
                    </div>
                  </div>
                  <div className={styles.violationName}>{violation.name}</div>
                  <div className={styles.violationDetails}>
                    <span className={styles.violationType}>
                      {violation.type === 'simple' ? 'Простое' : 'Грубое'}
                    </span>
                    <span className={styles.violationFixability}>
                      {violation.fixability === 'fixable' ? 'Устранимое' : 'Неустранимое'}
                    </span>
                    <span className={styles.violationDeadline}>
                      {violation.fixability === 'non_fixable' ? 
                        'Не подлежит устранению' : 
                        violation.fixDeadline ? 
                          `Срок устранения: ${new Date(violation.fixDeadline).toLocaleDateString('ru')}` :
                          'Срок не указан'
                      }
                    </span>
                  </div>
                  
                  {/* Show documents section to all roles */}
                  {violation.documents && violation.documents.length > 0 && (
                    <div className={styles.violationDocuments}>
                      <h4>Документы</h4>
                      <div className={styles.documentsList}>
                        {violation.documents.map((doc: ViolationDocument, index: number) => (
                          <div key={doc.id} className={styles.documentItem}>
                            <span className={styles.documentName}>
                              {getDocumentDisplayName(doc, index)}
                            </span>
                            <button 
                              onClick={(e) => handleDownload(e, objectId, doc)}
                              className={styles.downloadButton}
                            >
                              Скачать
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Show document upload only for Control and Inspector roles */}
                  {canAddViolations && (
                    <div className={styles.documentUpload}>
                      <input
                        ref={fileInputRef}
                        type="file"
                        onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                        className={styles.fileInput}
                        id={`violation-doc-${violation.id}`}
                      />
                      <label 
                        htmlFor={`violation-doc-${violation.id}`}
                        className={styles.uploadLabel}
                      >
                        {selectedFile ? selectedFile.name : 'Выберите документ'}
                      </label>
                      
                      {selectedFile && (
                        <button
                          onClick={() => handleViolationDocumentUpload(violation.id)}
                          className={styles.uploadButton}
                          disabled={uploadingViolationId === violation.id}
                        >
                          {uploadingViolationId === violation.id ? 'Загрузка...' : 'Загрузить'}
                        </button>
                      )}
                    </div>
                  )}

                  {/* Show location metadata to all roles */}
                  {violation.locationData && (
                    <div className={styles.violationMetadata}>
                      <div className={styles.violationTime}>
                        <span className={styles.label}>Время фиксации:</span>
                        <span className={styles.value}>
                          {new Date(violation.locationData.timestamp).toLocaleString('ru')}
                        </span>
                      </div>
                      <div className={styles.violationLocation}>
                        <span className={styles.label}>Координаты:</span>
                        <span className={styles.value}>
                          {violation.locationData.latitude.toFixed(6)}, {violation.locationData.longitude.toFixed(6)}
                        </span>
                        <span className={styles.accuracy}>
                          (точность: ±{Math.round(violation.locationData.accuracy)}м)
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Add response section */}
                  <div className={styles.violationResponses}>
                    <h4>История устранения</h4>
                    {Array.isArray(violation.responses) && violation.responses.length > 0 ? (
                      violation.responses.map(response => (
                        <div key={response.id} className={styles.responseItem}>
                          <div className={styles.responseHeader}>
                            <div className={styles.responseStatus} data-status={response.status}>
                              {response.status === 'awaiting_approval' && 'На проверке'}
                              {response.status === 'approved' && 'Принято'}
                              {response.status === 'needs_revision' && 'Требует доработки'}
                            </div>
                            <div className={styles.responseDate}>
                              {new Date(response.createdAt).toLocaleString('ru')}
                            </div>
                          </div>

                          {response.description && (
                            <div className={styles.responseDescription}>{response.description}</div>
                          )}

                          {Array.isArray(response.documents) && response.documents.length > 0 && ( 
                            <div className={styles.responseDocuments}>
                              <h5>Приложенные документы:</h5>
                              {response.documents.map((doc: ViolationDocument) => (
                                <div key={doc.id} className={styles.documentItem}>
                                  <span className={styles.documentName}>
                                    {doc.name}
                                  </span>
                                  <button 
                                    onClick={(e) => handleDownload(e, objectId, doc)}
                                    className={styles.downloadButton}
                                  >
                                    Скачать
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Add status update controls for controllers and inspectors */}
                          {(userRole === UserRole.CONTROL || userRole === UserRole.INSPECTOR) && 
                           response.status === 'awaiting_approval' && (
                            <div className={styles.statusControls}>
                              <button
                                onClick={() => handleResponseStatusUpdate(violation.id, response.id, 'approved', '')}
                                className={`${styles.statusButton} ${styles.approveButton}`}
                              >
                                Принять
                              </button>
                              <button
                                onClick={() => handleRevisionClick(violation.id, response.id)}
                                className={`${styles.statusButton} ${styles.rejectButton}`}
                              >
                                Отправить на доработку
                              </button>
                            </div>
                          )}

                          {response.controllerComment && (
                            <div className={styles.controllerComment}>
                              <strong>Комментарий проверяющего:</strong> {response.controllerComment}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <div className={styles.noResponses}>Нет ответов по устранению</div>
                    )}

                    {/* Show response form for contractor */}
                    {userRole === UserRole.CONTRACTOR && 
                     violation.status !== 'resolved' &&
                     (!violation.responses?.length || 
                      violation.responses[violation.responses.length - 1]?.status === 'needs_revision') && (
                      <ViolationResponseForm
                        violationId={violation.id}
                        onSubmit={(data) => handleResponseSubmit(violation.id, data)}
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Comment Modal */}
      {isCommentModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modal}>
            <h3>Комментарий для доработки</h3>
            <textarea
              value={revisionComment}
              onChange={(e) => setRevisionComment(e.target.value)}
              placeholder="Опишите что нужно исправить..."
              className={styles.commentTextarea}
              autoFocus
            />
            <div className={styles.modalButtons}>
              <button
                onClick={() => {
                  setIsCommentModalOpen(false);
                  setRevisionComment('');
                  setSelectedResponse(null);
                }}
                className={`${styles.modalButton} ${styles.cancelButton}`}
              >
                Отмена
              </button>
              <button
                onClick={handleCommentSubmit}
                disabled={!revisionComment.trim()}
                className={`${styles.modalButton} ${styles.submitButton}`}
              >
                Отправить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
