const Query = {
  users(
    parent,
    args,
    {
      prisma,
      pagination: { applyPagination }
    },
    info
  ) {
    const { query, orderBy } = args
    const opArgs = { orderBy, ...applyPagination(args) }

    if (query) {
      opArgs.where = {
        OR: [{ name_contains: query }, { email_contains: query }]
      }
    }

    return prisma.query.users(opArgs, info)
  },
  posts(
    parent,
    args,
    {
      prisma,
      pagination: { applyPagination }
    },
    info
  ) {
    const { query, orderBy } = args
    const opArgs = {
      where: {
        published: true
      },
      orderBy,
      ...applyPagination(args)
    }

    if (query) {
      opArgs.where = {
        OR: [{ title_contains: query }, { body_contains: query }]
      }
    }

    return prisma.query.posts(opArgs, info)
  },
  myPosts(
    parent,
    args,
    {
      prisma,
      request,
      auth: { getUserId },
      pagination: { applyPagination }
    },
    info
  ) {
    const userId = getUserId(request)
    const { query, orderBy } = args
    const opArgs = {
      where: {
        author: {
          id: userId
        }
      },
      orderBy,
      ...applyPagination(args)
    }

    if (query) {
      opArgs.where.OR = [{ title_contains: query }, { body_contains: query }]
    }

    return prisma.query.posts(opArgs, info)
  },
  comments(
    parent,
    args,
    {
      prisma,
      pagination: { applyPagination }
    },
    info
  ) {
    const { orderBy } = args
    const opArgs = {
      orderBy,
      ...applyPagination(args)
    }

    return prisma.query.comments(opArgs, info)
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
