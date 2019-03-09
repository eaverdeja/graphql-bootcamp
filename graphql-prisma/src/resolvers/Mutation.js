const Mutation = {
  async login(
    parent,
    {
      credentials: { email, password }
    },
    {
      prisma,
      auth: { createToken, comparePassword }
    },
    info
  ) {
    const user = await prisma.query.user({
      where: {
        email
      }
    })
    const hashedPassword = user ? user.password : ''

    const matchPassword = await comparePassword(password, hashedPassword)

    if (!user || !matchPassword) {
      throw new Error('Invalid credentials!')
    }

    return {
      user,
      token: createToken({ userId: user.id })
    }
  },
  async createUser(
    parent,
    { data },
    {
      prisma,
      auth: { createToken, hashPassword }
    },
    info
  ) {
    const { password } = data

    const hashedPassword = await hashPassword(password)

    const user = await prisma.mutation.createUser({
      data: {
        ...data,
        password: hashedPassword
      }
    })

    return {
      user,
      token: createToken({ userId: user.id })
    }
  },
  deleteUser(
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

    return prisma.mutation.deleteUser({ where: { id: userId } }, info)
  },
  async updateUser(
    parent,
    { data },
    {
      prisma,
      request,
      auth: { getUserId, hashPassword }
    },
    info
  ) {
    const userId = getUserId(request)

    if (data.password) {
      const hashedPassword = await hashPassword(data.password)
      data.password = hashedPassword
    }

    return prisma.mutation.updateUser({ where: { id: userId }, data }, info)
  },
  createPost(
    parent,
    { data },
    {
      prisma,
      request,
      auth: { getUserId }
    },
    info
  ) {
    const userId = getUserId(request)

    const { title, body, published } = data
    return prisma.mutation.createPost(
      {
        data: {
          title,
          body,
          published,
          author: {
            connect: {
              id: userId
            }
          }
        }
      },
      info
    )
  },
  async deletePost(
    parent,
    { id },
    {
      prisma,
      request,
      postUtils: { postBelongsToUser }
    },
    info
  ) {
    await postBelongsToUser(id, prisma, request)

    return prisma.mutation.deletePost({ where: { id } }, info)
  },
  async updatePost(
    parent,
    { id, data },
    {
      prisma,
      request,
      postUtils: { postBelongsToUser, isPostPublished }
    },
    info
  ) {
    await postBelongsToUser(id, prisma, request)
    const { title, body, published } = data

    const currentlyPublished = await isPostPublished(prisma, id)
    if (currentlyPublished && published === false) {
      await prisma.mutation.deleteManyComments({
        where: {
          post: {
            id
          }
        }
      })
    }

    return prisma.mutation.updatePost(
      {
        where: { id },
        data: {
          title,
          body,
          published
        }
      },
      info
    )
  },
  async createComment(
    parent,
    { data },
    {
      prisma,
      request,
      auth: { getUserId },
      postUtils: { isPostPublished }
    },
    info
  ) {
    const userId = getUserId(request)
    const { text, post } = data

    const currentlyPublished = await isPostPublished(prisma, post)

    if (!currentlyPublished) {
      throw new Error('Post is not published yet!')
    }

    return prisma.mutation.createComment(
      {
        data: {
          text,
          author: {
            connect: {
              id: userId
            }
          },
          post: {
            connect: {
              id: post
            }
          }
        }
      },
      info
    )
  },
  async deleteComment(
    parent,
    { id },
    {
      prisma,
      request,
      commentUtils: { commentBelongsToUser }
    },
    info
  ) {
    await commentBelongsToUser(id, prisma, request)

    return prisma.mutation.deleteComment({ where: { id } }, info)
  },
  async updateComment(
    parent,
    { id, data },
    {
      prisma,
      request,
      commentUtils: { commentBelongsToUser }
    },
    info
  ) {
    await commentBelongsToUser(id, prisma, request)

    return prisma.mutation.updateComment({ where: { id }, data }, info)
  }
}

export { Mutation as default }
