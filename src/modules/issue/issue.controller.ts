import type { Request, Response } from "express";
import { issueService } from "./issue.service";

// Create
const createIssue = async (req: Request, res: Response) => {

    const reporter_id = req.user.id;

    const result =
        await issueService.createIssueIntoDB(
            req.body,
            reporter_id
        );

    res.status(201).json({
        success: true,
        message: "Issue created successfully",
        data: result
    });
};


// Get All
const getAllIssues = async (req: Request, res: Response) => {

    const result =
        await issueService.getAllIssuesFromDB();

    res.status(200).json({
        success: true,
        message: "Issues retrieved successfully",
        data: result
    });
};


// Get Single
const getSingleIssue = async (req: Request, res: Response) => {

    const result = await issueService.getSingleIssueFromDB(Number(req.params.id));

    res.status(200).json({
        success: true,
        message: "Issue retrieved successfully",
        data: result
    });
};


// Update
const updateIssue = async (req: Request, res: Response) => {

    const result =await issueService.updateIssueIntoDB(
            Number(req.params.id),
            req.body
        );

    res.status(200).json({
        success: true,
        message: "Issue updated successfully",
        data: result
    });
};


// Delete
const deleteIssue = async (req: Request, res: Response) => {

    await issueService.deleteIssueFromDB(
        Number(req.params.id)
    );

    res.status(200).json({
        success: true,
        message: "Issue deleted successfully"
    });
};

export const issueController = {
    createIssue,
    getAllIssues,
    getSingleIssue,
    updateIssue,
    deleteIssue
};