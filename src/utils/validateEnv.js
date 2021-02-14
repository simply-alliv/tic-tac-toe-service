const { cleanEnv, port, str } = require("envalid");

const validateEnv = () => {
  cleanEnv(process.env, {
    PORT: port(),
    HOST: str(),
    CORS_ORIGIN: str(),
    MONGO_PASSWORD: str(),
    MONGO_PATH: str(),
    MONGO_USER: str(),
  });
};

module.exports = validateEnv;
