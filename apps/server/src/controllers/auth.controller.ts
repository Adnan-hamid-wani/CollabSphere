import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// Temporary in-memory storage
const users: any[] = [];
let userIdCounter = 1;

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

export const register = async (req: Request, res: Response): Promise<Response> => {
  const { email, username, password, role } = req.body;

  // Check if user already exists
  const existingUser = users.find(user => user.email === email);
  if (existingUser) return res.status(400).json({ message: "Email already exists" });

  const hashedPassword = await bcrypt.hash(password, 10);

  const user = {
    id: userIdCounter++,
    email,
    username,
    password: hashedPassword,
    role: role || "USER",
    createdAt: new Date(),
  };

  users.push(user);

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

  return res.status(201).json({
    message: "User registered",
    user: { id: user.id, email: user.email, username: user.username, role: user.role },
    token,
  });
};

export const login = async (req: Request, res: Response) => {
  console.log('LOGIN BODY:', req.body);

  const { email, password } = req.body;

  const user = users.find(u => u.email === email);
  console.log("User from memory:", user);

  if (!user) return res.status(400).json({ message: 'User not found' });

  const validPassword = await bcrypt.compare(password, user.password);
  console.log("Password match:", validPassword);

  if (!validPassword) return res.status(400).json({ message: 'Invalid credentials' });

  const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
    expiresIn: '7d',
  });

  return res.json({ token, user: { id: user.id, email: user.email, username: user.username, role: user.role } });
};