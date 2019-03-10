const Query = {
  users(parent, { query, first, skip }, { prisma }, info) {
    const opArgs = {}

    if (query) {
      opArgs.where = {
        OR: [{ name_contains: query }, { email_contains: query }]
      }
    }

    if (first && skip) {
      opArgs.first = first
      opArgs.skip = skip
    }

    return prisma.query.users(opArgs, info)
  },
  posts(parent, { query, first, skip }, { prisma }, info) {
    const opArgs = {
      where: {
        published: true
      }
    }

    if (query) {
      opArgs.where = {
        OR: [{ title_contains: query }, { body_contains: query }]
      }
    }

    if (first && skip) {
      opArgs.first = first
      opArgs.skip = skip
    }

    return prisma.query.posts(opArgs, info)
  },
  myPosts(
    parent,
    args,
    {
      prisma,
      request,
      auth: { getUserId }
    },
    info
  ) {
    const userId = getUserId(request)
    const opArgs = {
      where: {
        author: {
          id: userId
        }
      }
    }

    if (args.query) {
      opArgs.where.OR = [
        { title_contains: args.query },
        { body_contains: args.query }
      ]
    }

    return prisma.query.posts(opArgs, info)
  },
  comments(parent, args, { prisma }, info) {
    return prisma.query.comments(null, info)
  },
  async me(
    parent,
    args,
    {
      prisma,
      request,
      auth: { getUserId }
    },
    info
  ) {
    const userId = getUserId(request)
    const user = await prisma.query.user(
      {
        where: {
          id: userId
        }
      },
      info
    )

    if (!user) {
      throw new Error('User not found!')
    }

    return user
  },
  async post(
    parent,
    { id },
    {
      prisma,
      request,
      auth: { getUserId }
    },
    info
  ) {
    const userId = getUserId(request, false)

    const posts = await prisma.query.posts(
      {
        where: {
          id,
          OR: [
            {
              published: true
            },
            {
              author: {
                id: userId
              }
            }
          ]
        }
      },
      info
    )

    if (posts.length === 0) {
      throw new Error('Post not found!')
    }

    return posts[0]
  }
}

export { Query as default }
