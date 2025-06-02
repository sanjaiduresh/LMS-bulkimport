import { Request, ResponseToolkit } from '@hapi/hapi';
import { EmployeeData } from './userServices';
import { UserValidator } from './userValidator';
import { parseExcel, pushEmployeesToQueue } from '../utils/excelWorker';
import { Readable } from 'typeorm/platform/PlatformTools';

export class UserController {
  // CREATE EMPLOYEE - enqueue for Redis worker (single user)
  static async createEmployee(request: Request, h: ResponseToolkit) {
    try {
      const userData = request.payload as EmployeeData;

      await UserValidator.checkUserAlreadyExist(userData.email);

      // Enqueue user creation (async worker)
      await pushEmployeesToQueue([userData]);

      return h
        .response({ message: 'Employee creation queued successfully' })
        .code(201);
    } catch (error: any) {
      console.error('Error:', error.message);
      return h
        .response({ error: error.message || 'Failed to queue employee creation' })
        .code(400);
    }
  }

  // BULK UPLOAD - upload excel file and enqueue employees
  static async uploadHandler(request: Request, h: ResponseToolkit) {
    try {
      const data = request.payload as any;

      if (!data || !data.file) {
        return h.response({ error: 'No file provided' }).code(400);
      }

      const file = data.file as Readable;

      const buffer = await UserController.streamToBuffer(file);
      const employees = await parseExcel(buffer);

      if (!employees.length) {
        return h
          .response({ message: 'No valid employee data found in the file' })
          .code(400);
      }

      await pushEmployeesToQueue(employees);

      return h
        .response({ message: `Successfully queued ${employees.length} employees for creation.` })
        .code(200);
    } catch (error: any) {
      console.error('Bulk upload error:', error);
      return h
        .response({ error: error.message || 'Failed to process upload' })
        .code(500);
    }
  }

  // Helper: convert readable stream to buffer
  static async streamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(chunk));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}

// Routes for single create and bulk upload
import { ServerRoute } from '@hapi/hapi';

export const userRoute: ServerRoute[] = [
  {
    method: 'POST',
    path: '/employees',
    handler: UserController.createEmployee,
  },
  {
    method: 'POST',
    path: '/employees/bulk-upload',
    options: {
      payload: {
        output: 'stream',
        parse: true,
        allow: 'multipart/form-data',
        maxBytes: 10 * 1024 * 1024, // 10MB
        multipart: true,
      },
    },
    handler: UserController.uploadHandler,
  },
];
