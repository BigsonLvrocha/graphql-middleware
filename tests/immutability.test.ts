import { makeExecutableSchema } from '@graphql-tools/schema'
import { GraphQLSchema, graphql } from 'graphql'
import { applyMiddleware, IMiddleware } from '../src'

type Context = {
  middlewareCalled: boolean
}

test('immutable', async () => {
  const typeDefs = `
    type Query {
      test: Boolean!
    }
  `
  const resolvers = {
    Query: {
      test: (_: unknown, __: unknown, ctx: Context) => ctx.middlewareCalled,
    },
  }

  const middleware: IMiddleware = (
    resolve,
    parent,
    args,
    ctx: Context,
    info,
  ) => {
    ctx.middlewareCalled = true
    return resolve(parent, args, { ...ctx, middlewareCalled: true }, info)
  }
  const middlewares = {
    Query: {
      test: middleware,
    },
  }

  const schema = makeExecutableSchema({ typeDefs, resolvers })
  const schemaWithMiddlewares = applyMiddleware(schema, middlewares)

  const query = `
    query TestQuery {
      test
    }
  `

  const responseWithMiddleware = await graphql(
    schemaWithMiddlewares,
    query,
    {},
    { middlewareCalled: false },
    {},
  )
  expect(responseWithMiddleware.errors).toBeUndefined()
  expect(responseWithMiddleware.data!.test).toEqual(true)

  const responseWihoutMiddleware = await graphql(
    schema,
    query,
    {},
    { middlewareCalled: false },
    {},
  )
  expect(responseWihoutMiddleware.errors).toBeUndefined()
  expect(responseWihoutMiddleware.data!.test).toEqual(false)
})