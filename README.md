# GraphQL Bootcamp - Pagination and Sorting

- [Pagination and Sorting](#pagination-and-sorting)
  - [Pagination in the database schema](#pagination-in-the-database-schema)
      - [Offset based pagination](#offset-based-pagination)
      - [Cursor based pagination](#cursor-based-pagination)
  - [Pagination in the application schema](#pagination-in-the-application-schema)
      - [Changes to our schema](#changes-to-our-schema)

## Pagination and Sorting

Pagination and sorting are key functionalities of production-ready applications. As the number of records in our database grows, limiting and sorting the records becomes a must. I won't explain the basics of pagination here ([this article is nice though](https://slack.engineering/evolving-api-pagination-at-slack-1c1f644f8e12)). My goal is simply to state some of the solutions Prisma offers us for solving pagination issues and how we can use them.

### Pagination in the database schema

In the database schema, [Prisma gives us different pagination approaches](https://www.prisma.io/docs/prisma-graphql-api/reference/queries-qwe1/#pagination) to work with lists of results.

The available query arguments look like this for the `User` type defined in `datamodel.prisma`:

```graphql
users(
  where: UserWhereInput
  orderBy: UserOrderByInput
  skip: Int
  after: String
  before: String
  first: Int
  last: Int
): [User]!
```

#### Offset based pagination

We can do offset based pagination by using the `first` and `skip` arguments provided by Prisma. We can also do reverse based pagination with the `last` argument. Cool!

#### Cursor based pagination

Prisma also supports cursor based pagination. Normally, cursors reference properly indexed columns at the database level, enabling more efficient queries. Apart from that, it doesn't have one of the caveats offset based pagination has: **offset based pagination can skip or return duplicate results if the database has a high write access given the page window reference is lost**.

Prisma gives us the [`after` and `before` arguments](https://www.prisma.io/docs/prisma-graphql-api/reference/queries-qwe1/#seeking-forward-and-backward-with-first-and-last) for specifying our cursor. `after` is used for specifying our starting node and should only be used together with `first`. `before` is also used for specifying our starting node, but should only be used together with `last`. The docs referenced above have nice examples on the proper usage of the `first`, `last`, `after`, `before` and `skip` arguments. 

### Pagination in the application schema

Our application schema should leverage what is relevant for our domain needs. Given that, reverse based pagination isn't that necessary and we'll leave it alone.

Unfortunately, ordering capabilities aren't full blown yet (check out [1](https://github.com/prisma/prisma/issues/62) and [2](https://github.com/prisma/prisma/issues/95)). We wait patiently for these two very important features!

#### Changes to our schema

Most of our queries were altered to support pagination. Custom inputs were created to keep the schema DRY:

<details><summary><code>schema.graphql</code></summary>
<p>

```graphql
type Query {
  users(
    query: String
    page: SimplePaginationInput
    cursor: CursorPaginationInput
  ): [User!]!
  posts(
    query: String
    page: SimplePaginationInput
    cursor: CursorPaginationInput
  ): [Post!]!
  myPosts(
    query: String
    page: SimplePaginationInput
    cursor: CursorPaginationInput
  ): [Post!]!
  comments(
    page: SimplePaginationInput
    cursor: CursorPaginationInput
  ): [Comment!]!
  me: User!
  post(id: ID!): Post!
}

...

input SimplePaginationInput {
  first: Int!
  skip: Int!
}

input CursorPaginationInput {
  after: String!
}
```

</p>
</details>

---

To use the pagination arguments in our resolvers, an utility function was created and injected on the context. Using it on the `users` query was simply a matter of spreading the object returned from the utility function into the `opArgs` variable:

<details><summary><code>utils/pagination.js</code></summary>
<p>

```javascript
export const applyPagination = args => {
  const paginationArgs = {}
  const { page, cursor } = args

  if (page) {
    const { first, skip } = page
    paginationArgs.first = first
    paginationArgs.skip = skip
  }

  if (cursor) {
    paginationArgs.after = cursor.after
  }

  return paginationArgs
}
```

</p>
</details>

<details><summary><code>Query.js</code></summary>
<p>

```javascript
users(
  parent,
  args,
  {
    prisma,
    pagination: { applyPagination }
  },
  info
) {
  const opArgs = { ...applyPagination(args) }
  const { query } = args

  if (query) {
    opArgs.where = {
      OR: [{ name_contains: query }, { email_contains: query }]
    }
  }

  return prisma.query.users(opArgs, info)
}
```

</p>
</details>

### Sorting in the database schema

In the database schema, [Prisma gives us ascending and descending sorting operators for each of the scalar fields defined in the types of our datamodel](https://www.prisma.io/docs/1.27/prisma-graphql-api/reference/queries-qwe1/#ordering).

With ordering capabilities inherited from Prisma, our `Query` root type looks like this:

<details><summary><code>schema.graphql</code></summary>
<p>

```graphql
# import UserOrderByInput, PostOrderByInput, CommentOrderByInput from './generated/schema.graphql'

type Query {
  users(
    query: String
    page: SimplePaginationInput
    cursor: CursorPaginationInput
    orderBy: UserOrderByInput
  ): [User!]!
  posts(
    query: String
    page: SimplePaginationInput
    cursor: CursorPaginationInput
    orderBy: PostOrderByInput
  ): [Post!]!
  myPosts(
    query: String
    page: SimplePaginationInput
    cursor: CursorPaginationInput
    orderBy: PostOrderByInput
  ): [Post!]!
  comments(
    page: SimplePaginationInput
    cursor: CursorPaginationInput
    orderBy: CommentOrderByInput
  ): [Comment!]!
  me: User!
  post(id: ID!): Post!
}
```

</p>
</details>

---

Leveraging the orderBy argument in our resolver is quite simple (compare it to the snippet posted above). Destructuring it from the received arguments and adding it to the operation arguments is all it takes.

<details><summary><code>Query.js</code></summary>
<p>

```javascript
users(
  parent,
  args,
  {
    prisma,
    pagination: { applyPagination }
  },
  info
) {
  const { query, orderBy } = args
  const opArgs = { orderBy, ...applyPagination(args) }

  if (query) {
    opArgs.where = {
      OR: [{ name_contains: query }, { email_contains: query }]
    }
  }

  return prisma.query.users(opArgs, info)
}
```

</p>
</details>
