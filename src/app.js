const express = require("express");
const http = require("http");
const cors = require("cors");

class App {
  app;
  server;

  constructor() {
    this.app = express();

    this.connectToTheDatabase();
    this.initializeMiddlewares();
    this.server = http.createServer(this.app);
  }

  initializeMiddlewares() {
    this.app.use(cors({ origin: "http://localhost:3000", credentials: true }));
  }

  listen() {
    this.server.listen(process.env.PORT, () => {
      console.log(`App listening on the port ${process.env.PORT}`);
    });
  }

  getServer() {
    return this.server;
  }

  connectToTheDatabase() {
    const { MONGO_USER, MONGO_PASSWORD, MONGO_PATH } = process.env;
    mongoose.connect(
      `mongodb+srv://${MONGO_USER}:${MONGO_PASSWORD}${MONGO_PATH}`,
      {
        useNewUrlParser: true,
      }
    );
  }
}

module.exports = App;
