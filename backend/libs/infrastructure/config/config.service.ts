import app from './configs/app.config';
import database from './configs/database.config';
import jwt from './configs/jwt.config';
import upload from './configs/upload.config';

export class cfg {
  public static get database() {
    return database();
  }

  public static get app() {
    return app();
  }

  public static get jwt() {
    return jwt();
  }

  public static get upload () {
    return upload();
  }
}
