const Query = {
  users(parent, args, { prisma }, info) {
    return prisma.query.users(null, info)
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
