import { pool } from "../../db";
import type { IIssue } from "./issue.interface";

// Create Issue
const createIssueIntoDB = async (payload: IIssue, reporter_id: number) => {

    const { title, description, type } = payload;

    const result = await pool.query(
        `
        INSERT INTO issues
        (title, description, type, reporter_id)

        VALUES($1, $2, $3, $4)

        RETURNING *
        `,
        [title, description, type, reporter_id]
    );

    return result.rows[0];
};


// Get All Issues
const getAllIssuesFromDB = async () => {

    const result = await pool.query(`
        SELECT * FROM issues
        ORDER BY created_at DESC
    `);

    return result.rows;
};


// Get Single Issue
const getSingleIssueFromDB = async (id: number) => {

    const result = await pool.query(
        `
        SELECT * FROM issues
        WHERE id = $1
        `,
        [id]
    );

    return result.rows[0];
};


// Update Issue
const updateIssueIntoDB = async (id: number, payload: IIssue) => {

    const { title, description, type } = payload;

    const result = await pool.query(
        `
        UPDATE issues

        SET
        title = $1,
        description = $2,
        type = $3,
        updated_at = NOW()

        WHERE id = $4

        RETURNING *
        `,
        [title, description, type, id]
    );

    return result.rows[0];
};


// Delete Issue
const deleteIssueFromDB = async (id: number) => {

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