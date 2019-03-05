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
  }
}

export { Subscription as default }
