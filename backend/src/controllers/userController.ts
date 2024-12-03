import User from '../models/user';
import { RequestHandler } from 'express';

class UserController {
  static getAllUsers: RequestHandler = async (req, res, next) => {
    try {
      const users = await User.find();
      res.status(200).json({
        data: {
          users: users
        }
      });
    } catch (error: any) {
		res.status(500).json({
			message: "Error signing up",
			error: error.message
		})
	}
  };
}

export default UserController;
