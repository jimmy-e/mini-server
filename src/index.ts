import cors from 'cors';
import express from 'express';
import http from 'http';
import passport from 'passport';
import session from 'express-session';
import uuid from 'uuid/v4';
import { ApolloServer } from 'apollo-server-express';
import { PubSub } from 'graphql-subscriptions';
import LocalStrategy from './passport/localStrategy';
import buildPassportContext from './passport/buildPassportContext';
import resolvers from './resolvers';
import typeDefs from './typeDefs';
import users from './users';

// ----- INITIALIZE PASSPORT ----- //

passport.serializeUser((user: any, done) => done(null, user.id));

passport.deserializeUser((id, done) => {
  const matchingUser = users.find((user) => user.id === id);
  done(null, matchingUser);
});

passport.use(
  new LocalStrategy((email, password, done) => {
    const matchingUser = users.find((user) => email === user.email && password === user.password);
    const error = matchingUser ? null : new Error('no matching user');
    done(error, matchingUser);
  }),
);

const passportMiddleware = passport.initialize();
const passportSessionMiddleware = passport.session();

// ----- INITIALIZE EXPRESS ----- //

const expressMiddleware = express();
const expressSessionMiddleware = session({
  genid: (request) => uuid(),
  resave: false,
  saveUninitialized: false,
  secret: 'sample_session_secret',
});

expressMiddleware.use(cors({
  credentials: true,
  origin: 'http://localhost:8080',
}));

expressMiddleware.use(expressSessionMiddleware);
expressMiddleware.use(passportMiddleware);
expressMiddleware.use(passportSessionMiddleware);

// ----- INITIALIZE OUR SERVER ----- //

const pubsub = new PubSub();

const server = new ApolloServer({
  context: (request) => ({
    passport: buildPassportContext({ request: request.req, response: request.res }),
    pubsub,
  }),
  playground: {
    settings: {
      'request.credentials': 'same-origin',
    },
  },
  resolvers,
  typeDefs,
});

server.applyMiddleware({
  app: expressMiddleware,
  cors: false,
  path: '/graphql',
});

// ----- RUNNING THE SERVER ----- //

const httpServer = http.createServer(expressMiddleware);
server.installSubscriptionHandlers(httpServer);

httpServer.listen(process.env.PORT, () => {
  console.log(`Server ready at http://localhost:${process.env.PORT}${server.graphqlPath}`);
  console.log(`Subscriptions ready at ws://localhost:${process.env.PORT}${server.subscriptionsPath}`);
});

if (process.env.NODE_ENV !== 'PROD' && module.hot) {
  module.hot.accept();
  module.hot.dispose(() => server.stop());
}
