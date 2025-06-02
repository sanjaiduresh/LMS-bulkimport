"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseExcel = parseExcel;
exports.pushEmployeesToQueue = pushEmployeesToQueue;
const exceljs_1 = __importDefault(require("exceljs"));
const redisClient_1 = require("../worker/redisClient");
function normalizeCellValue(cell) {
    if (cell === null || cell === undefined)
        return '';
    if (typeof cell === 'object' && 'text' in cell)
        return cell.text;
    return String(cell).trim();
}
async function parseExcel(buffer) {
    const workbook = new exceljs_1.default.Workbook();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];
    const employees = [];
    worksheet.eachRow((row, index) => {
        if (index === 1)
            return; // skip header row
        const rowData = row.values;
        const email = normalizeCellValue(rowData[1]).toLowerCase();
        const name = normalizeCellValue(rowData[2]);
        const password = normalizeCellValue(rowData[3]);
        const role = normalizeCellValue(rowData[4]);
        if (!email || !name || !password || !role) {
            console.warn(`⚠️ Skipping row ${index} - Missing required fields`);
            return;
        }
        employees.push({
            email,
            name,
            password,
            role,
            // optionally add leaveBalance or other fields if available
        });
    });
    console.log(`✅ Parsed ${employees.length} employees`);
    return employees;
}
async function pushEmployeesToQueue(employees) {
    await (0, redisClient_1.connectRedisWithRetry)();
    const pipeline = redisClient_1.redisClient.multi();
    employees.forEach((emp) => {
        pipeline.rPush('employee_queue', JSON.stringify(emp));
    });
    await pipeline.exec();
    console.log(`✅ Pushed ${employees.length} employees to queue`);
    // don't disconnect here, keep connection for reuse
    // await redisClient.disconnect();
}
