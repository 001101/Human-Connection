import { neo4jgraphql } from 'neo4j-graphql-js'

export default {
  Query: {
    notifications: async (parent, args, context, resolveInfo) => {
      const { user, driver } = context
      let session
      let notifications
      let whereClause
      let orderByClause
      switch(args.read) {
        case true:
          whereClause = 'WHERE notification.read = TRUE'
          break;
        case false:
          whereClause = 'WHERE notification.read = FALSE'
          break;
        default:
          whereClause = ''
      }
      switch(args.orderBy) {
        case 'createdAt_asc':
          orderByClause = 'ORDER BY notification.createdAt ASC'
          break;
        case 'createdAt_desc':
          orderByClause = 'ORDER BY notification.createdAt DESC'
          break;
        default:
          orderByClause = ''
      }

      try {
        session = context.driver.session()
        const cypher = `
        MATCH (resource)-[notification:NOTIFIED]->(user:User {id:$id})
        ${whereClause}
        RETURN resource, notification, user
        ${orderByClause}
        `
        const result = await session.run(cypher, { id: user.id })
        const resourceTypes = ['Post', 'Comment']
        notifications = await result.records.map(record => {
          return {
            ...record.get('notification').properties,
            from: {
              __typename: record.get('resource').labels.find(l => resourceTypes.includes(l)),
              ...record.get('resource').properties
            },
            to: {
              __typename: 'User',
              ...record.get('user').properties,
            }
          }
        })
      } finally {
        session.close()
      }
      return notifications
    },
  },
  Mutation: {
    markAsRead: async (parent, params, context, resolveInfo) => {
      return null
    }
  },
}
