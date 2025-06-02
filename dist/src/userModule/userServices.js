"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const connection_1 = require("../../db/connection");
const userEntity_1 = require("./userEntity");
class UserService {
    static async createEmployee(data) {
        const repo = connection_1.dataSource.getMongoRepository(userEntity_1.user);
        const duplicate = await repo.findOne({ where: { email: data.email } });
        if (duplicate)
            throw new Error("User with this email already exists");
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
    static async getEmployeeByEmail(email) {
        const repo = connection_1.dataSource.getMongoRepository(userEntity_1.user);
        try {
            const employee = await repo.findOne({
                where: { email, soft_delete: false }, // Assuming you track soft deletes
            });
            return employee;
        }
        catch (error) {
            console.error("Error getting employee by email:", error);
            throw new Error("Failed to get employee");
        }
    }
    // Optional: You might want to keep your existing getEmployee by id as well:
    static async getEmployee(id) {
        const repo = connection_1.dataSource.getMongoRepository(userEntity_1.user);
        try {
            const employee = await repo.findOne({
                where: { id, soft_delete: false },
            });
            return employee;
        }
        catch (error) {
            console.error("Error getting employee by id:", error);
            throw new Error("Failed to get employee");
        }
    }
}
exports.UserService = UserService;
