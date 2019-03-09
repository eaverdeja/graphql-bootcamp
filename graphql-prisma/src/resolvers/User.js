const User = {
  async email(
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

export { User as default }
