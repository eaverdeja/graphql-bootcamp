import bcrypt from 'bcryptjs'
import { getUserId, createToken } from '../utils/auth'

const Mutation = {
  async login(
    parent,
    {
      credentials: { email, password }
    },
    { prisma },
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
  async createUser(parent, { data }, { prisma }, info) {
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
  deleteUser(parent, { id }, { prisma }, info) {
    return prisma.mutation.deleteUser({ where: { id } }, info)
  },
  updateUser(parent, { data }, { prisma, request }, info) {
    const userId = getUserId(request)

    return prisma.mutation.updateUser({ where: { id: userId }, data }, info)
  },
  createPost(parent, { data }, { prisma, request }, info) {
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
  deletePost(parent, { id }, { prisma }, info) {
    return prisma.mutation.deletePost({ where: { id } }, info)
  },
  updatePost(parent, { id, data }, { prisma }, info) {
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
  createComment(parent, { data }, { prisma }, info) {
    const { text, author, post } = data
    return prisma.mutation.createComment(
      {
        data: {
          text,
          author: {
            connect: {
              id: author
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
  deleteComment(parent, { id }, { prisma }, info) {
    return prisma.mutation.deleteComment({ where: { id } }, info)
  },
  updateComment(parent, { id, data }, { prisma }, info) {
    const { text } = data
    return prisma.mutation.updateComment(
      { where: { id }, data: { text } },
      info
    )
  }
}

export { Mutation as default }
