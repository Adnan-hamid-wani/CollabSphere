import { Router } from "express";
import {
  createTask,
  updateTask,
  deleteTask,
  approveTask,
  rejectTask,
  getAllColumnsWithTasks,
  markAsCompleted,
  getUsers,
} from "../controllers/task.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { isAdmin } from "../middlewares/isAdmin.middlwware";
import { RequestHandler } from "express";

const router = Router();

// Authenticate all routes
router.use((req, res, next) => {
  Promise.resolve(authenticate(req, res, next)).catch(next);
});

router.post("/", isAdmin as RequestHandler, (req, res, next) => {
  Promise.resolve(createTask(req, res)).catch(next);
});

router.put("/:id", isAdmin as RequestHandler, (req, res, next) => {
  Promise.resolve(updateTask(req, res)).catch(next);
});

router.delete("/:id", isAdmin as RequestHandler, (req, res, next) => {
  Promise.resolve(deleteTask(req, res)).catch(next);
});

router.put("/:id/complete", (req, res, next) => {
  Promise.resolve(markAsCompleted(req, res)).catch(next);
});

router.put("/:id/approve", isAdmin as RequestHandler, (req, res, next) => {
  Promise.resolve(approveTask(req, res)).catch(next);
});

router.put("/:id/reject", isAdmin as RequestHandler, (req, res, next) => {
  Promise.resolve(rejectTask(req, res)).catch(next);
});

router.get("/columns", (req, res, next) => {
  Promise.resolve(getAllColumnsWithTasks(req, res)).catch(next);
});

router.get("/", async (_req, res) => {
  try {
    const users = getUsers();
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

export default router;