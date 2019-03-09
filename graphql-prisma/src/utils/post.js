import { getUserId } from './auth'

export const postBelongsToUser = async (postId, prisma, request) => {
  const userId = getUserId(request)

  const match = await prisma.exists.Post({
    id: postId,
    author: {
      id: userId
    }
  })

  if (!match) {
    throw new Error("The desired post doesn't belong to the current user")
  }
}

export const isPostPublished = async (prisma, post) =>
  prisma.exists.Post({
    id: post,
    published: true
  })
