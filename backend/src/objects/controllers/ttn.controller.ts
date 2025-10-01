import { Controller, Get, Post, Body, Param, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { v4 as uuidv4 } from 'uuid';
import { TTNService } from '../services/ttn.service';
import { ObjectsService } from '../services/objects.service'; // Add this import
import * as fs from 'fs'; // Added for file system operations

interface CreateTTNEntryDto {
  workTypeId: string;
  description: string;
}

@Controller('objects/:objectId/work-types')
export class TTNController {
  constructor(
    private readonly ttnService: TTNService,
    private readonly objectsService: ObjectsService, // Add this injection
  ) {}

  @Get()
  async getWorkTypes(@Param('objectId') objectId: string) {
    const object = await this.objectsService.findOne(objectId);
    return object.workSchedule?.workTypes || [];
  }

  @Get(':workTypeId/ttn')
  async getTTNEntries(
    @Param('objectId') objectId: string,
    @Param('workTypeId') workTypeId: string
  ) {
    return this.ttnService.getTTNEntriesByWorkType(workTypeId);
  }

  @Post(':workTypeId/ttn')
  async createTTNEntry(
    @Param('objectId') objectId: string,
    @Param('workTypeId') workTypeId: string,
    @Body() createTTNDto: CreateTTNEntryDto
  ) {
    return this.ttnService.createTTNEntry(
      workTypeId,
      createTTNDto.description
    );
  }

  @Post(':workTypeId/ttn/:ttnEntryId/documents')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: (req, file, callback) => {
        const objectId = req.params.objectId;
        const dir = `./uploads/documents/${objectId}`;
        // Create directory if it doesn't exist
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        callback(null, dir);
      },
      filename: (req, file, callback) => {
        const uniqueId = uuidv4();
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        callback(null, `${uniqueId}${extname(originalName)}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      callback(null, true);
    },
  }))
  async uploadTTNDocument(
    @Param('objectId') objectId: string,
    @Param('workTypeId') workTypeId: string,
    @Param('ttnEntryId') ttnEntryId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const document = {
      id: uuidv4(),
      name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      path: `documents/${objectId}/${file.filename}`, // This path should match where we actually save the file
      type: file.mimetype,
      status: 'approved',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.ttnService.addDocumentToTTNEntry(ttnEntryId, document);
  }
}
