import { Controller, Get, Post, Body, Param, Patch, UseInterceptors, UploadedFile, UseGuards, UnauthorizedException, Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { ElectronicJournalService } from '../services/electronic-journal.service';
import { CreateViolationResponseDto, UpdateViolationResponseStatusDto } from '../dto/create-violation-response.dto';
import { JwtAuthGuard } from '@shared/guards/jwt-auth.guard';
import { Request } from '@nestjs/common';

@Controller('objects/:objectId/violations')
export class ElectronicJournalController {
  constructor(private readonly electronicJournalService: ElectronicJournalService) {}

  @Post(':violationId/responses')
  async createViolationResponse(
    @Param('objectId') objectId: string,
    @Param('violationId') violationId: string,
    @Body() createResponseDto: CreateViolationResponseDto
  ) {
    return this.electronicJournalService.createViolationResponse(
      objectId,
      violationId,
      createResponseDto
    );
  }

  @Get(':violationId/responses')
  getViolationResponses(
    @Param('objectId') objectId: string,
    @Param('violationId') violationId: string
  ) {
    return this.electronicJournalService.getViolationResponses(
      objectId,
      violationId
    );
  }

  @Patch(':violationId/responses/:responseId')
  @UseGuards(JwtAuthGuard)
  async updateViolationResponseStatus(
    @Req() req,
    @Param('objectId') objectId: string,
    @Param('violationId') violationId: string,
    @Param('responseId') responseId: string,
    @Body() updateStatusDto: UpdateViolationResponseStatusDto
  ) {
    // Check user role from JWT token, case-insensitive comparison
    const userRole = req.user?.role?.toLowerCase();
    if (!userRole || (userRole !== 'control' && userRole !== 'inspector')) {
      throw new UnauthorizedException('Only controllers and inspectors can update response status');
    }

    return this.electronicJournalService.updateViolationResponseStatus(
      objectId,
      violationId,
      responseId,
      updateStatusDto
    );
  }

  @Post(':violationId/responses/:responseId/documents')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads/documents',
      filename: (req, file, callback) => {
        const objectId = req.params.objectId;
        const uniqueId = uuidv4();
        // Decode the original filename to handle UTF-8 characters properly
        const originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
        callback(null, `${objectId}-${uniqueId}${extname(originalName)}`);
      },
    }),
    fileFilter: (req, file, callback) => {
      // Optional: Add file type validation here
      callback(null, true);
    },
  }))
  async uploadViolationResponseDocument(
    @Param('objectId') objectId: string,
    @Param('violationId') violationId: string,
    @Param('responseId') responseId: string,
    @UploadedFile() file: Express.Multer.File
  ) {
    if (!file) {
      throw new Error('No file uploaded');
    }

    const document = {
      id: uuidv4(),
      // Decode the original filename to handle UTF-8 characters properly
      name: Buffer.from(file.originalname, 'latin1').toString('utf8'),
      path: `documents/${objectId}/${file.filename}`,
      type: file.mimetype,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return this.electronicJournalService.addDocumentToViolationResponse(
      objectId,
      violationId,
      responseId,
      document
    );
  }
}