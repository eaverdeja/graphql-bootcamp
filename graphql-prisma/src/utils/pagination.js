export const applyPagination = args => {
  const paginationArgs = {}
  const { page, cursor } = args

  if (page) {
    const { first, skip } = page
    paginationArgs.first = first
    paginationArgs.skip = skip
  }

  if (cursor) {
    paginationArgs.after = cursor.after
  }

  return paginationArgs
}
