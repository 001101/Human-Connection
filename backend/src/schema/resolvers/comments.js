import { neo4jgraphql } from 'neo4j-graphql-js'
import { UserInputError } from 'apollo-server'

const NO_POST_ERR_MESSAGE = 'Comment cannot be created without a post!'

export default {
  Mutation: {
    CreateComment: async (object, params, context, resolveInfo) => {
      const { postId } = params
      // Adding relationship from comment to post by passing in the postId,
      // but we do not want to create the comment with postId as an attribute
      // because we use relationships for this. So, we are deleting it from params
      // before comment creation.
      delete params.postId

      const session = context.driver.session()
      const postQueryRes = await session.run(
        `
        MATCH (post:Post {id: $postId})
        RETURN post`,
        {
          postId,
        },
      )
      const [post] = postQueryRes.records.map(record => {
        return record.get('post')
      })

      if (!post) {
        throw new UserInputError(NO_POST_ERR_MESSAGE)
      }
      const comment = await neo4jgraphql(object, params, context, resolveInfo, false)

      await session.run(
        `
        MATCH (post:Post {id: $postId}), (comment:Comment {id: $commentId}), (author:User {id: $userId})
        MERGE (post)<-[:COMMENTS]-(comment)<-[:WROTE]-(author)
        RETURN post`,
        {
          userId: context.user.id,
          postId,
          commentId: comment.id,
        },
      )
      session.close()

      return comment
    },
    UpdateComment: async (object, params, context, resolveInfo) => {
      await neo4jgraphql(object, params, context, resolveInfo, false)
    },
    DeleteComment: async (object, params, context, resolveInfo) => {
      const comment = await neo4jgraphql(object, params, context, resolveInfo, false)

      return comment
    },
  },
}
