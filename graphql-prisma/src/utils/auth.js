import jwt from 'jsonwebtoken'

const JWT_SECRET = 'thisisasecret'

export const getUserId = request => {
  const { request: parsedRequest } = request
  const authHeader = parsedRequest.headers.authorization

  if (!authHeader) {
    throw new Error('No auth token was given')
  }

  const token = authHeader.replace('Bearer ', '')
  const decoded = jwt.verify(token, JWT_SECRET)

  return decoded.userId
}

export const createToken = payload => jwt.sign(payload, JWT_SECRET)
