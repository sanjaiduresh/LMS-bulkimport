import { UserService } from './userServices';

export class UserValidator {
  static async checkUserAlreadyExist(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await UserService.getEmployeeByEmail(normalizedEmail);

    if (user) {
      throw new Error('User with this email already exists');
    }
  }
}
