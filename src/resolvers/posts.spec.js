import Factory from '../seed/factories'
import { GraphQLClient } from 'graphql-request'
import { host, login } from '../jest/helpers'

const factory = Factory()
let client

beforeEach(async () => {
  await factory.create('User', {
    email: 'test@example.org',
    password: '1234'
  })
})

afterEach(async () => {
  await factory.cleanDatabase()
})

describe('CreatePost', () => {
  const mutation = `
    mutation {
      CreatePost(title: "I am a title", content: "Some content") {
        title
        content
        slug
        disabled
        deleted
      }
    }
  `

  describe('unauthenticated', () => {
    it('throws authorization error', async () => {
      client = new GraphQLClient(host)
      await expect(client.request(mutation)).rejects.toThrow('Not Authorised')
    })
  })

  describe('authenticated', () => {
    let headers
    beforeEach(async () => {
      headers = await login({ email: 'test@example.org', password: '1234' })
      client = new GraphQLClient(host, { headers })
    })

    it('creates a post', async () => {
      const expected = {
        CreatePost: {
          title: 'I am a title',
          content: 'Some content'
        }
      }
      await expect(client.request(mutation)).resolves.toMatchObject(expected)
    })

    it('assigns the authenticated user as author', async () => {
      await client.request(mutation)
      const { User } = await client.request(`{
          User(email:"test@example.org") {
            contributions {
              title
            }
          }
        }`, { headers })
      expect(User).toEqual([ { contributions: [ { title: 'I am a title' } ] } ])
    })

    describe('disabled and deleted', () => {
      it('initially false', async () => {
        const expected = { CreatePost: { disabled: false, deleted: false } }
        await expect(client.request(mutation)).resolves.toMatchObject(expected)
      })
    })
  })
})

describe('UpdatePost', () => {
  const mutation = `
    mutation($id: ID!, $content: String) {
      UpdatePost(id: $id, content: $content) {
        id
        content
      }
    }
  `

  let variables = {
    id: 'p1',
    content: 'New content'
  }

  beforeEach(async () => {
    const asAuthor = Factory()
    await asAuthor.create('User', {
      email: 'author@example.org',
      password: '1234'
    })
    await asAuthor.authenticateAs({
      email: 'author@example.org',
      password: '1234'
    })
    await asAuthor.create('Post', {
      id: 'p1',
      content: 'Old content'
    })
  })

  describe('unauthenticated', () => {
    it('throws authorization error', async () => {
      client = new GraphQLClient(host)
      await expect(client.request(mutation, variables)).rejects.toThrow('Not Authorised')
    })
  })

  describe('authenticated but not the author', () => {
    let headers
    beforeEach(async () => {
      headers = await login({ email: 'test@example.org', password: '1234' })
      client = new GraphQLClient(host, { headers })
    })

    it('throws authorization error', async () => {
      await expect(client.request(mutation, variables)).rejects.toThrow('Not Authorised')
    })
  })

  describe('authenticated as author', () => {
    let headers
    beforeEach(async () => {
      headers = await login({ email: 'author@example.org', password: '1234' })
      client = new GraphQLClient(host, { headers })
    })

    it('updates a post', async () => {
      const expected = { UpdatePost: { id: 'p1', content: 'New content' } }
      await expect(client.request(mutation, variables)).resolves.toEqual(expected)
    })
  })
})

describe('DeletePost', () => {
  const mutation = `
    mutation($id: ID!) {
      DeletePost(id: $id) {
        id
        content
      }
    }
  `

  let variables = {
    id: 'p1'
  }

  beforeEach(async () => {
    const asAuthor = Factory()
    await asAuthor.create('User', {
      email: 'author@example.org',
      password: '1234'
    })
    await asAuthor.authenticateAs({
      email: 'author@example.org',
      password: '1234'
    })
    await asAuthor.create('Post', {
      id: 'p1',
      content: 'To be deleted'
    })
  })

  describe('unauthenticated', () => {
    it('throws authorization error', async () => {
      client = new GraphQLClient(host)
      await expect(client.request(mutation, variables)).rejects.toThrow('Not Authorised')
    })
  })

  describe('authenticated but not the author', () => {
    let headers
    beforeEach(async () => {
      headers = await login({ email: 'test@example.org', password: '1234' })
      client = new GraphQLClient(host, { headers })
    })

    it('throws authorization error', async () => {
      await expect(client.request(mutation, variables)).rejects.toThrow('Not Authorised')
    })
  })

  describe('authenticated as author', () => {
    let headers
    beforeEach(async () => {
      headers = await login({ email: 'author@example.org', password: '1234' })
      client = new GraphQLClient(host, { headers })
    })

    it('deletes a post', async () => {
      const expected = { DeletePost: { id: 'p1', content: 'To be deleted' } }
      await expect(client.request(mutation, variables)).resolves.toEqual(expected)
    })
  })
})




