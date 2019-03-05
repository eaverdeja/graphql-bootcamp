const Query = {
  users(parent, args, { prisma }, info) {
    const opArgs = {}

    if (args.query) {
      opArgs.where = {
        OR: [{ name_contains: args.query }, { email_contains: args.query }]
      }
    }

    return prisma.query.users(opArgs, info)
  },
  posts(parent, args, { prisma }, info) {
    return prisma.query.posts(null, info)
  },
  comments(parent, args, { prisma }, info) {
    return prisma.query.comments(null, info)
  },
  me() {
    return {
      id: '123098',
      name: 'Mike',
      email: 'mike@example.com'
    }
  },
  post(parent, args, { prisma }, info) {
    const whereId = {
      where: {
        id: args.id
      }
    }
    if (!prisma.exists.Post(whereId)) {
      throw new Error('Post not found!')
    }
    return prisma.query.post(whereId, info)
  }
}

export { Query as default }
