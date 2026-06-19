import express from "express";
import { issueController } from "./issue.controller";
import auth from "../../middleware/auth";
import asyncHandler from "../../utility/asyncHandler";

const router = express.Router();

router.post("/", auth, asyncHandler(issueController.createIssue));
router.get("/", asyncHandler(issueController.getAllIssues));
router.get("/:id", asyncHandler(issueController.getSingleIssue));
router.patch("/:id", auth, asyncHandler(issueController.updateIssue));
router.delete("/:id", auth, asyncHandler(issueController.deleteIssue));

export const issueRoute = router;
