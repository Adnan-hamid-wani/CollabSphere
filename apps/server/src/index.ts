import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.routes";
import taskRoutes from "./routes/tasks.routes";
import userRoutes from "./routes/tasks.routes";
import http from "http";
import { Server } from "socket.io";
import { addUser } from "./controllers/task.controller";

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

// Add some default users for testing
addUser({
  id: 1,
  email: "admin@example.com",
  username: "admin",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  role: "ADMIN",
  createdAt: new Date(),
});

addUser({
  id: 2,
  email: "user@example.com",
  username: "user",
  password: "$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi", // password
  role: "USER",
  createdAt: new Date(),
});

// API routes must come after CORS and socket setup
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

// Use server.listen
const PORT = process.env.PORT || 4000;
server.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));