import { Prisma } from 'prisma-binding'

const prisma = new Prisma({
  typeDefs: 'src/generated/schema.graphql',
  endpoint: 'http://localhost:4466',
  secret: 'somethingsupersecret'
})

export default prisma
