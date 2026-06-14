import express, { type Request, type Response } from "express"
import { authRouter } from "./modules/auth/auth.route"
import { issueRoute } from "./modules/issue/issue.route"
const app = express()
const port = 5000

// Middleware
app.use(express.json())

// API End Points
app.use("/api/auth", authRouter);
app.use("api/auth/login", authRouter);
app.use("/api/auth", authRouter);
app.use("/api/issues", issueRoute);


app.get('/', (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: "Hello Developer",
      author: "SM.Remal",
    })
  } catch (error) {
    console.log(error)
  }
})

export default app;