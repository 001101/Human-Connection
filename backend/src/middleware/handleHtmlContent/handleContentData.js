import extractMentionedUsers from './notifications/extractMentionedUsers'
import extractHashtags from './hashtags/extractHashtags'

const notifyMentionOfPost = async (postId, idsOfMentionedUsers, context) => {
  if (!idsOfMentionedUsers.length) return

  const session = context.driver.session()
  const createdAt = new Date().toISOString()
  const cypher = `
    MATCH (u: User) WHERE u.id IN $idsOfMentionedUsers
    MATCH (p: Post) WHERE p.id = $postId
    CREATE (n: Notification { id: apoc.create.uuid(), read: false, createdAt: $createdAt })
    MERGE (n)-[:NOTIFIED]->(u)
    MERGE (p)-[:NOTIFIED]->(n)
    `
  await session.run(cypher, {
    idsOfMentionedUsers,
    createdAt,
    postId,
  })
  session.close()
}

const notifyMentionOfComment = async (commentId, idsOfMentionedUsers, context) => {
  if (!idsOfMentionedUsers.length) return

  const session = context.driver.session()
  const createdAt = new Date().toISOString()
  const cypher = `
    MATCH (u: User) WHERE u.id in $idsOfMentionedUsers
    MATCH (c: Comment) WHERE c.id = $commentId
    CREATE (n: Notification { id: apoc.create.uuid(), read: false, createdAt: $createdAt })
    MERGE (n)-[:NOTIFIED]->(u)
    MERGE (c)-[:NOTIFIED]->(n)
    `
  await session.run(cypher, {
    idsOfMentionedUsers,
    createdAt,
    commentId,
  })
  session.close()
}

const updateHashtagsOfPost = async (postId, hashtags, context) => {
  if (!hashtags.length) return

  const session = context.driver.session()
  // We need two Cypher statements, because the 'MATCH' in the 'cypherDeletePreviousRelations' statement
  //  functions as an 'if'. In case there is no previous relation, the rest of the commands are omitted
  //  and no new Hashtags and relations will be created.
  const cypherDeletePreviousRelations = `
    MATCH (p: Post { id: $postId })-[previousRelations: TAGGED]->(t: Tag)
    DELETE previousRelations
    RETURN p, t
    `
  const cypherCreateNewTagsAndRelations = `
    MATCH (p: Post { id: $postId})
    UNWIND $hashtags AS tagName
    MERGE (t: Tag { id: tagName, name: tagName, disabled: false, deleted: false })
    MERGE (p)-[:TAGGED]->(t)
    RETURN p, t
    `
  await session.run(cypherDeletePreviousRelations, {
    postId,
  })
  await session.run(cypherCreateNewTagsAndRelations, {
    postId,
    hashtags,
  })
  session.close()
}

const handleContentDataOfPost = async (resolve, root, args, context, resolveInfo) => {
  // extract user ids before xss-middleware removes classes via the following "resolve" call
  const idsOfMentionedUsers = extractMentionedUsers(args.content)
  // extract tag (hashtag) ids before xss-middleware removes classes via the following "resolve" call
  const hashtags = extractHashtags(args.content)

  // removes classes from the content
  const post = await resolve(root, args, context, resolveInfo)

  await notifyMentionOfPost(post.id, idsOfMentionedUsers, context)
  await updateHashtagsOfPost(post.id, hashtags, context)

  return post
}

const handleContentDataOfComment = async (resolve, root, args, context, resolveInfo) => {
  // extract user ids before xss-middleware removes classes via the following "resolve" call
  const idsOfMentionedUsers = extractMentionedUsers(args.content)

  // removes classes from the content
  const comment = await resolve(root, args, context, resolveInfo)

  await notifyMentionOfComment(comment.id, idsOfMentionedUsers, context)

  return comment
}

export default {
  Mutation: {
    CreatePost: handleContentDataOfPost,
    UpdatePost: handleContentDataOfPost,
    CreateComment: handleContentDataOfComment,
    //UpdateComment: handleContentDataOfComment,
  },
}