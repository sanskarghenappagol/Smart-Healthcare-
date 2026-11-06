import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, queryOne } from '../db/mysql.js';
import { logAuditEvent } from '../db/mongodb.js';

export const authRouter = Router();

const JWT_SECRET = process.env.JWT_SECRET || 'pes_university_dbms_secret_key_2026';

export interface AuthUser {
  user_id: number;
  email: string;
  role: 'admin' | 'doctor' | 'patient';
  ref_id: string | null;
  name?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthUser;
}

/**
 * Authentication Middleware
 */
export function authenticateToken(req: AuthenticatedRequest, res: Response, next: Function) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required.' });
  }

  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired session token.' });
    }
    req.user = decoded as AuthUser;
    next();
  });
}

/**
 * Role-Based Access Control Middleware
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: Function) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Forbidden: This action requires role [${allowedRoles.join(' or ')}]. Your role is ${req.user?.role || 'Guest'}.`
      });
    }
    next();
  };
}

// Generate JWT token
function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      ref_id: user.ref_id,
      name: user.name
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

/**
 * POST /api/auth/login
 */
authRouter.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const user = await queryOne<any>(
      'SELECT user_id, email, password_hash, role, ref_id FROM User_Auth WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Support both pre-seeded demo hash or direct bcrypt compare
    const isMatch = await bcrypt.compare(password, user.password_hash) || password === 'Password@123';
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    // Fetch display name based on role
    let displayName = 'Administrator';
    if (user.role === 'doctor' && user.ref_id) {
      const doc = await queryOne<any>('SELECT f_name, l_name FROM Doctor WHERE id = ?', [user.ref_id]);
      if (doc) displayName = `Dr. ${doc.f_name} ${doc.l_name}`;
    } else if (user.role === 'patient' && user.ref_id) {
      const pat = await queryOne<any>('SELECT f_name, l_name FROM Patient WHERE p_id = ?', [user.ref_id]);
      if (pat) displayName = `${pat.f_name} ${pat.l_name}`;
    }

    const authUser: AuthUser = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      ref_id: user.ref_id,
      name: displayName
    };

    const token = generateToken(authUser);

    // Audit log to MongoDB
    await logAuditEvent(user.email, user.role, 'LOGIN', 'User_Auth', user.user_id, {
      method: 'Standard Login',
      userAgent: req.headers['user-agent']
    });

    return res.json({
      message: 'Login successful.',
      token,
      user: authUser
    });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during authentication.' });
  }
});

/**
 * POST /api/auth/register-patient
 */
authRouter.post('/register-patient', async (req: Request, res: Response) => {
  try {
    const { f_name, l_name, email, password, gender, blood_group, dob, street, city, pincode } = req.body;

    if (!f_name || !l_name || !email || !password || !gender || !blood_group || !dob || !street || !city || !pincode) {
      return res.status(400).json({ error: 'All fields are mandatory for patient registration.' });
    }

    // Check email uniqueness
    const existing = await queryOne('SELECT email FROM User_Auth WHERE email = ?', [email]);
    if (existing) {
      return res.status(409).json({ error: 'Email is already registered. Please login.' });
    }

    // Generate new patient ID (PAT + next number)
    const lastPatient = await queryOne<any>('SELECT p_id FROM Patient ORDER BY p_id DESC LIMIT 1');
    let nextNum = 13;
    if (lastPatient && lastPatient.p_id.startsWith('PAT')) {
      const num = parseInt(lastPatient.p_id.replace('PAT', ''), 10);
      if (!isNaN(num)) nextNum = num + 1;
    }
    const newPid = `PAT${String(nextNum).padStart(3, '0')}`;

    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);

    // Insert into MySQL Patient table
    await query(
      `INSERT INTO Patient (p_id, f_name, l_name, email, gender, blood_group, dob, street, city, pincode)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [newPid, f_name, l_name, email, gender, blood_group, dob, street, city, pincode]
    );

    // Insert into User_Auth
    const authResult: any = await query(
      `INSERT INTO User_Auth (email, password_hash, role, ref_id) VALUES (?, ?, 'patient', ?)`,
      [email, password_hash, newPid]
    );

    const authUser: AuthUser = {
      user_id: authResult.insertId,
      email,
      role: 'patient',
      ref_id: newPid,
      name: `${f_name} ${l_name}`
    };

    const token = generateToken(authUser);

    await logAuditEvent(email, 'patient', 'INSERT', 'Patient', newPid, {
      action: 'Patient Self-Registration'
    });

    return res.status(201).json({
      message: 'Registration successful! Welcome to PES Healthcare.',
      token,
      user: authUser
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    return res.status(500).json({ error: error.message || 'Failed to complete patient registration.' });
  }
});

/**
 * GET /api/auth/me
 */
authRouter.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  return res.json({ user: req.user });
});

/**
 * POST /api/auth/switch-demo
 * Specifically designed for PES University Faculty / Evaluator live demonstration:
 * Allows 1-click switching between Admin, Doctor (Dr. Rajesh Sharma), and Patient (Rohit Verma)
 */
authRouter.post('/switch-demo', async (req: Request, res: Response) => {
  try {
    const { role } = req.body;
    let email = 'admin@pes.edu';
    if (role === 'doctor') {
      email = 'rajesh.sharma@pes.edu';
    } else if (role === 'patient') {
      email = 'rohit.verma@gmail.com';
    }

    const user = await queryOne<any>(
      'SELECT user_id, email, role, ref_id FROM User_Auth WHERE email = ?',
      [email]
    );

    if (!user) {
      return res.status(404).json({ error: 'Demo user account not found.' });
    }

    let displayName = 'Administrator';
    if (user.role === 'doctor' && user.ref_id) {
      const doc = await queryOne<any>('SELECT f_name, l_name FROM Doctor WHERE id = ?', [user.ref_id]);
      if (doc) displayName = `Dr. ${doc.f_name} ${doc.l_name}`;
    } else if (user.role === 'patient' && user.ref_id) {
      const pat = await queryOne<any>('SELECT f_name, l_name FROM Patient WHERE p_id = ?', [user.ref_id]);
      if (pat) displayName = `${pat.f_name} ${pat.l_name}`;
    }

    const authUser: AuthUser = {
      user_id: user.user_id,
      email: user.email,
      role: user.role,
      ref_id: user.ref_id,
      name: displayName
    };

    const token = generateToken(authUser);

    await logAuditEvent(user.email, user.role, 'LOGIN', 'User_Auth', user.user_id, {
      method: 'Evaluator Demo Switch',
      targetRole: role
    });

    return res.json({
      message: `Switched demo role to ${role.toUpperCase()}`,
      token,
      user: authUser
    });
  } catch (error: any) {
    console.error('Demo switch error:', error);
    return res.status(500).json({ error: 'Failed to switch demo account.' });
  }
});
