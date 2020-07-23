const { cleanEnv, port, str } = require("envalid");

const validateEnv = () => {
  cleanEnv(process.env, {
    PORT: port(),
    HOST: str(),
  });
};

module.exports = validateEnv;
