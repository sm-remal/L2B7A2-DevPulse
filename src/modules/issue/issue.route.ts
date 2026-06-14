import express from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";

const router = express.Router();

router.post("/", auth, issueController.createIssue);
router.get("/", issueController.getAllIssues);
router.get("/:id", issueController.getSingleIssue);
router.patch("/:id", auth, issueController.updateIssue);
router.delete("/:id", auth, issueController.deleteIssue);

export const issueRoute = router;