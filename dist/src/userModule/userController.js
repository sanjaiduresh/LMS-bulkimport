"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userRoute = exports.UserController = void 0;
const userValidator_1 = require("./userValidator");
const excelWorker_1 = require("../utils/excelWorker");
class UserController {
    // CREATE EMPLOYEE - enqueue for Redis worker (single user)
    static async createEmployee(request, h) {
        try {
            const userData = request.payload;
            await userValidator_1.UserValidator.checkUserAlreadyExist(userData.email);
            // Enqueue user creation (async worker)
            await (0, excelWorker_1.pushEmployeesToQueue)([userData]);
            return h
                .response({ message: 'Employee creation queued successfully' })
                .code(201);
        }
        catch (error) {
            console.error('Error:', error.message);
            return h
                .response({ error: error.message || 'Failed to queue employee creation' })
                .code(400);
        }
    }
    // BULK UPLOAD - upload excel file and enqueue employees
    static async uploadHandler(request, h) {
        try {
            const data = request.payload;
            if (!data || !data.file) {
                return h.response({ error: 'No file provided' }).code(400);
            }
            const file = data.file;
            const buffer = await UserController.streamToBuffer(file);
            const employees = await (0, excelWorker_1.parseExcel)(buffer);
            if (!employees.length) {
                return h
                    .response({ message: 'No valid employee data found in the file' })
                    .code(400);
            }
            await (0, excelWorker_1.pushEmployeesToQueue)(employees);
            return h
                .response({ message: `Successfully queued ${employees.length} employees for creation.` })
                .code(200);
        }
        catch (error) {
            console.error('Bulk upload error:', error);
            return h
                .response({ error: error.message || 'Failed to process upload' })
                .code(500);
        }
    }
    // Helper: convert readable stream to buffer
    static async streamToBuffer(stream) {
        return new Promise((resolve, reject) => {
            const chunks = [];
            stream.on('data', (chunk) => chunks.push(chunk));
            stream.on('end', () => resolve(Buffer.concat(chunks)));
            stream.on('error', reject);
        });
    }
}
exports.UserController = UserController;
exports.userRoute = [
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
