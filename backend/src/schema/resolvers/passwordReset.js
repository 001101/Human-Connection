import uuid from 'uuid/v4'
import bcrypt from 'bcryptjs'

export async function createPasswordReset(options) {
  const { driver, code, email, issuedAt = new Date() } = options
  const session = driver.session()
  const cypher = `
      MATCH (u:User) WHERE u.email = $email
      CREATE(pr:PasswordReset {code: $code, issuedAt: datetime($issuedAt), usedAt: NULL})
      MERGE (u)-[:REQUESTED]->(pr)
      RETURN pr
      `
  const transactionRes = await session.run(cypher, { issuedAt: issuedAt.toISOString(), code, email })
  const resets = transactionRes.records.map(record => record.get('pr'))
  session.close()
  return resets
}

export default {
  Mutation: {
    requestPasswordReset: async (_, { email }, { driver }) => {
      const code = uuid().substring(0,6)
      await createPasswordReset({ driver, code, email })
      return true
    },
    resetPassword: async (_, { email, code, newPassword }, { driver }) => {
      const session = driver.session()
      const stillValid = new Date()
      stillValid.setDate(stillValid.getDate() - 1)
      const newHashedPassword = await bcrypt.hashSync(newPassword, 10)
      const cypher = `
      MATCH (r:PasswordReset {code: $code})
      MATCH (u:User {email: $email})-[:REQUESTED]->(r)
      WHERE duration.between(r.issuedAt, datetime()).days <= 0 AND r.usedAt IS NULL
      SET r.usedAt = datetime()
      SET u.password = $newHashedPassword
      RETURN r
      `
      let transactionRes = await session.run(cypher, { stillValid, email, code, newHashedPassword })
      const [reset] = transactionRes.records.map(record => record.get('r'))
      const result = !!(reset && reset.properties.usedAt)
      session.close()
      return result
    },
  },
}
