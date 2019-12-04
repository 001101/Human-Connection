const resourceTypes = ['Post', 'Comment']

const transformReturnType = record => {
  return {
    ...record.get('notification').properties,
    from: {
      __typename: record.get('resource').labels.find(l => resourceTypes.includes(l)),
      ...record.get('resource').properties,
    },
    to: {
      ...record.get('user').properties,
    },
  }
}

export default {
  Query: {
    notifications: async (_parent, args, context, _resolveInfo) => {
      const { user: currentUser } = context
      const session = context.driver.session()
      let whereClause, orderByClause

      switch (args.read) {
        case true:
          whereClause = 'WHERE notification.read = TRUE'
          break
        case false:
          whereClause = 'WHERE notification.read = FALSE'
          break
        default:
          whereClause = ''
      }
      switch (args.orderBy) {
        case 'updatedAt_asc':
          orderByClause = 'ORDER BY notification.updatedAt ASC'
          break
        case 'updatedAt_desc':
          orderByClause = 'ORDER BY notification.updatedAt DESC'
          break
        default:
          orderByClause = ''
      }
      const offset = args.offset && typeof args.offset === 'number' ? `SKIP ${args.offset}` : ''
      const limit = args.first && typeof args.first === 'number' ? `LIMIT ${args.first}` : ''
      const cypher = `
        MATCH (resource {deleted: false, disabled: false})-[notification:NOTIFIED]->(user:User {id:$id})
        ${whereClause}
        RETURN resource, notification, user
        ${orderByClause}
        ${offset} ${limit}
        `
      try {
        const result = await session.run(cypher, { id: currentUser.id })
        return result.records.map(transformReturnType)
      } finally {
        session.close()
      }
    },
  },
  Mutation: {
    markAsRead: async (parent, args, context, resolveInfo) => {
      const { user: currentUser } = context
      const session = context.driver.session()
      try {
        const cypher = `
        MATCH (resource {id: $resourceId})-[notification:NOTIFIED {read: FALSE}]->(user:User {id:$id})
        SET notification.read = TRUE
        RETURN resource, notification, user
        `
        const result = await session.run(cypher, { resourceId: args.id, id: currentUser.id })
        const notifications = await result.records.map(transformReturnType)
        return notifications[0]
      } finally {
        session.close()
      }
    },
  },
  NOTIFIED: {
    id: async parent => {
      // serialize an ID to help the client update the cache
      return `${parent.reason}/${parent.from.id}/${parent.to.id}`
    },
  },
}
