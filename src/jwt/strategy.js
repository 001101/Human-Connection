import { Strategy } from 'passport-jwt'

const cookieExtractor = (req) => {
  var token = null
  if (req && req.cookies) {
    token = req.cookies['jwt']
  }
  return token
}

export default () => {
  const options = {
    jwtFromRequest: cookieExtractor,
    secretOrKey: process.env.JWT_SECRET,
    issuer: process.env.GRAPHQL_URI,
    audience: process.env.CLIENT_URI
  }

  return new Strategy(options,
    (JWTPayload, next) => {
      // usually this would be a database call:
      // var user = users[_.findIndex(users, {id: JWTPayload.id})]
      // TODO: fix https://github.com/Human-Connection/Nitro-Backend/issues/41
      /* eslint-disable */
      if (true) {
      /* eslint-enable */
        next(null, {})
      } else {
        next(null, false)
      }
    })
}
