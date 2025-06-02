import { dataSource } from "../../db/connection";
import { user } from "./userEntity";

export interface EmployeeData {
  name: string;
  email: string;
  password: string;
  role?: "admin" | "employee" | "manager" | "hr" | "director";
  leaveBalance?: {
    casual?: number;
    sick?: number;
    earned?: number;
  };
}

export class UserService {
  static async createEmployee(data: EmployeeData) {
    const repo = dataSource.getMongoRepository(user);

    const duplicate = await repo.findOne({ where: { email: data.email } });
    if (duplicate) throw new Error("User with this email already exists");

    const employee = repo.create({
      // Ensure these properties exist in Employee entity, otherwise remove them
      name: data.name,
      email: data.email,
      password: data.password,
      role: data.role ?? "employee",
      leaveBalance: {
        casual: data.leaveBalance?.casual ?? 10,
        sick: data.leaveBalance?.sick ?? 5,
        earned: data.leaveBalance?.earned ?? 15,
      }
    });

    await repo.save(employee);
    return employee;
  }

  static async getEmployeeByEmail(email: string): Promise<user | null> {
    const repo = dataSource.getMongoRepository(user);
    try {
      const employee = await repo.findOne({
        where: { email, soft_delete: false }, // Assuming you track soft deletes
      });
      return employee;
    } catch (error) {
      console.error("Error getting employee by email:", error);
      throw new Error("Failed to get employee");
    }
  }

  // Optional: You might want to keep your existing getEmployee by id as well:
  static async getEmployee(id: string): Promise<user | null> {
    const repo = dataSource.getMongoRepository(user);
    try {
      const employee = await repo.findOne({
        where: { id, soft_delete: false },
      });
      return employee;
    } catch (error) {
      console.error("Error getting employee by id:", error);
      throw new Error("Failed to get employee");
    }
  }

  // You can add other methods like updateEmployee, deleteEmployee, etc. here
}
