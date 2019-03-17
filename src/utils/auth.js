import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const { JWT_SECRET } = process.env
const { TOKEN_EXPIRES_IN } = process.env

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

export const hashPassword = async password => {
  if (password.length < 8) {
    throw new Error('Password must be 8 characters or longer.')
  }

  return bcrypt.hash(password, 10)
}

export const comparePassword = bcrypt.compare
