import { GraphQLServer, PubSub } from 'graphql-yoga'
import db from './db'
import prisma from './prisma'
import { postBelongsToUser, isPostPublished } from './utils/post'
import { commentBelongsToUser } from './utils/comment'
import { getUserId, createToken } from './utils/auth'
import { resolvers, fragmentReplacements } from './resolvers'

const pubsub = new PubSub()

const server = new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context(request) {
    return {
      db,
      pubsub,
      prisma,
      request,
      postUtils: {
        postBelongsToUser,
        isPostPublished
      },
      commentUtils: {
        commentBelongsToUser
      },
      auth: {
        getUserId,
        createToken
      }
    }
  },
  fragmentReplacements
})

server.start(() => {
  console.log('The server is up!')
})
