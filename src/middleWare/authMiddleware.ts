import bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import { dataSource } from '../../db/connection';
import { User } from '../userModule/userEntity';
import { generateJwt } from '../utils/jwt';

export async function handleToken(req: any) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('Token missing or invalid format');
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as jwt.JwtPayload;
    return {
      valid: true,
      expired: false,
      decoded,
    };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw new Error('Token expired. Please log in again.');
    }
    throw new Error('Invalid token.');
  }
}

export async function login(email: string, password: string) {
  const employeeRepo = dataSource.getRepository(User);

  const users = await employeeRepo.findOneBy({ email });
  if (!users) {
    throw new Error('User not found');
  }

  // Compare hashed password using bcrypt
  const isPasswordValid = await bcrypt.compare(password, users.password_hash);
  if (!isPasswordValid) {
    throw new Error('Invalid password');
  }

  const role = users.role;

  const token = await generateJwt(users);
  return { token, role };
}
