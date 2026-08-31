import mongoose, { Schema, Document, Types } from 'mongoose';
import bcrypt from 'bcryptjs';

export type UserRole = 'STAFF' | 'DEPARTMENT_HEAD' | 'ADMIN' | 'IT_SECURITY_ADMIN';

export interface IUser extends Document {
  employeeId: string;
  fullName: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  department?: Types.ObjectId | null;
  site: string;
  position: string;
  isActive: boolean;
  failedLoginAttempts: number;
  lockUntil?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  isLocked(): boolean;
}

const UserSchema = new Schema<IUser>(
  {
    employeeId: {
      type: String,
      required: [true, 'Employee ID is required'],
      unique: true,
      trim: true,
      uppercase: true,
    },
    fullName: {
      type: String,
      required: [true, 'Full name is required'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address'],
    },
    passwordHash: {
      type: String,
      required: [true, 'Password hash is required'],
      select: false, // Don't return password hash in regular queries
    },
    role: {
      type: String,
      enum: ['STAFF', 'DEPARTMENT_HEAD', 'ADMIN', 'IT_SECURITY_ADMIN'],
      default: 'STAFF',
      required: true,
    },
    department: {
      type: Schema.Types.ObjectId,
      ref: 'Department',
      default: null,
    },
    site: {
      type: String,
      required: true,
      default: 'Hemas Hospital Wattala',
      trim: true,
    },
    position: {
      type: String,
      required: true,
      default: 'Clinical Staff',
      trim: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
UserSchema.index({ role: 1 });
UserSchema.index({ department: 1 });

UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  if (!this.passwordHash) return false;
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

UserSchema.methods.isLocked = function (): boolean {
  return !!(this.lockUntil && this.lockUntil.getTime() > Date.now());
};

export const User = mongoose.model<IUser>('User', UserSchema);
