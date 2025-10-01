import env from '../config.validator';

export default () => ({
  port: env.get('PORT').required().asPortNumber(),
  nodeEnv: env.get('NODE_ENV').required().asString(),
  mode: env.get('NODE_ENV').required().asString(),
});
