import { pool } from "../../db";
import AppError from "../../utility/AppError";
import type { AuthTokenPayload } from "../../middleware/auth";
import type {
    IIssue,
    IIssueResponse,
    IIssueRow,
    IUpdateIssue,
    IssueStatus,
    IssueType,
} from "./issue.interface";
import { userService } from "../user/user.service";

const allowedIssueTypes: IssueType[] = ["bug", "feature_request"];
const allowedIssueStatuses: IssueStatus[] = ["open", "in_progress", "resolved"];

const validateIssueId = (id: number) => {
    if (!Number.isInteger(id) || id <= 0) {
        throw new AppError(400, "Invalid issue id");
    }
};

const validateCreatePayload = (payload: IIssue) => {
    const title = payload.title?.trim();
    const description = payload.description?.trim();
    const type = payload.type;

    if (!title) {
        throw new AppError(400, "Title is required");
    }

    if (title.length > 150) {
        throw new AppError(400, "Title must not exceed 150 characters");
    }

    if (!description) {
        throw new AppError(400, "Description is required");
    }

    if (description.length < 20) {
        throw new AppError(400, "Description must be at least 20 characters");
    }

    if (!allowedIssueTypes.includes(type)) {
        throw new AppError(400, "Invalid issue type");
    }

    return {
        title,
        description,
        type,
    };
};

const validateUpdatePayload = (payload: IUpdateIssue) => {
    const updates: Partial<Pick<IIssueRow, "title" | "description" | "type" | "status">> = {};

    if (typeof payload.title !== "undefined") {
        const title = payload.title.trim();
        if (!title) {
            throw new AppError(400, "Title cannot be empty");
        }
        if (title.length > 150) {
            throw new AppError(400, "Title must not exceed 150 characters");
        }
        updates.title = title;
    }

    if (typeof payload.description !== "undefined") {
        const description = payload.description.trim();
        if (!description) {
            throw new AppError(400, "Description cannot be empty");
        }
        if (description.length < 20) {
            throw new AppError(400, "Description must be at least 20 characters");
        }
        updates.description = description;
    }

    if (typeof payload.type !== "undefined") {
        if (!allowedIssueTypes.includes(payload.type)) {
            throw new AppError(400, "Invalid issue type");
        }
        updates.type = payload.type;
    }

    if (typeof payload.status !== "undefined") {
        if (!allowedIssueStatuses.includes(payload.status)) {
            throw new AppError(400, "Invalid issue status");
        }
        updates.status = payload.status;
    }

    if (Object.keys(updates).length === 0) {
        throw new AppError(400, "At least one field is required for update");
    }

    return updates;
};

const mapIssueWithReporter = (
    issue: IIssueRow,
    reporterMap: Map<number, { id: number; name: string; role: AuthTokenPayload["role"] }>
): IIssueResponse => {
    const reporter = reporterMap.get(issue.reporter_id);

    if (!reporter) {
        throw new AppError(404, "Reporter not found");
    }

    return {
        id: issue.id,
        title: issue.title,
        description: issue.description,
        type: issue.type,
        status: issue.status,
        reporter,
        created_at: issue.created_at,
        updated_at: issue.updated_at,
    };
};

const enrichIssues = async (issues: IIssueRow[]) => {
    const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
    const reporters = await userService.findUsersByIds(reporterIds);
    const reporterMap = new Map(reporters.map((reporter) => [reporter.id, reporter]));

    if (reporterMap.size !== reporterIds.length) {
        throw new AppError(404, "Reporter not found");
    }

    return issues.map((issue) => mapIssueWithReporter(issue, reporterMap));
};

// Create Issue
const createIssueIntoDB = async (payload: IIssue, reporter_id: number) => {
    validateIssueId(reporter_id);
    const reporter = await userService.findUserById(reporter_id);

    if (!reporter) {
        throw new AppError(404, "Reporter not found");
    }

    const { title, description, type } = validateCreatePayload(payload);

    const result = await pool.query<IIssueRow>(
        `
        INSERT INTO issues
        (title, description, type, reporter_id)
        VALUES($1, $2, $3, $4)
        RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
        `,
        [title, description, type, reporter_id]
    );

    const issue = result.rows[0];
    if (!issue) {
        throw new AppError(500, "Failed to create issue");
    }
    return issue;
};

