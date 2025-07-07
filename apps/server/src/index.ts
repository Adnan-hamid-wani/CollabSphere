import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/tasks.routes";
import userRoutes from "./routes/tasks.routes";
import http from "http";
import { Server } from "socket.io";
import { addUser } from "./controllers/task.controller";
import bcrypt from "bcryptjs";

dotenv.config();

const app = express();

// CORS must come before any routes or sockets
app.use(cors({
  origin: "http://localhost:5173", // Your frontend origin
  credentials: true,
}));

app.use(express.json());

const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    credentials: true,
  },
});

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  const userRole = socket.handshake.query.role;

  if (userId) socket.join(userId);
  if (userRole === "ADMIN") socket.join("admin");

  console.log(`🔌 Socket connected: ${userId} (${userRole})`);
});

app.set("io", io);

// Add some default users for testing with properly hashed passwords
const initializeDefaultUsers = async () => {
  const hashedPassword = await bcrypt.hash("password", 10);
  
  addUser({
    id: 1,
    email: "admin@example.com",
    username: "admin",
    password: hashedPassword,
    role: "ADMIN",
    createdAt: new Date(),
  });

  addUser({
    id: 2,
    email: "user@example.com",
    username: "user",
    password: hashedPassword,
    role: "USER",
    createdAt: new Date(),
  });

  console.log("✅ Default users initialized:");
  console.log("Admin: admin@example.com / password");
  console.log("User: user@example.com / password");
};

// Initialize default users
initializeDefaultUsers();

// API routes must come after CORS and socket setup
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

// Use server.listen
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));