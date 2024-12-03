import { Router } from "express";
import AuthController from "../controllers/authController";
import UserController from "../controllers/userController";

const router = Router();

router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);

router.route('/').get(AuthController.protect, UserController.getAllUsers);

export default router;