import React, { useState } from 'react';
import styles from './ElectronicJournal.module.scss';

interface ViolationResponseFormProps {
  violationId: string;
  onSubmit: (data: { description: string, documents: File[] }) => Promise<void>;
}

export const ViolationResponseForm: React.FC<ViolationResponseFormProps> = ({
  violationId,
  onSubmit
}) => {
  const [description, setDescription] = useState('');
  const [documents, setDocuments] = useState<File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await onSubmit({ description, documents });
      setDescription('');
      setDocuments([]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    setDocuments(prev => [...prev, ...files]);
  };

  const removeDocument = (index: number) => {
    setDocuments(docs => docs.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit} className={styles.responseForm}>
      <div className={styles.formGroup}>
        <label>Описание выполненных работ</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Опишите выполненные работы по устранению нарушения..."
          className={styles.responseTextarea}
          required
        />
      </div>

      <div className={styles.formGroup}>
        <label>Документы и фотографии</label>
        <div className={styles.documentUploadSection}>
          <input
            type="file"
            multiple
            accept="image/*,.pdf,.doc,.docx"
            onChange={handleFileSelect}
            className={styles.fileInput}
            id={`response-documents-${violationId}`}
          />
          <label 
            htmlFor={`response-documents-${violationId}`}
            className={styles.uploadLabel}
          >
            Выберите файлы
          </label>
          
          {documents.length > 0 && (
            <div className={styles.selectedFiles}>
              {documents.map((doc, index) => (
                <div key={index} className={styles.selectedFile}>
                  <span>{doc.name}</span>
                  <button
                    type="button"
                    onClick={() => removeDocument(index)}
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
        disabled={isSubmitting || !description.trim()}
        className={styles.submitButton}
      >
        {isSubmitting ? 'Отправка...' : 'Отправить на проверку'}
      </button>
    </form>
  );
};
