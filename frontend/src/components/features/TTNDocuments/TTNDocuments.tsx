import { useState, useEffect, useRef } from 'react';
import type { FC } from 'react';
import { ttnService } from '../../../services/ttn.service';
import { ocrService } from '../../../services/ocr.service';
import type { WorkType } from '../../../types/city-object.types';
import styles from './TTNDocuments.module.scss';
import { verifyUserAtObject } from '../../../utils/geolocation';
import { UserRole } from '../../../types/user.types';

interface DocumentFile {
  file: File;
  type: 'ttn' | 'quality';
}

interface TTNDocumentsProps {
  objectId: string;
  onNotification: (message: string, type: 'success' | 'error') => void;
  polygon: { type: string; coordinates: Array<[number, number]> }; // Add this prop
  userRole?: string;  // Add this
}

// Add interface for TTN entries
interface TTNEntry {
  id: string;
  description: string;
  documents: Array<{
    id: string;
    name: string;
    type: string;
    path: string;
  }>;
  createdAt: string;
}

interface OCRTask {
  workTypeId: string;
  taskId: string;
  intervalId: number;
}

interface OCRFile {
  file: File;
  status: 'ready' | 'processing';
}

interface QueueTimer {
  timeLeft: number;
  intervalId?: number;
}

// Add new interfaces
interface QueuedTTN {
  id: string;
  workTypeId: string;
  description: string;
  createdAt: string;
  status: 'pending_ocr' | 'processing_ocr' | 'completed';
  documents?: Array<{
    id: string;
    name: string;
    type: string;
    path: string;
  }>;
}

// Add interface for TTN creation data
interface CreateTTNData {
  description: string;
  status?: 'pending_ocr' | 'completed';  // Make status optional
}

// Add state for selected OCR files in queue
interface QueuedOCRFile {
  ttnId: string;
  file: File;
}

