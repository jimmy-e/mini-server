import { gql } from 'apollo-server-express';

const typeDefs = gql`
  type User {
    id: String
    firstName: String
    lastName: String
    email: String
  }
  input LoginUserInput {
    email: String!
    password: String!
  }
  type Query {
    isAuthenticated: Boolean
  }
  type Mutation {
    loginUser(data: LoginUserInput): User!
  }
`;

export default typeDefs;
