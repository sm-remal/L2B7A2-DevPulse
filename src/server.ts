import app from "./app"
import config from "./config"
import { initDB } from "./db"

const startServer = async () => {
  await initDB();

  app.listen(config.port, () => {
    console.log(`Example app listening on port ${config.port}`)
  })
}

void startServer();
