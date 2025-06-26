import { createClient } from 'redis';
import { UserService, EmployeeData } from '../userModule/userServices';
import { dataSource } from '../../db/connection';

const redis = createClient({ url: process.env.UPSTASH_REDIS_URL });

redis.on('error', (err) => console.error('Redis error:', err));

(async function startWorker() {
  try {
    await dataSource.initialize();
    console.log('✅ Sql connected!');
    const userRepo = dataSource.getRepository('User');
    console.log('✅ User entity metadata loaded:', !!userRepo.metadata);
  } catch (err) {
    console.error('❌ Database connection error:', err);
    process.exit(1);
  }

  try {
    await redis.connect();
    console.log('✅ Redis connected');
  } catch (err) {
    console.error('❌ Redis connection error:', err);
    process.exit(1);
  }

  console.log('🚀 Worker started and waiting for employee data...');

  while (true) {
    try {
      const data = await redis.brPop('employee_queue', 0);
      if (!data) continue;

      const employee: EmployeeData = JSON.parse(data.element);
      console.log(`Processing employee: ${employee.email}`);
      await UserService.createEmployee(employee);
      console.log(`✅ Created employee: ${employee.email}`);
    } catch (err) {
      console.error('❌ Worker error:', err);
    }
  }
})();