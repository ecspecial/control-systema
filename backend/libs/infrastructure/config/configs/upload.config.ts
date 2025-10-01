import env from '../config.validator';

export default () => ({
  uploadPath: env.get('UPLOAD_PATH').default(process.cwd() + '/uploads').asString(),
  maxFileSize: env.get('MAX_FILE_SIZE').default(10 * 1024 * 1024).asInt(), // 10MB
});
