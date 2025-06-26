import { dataSource } from "../../db/connection";
import { User } from "./userEntity";
import { Role } from "./RolesEntity";
import { LeaveBalance } from "./LeaveBalanceEntity";
import { LeaveType } from "./LeaveTypeEntity";
import bcrypt from "bcrypt";

export interface EmployeeData {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "employee" | "manager" | "intern";
  managerId?: number;
  leaveBalance?: {
    casual?: number;
    sick?: number;
    earned?: number;
  };
}

export class UserService {
  static async createEmployee(data: EmployeeData) {
    await this.checkUserAlreadyExists(data.email); // <-- Use validator inside

    const userRepo = dataSource.getRepository(User);
    const roleRepo = dataSource.getRepository(Role);
    const leaveTypeRepo = dataSource.getRepository(LeaveType);
    const leaveBalanceRepo = dataSource.getRepository(LeaveBalance);

    const role = await roleRepo.findOne({ where: { name: data.role ?? "employee" } });
    if (!role) throw new Error(`Role '${data.role ?? "employee"}' not found`);

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = userRepo.create({
      name: data.name,
      email: data.email.trim().toLowerCase(),
      password_hash: hashedPassword,
      role_id: role.role_id,
      manager_id: data.managerId ?? null,
    });

    const savedUser = await userRepo.save(user);

    const leaveTypes = await leaveTypeRepo.find();
    const leaveTypeMap = Object.fromEntries(
      leaveTypes.map((lt) => [lt.name.toLowerCase(), lt])
    );

    const currentYear = new Date().getFullYear();
    const defaults = {
      casual: data.leaveBalance?.casual ?? 10,
      sick: data.leaveBalance?.sick ?? 5,
      earned: data.leaveBalance?.earned ?? 15,
    };

    const leaveBalances: LeaveBalance[] = [];

    for (const [type, total] of Object.entries(defaults)) {
      const leaveType = leaveTypeMap[type];
      if (!leaveType) continue;

      const leaveBalance = leaveBalanceRepo.create({
        user_id: savedUser.user_id,
        type_id: leaveType.type_id,
        year: currentYear,
        total_days: total.toFixed(2),
        used_days: "0.00",
        available_days: total.toFixed(2),
      });

      leaveBalances.push(leaveBalance);
    }

    await leaveBalanceRepo.save(leaveBalances);

    return savedUser;
  }

  static async getEmployeeByEmail(email: string): Promise<User | null> {
    const userRepo = dataSource.getRepository(User);
    const normalizedEmail = email.trim().toLowerCase();

    try {
      return await userRepo.findOne({
        where: { email: normalizedEmail},
      });
    } catch (error) {
      console.error("Error getting employee by email:", error);
      throw new Error("Failed to get employee");
    }
  }

  static async getEmployee(id: string): Promise<User | null> {
    const userRepo = dataSource.getRepository(User);
    try {
      return await userRepo.findOne({
        where: { user_id: parseInt(id)},
      });
    } catch (error) {
      console.error("Error getting employee by ID:", error);
      throw new Error("Failed to get employee");
    }
  }

  static async checkUserAlreadyExists(email: string): Promise<void> {
    const existingUser = await this.getEmployeeByEmail(email);
    if (existingUser) {
      throw new Error("User with this email already exists");
    }
  }
}