describe('AddPostDisabledBy', () => {
  const setup = async (params = {}) => {
    await factory.create('User', {email: 'author@example.org', password: '1234'})
    await factory.authenticateAs({email: 'author@example.org', password: '1234'})
    await factory.create('Post', {
      id: 'p9' // that's the ID we will look for
    })

    let headers = {}
    const { email, password } = params
    if (email && password) {
      const user = await factory.create('User', params)
      headers = await login({email, password})
    }
    client = new GraphQLClient(host, { headers })
  }

  const mutation = `
    mutation {
      AddPostDisabledBy(from: { id: "u7" }, to: { id: "p9" }) {
        from {
          id
        }
        to {
          id
        }
      }
    }
  `

  it('throws authorization error', async () => {
    await setup()
    await expect(client.request(mutation)).rejects.toThrow('Not Authorised')
  })

  describe('authenticated', () => {
    it('throws authorization error', async () => {
      await setup({
        email: 'someUser@example.org',
        password: '1234'
      })
      await expect(client.request(mutation)).rejects.toThrow('Not Authorised')
    })

    describe('as moderator', () => {
      it('throws authorization error', async () => {
        await setup({
          email: 'attributedUserMismatch@example.org',
          password: '1234',
          role: 'moderator'
        })
        await expect(client.request(mutation)).rejects.toThrow('Not Authorised')
      })

      describe('current user matches provided user', () => {
        beforeEach(async () => {
          await setup({
            id: 'u7',
            email: 'moderator@example.org',
            password: '1234',
            role: 'moderator'
          })
        })

        it('returns created relation', async () => {
          const expected = {
            AddPostDisabledBy: {
              from: { id: 'u7' },
              to: { id: 'p9' }
            }
          }
          await expect(client.request(mutation)).resolves.toEqual(expected)
        })

        it('sets current user', async () => {
          await client.request(mutation)
          const query = `{ Post(disabled: true) { id,  disabledBy { id } } }`
          const expected = { Post: [{ id: 'p9', disabledBy: { id: 'u7' } }] }
          await expect(client.request(query)).resolves.toEqual(expected)
        })

        it('updates .disabled on post', async () => {
          const before = { Post: [ { id: 'p9', disabled: false } ] }
          const expected = { Post: [ { id: 'p9', disabled: true } ] }

          await expect(client.request(
            `{ Post { id disabled } }`
          )).resolves.toEqual(before)
          await client.request(mutation) // this updates .disabled
          await expect(client.request(
            `{ Post(disabled: true) { id disabled } }`
          )).resolves.toEqual(expected)
        })
      })
    })
  })
})

describe('RemovePostDisabledBy', () => {
  const setup = async (params = {}) => {
    await factory.create('User', {email: 'anotherModerator@example.org', password: '1234', id: 'u123', role: 'moderator'})
    await factory.authenticateAs({email: 'anotherModerator@example.org', password: '1234'})
    await factory.create('Post', {
      id: 'p9' // that's the ID we will look for
    })
    await factory.relate('Post', 'DisabledBy', {
      from: 'u123',
      to: 'p9'
    }) // that's we want to delete

    let headers = {}
    const { email, password } = params
    if (email && password) {
      const user = await factory.create('User', params)
      headers = await login({email, password})
    }
    client = new GraphQLClient(host, { headers })
  }

  const mutation = `
      mutation {
        RemovePostDisabledBy(from: { id: "u7" }, to: { id: "p9" }) {
          from {
            id
          }
          to {
            id
          }
        }
      }
    `

  it('throws authorization error', async () => {
    await setup()
    await expect(client.request(mutation)).rejects.toThrow('Not Authorised')
  })

  describe('authenticated', () => {
    it('throws authorization error', async () => {
      await setup({
        email: 'someUser@example.org',
        password: '1234'
      })
      await expect(client.request(mutation)).rejects.toThrow('Not Authorised')
    })

    describe('as moderator', () => {
      it('throws authorization error', async () => {
        await setup({
          role: 'moderator',
          email: 'someUser@example.org',
          password: '1234'
        })
        await expect(client.request(mutation)).rejects.toThrow('Not Authorised')
      })

      describe('current user matches provided user', () => {
        beforeEach(async () => {
          await setup({
            id: 'u7',
            role: 'moderator',
            email: 'someUser@example.org',
            password: '1234'
          })
        })

        it('returns deleted relation', async () => {
          const expected = {
            RemovePostDisabledBy: {
              from: { id: 'u7' },
              to: { id: 'p9' }
            }
          }
          await expect(client.request(mutation)).resolves.toEqual(expected)
        })

        it('updates .disabled on post', async () => {
          const before = { Post: [ { id: 'p9', disabled: true } ] }
          const expected = { Post: [ { id: 'p9', disabled: false } ] }

          await expect(client.request(
            `{ Post(disabled: true) { id disabled } }`
          )).resolves.toEqual(before)
          await client.request(mutation) // this updates .disabled
          await expect(client.request(
            `{ Post { id disabled } }`
          )).resolves.toEqual(expected)
        })
      })
    })
  })
})
