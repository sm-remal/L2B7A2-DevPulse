import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import sendResponse from "../../utility/sendResponse";

// Create
const createIssue = async (req: Request, res: Response) => {
    try {
        const reporter_id = req.user.id;

        const result = await issueService.createIssueIntoDB(
            req.body,
            reporter_id
        );

        sendResponse(res, {
            statusCode: 201,
            success: true,
            message: "Issue created successfully",
            data: result,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message || "Failed to create issue",
            error,
        });
    }
};

// Get All
const getAllIssues = async (req: Request, res: Response) => {
    try {
        const result = await issueService.getAllIssuesFromDB();

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issues retrieved successfully",
            data: result,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message || "Failed to retrieve issues",
            error,
        });
    }
};

// Get Single
const getSingleIssue = async (req: Request, res: Response) => {
    try {
        const result = await issueService.getSingleIssueFromDB(
            Number(req.params.id)
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue retrieved successfully",
            data: result,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message || "Failed to retrieve issue",
            error,
        });
    }
};

// Update
const updateIssue = async (req: Request, res: Response) => {
    try {
        const result = await issueService.updateIssueIntoDB(
            Number(req.params.id),
            req.body
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue updated successfully",
            data: result,
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message || "Failed to update issue",
            error,
        });
    }
};

// Delete
const deleteIssue = async (req: Request, res: Response) => {
    try {
        await issueService.deleteIssueFromDB(
            Number(req.params.id)
        );

        sendResponse(res, {
            statusCode: 200,
            success: true,
            message: "Issue deleted successfully",
        });
    } catch (error: any) {
        sendResponse(res, {
            statusCode: 500,
            success: false,
            message: error.message || "Failed to delete issue",
            error,
        });
    }
};

export const issueController = {
    createIssue,
    getAllIssues,
    getSingleIssue,
    updateIssue,
    deleteIssue,
};