// Get All Issues
const getAllIssuesFromDB = async (query: { sort?: string | undefined; type?: string | undefined; status?: string | undefined }) => {
    const conditions: string[] = [];
    const params: Array<string> = [];

    if (typeof query.type !== "undefined") {
        if (!allowedIssueTypes.includes(query.type as IssueType)) {
            throw new AppError(400, "Invalid issue type filter");
        }
        params.push(query.type);
        conditions.push(`type = $${params.length}`);
    }

    if (typeof query.status !== "undefined") {
        if (!allowedIssueStatuses.includes(query.status as IssueStatus)) {
            throw new AppError(400, "Invalid issue status filter");
        }
        params.push(query.status);
        conditions.push(`status = $${params.length}`);
    }

    const sort = query.sort ?? "newest";
    if (sort !== "newest" && sort !== "oldest") {
        throw new AppError(400, "Invalid sort value");
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
    const orderClause = sort === "oldest" ? "ASC" : "DESC";

    const result = await pool.query<IIssueRow>(
        `
        SELECT id, title, description, type, status, reporter_id, created_at, updated_at
        FROM issues
        ${whereClause}
        ORDER BY created_at ${orderClause}
        `,
        params
    );

    return enrichIssues(result.rows);
};

// Get Single Issue
const getSingleIssueFromDB = async (id: number) => {
    validateIssueId(id);

    const result = await pool.query<IIssueRow>(
        `
        SELECT id, title, description, type, status, reporter_id, created_at, updated_at
        FROM issues
        WHERE id = $1
        `,
        [id]
    );

    const issue = result.rows[0];

    if (!issue) {
        throw new AppError(404, "Issue not found");
    }

    const reporter = await userService.findUserById(issue.reporter_id);

    if (!reporter) {
        throw new AppError(404, "Reporter not found");
    }

    return mapIssueWithReporter(
        issue,
        new Map([[reporter.id, { id: reporter.id, name: reporter.name, role: reporter.role }]])
    );
};

// Update Issue
const updateIssueIntoDB = async (id: number, payload: IUpdateIssue, requester: AuthTokenPayload): Promise<IIssueRow> => {
    validateIssueId(id);

    const existingIssueResult = await pool.query<IIssueRow>(
        `
        SELECT id, title, description, type, status, reporter_id, created_at, updated_at
        FROM issues
        WHERE id = $1
        `,
        [id]
    );

    const existingIssue = existingIssueResult.rows[0];

    if (!existingIssue) {
        throw new AppError(404, "Issue not found");
    }

    if (requester.role !== "maintainer") {
        if (existingIssue.reporter_id !== requester.id) {
            throw new AppError(403, "You are not allowed to update this issue");
        }

        if (existingIssue.status !== "open") {
            throw new AppError(409, "Only open issues can be updated by contributors");
        }

        if (typeof payload.status !== "undefined") {
            throw new AppError(403, "Contributors cannot change issue status");
        }
    }

    const updates = validateUpdatePayload(payload);
    const setClauses: string[] = [];
    const values: Array<string | number> = [];
    const columns: Array<keyof typeof updates> = Object.keys(updates) as Array<keyof typeof updates>;

    columns.forEach((column) => {
        values.push(updates[column] as string);
        setClauses.push(`${column} = $${values.length}`);
    });

    values.push(id);
    setClauses.push(`updated_at = NOW()`);

    const result = await pool.query<IIssueRow>(
        `
        UPDATE issues
        SET ${setClauses.join(", ")}
        WHERE id = $${values.length}
        RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
        `,
        values
    );

    const issue = result.rows[0];
    if (!issue) {
        throw new AppError(500, "Failed to update issue");
    }

    return issue;
};

// Delete Issue
const deleteIssueFromDB = async (id: number, requester: AuthTokenPayload) => {
    validateIssueId(id);

    if (requester.role !== "maintainer") {
        throw new AppError(403, "Only maintainers can delete issues");
    }

    const existingIssue = await pool.query<Pick<IIssueRow, "id">>(
        `
        SELECT id
        FROM issues
        WHERE id = $1
        `,
        [id]
    );

    if (!existingIssue.rows[0]) {
        throw new AppError(404, "Issue not found");
    }

    await pool.query(
        `
        DELETE FROM issues
        WHERE id = $1
        `,
        [id]
    );
};

export const issueService = {
    createIssueIntoDB,
    getAllIssuesFromDB,
    getSingleIssueFromDB,
    updateIssueIntoDB,
    deleteIssueFromDB
};
