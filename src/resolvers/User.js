const User = {
  posts: {
    fragment: `
      fragment userId on User { id }
    `,
    resolve(parent, args, { prisma }, info) {
      return prisma.query.posts(
        {
          where: {
            published: true,
            author: {
              id: parent.id
            }
          }
        },
        info
      )
    }
  },
  email: {
    fragment: 'fragment userId on User { id }',
    resolve(
      parent,
      args,
      {
        request,
        auth: { getUserId }
      },
      info
    ) {
      const userId = getUserId(request, false)

      if (userId === parent.id) {
        return parent.email
      }

      return null
    }
  }
}

export { User as default }
