export const prettyLog = (data, label = null) => {
  if (label) {
    console.groupCollapsed(label)
  }

  console.log(JSON.stringify(data, null, 3))

  if (label) {
    console.groupEnd()
  }

  return Promise.resolve(data)
}
