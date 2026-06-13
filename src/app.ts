import express, { type Request, type Response } from "express"
import { authRouter } from "./modules/auth/auth.route"
const app = express()
const port = 5000

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

  // API End Points
  app.use("/api/auth", authRouter);


})

export default app;