import { GraphQLServer, PubSub } from 'graphql-yoga'
import db from './db'
import Query from './resolvers/Query'
import Mutation from './resolvers/Mutation'
import Subscription from './resolvers/Subscription'
import User from './resolvers/User'
import Post from './resolvers/Post'
import Comment from './resolvers/Comment'
import prisma from './prisma'
import { postBelongsToUser } from './utils/post'
import { commentBelongsToUser } from './utils/comment'

const pubsub = new PubSub()

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers: {
    Query,
    Mutation,
    Subscription,
    User,
    Post,
    Comment
  },
  context(request) {
    return {
      db,
      pubsub,
      prisma,
      request,
      postUtils: {
        postBelongsToUser
      },
      commentUtils: {
        commentBelongsToUser
      }
    }
  }
})

server.start(() => {
  console.log('The server is up!')
})
