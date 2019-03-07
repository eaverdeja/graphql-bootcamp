import bcrypt from 'bcryptjs'

const Mutation = {
  async login(
    parent,
    {
      credentials: { email, password }
    },
    {
      prisma,
      auth: { createToken }
    },
    info
  ) {
    const user = await prisma.query.user({
      where: {
        email
      }
    })
    const hashedPassword = user ? user.password : ''

    const matchPassword = await bcrypt.compare(password, hashedPassword)

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
      auth: { createToken }
    },
    info
  ) {
    const { password } = data
    if (password.length < 8) {
      throw new Error('Password must be 8 characters or longer.')
    }

    const hashedPassword = await bcrypt.hash(password, 10)

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
  updateUser(
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
      postUtils: { postBelongsToUser }
    },
    info
  ) {
    await postBelongsToUser(id, prisma, request)

    const { title, body, published } = data
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
  createComment(
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

    const { text, post } = data
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
