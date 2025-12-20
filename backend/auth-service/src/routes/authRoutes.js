import express from 'express';
import { register, login, changePassword, deleteAccount, getMe } from '../controllers/authController.js';

const router = express.Router();

// Route: POST /api/auth/register
// Desc:  Create a new user
router.post('/register', register);

// Route: POST /api/auth/login
// Desc:  Authenticate user & return JWT Token
router.post('/login', login);

// Protected Routes (Gateway must verify token for these)
router.put('/password', changePassword); 
router.get('/me', getMe); // GET /api/auth/me (Protected)
router.delete('/me', deleteAccount);

export default router;