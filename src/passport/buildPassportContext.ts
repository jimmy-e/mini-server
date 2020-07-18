import passport from 'passport';
import {
  AuthenticateParams,
  AuthenticateReturn,
  BuildPassportContextParams,
  Done,
  ExpressParams,
  Info,
  LoginParams,
  PromisifiedAuthenticateParams,
  PromisifiedLoginParams,
} from './passportTypes';

const promisifiedAuthenticate = ({
  authenticateOptions,
  request,
  response,
  strategyName,
}: PromisifiedAuthenticateParams): Promise<AuthenticateReturn> => (
  new Promise<AuthenticateReturn>((resolve, reject) => {
    const done: Done = (
      error: Error | undefined,
      user: object | undefined,
      info?: Info | undefined,
    ): void => {
      if (error) reject(error);
      else resolve({ user, info });
    };

    const authenticateFunction = passport.authenticate(strategyName, authenticateOptions, done);
    return authenticateFunction(request, response);
  }));

const promisifiedLogin = ({
  authenticateOptions,
  request,
  user,
}: PromisifiedLoginParams): Promise<void> => new Promise<void>((resolve, reject) => {
  const done = (err: Error | undefined): void => {
    if (err) reject(err);
    else resolve();
  };

  request.login(user, authenticateOptions, done);
});

export default ({ request, response }: ExpressParams): BuildPassportContextParams => {
  const authenticate = (
    { authenticateOptions, strategyName }: AuthenticateParams,
  ): Promise<AuthenticateReturn> => (
    promisifiedAuthenticate({
      authenticateOptions,
      request,
      response,
      strategyName,
    })
  );

  const isAuthenticated = (): boolean => request.isAuthenticated();

  const getUserId = (): string => {
    if (isAuthenticated()) {
      // @ts-ignore
      return request.user.id;
    }
    throw Error('Passport Context getUserId error: User is not authenticated');
  };

  const login = ({ authenticateOptions, user }: LoginParams): Promise<void> => (
    promisifiedLogin({ authenticateOptions, request, user })
  );

  const logout = (): void => request.logout();

  return {
    authenticate,
    getUserId,
    isAuthenticated,
    login,
    logout,
  };
};
