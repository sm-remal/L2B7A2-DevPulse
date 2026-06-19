import type { Request, Response } from "express";
import { issueService } from "./issue.service";
import sendResponse from "../../utility/sendResponse";
import { RESPONSE_MESSAGES } from "../../utility/responseMessages";

// Create
const createIssue = async (req: Request, res: Response) => {
    const reporter_id = req.user.id;

    const result = await issueService.createIssueIntoDB(
        req.body,
        reporter_id
    );

    sendResponse(res, {
        statusCode: 201,
        success: true,
        message: RESPONSE_MESSAGES.issue.createSuccess,
        data: result,
    });
};

// Get All
const getAllIssues = async (req: Request, res: Response) => {
    const query: {
        sort?: string | undefined;
        type?: string | undefined;
        status?: string | undefined;
    } = {};

    if (typeof req.query.sort === "string") {
        query.sort = req.query.sort;
    }

    if (typeof req.query.type === "string") {
        query.type = req.query.type;
    }

    if (typeof req.query.status === "string") {
        query.status = req.query.status;
    }

    const result = await issueService.getAllIssuesFromDB(query);

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: RESPONSE_MESSAGES.issue.listSuccess,
        data: result,
    });
};

// Get Single
const getSingleIssue = async (req: Request, res: Response) => {
    const result = await issueService.getSingleIssueFromDB(
        Number(req.params.id)
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: RESPONSE_MESSAGES.issue.singleSuccess,
        data: result,
    });
};

// Update
const updateIssue = async (req: Request, res: Response) => {
    const result = await issueService.updateIssueIntoDB(
        Number(req.params.id),
        req.body,
        req.user
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: RESPONSE_MESSAGES.issue.updateSuccess,
        data: result,
    });
};

// Delete
const deleteIssue = async (req: Request, res: Response) => {
    await issueService.deleteIssueFromDB(
        Number(req.params.id),
        req.user
    );

    sendResponse(res, {
        statusCode: 200,
        success: true,
        message: RESPONSE_MESSAGES.issue.deleteSuccess,
    });
};

export const issueController = {
    createIssue,
    getAllIssues,
    getSingleIssue,
    updateIssue,
    deleteIssue,
};
