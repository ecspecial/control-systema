import env from '../config.validator';

export default () => ({
  host: env.get('DB_HOST').required().asString(),
  port: env.get('DB_PORT').required().asPortNumber(),
  username: env.get('DB_USERNAME').required().asString(),
  password: env.get('DB_PASSWORD').required().asString(),
  database: env.get('DB_DATABASE').required().asString(),
});
