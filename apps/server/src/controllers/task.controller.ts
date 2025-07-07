import { Request, Response } from "express";
import { AuthRequest } from "../middlewares/auth.middleware";

// Temporary in-memory storage
const tasks: any[] = [];
const users: any[] = [];
let taskIdCounter = 1;

export const createTask = async (req: AuthRequest, res: Response) => {
  const { title, description, assignedToEmail } = req.body;

  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Only admins can create tasks" });
  }

  if (!assignedToEmail || !title) {
    return res.status(400).json({ message: "Title and assigned user's email are required" });
  }

  // Find user by email
  const user = users.find(u => u.email === assignedToEmail);

  if (!user) {
    return res.status(404).json({ message: "Assigned user not found" });
  }

  const task = {
    id: taskIdCounter++,
    title,
    description,
    assignedTo: user.id,
    createdBy: req.user.id,
    status: "TODO",
    submittedForReview: false,
    feedback: null,
    createdAt: new Date(),
    assignedUser: { id: user.id, username: user.username }
  };

  tasks.push(task);

  const io = req.app.get('io');
  if (io) {
    io.to(user.id.toString()).emit("task-created", task);
    io.to("admin").emit("task-created", task);
    io.to(task.assignedTo.toString()).emit("notification", {
      message: `New Task Created: ${task.title} ${task.description}`,
    });
  }

  return res.status(201).json(task);
};

export const updateTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { title, description } = req.body;

  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Only admins can update tasks" });
  }

  const taskIndex = tasks.findIndex(t => t.id === parseInt(id));
  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  tasks[taskIndex] = { ...tasks[taskIndex], title, description };
  const task = tasks[taskIndex];

  const io = req.app.get("io");
  if (io) {
    io.to(task.assignedTo.toString()).emit("task-updated", task);
    io.to("admin").emit("task-updated", task);
    io.to(task.assignedTo.toString()).emit("notification", {
      message: `Task Updated: ${task.title} ${task.description}`,
    });
  }

  return res.status(200).json(task);
};

export const deleteTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Only admins can delete tasks" });
  }

  const taskIndex = tasks.findIndex(t => t.id === parseInt(id));
  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  const task = tasks[taskIndex];
  tasks.splice(taskIndex, 1);

  const io = req.app.get("io");
  if (io) {
    io.to(task.assignedTo.toString()).emit("task-deleted", task.id);
    io.to("admin").emit("task-deleted", task.id);
    io.to(task.assignedTo.toString()).emit("notification", {
      message: `Task has been Deleted: Title: ${task.title} Description: ${task.description}`,
    });
  }

  return res.status(200).json({ message: "Task deleted" });
};

export const markAsCompleted = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const taskIndex = tasks.findIndex(t => t.id === parseInt(id));
  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  const task = tasks[taskIndex];

  if (task.assignedTo !== req.user?.id) {
    return res.status(403).json({ message: "Not authorized" });
  }

  tasks[taskIndex] = { ...task, submittedForReview: true };
  const updated = tasks[taskIndex];

  const io = req.app.get("io");
  if (io) {
    io.to("admin").emit("task-completed", updated);
    io.to("admin").emit("notification", { message: `Task Completed by: ${req.user.username}` });
  }

  return res.status(200).json(updated);
};

export const approveTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  
  if (!id) {
    return res.status(400).json({ message: "Task ID is required" });
  }

  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Only admins can approve" });
  }

  const taskIndex = tasks.findIndex(t => t.id === parseInt(id));
  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    status: "COMPLETED",
    submittedForReview: false,
    feedback: null,
  };

  const task = tasks[taskIndex];

  const io = req.app.get("io");
  if (io) {
    io.to(task.assignedTo.toString()).emit("task-approved", task);
    io.to("admin").emit("task-approved", task);
    io.to(task.assignedTo.toString()).emit("notification", {
      message: `Task Approved: ${task.title} ${task.description}`,
    });
  }

  return res.status(200).json(task);
};

export const rejectTask = async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { feedback } = req.body;

  if (req.user?.role !== "ADMIN") {
    return res.status(403).json({ message: "Only admins can reject" });
  }

  if (!feedback) {
    return res.status(400).json({ message: "Feedback is required" });
  }

  const taskIndex = tasks.findIndex(t => t.id === parseInt(id));
  if (taskIndex === -1) {
    return res.status(404).json({ message: "Task not found" });
  }

  tasks[taskIndex] = {
    ...tasks[taskIndex],
    status: "REJECTED",
    feedback,
    submittedForReview: false,
  };

  const task = tasks[taskIndex];

  const io = req.app.get("io");
  if (io) {
    io.to(task.assignedTo.toString()).emit("task-rejected", task);
    io.to("admin").emit("task-rejected", task);
    io.to(task.assignedTo.toString()).emit("notification", {
      message: `Task Rejected: ${task.title} ${task.description}`,
    });
  }

  return res.status(200).json(task);
};

export const getAllColumnsWithTasks = async (req: AuthRequest, res: Response) => {
  const statuses = ["TODO", "REJECTED", "COMPLETED"];
  const userId = req.user?.id;
  const userRole = req.user?.role;

  const columns = statuses.map(status => {
    const filteredTasks = tasks.filter(task => {
      if (task.status !== status) return false;
      if (userRole !== "ADMIN" && task.assignedTo !== userId) return false;
      return true;
    });

    return { status, tasks: filteredTasks };
  });

  return res.json(columns);
};

// Helper function to add users (for testing)
export const addUser = (user: any) => {
  users.push(user);
  console.log("User added:", user);
  console.log("Total users:", users.length);
};

// Helper function to get users - return full user objects with passwords for auth
export const getUsers = () => {
  return users;
};

// Helper function to get users for API (without passwords)
export const getUsersForAPI = () => {
  return users.map(user => ({ id: user.id, email: user.email, username: user.username }));
};