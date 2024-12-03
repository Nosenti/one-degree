import mongoose, { Schema, Document, Model } from 'mongoose';
import validator from 'validator';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string | undefined;
  photo?: string;
  createdAt: Date;
  updatedAt: Date;
  passwordChangedAt?: Date;
  correctPassword(
    candidatePassword: string,
    userPassword: string
  ): Promise<boolean>;
  changedPasswordAfter(JWTTimestamp: Date): Promise<boolean>;
}

// Schema Definition
const UserSchema = new Schema<IUser, Model<IUser>>(
  {
    name: {
      type: String,
      required: [true, 'Please tell us your name']
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      match: [/.+\@.+\..+/, 'Please fill a valid email address'],
      lowercase: true
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 8,
      select: false
    },
    passwordConfirm: {
      type: String,
      required: [true, 'Please provide a password'],
      validate: {
        // This only works on CREATE and SAVE!
        validator: function (el) {
          return el === this.password;
        },
        message: 'Passwords are not the same'
      }
    },
    photo: {
      type: String,
      default: ''
    },
    passwordChangedAt: Date
  },
  {
    timestamps: true
  }
);

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  this.password = await bcrypt.hash(this.password, 12);
  this.passwordConfirm = undefined;
  next();
});

UserSchema.methods.correctPassword = async function (
  candidatePassword: string,
  userPassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, userPassword);
};

UserSchema.methods.changedPasswordAfter = async function (
  JWTTimestamp: number
): Promise<boolean> {
  if (this.passwordChangedAt) {
    const changedTimestamp: number = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return JWTTimestamp < changedTimestamp;
  }
  return false;
};

const User = mongoose.model<IUser>('User', UserSchema);
export default User;
