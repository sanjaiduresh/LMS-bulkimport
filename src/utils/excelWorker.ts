import ExcelJS from 'exceljs';
import { EmployeeData } from '../userModule/userServices';
import { redisClient, connectRedisWithRetry } from '../worker/redisClient';

function normalizeCellValue(cell: any): string {
  if (cell === null || cell === undefined) return '';
  if (typeof cell === 'object' && 'text' in cell) return cell.text;
  return String(cell).trim();
}

export async function parseExcel(buffer: Buffer): Promise<EmployeeData[]> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const worksheet = workbook.worksheets[0];

  const employees: EmployeeData[] = [];

  worksheet.eachRow((row, index) => {
    if (index === 1) return; // skip header row

    const rowData = row.values as any[];

    const email = normalizeCellValue(rowData[1]).toLowerCase();
    const name = normalizeCellValue(rowData[2]);
    const password = normalizeCellValue(rowData[3]);
    const role = normalizeCellValue(rowData[4]) as EmployeeData['role'];

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

export async function pushEmployeesToQueue(employees: EmployeeData[]) {
  await connectRedisWithRetry();

  const pipeline = redisClient.multi();

  employees.forEach((emp) => {
    pipeline.rPush('employee_queue', JSON.stringify(emp));
  });

  await pipeline.exec();
  console.log(`✅ Pushed ${employees.length} employees to queue`);

  // don't disconnect here, keep connection for reuse
  // await redisClient.disconnect();
}
