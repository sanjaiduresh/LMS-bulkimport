import {
  Entity,
  ObjectIdColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm";
import { ObjectId } from "mongodb";

type LeaveBalance = {
  casual: number;
  sick: number;
  earned: number;
};

@Entity("user")
export class user {
  @ObjectIdColumn()
  _id: ObjectId;

  @Column()
  name: string;

  @Column()
  email: string;

  @Column()
  password: string;

  @Column({
    type: "enum",
    enum: ["admin", "employee", "manager", "hr", "director"],
    default: "employee",
  })
  role: "admin" | "employee" | "manager" | "hr" | "director";

  @Column()
  leaveBalance: LeaveBalance;

  @CreateDateColumn({ name: "createdAt" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updatedAt" })
  updatedAt: Date;
}
