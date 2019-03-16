const Subscription = {
  comment: {
    subscribe(parent, { postId }, { prisma }, info) {
      const subscribeToPostOptions = {
        where: {
          node: {
            post: {
              id: postId
            }
          }
        }
      }
      return prisma.subscription.comment(subscribeToPostOptions, info)
    }
  },
  post: {
    subscribe(parent, args, { prisma }, info) {
      const publishedPosts = {
        where: {
          node: {
            published: true
          }
        }
      }
      return prisma.subscription.post(publishedPosts, info)
    }
  },
  myPost: {
    subscribe(
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

      return prisma.subscription.post(
        {
          where: {
            node: {
              author: {
                id: userId
              }
            }
          }
        },
        info
      )
    }
  }
}

export { Subscription as default }
