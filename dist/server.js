
   import { createRequire } from 'module';
   const require = createRequire(import.meta.url);
  

// src/app.ts
import express2 from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";

// src/config/index.ts
import dotenv from "dotenv";
import path from "path";
dotenv.config({
  path: path.join(process.cwd(), ".env")
});
var config = {
  connection_string: process.env.CONNECTIONSTRING ?? "",
  port: Number(process.env.PORT ?? 5e3),
  jwt_secret: process.env.JWT_SECRET ?? ""
};
var config_default = config;

// src/modules/auth/auth.service.ts
import jwt from "jsonwebtoken";

// src/utility/AppError.ts
var AppError = class extends Error {
  statusCode;
  errors;
  constructor(statusCode, message, errors) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.name = "AppError";
  }
};
var AppError_default = AppError;

// src/db/index.ts
import { Pool } from "pg";
var pool = new Pool({
  connectionString: config_default.connection_string
});
var initDB = async () => {
  try {
    await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role VARCHAR(20) DEFAULT 'contributor'
            CHECK (role IN ('contributor', 'maintainer')),
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
            )`);
    await pool.query(`
                CREATE TABLE IF NOT EXISTS issues (
                id SERIAL PRIMARY KEY,
                title VARCHAR(150) NOT NULL,
                description TEXT NOT NULL,
                type VARCHAR(30) NOT NULL
                CHECK (type IN ('bug', 'feature_request')),
                status VARCHAR(30) DEFAULT 'open'
                CHECK (status IN ('open', 'in_progress', 'resolved')),
                reporter_id INT NOT NULL,
                created_at TIMESTAMP DEFAULT NOW(),
                updated_at TIMESTAMP DEFAULT NOW()
                )`);
    console.log("Table created successfully");
  } catch (error) {
    console.log(error);
  }
};

// src/modules/user/user.service.ts
var findUserByEmail = async (email) => {
  const result = await pool.query(
    `SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE email = $1`,
    [email]
  );
  return result.rows[0] ?? null;
};
var findUserById = async (id) => {
  const result = await pool.query(
    `SELECT id, name, email, password, role, created_at, updated_at FROM users WHERE id = $1`,
    [id]
  );
  return result.rows[0] ?? null;
};
var findUsersByIds = async (ids) => {
  if (ids.length === 0) {
    return [];
  }
  const result = await pool.query(
    `SELECT id, name, role FROM users WHERE id = ANY($1::int[])`,
    [ids]
  );
  return result.rows;
};
var userService = {
  findUserByEmail,
  findUserById,
  findUsersByIds
};

// src/modules/auth/auth.service.ts
var signupUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  if (!name?.trim()) {
    throw new AppError_default(400, "Name is required");
  }
  if (!email?.trim()) {
    throw new AppError_default(400, "Email is required");
  }
  if (!password) {
    throw new AppError_default(400, "Password is required");
  }
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
    throw new AppError_default(400, "Invalid email address");
  }
  const normalizedRole = role ?? "contributor";
  if (normalizedRole !== "contributor" && normalizedRole !== "maintainer") {
    throw new AppError_default(400, "Invalid role");
  }
  const isUserExist = await userService.findUserByEmail(normalizedEmail);
  if (isUserExist) {
    throw new AppError_default(409, "Email already exists");
  }
  const hashPassword = await bcrypt.hash(password, 10);
  const result = await pool.query(
    `
            INSERT INTO users (name, email, password, role)
            VALUES($1, $2, $3, $4)
            RETURNING id, name, email, role, created_at, updated_at
        `,
    [name.trim(), normalizedEmail, hashPassword, normalizedRole]
  );
  const createdUser = result.rows[0];
  if (!createdUser) {
    throw new AppError_default(500, "Failed to register user");
  }
  return createdUser;
};
var loginUserIntoDB = async (payload) => {
  const { email, password } = payload;
  if (!email?.trim() || !password) {
    throw new AppError_default(400, "Email and password are required");
  }
  const user = await userService.findUserByEmail(email.trim().toLowerCase());
  if (!user) {
    throw new AppError_default(401, "Invalid credentials");
  }
  const isPasswordMatch = await bcrypt.compare(
    password,
    user.password
  );
  if (!isPasswordMatch) {
    throw new AppError_default(401, "Invalid credentials");
  }
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      role: user.role
    },
    config_default.jwt_secret,
    {
      expiresIn: "7d"
    }
  );
  return {
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      created_at: user.created_at,
      updated_at: user.updated_at
    }
  };
};
var authService = {
  signupUserIntoDB,
  loginUserIntoDB
};

// src/utility/sendResponse.ts
var sendResponse = (res, data) => {
  const payload = {
    success: data.success,
    message: data.message
  };
  if (typeof data.data !== "undefined") {
    payload.data = data.data;
  }
  if (typeof data.errors !== "undefined") {
    payload.errors = data.errors;
  }
  res.status(data.statusCode).json(payload);
};
var sendResponse_default = sendResponse;

// src/utility/responseMessages.ts
var RESPONSE_MESSAGES = {
  auth: {
    signupSuccess: "User registered successfully",
    loginSuccess: "Login successful"
  },
  issue: {
    createSuccess: "Issue created successfully",
    listSuccess: "Issues retrived successfully",
    singleSuccess: "Issue retrived successfully",
    updateSuccess: "Issue updated successfully",
    deleteSuccess: "Issue deleted successfully"
  }
};

// src/modules/auth/auth.controller.ts
var signupUser = async (req, res) => {
  const result = await authService.signupUserIntoDB(req.body);
  sendResponse_default(res, {
    statusCode: 201,
    success: true,
    message: RESPONSE_MESSAGES.auth.signupSuccess,
    data: result
  });
};
var loginUser = async (req, res) => {
  const result = await authService.loginUserIntoDB(req.body);
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: RESPONSE_MESSAGES.auth.loginSuccess,
    data: result
  });
};
var authController = {
  signupUser,
  loginUser
};

// src/utility/asyncHandler.ts
var asyncHandler = (handler) => {
  return (req, res, next) => {
    Promise.resolve(handler(req, res, next)).catch(next);
  };
};
var asyncHandler_default = asyncHandler;

// src/modules/auth/auth.route.ts
var route = Router();
route.post("/signup", asyncHandler_default(authController.signupUser));
route.post("/login", asyncHandler_default(authController.loginUser));
var authRouter = route;

// src/modules/issue/issue.route.ts
import express from "express";

// src/modules/issue/issue.service.ts
var allowedIssueTypes = ["bug", "feature_request"];
var allowedIssueStatuses = ["open", "in_progress", "resolved"];
var validateIssueId = (id) => {
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError_default(400, "Invalid issue id");
  }
};
var validateCreatePayload = (payload) => {
  const title = payload.title?.trim();
  const description = payload.description?.trim();
  const type = payload.type;
  if (!title) {
    throw new AppError_default(400, "Title is required");
  }
  if (title.length > 150) {
    throw new AppError_default(400, "Title must not exceed 150 characters");
  }
  if (!description) {
    throw new AppError_default(400, "Description is required");
  }
  if (description.length < 20) {
    throw new AppError_default(400, "Description must be at least 20 characters");
  }
  if (!allowedIssueTypes.includes(type)) {
    throw new AppError_default(400, "Invalid issue type");
  }
  return {
    title,
    description,
    type
  };
};
var validateUpdatePayload = (payload) => {
  const updates = {};
  if (typeof payload.title !== "undefined") {
    const title = payload.title.trim();
    if (!title) {
      throw new AppError_default(400, "Title cannot be empty");
    }
    if (title.length > 150) {
      throw new AppError_default(400, "Title must not exceed 150 characters");
    }
    updates.title = title;
  }
  if (typeof payload.description !== "undefined") {
    const description = payload.description.trim();
    if (!description) {
      throw new AppError_default(400, "Description cannot be empty");
    }
    if (description.length < 20) {
      throw new AppError_default(400, "Description must be at least 20 characters");
    }
    updates.description = description;
  }
  if (typeof payload.type !== "undefined") {
    if (!allowedIssueTypes.includes(payload.type)) {
      throw new AppError_default(400, "Invalid issue type");
    }
    updates.type = payload.type;
  }
  if (typeof payload.status !== "undefined") {
    if (!allowedIssueStatuses.includes(payload.status)) {
      throw new AppError_default(400, "Invalid issue status");
    }
    updates.status = payload.status;
  }
  if (Object.keys(updates).length === 0) {
    throw new AppError_default(400, "At least one field is required for update");
  }
  return updates;
};
var mapIssueWithReporter = (issue, reporterMap) => {
  const reporter = reporterMap.get(issue.reporter_id);
  if (!reporter) {
    throw new AppError_default(404, "Reporter not found");
  }
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var enrichIssues = async (issues) => {
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const reporters = await userService.findUsersByIds(reporterIds);
  const reporterMap = new Map(reporters.map((reporter) => [reporter.id, reporter]));
  if (reporterMap.size !== reporterIds.length) {
    throw new AppError_default(404, "Reporter not found");
  }
  return issues.map((issue) => mapIssueWithReporter(issue, reporterMap));
};
var createIssueIntoDB = async (payload, reporter_id) => {
  validateIssueId(reporter_id);
  const reporter = await userService.findUserById(reporter_id);
  if (!reporter) {
    throw new AppError_default(404, "Reporter not found");
  }
  const { title, description, type } = validateCreatePayload(payload);
  const result = await pool.query(
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
    throw new AppError_default(500, "Failed to create issue");
  }
  return issue;
};
var getAllIssuesFromDB = async (query) => {
  const conditions = [];
  const params = [];
  if (typeof query.type !== "undefined") {
    if (!allowedIssueTypes.includes(query.type)) {
      throw new AppError_default(400, "Invalid issue type filter");
    }
    params.push(query.type);
    conditions.push(`type = $${params.length}`);
  }
  if (typeof query.status !== "undefined") {
    if (!allowedIssueStatuses.includes(query.status)) {
      throw new AppError_default(400, "Invalid issue status filter");
    }
    params.push(query.status);
    conditions.push(`status = $${params.length}`);
  }
  const sort = query.sort ?? "newest";
  if (sort !== "newest" && sort !== "oldest") {
    throw new AppError_default(400, "Invalid sort value");
  }
  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";
  const orderClause = sort === "oldest" ? "ASC" : "DESC";
  const result = await pool.query(
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
var getSingleIssueFromDB = async (id) => {
  validateIssueId(id);
  const result = await pool.query(
    `
        SELECT id, title, description, type, status, reporter_id, created_at, updated_at
        FROM issues
        WHERE id = $1
        `,
    [id]
  );
  const issue = result.rows[0];
  if (!issue) {
    throw new AppError_default(404, "Issue not found");
  }
  const reporter = await userService.findUserById(issue.reporter_id);
  if (!reporter) {
    throw new AppError_default(404, "Reporter not found");
  }
  return mapIssueWithReporter(
    issue,
    /* @__PURE__ */ new Map([[reporter.id, { id: reporter.id, name: reporter.name, role: reporter.role }]])
  );
};
var updateIssueIntoDB = async (id, payload, requester) => {
  validateIssueId(id);
  const existingIssueResult = await pool.query(
    `
        SELECT id, title, description, type, status, reporter_id, created_at, updated_at
        FROM issues
        WHERE id = $1
        `,
    [id]
  );
  const existingIssue = existingIssueResult.rows[0];
  if (!existingIssue) {
    throw new AppError_default(404, "Issue not found");
  }
  if (requester.role !== "maintainer") {
    if (existingIssue.reporter_id !== requester.id) {
      throw new AppError_default(403, "You are not allowed to update this issue");
    }
    if (existingIssue.status !== "open") {
      throw new AppError_default(409, "Only open issues can be updated by contributors");
    }
    if (typeof payload.status !== "undefined") {
      throw new AppError_default(403, "Contributors cannot change issue status");
    }
  }
  const updates = validateUpdatePayload(payload);
  const setClauses = [];
  const values = [];
  const columns = Object.keys(updates);
  columns.forEach((column) => {
    values.push(updates[column]);
    setClauses.push(`${column} = $${values.length}`);
  });
  values.push(id);
  setClauses.push(`updated_at = NOW()`);
  const result = await pool.query(
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
    throw new AppError_default(500, "Failed to update issue");
  }
  return issue;
};
var deleteIssueFromDB = async (id, requester) => {
  validateIssueId(id);
  if (requester.role !== "maintainer") {
    throw new AppError_default(403, "Only maintainers can delete issues");
  }
  const existingIssue = await pool.query(
    `
        SELECT id
        FROM issues
        WHERE id = $1
        `,
    [id]
  );
  if (!existingIssue.rows[0]) {
    throw new AppError_default(404, "Issue not found");
  }
  await pool.query(
    `
        DELETE FROM issues
        WHERE id = $1
        `,
    [id]
  );
};
var issueService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueIntoDB,
  deleteIssueFromDB
};

// src/modules/issue/issue.controller.ts
var createIssue = async (req, res) => {
  const reporter_id = req.user.id;
  const result = await issueService.createIssueIntoDB(
    req.body,
    reporter_id
  );
  sendResponse_default(res, {
    statusCode: 201,
    success: true,
    message: RESPONSE_MESSAGES.issue.createSuccess,
    data: result
  });
};
var getAllIssues = async (req, res) => {
  const query = {};
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
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: RESPONSE_MESSAGES.issue.listSuccess,
    data: result
  });
};
var getSingleIssue = async (req, res) => {
  const result = await issueService.getSingleIssueFromDB(
    Number(req.params.id)
  );
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: RESPONSE_MESSAGES.issue.singleSuccess,
    data: result
  });
};
var updateIssue = async (req, res) => {
  const result = await issueService.updateIssueIntoDB(
    Number(req.params.id),
    req.body,
    req.user
  );
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: RESPONSE_MESSAGES.issue.updateSuccess,
    data: result
  });
};
var deleteIssue = async (req, res) => {
  await issueService.deleteIssueFromDB(
    Number(req.params.id),
    req.user
  );
  sendResponse_default(res, {
    statusCode: 200,
    success: true,
    message: RESPONSE_MESSAGES.issue.deleteSuccess
  });
};
var issueController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middleware/auth.ts
import jwt2 from "jsonwebtoken";
var auth = (req, res, next) => {
  try {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : header;
    if (!token) {
      throw new AppError_default(401, "Unauthorized");
    }
    const decoded = jwt2.verify(token, config_default.jwt_secret);
    req.user = decoded;
    next();
  } catch {
    next(new AppError_default(401, "Unauthorized"));
  }
};
var auth_default = auth;

// src/modules/issue/issue.route.ts
var router = express.Router();
router.post("/", auth_default, asyncHandler_default(issueController.createIssue));
router.get("/", asyncHandler_default(issueController.getAllIssues));
router.get("/:id", asyncHandler_default(issueController.getSingleIssue));
router.patch("/:id", auth_default, asyncHandler_default(issueController.updateIssue));
router.delete("/:id", auth_default, asyncHandler_default(issueController.deleteIssue));
var issueRoute = router;

// src/middleware/globalErrorHandler.ts
var globalErrorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }
  if (err instanceof AppError_default) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      errors: err.errors
    });
  }
  const message = err instanceof Error ? err.message : "Internal Server Error";
  return res.status(500).json({
    success: false,
    message
  });
};
var globalErrorHandler_default = globalErrorHandler;

// src/app.ts
var app = express2();
app.use(express2.json());
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRoute);
app.get("/", (req, res) => {
  try {
    res.status(200).json({
      success: true,
      message: "Hello Developer",
      author: "SM.Remal"
    });
  } catch (error) {
    console.log(error);
  }
});
app.use(globalErrorHandler_default);
var app_default = app;

// src/server.ts
var startServer = async () => {
  await initDB();
  app_default.listen(config_default.port, () => {
    console.log(`Example app listening on port ${config_default.port}`);
  });
};
void startServer();
//# sourceMappingURL=server.js.map