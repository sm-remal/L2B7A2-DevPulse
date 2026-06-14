export interface IIssue {
    title: string;
    description: string;
    type: "bug" | "feature_request";
}

export interface IUpdateIssue {
    title: string;
    description: string;
    type: "bug" | "feature_request";
}