import type { IUserReporter } from "../user/user.interface";

export type IssueType = "bug" | "feature_request";
export type IssueStatus = "open" | "in_progress" | "resolved";

export interface IIssue {
    title: string;
    description: string;
    type: IssueType;
}

export interface IUpdateIssue {
    title?: string;
    description?: string;
    type?: IssueType;
    status?: IssueStatus;
}

export interface IIssueRow {
    id: number;
    title: string;
    description: string;
    type: IssueType;
    status: IssueStatus;
    reporter_id: number;
    created_at: Date;
    updated_at: Date;
}

export interface IIssueResponse extends Omit<IIssueRow, "reporter_id"> {
    reporter: IUserReporter;
}
