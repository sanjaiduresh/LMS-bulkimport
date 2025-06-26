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

    // Adjust indexes based on your Excel columns:
    // Assuming columns:
    const name = normalizeCellValue(rowData[1]);
    const email = normalizeCellValue(rowData[2]).toLowerCase();
    const password = normalizeCellValue(rowData[3]);
    const role = normalizeCellValue(rowData[4]) as EmployeeData['role'];
    const managerIdStr = normalizeCellValue(rowData[5]);
    const casualStr = normalizeCellValue(rowData[6]);
    const sickStr = normalizeCellValue(rowData[7]);
    const earnedStr = normalizeCellValue(rowData[8]);

    if (!name || !email || !password || !role) {
      console.warn(`⚠️ Skipping row ${index} - Missing required fields`);
      return;
    }

    const managerId = managerIdStr ? Number(managerIdStr) : undefined;
    const leaveBalance = {
      casual: casualStr ? Number(casualStr) : undefined,
      sick: sickStr ? Number(sickStr) : undefined,
      earned: earnedStr ? Number(earnedStr) : undefined,
    };

    employees.push({
      name,
      email,
      password,
      role,
      managerId,
      leaveBalance,
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

  // Keep Redis connection open for reuse
  // await redisClient.disconnect();
}
