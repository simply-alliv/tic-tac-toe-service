const express = require("express");
const http = require("http");
const cors = require("cors");

class App {
  app;
  server;

  constructor() {
    this.app = express();
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
}

module.exports = App;
