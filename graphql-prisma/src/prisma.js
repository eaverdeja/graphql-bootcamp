import { Prisma } from 'prisma-binding'
import { fragmentReplacements } from './resolvers'

const prisma = new Prisma({
  typeDefs: 'src/generated/schema.graphql',
  endpoint: 'http://localhost:4466',
  secret: 'somethingsupersecret',
  fragmentReplacements
})

export default prisma
