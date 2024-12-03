import jwt from 'jsonwebtoken';
import { promisify } from 'util';
import User, { IUser } from '../models/user';
import { RequestHandler, Request, Response, NextFunction } from 'express';

const signToken = (id: any) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: process.env.JWT_EXPIRES_IN
  });
};

class AuthController {
  static signup: RequestHandler = async (req, res, next) => {
    try {
      const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm
      });

      const token = signToken(newUser._id);

      res.status(201).json({
        status: 'success',
        token,
        data: {
          user: newUser
        }
      });
    } catch (error: any) {
      res.status(500).json({
        message: 'Error signing up',
        error: error.message
      });
    }
  };
  static login: RequestHandler = async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // 1) Check if email and password exists
      if (!email || !password) {
        return res.status(400).json({
          message: 'Please provide email and password!'
        });
      }
      // 2) Check if user exists && password is correct
      const user = (await User.findOne({ email })
        .select('+password')
        .exec()) as IUser;

      if (!user || !(await user.correctPassword(password, user.password))) {
        return res.status(400).json({
          message: 'Incorrect email or password'
        });
      }
      // 3) If everything ok, send token to client
      const token = signToken(user._id);
      res.status(200).json({
        status: 'success',
        token
      });
    } catch (error: any) {
      res.status(500).json({
        message: 'Error signing up',
        error: error.message
      });
    }
  };

  static protect = async (req: any, res: Response, next: NextFunction) => {
    try {
      // 1) Getting the token and check if it exists
      let token;
      if (
        req.headers.authorization &&
        req.headers.authorization?.startsWith('Bearer')
      ) {
        token = req.headers.authorization.split(' ')[1];
      }

      if (!token) {
        return res.status(401).json({
          message: 'You are not logged in! Please login to get access.'
        });
      }
      // 2) Verify token
      const jwtSecret = process.env.JWT_SECRET;

      if (!jwtSecret) {
        throw new Error(
          'JWT_SECRET is not defined in the environment variables.'
        );
      }

      const verifyJwt = (
        token: string,
        secret: string
      ): Promise<jwt.JwtPayload> => {
        return new Promise((resolve: any, reject: any) => {
          jwt.verify(token, secret, (err, decoded) => {
            if (err) {
              return reject(err);
            }
            resolve(decoded as jwt.JwtPayload);
          });
        });
      };

      const decoded: any = (await verifyJwt(
        token,
        jwtSecret
      )) as jwt.JwtPayload;

      // 3) Check if user still exists
      const freshUser = (await User.findById(decoded.id).exec());
      if (!freshUser) {
        return res.status(401).json({
          message: 'The user belonging to the token no longer exists'
        });
      }

      // 4) Check if user changed password after the JWT was issued
      if (await freshUser.changedPasswordAfter(decoded.iat)) {
        return res.status(401).json({
          message: 'User recently changed password! Please login again. '
        });
      }

      // GRANT ACCESS TO PROTECTED ROUTE
      //console.log('req_:', req);
      req.user = freshUser;
      next();
    } catch (error: any) {
      res.status(500).json({
        error: error.message
      });
    }
  };
}

export default AuthController;
