import jwt from 'jsonwebtoken'

const JWT_SECRET = 'thisisasecret'
const TOKEN_EXPIRES_IN = '7 days'

export const getUserId = (request, requireAuth = true) => {
  const { request: httpRequest, connection: socket } = request
  const authHeader = httpRequest
    ? httpRequest.headers.authorization
    : socket.context.Authorization

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    return decoded.userId
  }

  if (requireAuth) {
    throw new Error('No auth token was given')
  }

  return null
}

export const createToken = payload =>
  jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN })
