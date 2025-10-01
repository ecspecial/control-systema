import env from '../config.validator';

export default () => ({
  accessTokenSecret: env.get('JWT_ACCESS_TOKEN_SECRET').required().asString(),
  accessTokenExpiresIn: env.get('JWT_ACCESS_TOKEN_EXPIRES_IN').default('1d').asString(),
  refreshTokenSecret: env.get('JWT_REFRESH_TOKEN_SECRET').required().asString(),
  refreshTokenExpiresIn: env.get('JWT_REFRESH_TOKEN_EXPIRES_IN').default('7d').asString(),
});
