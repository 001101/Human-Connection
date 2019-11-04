import { createTestClient } from 'apollo-server-testing'
import Factory from '../../seed/factories'
import { gql } from '../../jest/helpers'
import { neode as getNeode, getDriver } from '../../bootstrap/neo4j'
import createServer from '../../server'

const factory = Factory()
const neode = getNeode()
const driver = getDriver()

let query,
  mutate,
  authenticatedUser,
  disableVariables,
  // enableVariables,
  resourceVariables,
  moderator,
  nonModerator

const decideMutation = gql`
  mutation($resourceId: ID!, $disable: Boolean, $closed: Boolean) {
    decide(resourceId: $resourceId, disable: $disable, closed: $closed) {
      post {
        id
      }
      comment {
        id
      }
    }
  }
`
const enableMutation = gql`
  mutation($id: ID!) {
    enable(id: $id)
  }
`

const commentQuery = gql`
  query($id: ID!) {
    Comment(id: $id) {
      id
      disabled
      decidedByModerator {
        id
      }
    }
  }
`

const postQuery = gql`
  query($id: ID) {
    Post(id: $id) {
      id
      disabled
      decidedByModerator {
        id
      }
    }
  }
`

describe('moderate resources', () => {
  beforeAll(() => {
    authenticatedUser = undefined
    const { server } = createServer({
      context: () => {
        return {
          driver,
          neode,
          user: authenticatedUser,
        }
      },
    })
    mutate = createTestClient(server).mutate
    query = createTestClient(server).query
  })

  beforeEach(async () => {
    resourceVariables = {
      id: 'undefined-resource',
    }
    disableVariables = {
      resourceId: 'undefined-resource',
      disable: true,
      closed: false,
    }
    // enableVariables = {
    //   resourceId: 'undefined-resource',
    //   disable: false,
    //   closed: false,
    // }
    authenticatedUser = null
    moderator = await factory.create('User', {
      id: 'moderator-id',
      name: 'Moderator',
      email: 'moderator@example.org',
      password: '1234',
      role: 'moderator',
    })
  })

  afterEach(async () => {
    await factory.cleanDatabase()
  })

  describe('decide to disable', () => {
    describe('unauthenticated', () => {
      it('throws authorization error', async () => {
        await expect(
          mutate({ mutation: decideMutation, variables: disableVariables }),
        ).resolves.toMatchObject({
          errors: [{ message: 'Not Authorised!' }],
        })
      })
    })

    describe('authenticated', () => {
      describe('non moderator', () => {
        beforeEach(async () => {
          nonModerator = await factory.create('User', {
            id: 'non-moderator',
            name: 'Non Moderator',
            email: 'non.moderator@example.org',
            password: '1234',
          })
          authenticatedUser = await nonModerator.toJson()
        })

        it('throws authorization error', async () => {
          await expect(
            mutate({ mutation: decideMutation, variables: disableVariables }),
          ).resolves.toMatchObject({
            errors: [{ message: 'Not Authorised!' }],
          })
        })
      })

      describe('moderator', () => {
        beforeEach(async () => {
          authenticatedUser = await moderator.toJson()
        })

        describe('moderate a resource that is not a (Comment|Post|User) ', () => {
          beforeEach(async () => {
            disableVariables = {
              ...disableVariables,
              resourceId: 'sample-tag-id',
            }
            await factory.create('Tag', { id: 'sample-tag-id' })
          })

          it('returns null', async () => {
            await expect(
              mutate({ mutation: decideMutation, variables: disableVariables }),
            ).resolves.toMatchObject({
              data: { decide: null },
            })
          })
        })

        describe('moderate a comment', () => {
          beforeEach(async () => {
            // Wolle variables = {}
            await factory.create('Comment', {
              id: 'comment-id',
            })
          })

          it('returns disabled resource id', async () => {
            disableVariables = {
              ...disableVariables,
              resourceId: 'comment-id',
            }
            await expect(
              mutate({ mutation: decideMutation, variables: disableVariables }),
            ).resolves.toMatchObject({
              data: { decide: { comment: { id: 'comment-id' } } },
              errors: undefined,
            })
          })

          it('changes .decidedByModerator', async () => {
            resourceVariables = {
              id: 'comment-id',
            }
            disableVariables = {
              ...disableVariables,
              resourceId: 'comment-id',
            }
            const before = { data: { Comment: [{ id: 'comment-id', decidedByModerator: null }] } }
            const expected = {
              data: { Comment: [{ id: 'comment-id', decidedByModerator: { id: 'moderator-id' } }] },
            }
            await expect(
              query({ query: commentQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(before)
            await expect(
              mutate({ mutation: decideMutation, variables: disableVariables }),
            ).resolves.toMatchObject({
              data: { decide: { comment: { id: 'comment-id' } } },
            })
            await expect(
              query({ query: commentQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(expected)
          })

          it('updates .disabled on comment', async () => {
            resourceVariables = {
              id: 'comment-id',
            }
            disableVariables = {
              ...disableVariables,
              resourceId: 'comment-id',
            }
            const before = { data: { Comment: [{ id: 'comment-id', disabled: false }] } }
            const expected = { data: { Comment: [{ id: 'comment-id', disabled: true }] } }

            await expect(
              query({ query: commentQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(before)
            await expect(
              mutate({ mutation: decideMutation, variables: disableVariables }),
            ).resolves.toMatchObject({
              data: { decide: { comment: { id: 'comment-id' } } },
            })
            await expect(
              query({ query: commentQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(expected)
          })
        })

        describe('moderate a post', () => {
          beforeEach(async () => {
            await factory.create('Post', {
              id: 'sample-post-id',
            })
          })

          it('returns disabled resource id', async () => {
            disableVariables = {
              ...disableVariables,
              resourceId: 'sample-post-id',
            }
            await expect(
              mutate({ mutation: decideMutation, variables: disableVariables }),
            ).resolves.toMatchObject({
              data: { decide: { post: { id: 'sample-post-id' } } },
            })
          })

          it('changes .decidedByModerator', async () => {
            resourceVariables = {
              id: 'sample-post-id',
            }
            disableVariables = {
              ...disableVariables,
              resourceId: 'sample-post-id',
            }
            const before = { data: { Post: [{ id: 'sample-post-id', decidedByModerator: null }] } }
            const expected = {
              data: {
                Post: [{ id: 'sample-post-id', decidedByModerator: { id: 'moderator-id' } }],
              },
            }

            await expect(
              query({ query: postQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(before)
            await expect(
              mutate({ mutation: decideMutation, variables: disableVariables }),
            ).resolves.toMatchObject({
              data: { decide: { post: { id: 'sample-post-id' } } },
            })
            await expect(
              query({ query: postQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(expected)
          })

          it('updates .disabled on post', async () => {
            resourceVariables = {
              id: 'sample-post-id',
            }
            disableVariables = {
              ...disableVariables,
              resourceId: 'sample-post-id',
            }
            const before = { data: { Post: [{ id: 'sample-post-id', disabled: false }] } }
            const expected = { data: { Post: [{ id: 'sample-post-id', disabled: true }] } }

            await expect(
              query({ query: postQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(before)
            await expect(
              mutate({ mutation: decideMutation, variables: disableVariables }),
            ).resolves.toMatchObject({
              data: { decide: { post: { id: 'sample-post-id' } } },
            })
            await expect(
              query({ query: postQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(expected)
          })
        })
      })
    })
  })

  describe('enable', () => {
    describe('unautenticated user', () => {
      it('throws authorization error', async () => {
        resourceVariables = { id: 'sample-post-id' }
        await expect(
          mutate({ mutation: enableMutation, variables: resourceVariables }),
        ).resolves.toMatchObject({
          errors: [{ message: 'Not Authorised!' }],
        })
      })
    })

    describe('authenticated user', () => {
      describe('non moderator', () => {
        beforeEach(async () => {
          nonModerator = await factory.create('User', {
            id: 'non-moderator',
            name: 'Non Moderator',
            email: 'non.moderator@example.org',
            password: '1234',
          })
          authenticatedUser = await nonModerator.toJson()
        })

        it('throws authorization error', async () => {
          resourceVariables = { id: 'sample-post-id' }
          await expect(
            mutate({ mutation: enableMutation, variables: resourceVariables }),
          ).resolves.toMatchObject({
            errors: [{ message: 'Not Authorised!' }],
          })
        })
      })

      describe('moderator', () => {
        beforeEach(async () => {
          authenticatedUser = await moderator.toJson()
        })

        describe('moderate a resource that is not a (Comment|Post|User) ', () => {
          beforeEach(async () => {
            await Promise.all([factory.create('Tag', { id: 'sample-tag-id' })])
          })

          it('returns null', async () => {
            await expect(
              mutate({ mutation: enableMutation, variables: { id: 'sample-tag-id' } }),
            ).resolves.toMatchObject({
              data: { enable: null },
            })
          })
        })

        describe('moderate a comment', () => {
          beforeEach(async () => {
            disableVariables = {
              ...disableVariables,
              resourceId: 'comment-id',
            }
            resourceVariables = {
              id: 'comment-id',
            }
            await factory.create('Comment', {
              id: 'comment-id',
            })
            await mutate({ mutation: decideMutation, variables: disableVariables })
          })

          it('returns enabled resource id', async () => {
            await expect(
              mutate({ mutation: enableMutation, variables: resourceVariables }),
            ).resolves.toMatchObject({
              data: { enable: 'comment-id' },
              errors: undefined,
            })
          })

          it('changes .decidedByModerator', async () => {
            const expected = {
              data: { Comment: [{ id: 'comment-id', decidedByModerator: { id: 'moderator-id' } }] },
              errors: undefined,
            }
            await expect(
              mutate({ mutation: enableMutation, variables: resourceVariables }),
            ).resolves.toMatchObject({
              data: { enable: 'comment-id' },
              errors: undefined,
            })
            await expect(
              query({ query: commentQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(expected)
          })

          it('updates .disabled on comment', async () => {
            const expected = {
              data: { Comment: [{ id: 'comment-id', disabled: false }] },
              errors: undefined,
            }

            await expect(
              mutate({ mutation: enableMutation, variables: resourceVariables }),
            ).resolves.toMatchObject({
              data: { enable: 'comment-id' },
              errors: undefined,
            })
            await expect(
              query({ query: commentQuery, variables: resourceVariables }),
            ).resolves.toMatchObject(expected)
          })
        })

        describe('moderate a post', () => {
          beforeEach(async () => {
            resourceVariables = { id: 'post-id' }
            disableVariables = {
              ...disableVariables,
              resourceId: 'post-id',
            }
            resourceVariables = {
              id: 'post-id',
            }
            await factory.create('Post', {
              id: 'post-id',
            })
            await mutate({ mutation: decideMutation, variables: disableVariables })
          })

          it('returns enabled resource id', async () => {
            await expect(mutate({ mutation: enableMutation, variables: resourceVariables })).resolves.toMatchObject({
              data: { enable: 'post-id' },
              errors: undefined,
            })
          })

          it('changes .decidedByModerator', async () => {
            const expected = {
              data: { Post: [{ id: 'post-id', decidedByModerator: { id: 'moderator-id' } }] },
              errors: undefined,
            }
            await expect(mutate({ mutation: enableMutation, variables: resourceVariables })).resolves.toMatchObject({
              data: { enable: 'post-id' },
              errors: undefined,
            })
            await expect(query({ query: postQuery, variables: resourceVariables })).resolves.toMatchObject(expected)
          })

          it('updates .disabled on post', async () => {
            const expected = {
              data: { Post: [{ id: 'post-id', disabled: false }] },
              errors: undefined,
            }

            await expect(mutate({ mutation: enableMutation, variables: resourceVariables })).resolves.toMatchObject({
              data: { enable: 'post-id' },
              errors: undefined,
            })
            await expect(query({ query: postQuery, variables: resourceVariables })).resolves.toMatchObject(expected)
          })
        })
      })
    })
  })
})
