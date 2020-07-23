require("dotenv/config");
const App = require("./app");
const validateEnv = require("./utils/validateEnv");
const Games = require("./games");

validateEnv();

const app = new App();

app.listen();

const games = new Games(app.getServer());
