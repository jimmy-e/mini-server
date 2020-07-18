import { Request } from 'express';
import { Strategy } from 'passport-strategy';
import { Done, Info, VerifyFunction } from './passportTypes';

class LocalStrategy extends Strategy {
  public constructor(cb: VerifyFunction) {
    super();
    this.verify = cb;
    this.name = 'local';
  }

  public verify: VerifyFunction;

  public name: string;

  public authenticate(req: Request, options: { email: string; password: string }): void {
    const { email, password } = options;

    const done: Done = (error: Error, user: object, info?: Info) => {
      if (error) {
        // @ts-ignore
        return this.error(error);
      }
      if (!user) {
        // @ts-ignore
        return this.fail(info, 401);
      }
      // @ts-ignore
      return this.success(user, info);
    };

    this.verify(email, password, done);
  }
}

export default LocalStrategy;
