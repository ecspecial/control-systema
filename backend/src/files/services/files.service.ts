import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fs from 'fs';
import * as path from 'path';
import { Express } from 'express';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly uploadPath: string;

  constructor(private configService: ConfigService) {
    // Change this to match where files are actually stored
    this.uploadPath = './uploads';
    this.ensureUploadDirectory();
  }

  private ensureUploadDirectory() {
    const documentsPath = path.join(this.uploadPath, 'documents');
    if (!fs.existsSync(documentsPath)) {
      fs.mkdirSync(documentsPath, { recursive: true });
    }
  }

  async saveFile(
    file: Express.Multer.File,
    objectId: string,
  ): Promise<{ path: string; filename: string; id: string }> {
    try {
      // Create directory for object if it doesn't exist
      const objectPath = path.join(this.uploadPath, 'documents', objectId);
      fs.mkdirSync(objectPath, { recursive: true });

      // Generate unique ID for the file
      const fileId = uuidv4();
      const ext = path.extname(file.originalname);
      const filename = `${fileId}${ext}`;
      const finalPath = path.join(objectPath, filename);

      // Move file from temp to final location
      fs.copyFileSync(file.path, finalPath);
      
      // Clean up temp file
      fs.unlinkSync(file.path);

      // Return relative path for database
      const relativePath = path.join('documents', objectId, filename).replace(/\\/g, '/');
      
      return {
        path: relativePath,
        filename: file.originalname,
        id: fileId
      };
    } catch (error) {
      this.logger.error(`Error saving file: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getFilePath(filePath: string): Promise<string> {
    // filePath comes as "documents/objectId/filename"
    const fullPath = path.join(this.uploadPath, filePath);
    this.logger.debug(`Attempting to access file at: ${fullPath}`);
    
    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      this.logger.error(`File not found at path: ${fullPath}`);
      throw new InternalServerErrorException(`File not found at: ${filePath}`);
    }
    
    return fullPath;
  }
}
