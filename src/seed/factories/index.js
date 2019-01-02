import ApolloClient from 'apollo-client'
import gql from 'graphql-tag'
import dotenv from 'dotenv'
import { HttpLink } from 'apollo-link-http'
import { InMemoryCache } from 'apollo-cache-inmemory'
import neo4j from '../../bootstrap/neo4j'
import { query } from '../../graphql-schema'
import fetch from 'node-fetch'

dotenv.config()

if (process.env.NODE_ENV === 'production') {
  throw new Error('YOU CAN`T RUN FACTORIES IN PRODUCTION MODE')
}

const client = new ApolloClient({
  link: new HttpLink({ uri: process.env.GRAPHQL_URI, fetch }),
  cache: new InMemoryCache()
})

const driver = neo4j().getDriver()
const session = driver.session()

const builders = {
  'user': require('./users.js').default
}

const buildMutation = (model, parameters) => {
  return builders[model](parameters)
}

const create = async (model, parameters) => {
  await client.mutate({ mutation: gql(buildMutation(model, parameters)) })
}

const cleanDatabase = async () => {
  await query('MATCH (n) DETACH DELETE n', session)
}

export {
  create,
  buildMutation,
  cleanDatabase
}
