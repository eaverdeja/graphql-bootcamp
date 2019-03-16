import '@babel/polyfill'
import { GraphQLServer, PubSub } from 'graphql-yoga'
import db from './db'
import prisma from './prisma'
import { postBelongsToUser, isPostPublished } from './utils/post'
import { commentBelongsToUser } from './utils/comment'
import { applyPagination } from './utils/pagination'
import {
  getUserId,
  createToken,
  hashPassword,
  comparePassword
} from './utils/auth'
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
        createToken,
        hashPassword,
        comparePassword
      },
      pagination: {
        applyPagination
      }
    }
  },
  fragmentReplacements
})

server.start({ port: process.env.PORT || 4000 }, () => {
  console.log('The server is up!')
})
