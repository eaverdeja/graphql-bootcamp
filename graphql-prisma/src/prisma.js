import { Prisma } from 'prisma-binding'
import { fragmentReplacements } from './resolvers'

const prisma = new Prisma({
  typeDefs: 'src/generated/schema.graphql',
  endpoint: process.env.PRISMA_ENDPOINT,
  secret: 'somethingsupersecret',
  fragmentReplacements
})

export default prisma
