
import {
  Controller,
  Post,
  Get,
  Param,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  UseGuards,
  StreamableFile,
  Res,
  Logger,
  InternalServerErrorException,
  Body
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { Express } from 'express';
import { createReadStream } from 'fs';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { FilesService } from '../services/files.service';
import { ObjectsService } from '../../objects/services/objects.service';
import * as path from 'path';
import * as fs from 'fs';

interface Document {
  id: string;
  type: string;  // Known types: "opening_act"
  name: string;
  path: string;
  status: string; // Known statuses: "awaiting_approval", "approved", "rejected"
  createdAt: string;
  updatedAt: string;
}

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  private readonly logger = new Logger(FilesController.name);
  constructor(
    private readonly filesService: FilesService,
    private readonly objectsService: ObjectsService,
  ) {}

  @Post('upload/:objectId/:type')
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100 * 1024 * 1024 }), // 10MB
        ],
        fileIsRequired: true
      })
    ) 
    file: Express.Multer.File,
    @Param('objectId') objectId: string,
    @Param('type') type: string,
    @Body('documentName') documentName?: string,
  ) {
    const savedFile = await this.filesService.saveFile(file, objectId);

    // Handle different document types
    if (type === 'opening_act') {
      await this.objectsService.addDocument(objectId, {
        id: savedFile.id,
        type: 'opening_act',
        name: 'Акт открытия объекта',
        path: savedFile.path,
        status: 'awaiting_approval',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    } else {
      // Handle regular documents
      await this.objectsService.addDocument(objectId, {
        id: savedFile.id,
        type: type,
        name: documentName || savedFile.filename.replace(/\.[^/.]+$/, ""), // Use provided name or filename without extension
        path: savedFile.path,
        status: 'uploaded',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    return savedFile;
  }

  @Get('download/:objectId/:fileId')
  async getFile(
    @Param('objectId') objectId: string,
    @Param('fileId') fileId: string,
    @Res({ passthrough: true }) res: Response
  ): Promise<StreamableFile> {
    try {
      this.logger.debug(`Downloading file: objectId=${objectId}, fileId=${fileId}`);

      if (!objectId || !fileId) {
        throw new InternalServerErrorException('Invalid file parameters');
      }

      // Construct the full filename with extension
      const filePath = path.join('documents', objectId, fileId).replace(/\\/g, '/');
      this.logger.debug(`Looking for file at path: ${filePath}`);
      
      const fullPath = await this.filesService.getFilePath(filePath);
      
      if (!fs.existsSync(fullPath)) {
        this.logger.error(`File not found at: ${fullPath}`);
        throw new InternalServerErrorException('File not found');
      }

      const file = createReadStream(fullPath);
      
      res.set({
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(fileId)}`,
      });

      return new StreamableFile(file);
    } catch (error) {
      this.logger.error(`Error serving file: ${error.message}`);
      throw error;
    }
  }
}