export const TTNDocuments: FC<TTNDocumentsProps> = ({ 
  objectId, 
  onNotification,
  polygon,
  userRole
}) => {
  // Add this debug log at the start
  console.log('TTNDocuments mounted:', {
    userRole,
    isUserRoleValid: typeof userRole === 'string',
    expectedRoles: {
      CONTROL: UserRole.CONTROL,
      INSPECTOR: UserRole.INSPECTOR,
      CONTRACTOR: UserRole.CONTRACTOR
    }
  });

  // Add state for TTN entries
  const [ttnEntries, setTtnEntries] = useState<Record<string, TTNEntry[]>>({});
  const [workTypes, setWorkTypes] = useState<WorkType[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedWorkType, setSelectedWorkType] = useState<WorkType | null>(null);
  const [description, setDescription] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<DocumentFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [selectedOCRFile, setSelectedOCRFile] = useState<OCRFile | null>(null);
  const [queueTimer, setQueueTimer] = useState<QueueTimer | null>(null);
  const [isAtLocation, setIsAtLocation] = useState<boolean>(false);
  const [checkingLocation, setCheckingLocation] = useState<boolean>(false);
  const [lastVerifiedLocation, setLastVerifiedLocation] = useState<GeolocationPosition | null>(null);

  // Add state for queued TTNs
  const [queuedTTNs, setQueuedTTNs] = useState<QueuedTTN[]>([]);
  
  // Add state for selected OCR files in queue
  const [queuedOCRFiles, setQueuedOCRFiles] = useState<QueuedOCRFile[]>([]);

  // Add a ref to track if we've received a successful response
  const hasReceivedResult = useRef(false);

  // Memoize the notification callback to prevent infinite loops
  const notifyRef = useRef(onNotification);
  useEffect(() => {
    notifyRef.current = onNotification;
  }, [onNotification]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (queueTimer?.intervalId) {
        clearInterval(queueTimer.intervalId);
      }
    };
  }, [queueTimer]);

  // Load OCR tasks from localStorage on component mount
  useEffect(() => {
    const savedTasks = localStorage.getItem('ocrTasks');
    if (savedTasks) {
      const tasks: OCRTask[] = JSON.parse(savedTasks);
      tasks.forEach(task => {
        startOCRPolling(task.taskId, task.workTypeId);
      });
    }
  }, []);

  // Add function to fetch TTN entries
  const fetchTTNEntries = async (workTypeId: string) => {
    try {
      const entries = await ttnService.getTTNEntries(objectId, workTypeId);
      setTtnEntries(prev => ({
        ...prev,
        [workTypeId]: entries
      }));
    } catch (error) {
      console.error('Error fetching TTN entries:', error);
    }
  };

  // Modify useEffect to fetch TTN entries for each work type
  useEffect(() => {
    const fetchWorkTypes = async () => {
      try {
        const data = await ttnService.getWorkTypes(objectId);
        setWorkTypes(data);
        // Fetch TTN entries for each work type
        data.forEach((workType: WorkType) => fetchTTNEntries(workType.id));
      } catch (error) {
        console.error('Error fetching work types:', error);
        notifyRef.current('Ошибка при загрузке видов работ', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkTypes();
  }, [objectId]);

  const startOCRPolling = (taskId: string, workTypeId: string, queuedTTNId?: string) => {
    const intervalId = window.setInterval(async () => {
      // Don't make the request if we already got a result
      if (hasReceivedResult.current) {
        clearInterval(intervalId);
        return;
      }

      try {
        const result = await ocrService.checkOCRStatus(taskId);
        if (result.status === 'completed' && result.text) {
          // Set the flag to prevent further requests
          hasReceivedResult.current = true;

          // Update TTN entry with OCR result
          if (queuedTTNId) {
            // Update queued TTN status
            setQueuedTTNs(prev => prev.map(ttn => 
              ttn.id === queuedTTNId 
                ? { ...ttn, status: 'completed' }
                : ttn
            ));

            // Update the TTN entry description
            const ttnData: CreateTTNData = {
              description: result.text,
              status: 'completed'
            };
            
            try {
              await ttnService.createTTNEntry(objectId, workTypeId, ttnData);
              await fetchTTNEntries(workTypeId);
            } catch (error) {
              console.error('Error updating TTN entry:', error);
            }
          }

          // Update description if we're currently editing this work type
          if (selectedWorkType?.id === workTypeId) {
            setDescription(result.text);
            // Clear processing states
            setOcrProcessing(false);
            setQueueTimer(null);
            setSelectedOCRFile(null);
          }
          // Remove task from localStorage
          removeOCRTask(taskId);
          clearInterval(intervalId);
          notifyRef.current('Текст успешно распознан', 'success');
        } else if (result.status === 'error') {
          hasReceivedResult.current = true;
          removeOCRTask(taskId);
          clearInterval(intervalId);
          notifyRef.current('Ошибка при распознавании текста', 'error');
        }
      } catch (error) {
        console.error('Error checking OCR status:', error);
        removeOCRTask(taskId);
        clearInterval(intervalId);
      }
    }, 10000);

    // Save task to localStorage
    const tasks: OCRTask[] = JSON.parse(localStorage.getItem('ocrTasks') || '[]');
    tasks.push({ taskId, workTypeId, intervalId });
    localStorage.setItem('ocrTasks', JSON.stringify(tasks));
  };

  const removeOCRTask = (taskId: string) => {
    const tasks: OCRTask[] = JSON.parse(localStorage.getItem('ocrTasks') || '[]');
    const updatedTasks = tasks.filter(task => {
      if (task.taskId === taskId) {
        clearInterval(task.intervalId);
        return false;
      }
      return true;
    });
    localStorage.setItem('ocrTasks', JSON.stringify(updatedTasks));
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>, type: 'ttn' | 'quality') => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFiles(prev => [...prev, { file, type }]);
      // Reset the input
      event.target.value = '';
    }
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Add handleDownload function
  const handleDownload = async (path: string) => {
    try {
      const blob = await ttnService.downloadDocument(path);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = path.split('/').pop() || 'document';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      notifyRef.current('Документ успешно скачан', 'success');
    } catch (error) {
      console.error('Error downloading document:', error);
      notifyRef.current('Ошибка при скачивании документа', 'error');
    }
  };

  const verifyLocation = async () => {
    setCheckingLocation(true);
    try {
      const [verified, position] = await verifyUserAtObject(polygon, true);
      setIsAtLocation(verified);
      
      if (verified && position) {
        setLastVerifiedLocation(position);
        notifyRef.current('Местоположение подтверждено', 'success');
      } else {
        setLastVerifiedLocation(null);
        notifyRef.current('Вы должны находиться на объекте для добавления документов', 'error');
      }
    } catch (error: any) {
      console.error('Location verification error:', error);
      setLastVerifiedLocation(null);
      notifyRef.current(
        error.message || 'Ошибка проверки местоположения', 
        'error'
      );
    } finally {
      setCheckingLocation(false);
    }
  };

  // Only verify location on mount and when polygon changes
  useEffect(() => {
    verifyLocation();
  }, [polygon]); // Remove onNotification from deps array

  // Modify handleSubmit to update the entries after successful addition
  const handleSubmit = async (queueForOCR: boolean = false) => {
    if (!selectedWorkType || !description) return;

    if (!isAtLocation || !lastVerifiedLocation) {
      onNotification('Необходимо подтвердить местоположение', 'error');
      return;
    }

    setUploading(true);
    try {
      const ttnData: CreateTTNData = {
        description,
        ...(queueForOCR ? { status: 'pending_ocr' } : {})
      };

      const ttnEntry = await ttnService.createTTNEntry(objectId, selectedWorkType.id, ttnData);

      if (selectedFiles.length > 0) {
        await Promise.all(selectedFiles.map(docFile => 
          ttnService.uploadDocument(objectId, selectedWorkType.id, ttnEntry.id, docFile.file)
        ));
      }

      // If queuing for OCR, add to local queue
      if (queueForOCR) {
        setQueuedTTNs(prev => [...prev, {
          id: ttnEntry.id,
          workTypeId: selectedWorkType.id,
          description: description,
          createdAt: new Date().toISOString(),
          status: 'pending_ocr'
        }]);
        onNotification('ТТН добавлена в очередь на распознавание', 'success');
      } else {
        onNotification('Документы успешно добавлены', 'success');
      }

      // Refresh TTN entries for this work type
      await fetchTTNEntries(selectedWorkType.id);
      
      setDescription('');
      setSelectedFiles([]);
      setSelectedWorkType(null);
    } catch (error) {
      console.error('Error creating TTN entry:', error);
      onNotification('Ошибка при создании записи', 'error');
    } finally {
      setUploading(false);
    }
  };

  // Reset the flag when selecting a new file
  const handleOCRFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      hasReceivedResult.current = false; // Reset the flag
      setSelectedOCRFile({
        file,
        status: 'ready'
      });
    }
    event.target.value = '';
  };

  const startQueueTimer = (queuePosition: number) => {
    // Estimate 30 seconds per position in queue
    const initialTime = queuePosition * 30;
    
    if (queueTimer?.intervalId) {
      clearInterval(queueTimer.intervalId);
    }

    const intervalId = window.setInterval(() => {
      setQueueTimer(prev => {
        if (!prev || prev.timeLeft <= 0) {
          clearInterval(intervalId);
          return null;
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    setQueueTimer({ timeLeft: initialTime, intervalId });
  };

  const handleOCRSubmit = async () => {
    if (!selectedOCRFile || !selectedWorkType) return;

    setOcrProcessing(true);
    try {
      const result = await ocrService.submitOCR(selectedOCRFile.file);
      if (result.task_id) {
        startOCRPolling(result.task_id, selectedWorkType.id);
        notifyRef.current('Документ отправлен на распознавание', 'success');
        setSelectedOCRFile(prev => prev ? { ...prev, status: 'processing' } : null);
        
        // Start timer based on queue position
        if (result.queue_position) {
          startQueueTimer(result.queue_position);
        }
      }
    } catch (error) {
      console.error('Error submitting OCR:', error);
      notifyRef.current('Ошибка при отправке документа на распознавание', 'error');
      setSelectedOCRFile(null);
    }
  };

  // Add function to process queued TTN
  const processQueuedTTN = async (queuedTTN: QueuedTTN, file: File) => {
    try {
      setQueuedTTNs(prev => prev.map(ttn => 
        ttn.id === queuedTTN.id 
          ? { ...ttn, status: 'processing_ocr' }
          : ttn
      ));

      const result = await ocrService.submitOCR(file);
      
      if (result.task_id) {
        startOCRPolling(result.task_id, queuedTTN.workTypeId, queuedTTN.id);
        onNotification('Документ отправлен на распознавание', 'success');
        
        if (result.queue_position) {
          startQueueTimer(result.queue_position);
        }
      }
    } catch (error) {
      console.error('Error processing queued TTN:', error);
      onNotification('Ошибка при отправке документа на распознавание', 'error');
      
      setQueuedTTNs(prev => prev.map(ttn => 
        ttn.id === queuedTTN.id 
          ? { ...ttn, status: 'pending_ocr' }
          : ttn
      ));
    }
  };

  const canAddDocuments = userRole === UserRole.CONTROL || userRole === UserRole.INSPECTOR || userRole === UserRole.CONTRACTOR;

  console.log('🔍 TTN Debug:', { 
    userRole, 
    canAddDocuments, 
    loading,
    isAtLocation,
    checkingLocation,
    polygon,
    UserRole_CONTROL: UserRole.CONTROL,
    UserRole_INSPECTOR: UserRole.INSPECTOR,
    UserRole_CONTRACTOR: UserRole.CONTRACTOR
  });

  if (loading) return <div>Загрузка...</div>;

  return (
    <div className={styles.ttnDocuments}>
      {/* Show location status for all users */}
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
            <span>⚠️ Вы должны находиться на объекте для добавления документов</span>
            <button 
              onClick={verifyLocation}
              className={styles.retryButton}
            >
              Проверить местоположение
            </button>
          </div>
        )}
      </div>

      {/* Add OCR Queue section */}
      {queuedTTNs.length > 0 && (
        <div className={styles.ocrQueue}>
          <h3>Очередь на распознавание</h3>
          <div className={styles.queueList}>
            {queuedTTNs.map(queuedTTN => (
              <div key={queuedTTN.id} className={styles.queueItem}>
                <div className={styles.queueItemInfo}>
                  <span className={styles.queueItemDate}>
                    {new Date(queuedTTN.createdAt).toLocaleDateString('ru')}
                  </span>
                  <p className={styles.queueItemDescription}>{queuedTTN.description}</p>
                </div>
                {queuedTTN.status === 'pending_ocr' && (
                  <div className={styles.queueItemActions}>
                    <div className={styles.fileInputWrapper}>
                      <input
                        type="file"
                        id={`ocr-${queuedTTN.id}`}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setQueuedOCRFiles(prev => [
                              ...prev.filter(item => item.ttnId !== queuedTTN.id),
                              { ttnId: queuedTTN.id, file }
                            ]);
                          }
                          // Reset input
                          e.target.value = '';
                        }}
                        accept="image/*"
                        className={styles.fileInput}
                      />
                      <label htmlFor={`ocr-${queuedTTN.id}`} className={styles.fileInputLabel}>
                        {queuedOCRFiles.find(item => item.ttnId === queuedTTN.id)?.file.name || 
                         'Выберите фото для распознавания'}
                      </label>
                    </div>
                    {queuedOCRFiles.find(item => item.ttnId === queuedTTN.id) && (
                      <button
                        className={styles.ocrSubmitButton}
                        onClick={() => {
                          const ocrFile = queuedOCRFiles.find(item => item.ttnId === queuedTTN.id);
                          if (ocrFile) {
                            processQueuedTTN(queuedTTN, ocrFile.file);
                            // Remove from queued files after processing
                            setQueuedOCRFiles(prev => 
                              prev.filter(item => item.ttnId !== queuedTTN.id)
                            );
                          }
                        }}
                      >
                        Отправить на распознавание
                      </button>
                    )}
                  </div>
                )}
                {queuedTTN.status === 'processing_ocr' && (
                  <div className={styles.queueItemStatus}>
                    <div className={styles.spinner}></div>
                    <span>Распознавание...</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rest of your existing workTypesList */}
      <div className={styles.workTypesList}>
        {workTypes.map((workType) => (
          <div key={workType.id} className={styles.workTypeItem}>
            <h3>{workType.name}</h3>
            <div className={styles.ttnEntries}>
              {ttnEntries[workType.id]?.map(entry => (
                <div key={entry.id} className={styles.ttnEntry}>
                  <div className={styles.ttnEntryHeader}>
                    <span className={styles.ttnEntryDate}>
                      {new Date(entry.createdAt).toLocaleDateString('ru')}
                    </span>
                  </div>
                  <p className={styles.ttnEntryDescription}>{entry.description}</p>
                  <div className={styles.ttnEntryDocuments}>
                    {entry.documents.map(doc => (
                      <div key={doc.id} className={styles.ttnEntryDocument}>
                        <span>{doc.name}</span>
                        <button 
                          className={styles.downloadButton}
                          onClick={() => handleDownload(doc.path)}
                        >
                          Скачать
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            
            {selectedWorkType?.id === workType.id ? (
              // Add formDisabled class when not at location
              <div className={`${styles.addTTNForm} ${!isAtLocation && canAddDocuments ? styles.formDisabled : ''}`}>
                <div className={styles.formGroup}>
                  <label>Описание</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Введите описание"
                  />
                  <div className={styles.ocrSection}>
                    <label>Распознать ТТН</label>
                    <div className={styles.fileInputWrapper}>
                      <input
                        type="file"
                        id="ocrFile"
                        onChange={handleOCRFileSelect}
                        accept="image/*"
                        className={styles.fileInput}
                        disabled={ocrProcessing}
                      />
                      <label htmlFor="ocrFile" className={styles.fileInputLabel}>
                        {selectedOCRFile ? selectedOCRFile.file.name : 'Выберите фото ТТН для распознавания'}
                      </label>
                    </div>
                    {selectedOCRFile && !ocrProcessing && (
                      <button
                        className={styles.ocrSubmitButton}
                        onClick={handleOCRSubmit}
                      >
                        Распознать
                      </button>
                    )}
                  </div>
                </div>

                {ocrProcessing && !hasReceivedResult.current && (
                  <div className={styles.ocrStatus}>
                    <div className={styles.spinner}></div>
                    <span className={styles.ocrStatusText}>
                      Распознавание текста
                      {queueTimer && queueTimer.timeLeft > 0 && (
                        <>
                          <br />
                          Осталось примерно: {Math.floor(queueTimer.timeLeft / 60)}:{(queueTimer.timeLeft % 60).toString().padStart(2, '0')}
                        </>
                      )}
                    </span>
                  </div>
                )}

                <div className={styles.documentsSection}>
                  <div className={styles.documentInputs}>
                    <div className={styles.documentInput}>
                      <label>ТТН</label>
                      <div className={styles.fileInputWrapper}>
                        <input
                          type="file"
                          onChange={(e) => handleFileSelect(e, 'ttn')}
                          accept=".pdf,.doc,.docx"
                          id="ttnFile"
                          className={styles.fileInput}
                        />
                        <label htmlFor="ttnFile" className={styles.fileInputLabel}>
                          Выберите ТТН для загрузки
                        </label>
                      </div>
                    </div>

                    <div className={styles.documentInput}>
                      <label>Документ контроля качества</label>
                      <div className={styles.fileInputWrapper}>
                        <input
                          type="file"
                          onChange={(e) => handleFileSelect(e, 'quality')}
                          accept=".pdf,.doc,.docx"
                          id="qualityFile"
                          className={styles.fileInput}
                        />
                        <label htmlFor="qualityFile" className={styles.fileInputLabel}>
                          Выберите документ контроля качества
                        </label>
                      </div>
                    </div>
                  </div>

                  {selectedFiles.length > 0 && (
                    <div className={styles.selectedFiles}>
                      <label>Выбранные документы:</label>
                      {selectedFiles.map((docFile, index) => (
                        <div key={index} className={styles.selectedFile}>
                          <span>{docFile.type === 'ttn' ? 'ТТН' : 'Контроль качества'}: {docFile.file.name}</span>
                          <button
                            className={styles.removeFileButton}
                            onClick={() => handleRemoveFile(index)}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className={styles.formActions}>
                  <button
                    className={styles.cancelButton}
                    onClick={() => {
                      setSelectedWorkType(null);
                      setSelectedFiles([]);
                    }}
                  >
                    Отменить
                  </button>
                  <button
                    className={styles.queueButton}
                    onClick={() => handleSubmit(true)}
                    disabled={!description || uploading}
                  >
                    Добавить в очередь
                  </button>
                  <button
                    className={styles.submitButton}
                    onClick={() => handleSubmit(false)}
                    disabled={!description || selectedFiles.length === 0 || uploading}
                  >
                    {uploading ? 'Загрузка...' : 'Сохранить'}
                  </button>
                </div>
              </div>
            ) : (
              <div className={styles.addTTN}>
                <button
                  className={styles.addButton}
                  onClick={() => setSelectedWorkType(workType)}
                  disabled={!isAtLocation && canAddDocuments} // Disable button when not at location
                >
                  Добавить документы
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
