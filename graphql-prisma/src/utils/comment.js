import { getUserId } from './auth'

export const commentBeginsToUser = async (commentId, prisma, request) => {
  const userId = getUserId(request)

  const match = await prisma.exists.Comment({
    id: commentId,
    author: {
      id: userId
    }
  })

  if (!match) {
    throw new Error("The desired comment doesn't belong to the current user")
  }
}
