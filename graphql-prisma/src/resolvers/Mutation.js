import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const Mutation = {
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
      token: jwt.sign({ userId: user.id }, 'thisisasecret')
    }
  },
  deleteUser(parent, { id }, { prisma }, info) {
    return prisma.mutation.deleteUser({ where: { id } }, info)
  },
  updateUser(parent, { id, data }, { prisma }, info) {
    return prisma.mutation.updateUser({ where: { id }, data }, info)
  },
  createPost(parent, { data }, { prisma }, info) {
    const { title, body, published, author } = data
    return prisma.mutation.createPost(
      {
        data: {
          title,
          body,
          published,
          author: {
            connect: {
              id: author
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
