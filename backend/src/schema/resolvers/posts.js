import uuid from 'uuid/v4'
import fileUpload from './fileUpload'

export default {
  Mutation: {
    UpdatePost: async (object, params, context, resolveInfo) => {
      const { categoryIds } = params
      delete params.categoryIds
      params = await fileUpload(params, { file: 'imageUpload', url: 'image' })
      const session = context.driver.session()
      const cypherDeletePreviousRelations = `
        MATCH (post:Post { id: $params.id })-[previousRelations:CATEGORIZED]->(category:Category)
        DELETE previousRelations
        RETURN post, category
      `

      await session.run(cypherDeletePreviousRelations, { params })

      let updatePostCypher = `MATCH (post:Post {id: $params.id})
      SET post = $params
      `
      if (categoryIds && categoryIds.length) {
        updatePostCypher += `WITH post
        UNWIND $categoryIds AS categoryId
        MATCH (category:Category {id: categoryId})
        MERGE (post)-[:CATEGORIZED]->(category)
        `
      }
      updatePostCypher += `RETURN post`
      const updatePostVariables = { categoryIds, params }

      const transactionRes = await session.run(updatePostCypher, updatePostVariables)
      const [post] = transactionRes.records.map(record => {
        return record.get('post')
      })

      session.close()

      return post.properties
    },

    CreatePost: async (object, params, context, resolveInfo) => {
      const { categoryIds } = params
      delete params.categoryIds
      params = await fileUpload(params, { file: 'imageUpload', url: 'image' })
      params.id = params.id || uuid()

      let createPostCypher = `CREATE (post:Post {params})
      WITH post
      MATCH (author:User {id: $userId})
      MERGE (post)<-[:WROTE]-(author)
      `
      if (categoryIds) {
        createPostCypher += `WITH post
        UNWIND $categoryIds AS categoryId
        MATCH (category:Category {id: categoryId})
        MERGE (post)-[:CATEGORIZED]->(category)
        `
      }
      createPostCypher += `RETURN post`
      const createPostVariables = { userId: context.user.id, categoryIds, params }

      const session = context.driver.session()
      const transactionRes = await session.run(createPostCypher, createPostVariables)

      const [post] = transactionRes.records.map(record => {
        return record.get('post')
      })

      session.close()

      return post.properties
    },
  },
}
