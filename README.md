# GraphQL Bootcamp

## Things I Learned

I'll use this `README` to document stuff I learned while working on the [GraphQL Bootcamp](https://www.udemy.com/graphql-bootcamp) course at Udemy.

> Obviously, a lot of details are left out since I already knew some of the topics covered. If you want those, get the course on Udemy. It's good 👍

## Tools used so far

Eventually I'll collect all (or most of the) tools used in the course in this list, with a short and objective description of each:

- uuid
- nodemon
- babel
- graphql yoga
- prisma
  - prisma-binding
- graphql playground
- graphql cli

## Modules

The course is outlined in a few different modules. I'll stick to the same separation whenever possible throughout this `README`

- [GraphQL Bootcamp](#graphql-bootcamp)
- [Things I Learned](#things-i-learned)
- [Tools used so far](#tools-used-so-far)
- [Modules](#modules)
- [Warm Up](#warm-up)
- [GraphQL Basics](#graphql-basics)
- [Database layer](#database-layer)
  - [Postgres](#postgres)
  - [Prisma](#prisma)
    - [Database agnostic](#database-agnostic)
    - [Service abstraction](#service-abstraction)
    - [Migrations](#migrations)
    - [Nested mutations](#nested-mutations)
    - [Prisma binding](#prisma-binding)
      - [Queries](#queries)
      - [Mutations](#mutations)
      - [Async / Await](#async--await)
      - [Exists](#exists)
      - [@relation](#relation)
  - [Challenge - Modeling a review system](#challenge---modeling-a-review-system)
  - [Using the binding in our API](#using-the-binding-in-our-api)
    - [Simple query](#simple-query)
    - [Using args and filters](#using-args-and-filters)
    - [Mutations](#mutations-1)
    - [Final touch - Subscriptions](#final-touch---subscriptions)
- [Authentication](#authentication)
  - [Protecting the Prisma API](#protecting-the-prisma-api)

### Warm Up

- [Babel - Try it out](https://babeljs.io/repl)
  - We can tinker with the babel config straight from the browser!

### GraphQL Basics

- TODO

### Database layer

#### Postgres

- PgAdmin3 is not supported anymore for Ubuntu, so I tried going for pgAdmin4. The manual install seemed a bit cumbersome, so I went looking for a Docker solution. I found this small guide by Renato Groffe (valeu Renato! 👍) for spinning up Docker containers for `postgres` and for `pgAdmin4`. He even put a sweet `docker-compose.yml`!
  - _The articles are in portuguese_
  - [Postgres & Docker](https://medium.com/@renato.groffe/postgresql-docker-executando-uma-inst%C3%A2ncia-e-o-pgadmin-4-a-partir-de-containers-ad783e85b1a4)
  - [Creating a docker-compose file for Postgres & PgAdmin4](https://medium.com/@renato.groffe/postgresql-pgadmin-4-docker-compose-montando-rapidamente-um-ambiente-para-uso-55a2ab230b89)

<details><summary>The resulting compose file looks like this</summary>
<p>

```yml
version: "3"
services:
  prisma:
    image: prismagraphql/prisma:1.27
    restart: always
    ports:
      - "4466:4466"
    environment:
      PRISMA_CONFIG: |
        port: 4466
        # uncomment the next line and provide the env var PRISMA_MANAGEMENT_API_SECRET=my-secret to activate cluster security
        # managementApiSecret: my-secret
        databases:
          default:
            connector: postgres
            host: # host
            database: # name
            user: # user
            password: # password
            rawAccess: true
            port: '5432'
            migrations: true
            ssl: true

  postgres-compose:
    image: postgres
    environment:
      POSTGRES_PASSWORD: "Postgres2019!" # default postgres password
    ports:
      - "15432:5432"
    volumes:
      - /~/Projects/postgres:/var/lib/postgresql/data
    networks:
      - postgres-compose-network

  pgadmin-compose:
    image: dpage/pgadmin4
    environment:
      PGADMIN_DEFAULT_EMAIL: # your email
      PGADMIN_DEFAULT_PASSWORD: "PgAdmin2019!" #pgadmin default password
    ports:
      - "16543:80"
    depends_on:
      - postgres-compose
    networks:
      - postgres-compose-network

networks:
  postgres-compose-network:
    driver: bridge
```
</p>
</details>

---

#### Prisma

##### Database agnostic

With Prisma, we can use multiple databases, including SQL and NoSQL databases. Currently, there is support for MySQL, Postgres, Amazon RDS and MongoDB. ElasticSearch, neo4j, Cassandra and Amazon DynamoDB are on their roadmap.

##### Service abstraction

Prisma hides the database implementation details from us. The same datamodel should always yield the same schema, no matter the database driver(s) used. That's pretty cool! It's making me more prone to look into another DB vendor, seeing as I've never messed with postgres before.

##### Migrations

The current workflow of changing the `datamodel.prisma` will probably be affected by [official migration support by Prisma](https://github.com/prisma/rfcs/blob/migrations/text/0000-migrations.md). The [motivation](https://github.com/prisma/rfcs/blob/migrations/text/0000-migrations.md#motivation) section is clear and straight to the point. The new spec aims to be more explicit, having the `cli` generate editable migration files and using those as a source of truth instead of using the actual schema.

Personally it seems like a good idea to strike balance between declarative and imperative paradigms since declarative tools can get pretty magic ✨ pretty fast 🏎. For example, not knowing the **actual** database changes, I have to trust Prisma as a user that all will go well. With migrations support, I could see that adding a `@unique` directive to a field would give me a unique index on postgres.

##### Nested mutations

We can easily do cool stuff like the query below straight from GraphQL Playground:

<details><summary>Nested mutation example</summary>
<p>

```graphql
mutation {
  createUser(
    data: {
      name: "Jack"
      email: "jack@gmail.com"
      comments: {
        create: {
          text: "Creating a nested comment on an existing post!"
          post: { connect: { id: "cjsuc6g1k0eno079020fs4dng" } }
        }
      }
    }
  ) {
    id
    name
    email
    comments {
      text
      post {
        title
      }
    }
  }
}
```
</p>
</details>

---

Just by defining simple relations between the `User`, `Comment` and `Post` types, Prisma exposed some pretty handy **input types** (as in `createUser(data: {...}`). It looks like this:

<details><summary>Generated schema</summary>
<p>

```graphql
input UserCreateInput {
  name: String!
  email: String!
  posts: PostCreateManyWithoutAuthorInput # We are NOT using this one in the example
  comments: CommentCreateManyWithoutAuthorInput
}

input CommentCreateManyWithoutAuthorInput {
  create: [CommentCreateWithoutAuthorInput!] # We are using this one in the example
  connect: [CommentWhereUniqueInput!]
}

input CommentCreateWithoutAuthorInput {
  text: String!
  post: PostCreateOneInput!
}

input PostCreateOneInput {
  create: PostCreateInput
  connect: PostWhereUniqueInput # We are using this one in the example
}

input PostWhereUniqueInput {
  id: ID
}
```
</p>
</details>

---

At the same time we are **creating a user**, we are **creating a comment** attached to an **existing post**. Having that kind of operation resumed in a query is very powerful for clients of the API. Sweet!

These input types are available throughout the API:

<details><summary>Nested mutation example 2</summary>
<p>

```graphql
mutation {
  createComment(
    data: {
      author: { connect: { email: "jack@gmail.com" } }
      post: { connect: { id: "cjsuc6g1k0eno079020fs4dng" } }
      text: "Creating a comment for an existing user on an existing post!"
    }
  ) {
    id
    text
    author {
      name
    }
    post {
      title
    }
  }
}
```
</p>
</details>

---

Here we're **creating a comment** while connecting it to an **existing user** and an **existing post**. I was surprised to see that the `email` field on the `User` type was added as an option to `connect` other than the id, seeing as it used the `@unique` directive in the datamodel definition:

<details><summary>Generated schema</summary>
<p>

```graphql
type User {
  id: ID! @unique
  email: String! @unique
  ...
}

type Comment {
  author: User!
  ...
}

input CommentCreateInput {
  text: String!
  author: UserCreateOneWithoutCommentsInput!
  post: PostCreateOneInput!
}

input UserCreateOneWithoutCommentsInput {
  create: UserCreateWithoutCommentsInput
  connect: UserWhereUniqueInput
}

input UserWhereUniqueInput {
  id: ID
  email: String
}
```
</p>
</details>

---

##### Prisma binding

The `prisma-binding` library gives us an API to use Prisma with Node.js. After setting up the Prisma client using the factory exported from `prisma-binding`, we can use the created object for interacting with our Prisma API:

###### Queries

<details><summary>Querying for types and related types</summary>
<p>

```javascript
// Fetching users with information about their
// posts and comments from our API
prisma.query
  .users(
    null,
    `
        {
            id
            name
            email
            posts {
                id
                title
            }
            comments {
                text
                post {
                    id
                }
            }
        }
    `
  )
  .then(prettyLog)

// Fetching comments with information about their
// authors from our API
prisma.query
  .comments(
    null,
    `
            {
                id
                text
                author {
                    id
                    name
                }
            }
        `
  )
  .then(prettyLog)
```
</p>
</details>

<details><summary>prettyLog() gives us the following ouput</summary>
<p>

```json
// prettyLog() with the result of query.users()
[
  {
    "id": "cjsuc6hew0enq0790gzcmxel5",
    "name": "Bob",
    "email": "bob@gmail.com",
    "posts": []
  },
  {
    "id": "cjsuf0o3i00hy07906x376r0b",
    "name": "Jack",
    "email": "jack@gmail.com",
    "posts": [
      {
        "id": "cjsurame5001x07905emg5yrc",
        "title": "A post created with the prisma-node binding!"
      }
    ]
  }
][
  // prettyLog() with the result of query.comments()
  ({
    "id": "cjsuf0of900hz0790137xt91r",
    "text": "Creating a new user with a nested comment on an existing post!",
    "author": {
      "id": "cjsuf0o3i00hy07906x376r0b",
      "name": "Jack"
    }
  },
  {
    "id": "cjsugr1vk01n20790u8f5qoi1",
    "text": "Creating a comment for an existing user on an existing post!",
    "author": {
      "id": "cjsuf0o3i00hy07906x376r0b",
      "name": "Jack"
    }
  })
]
```

</p>
</details>

---

###### Mutations

<details><summary>Similarly, we can do use the client for executing mutations</summary>
<p>

```javascript
prisma.mutation
  .createPost(
    {
      data: {
        title: "A post created with the prisma-node binding!",
        body: "like.. wow",
        published: false,
        author: {
          connect: {
            id: "cjsuf0o3i00hy07906x376r0b"
          }
        }
      }
    },
    "{ id title body published }"
  )
  .then(prettyLog)
  .then(data =>
    prisma.mutation.updatePost({
      where: {
        id: data.id
      },
      data: {
        published: true,
        body: "Some ~killer~ description"
      }
    })
  )
  .then(data =>
    prisma.query.posts(
      null,
      `
        {
            id
            body
            published
        }
      `
    )
  )
  .then(prettyLog)
```
</p>
</details>

<details><summary>
prettyLog() gives us the following output</summary>
<p>

```json
// prettyLog() with the result of mutation.createPost()
{
  "id": "cjsurame5001x07905emg5yrc",
  "title": "A post created with the prisma-node binding!",
  "body": "like.. wow",
  "published": false
}[
  // prettyLog with the result from query.posts()
  // after calling mutation.updatePost()
  {
    "id": "cjsurame5001x07905emg5yrc",
    "body": "Some ~killer~ description",
    "published": true
  }
]
```
</p>
</details>

---

###### Async / Await

<details><summary>We could also do the above with `async/await`</summary>
<p>

```javascript
const runPrisma = async () => {
  const newPost = await prisma.mutation.createPost(
    {
      data: {
        title: "A post created with the prisma-node binding!",
        body: "like.. wow",
        published: false,
        author: {
          connect: {
            id: "cjsuf0o3i00hy07906x376r0b"
          }
        }
      }
    },
    "{ id title body published }"
  )

  prettyLog(newPost)

  const updatedPost = await prisma.mutation.updatePost({
    where: {
      id: newPost.id
    },
    data: {
      published: true,
      body: "Some ~killer~ description"
    }
  })

  const allPosts = await prisma.query.posts(
    null,
    `
      {
          id
          body
          published
      }
    `
  )

  prettyLog(allPosts)
}

runPrisma()
```
</p>
</details>

---

`prettyLog()` is quite simple. We just use it to give us a nice and simple (quick and dirty) debug tool:

```javascript
export const prettyLog = data => {
  console.log(JSON.stringify(data, null, 3))

  // Keep the ability to continue on the promise chain
  return Promise.resolve(data)
}
```

###### Exists

We can use the `exists` binding to check if a certain instance of a type exists:

```javascript
prisma.exists
  .Comment({
    id: "cjsuf0of900hz0790137xt91r"
  })
  .then(prettyLog) // bool
```

We can use any attribute from our model for the search criteria:

```javascript
prisma.exists
  .Post({
    published: true
  })
  .then(prettyLog) // bool
```

<details><summary>Using the <code>exists</code> property, we can build error workflows before actually calling mutations</summary>
<p>

```javascript
const createPostForUser = async (authorId, data) => {
  const userExists = await prisma.exists.User({
    id: authorId
  })

  if (!userExists) {
    throw new Error("User not found!")
  }

  const { author: user } = await prisma.mutation.createPost(
    {
      data: {
        author: {
          connect: {
            id: authorId
          }
        },
        ...data
      }
    },
    "{ author {id name email posts { id title published } } }"
  )
  return user
}
```
</p>
</details>

---

###### @relation

The `@relation` directive customizes the database behaviour when a determined record is deleted. Related records need to be kept or deleted, depending on business needs. Prisma offers two behaviour types: `SET_NULL` and `CASCADE`. 

<details><summary>For our datamodel, the following config probably makes the most sense</summary>
<p>

```graphql
type User {
  ...
  posts: [Post!]! @relation(name: "PostToUser", onDelete: CASCADE)
  comments: [Comment!]! @relation(name: "CommentToUser", onDelete: CASCADE)
}

type Post {
  ...
  author: User! @relation(name: "PostToUser", onDelete: SET_NULL)
  comments: [Comment!]! @relation(name: "CommentToPost", onDelete: CASCADE)
}

type Comment {
  ...
  author: User! @relation(name: "CommentToUser", onDelete: SET_NULL)
  post: Post! @relation(name: "CommentToPost", onDelete: SET_NULL)
}
```
</p>
</details>

---

#### Challenge - Modeling a review system

Andrew proposed that a review system for _something_ should be modeled separate from our blog model. I chose memes.

It is possible to configure multiple _prisma services_ using the same docker service. A separate schema is created in the postgres database and a new endpoint is made available after editing both the `prisma.yml` and `.graphqlconfig.yaml` files.

After the setup, a small exercise was proposed, where 2 users should be created and both of them should review a single meme. One of the users should be deleted and the reviews should also get deleted automatically given the use of `@relation (..., onDelete: CASCADE)`.

The final snippet was looking like this:

<details><summary>schema.graphql</summary>
<p>

```graphql
type User {
  id: ID! @unique
  name: String!
  email: String! @unique
  reviews: [Review!]! @relation(name: "ReviewToUser", onDelete: CASCADE)
}

type Meme {
  id: ID! @unique
  url: String!
  description: String!
  notSafeForWork: Boolean!
  reviews: [Review!]! @relation(name: "MemeToReviews", onDelete: CASCADE)
}

type Review {
  id: ID! @unique
  score: Float!
  reviewer: User! @relation(name: "ReviewToUser", onDelete: SET_NULL)
  meme: Meme! @relation(name: "ReviewToMeme", onDelete: SET_NULL)
}
```
</p>
</details>

---

<details><summary>prisma.js</summary>
<p>

```javascript
import { Prisma } from "prisma-binding"
import { prettyLog } from "./utils"

const prisma = new Prisma({
  typeDefs: "src/generated/schema.graphql",
  endpoint: "http://localhost:4466/reviews/default"
})

const truncateTables = async () => {
  // No ID would ever match 'xxx'
  const deleteAll = {
    where: {
      id_not: "xxx"
    }
  }

  // Order is important here!
  const mutations = [
    prisma.mutation.deleteManyReviews,
    prisma.mutation.deleteManyMemes,
    prisma.mutation.deleteManyUsers
  ]

  for (const mutation of mutations) {
    // We need to respect the
    // foreign key structures
    /* eslint-disable no-await-in-loop */
    await mutation.call(null, deleteAll)
  }
}

const run = async () => {
  try {
    await truncateTables()

    // Creating 2 users
    const user = await prisma.mutation.createUser(
      {
        data: {
          name: "John",
          email: "John's email"
        }
      },
      "{ id name email }"
    )
    const user2 = await prisma.mutation.createUser(
      {
        data: {
          name: "Jack",
          email: "Jack's email"
        }
      },
      "{ id name email }"
    )
    const chosenUser = user

    // Creating a meme for review
    const meme = await prisma.mutation.createMeme(
      {
        data: {
          description: "Dem Legs",
          url:
            "https://www.memedroid.com/memes/detail/2152162?refGallery=random&page=1",
          notSafeForWork: false
        }
      },
      "{ id description url notSafeForWork }"
    )

    prettyLog(meme, "Meme")

    // Create a review for the meme
    const review = await prisma.mutation.createReview(
      {
        data: {
          score: 7,
          reviewer: {
            connect: {
              id: user.id
            }
          },
          meme: {
            connect: {
              id: meme.id
            }
          }
        }
      },
      "{ score reviewer { name } meme { description } }"
    )
    const review2 = await prisma.mutation.createReview(
      {
        data: {
          score: 8,
          reviewer: {
            connect: {
              id: user2.id
            }
          },
          meme: {
            connect: {
              id: meme.id
            }
          }
        }
      },
      "{ score reviewer { name } meme { description } }"
    )

    prettyLog(review, "John's review")
    prettyLog(review2, "Jack's review")

    // Delete the user
    console.log(`Deleting ${chosenUser.name}!`)
    await prisma.mutation.deleteUser({
      where: {
        id: chosenUser.id
      }
    })

    // Make sure the user's reviews were deleted
    const reviews = await prisma.query.reviews(
      null,
      `
      {
        id
        score
      }
    `
    )
    prettyLog(reviews, "All reviews")

    console.log(`Checking if ${chosenUser.name} still has reviews`)
    const userHasReviews = async userId =>
      prisma.exists.Review({
        reviewer: {
          id: userId
        }
      })
    if (await userHasReviews(chosenUser.id)) {
      throw new Error(
        `The reviews for ${chosenUser.name} should have been deleted!`
      )
    } else {
      console.log("All is good!")
    }

    console.log(`Checking if ${meme.description} still has reviews`)
    const memeHasReviews = async userId =>
      prisma.exists.Review({
        meme: {
          id: userId
        }
      })
    if (await memeHasReviews(meme.id)) {
      throw new Error(
        `The reviews for ${meme.description} should have been deleted!`
      )
    } else {
      console.log("All is good!")
    }
  } catch (e) {
    console.log(e)
  }
}

run()

export default prisma
```
</p>
</details>

---

<details><summary>
The console output looks like this</summary>
<p>

```json
Meme
  {
     "id": "cjsv2v2hz03ph0790tzoq5md1",
     "description": "Dem Legs",
     "url": "https://www.memedroid.com/memes/detail/2152162?refGallery=random&page=1",
     "notSafeForWork": false
  }
John's review
  {
     "score": 7,
     "reviewer": {
        "name": "John"
     },
     "meme": {
        "description": "Dem Legs"
     }
  }
Jack's review
  {
     "score": 8,
     "reviewer": {
        "name": "Jack"
     },
     "meme": {
        "description": "Dem Legs"
     }
  }
Deleting John!
All reviews
  [
     {
        "id": "cjsv2v3yd03px0790zk9k2uev",
        "score": 8
     }
  ]
Checking if John still has reviews
All is good!
Deleting Dem Legs!
Checking if Dem Legs still has reviews
All is good!
```
</p>
</details>

---

#### Using the binding in our API

##### Simple query

Using `prisma-binding`, a typical resolver could look something like this

```javascript
users(parent, args, { prisma }, info) {
  return prisma.query.users(null, info)
}
```

The first argument is `null` because we have no **operation arguments**. In other words, the client can't modify the behaviour of this query by passing in `args`. The second argument should have the desired **selection set**. In the examples above, we hardcoded the selection set as the second argument. **Given that our clients are now in control of the incoming queries**, we leverage the `info` argument as the second parameter to our query. That ensures we fetch the fields asked for by the client! [After all, the desired selection set is right there on the info object](https://www.prisma.io/blog/graphql-server-basics-demystifying-the-info-argument-in-graphql-resolvers-6f26249f613a/)

##### Using args and filters

<details><summary>
Using the arguments given to us by our clients is pretty straighforward</summary>
<p>

```javascript
users(parent, args, { prisma }, info) {
  const opArgs = {}

  if(args.query) {
    opArgs.where = {
      name_contains: args.query
    }
  }

  return prisma.query.users(opArgs, info)
}
```
</p>
</details>

---

The `name_contains` property comes from our generated API. Each field in a model can be filtered in many different ways by the Prisma API.

<details><summary>Just for the "name" field (a String) we get the following filters out of the box</summary>
<p>

```graphql
type UserWhereInput {
  AND: [UserWhereInput!]
  OR: [UserWhereInput!]
  NOT: [UserWhereInput!]

  ...

  name: String
  name_not: String
  name_in: [String!]
  name_not_in: [String!]
  name_lt: String
  name_lte: String
  name_gt: String
  name_gte: String
  name_contains: String
  name_not_contains: String
  name_starts_with: String
  name_not_starts_with: String
  name_ends_with: String
  name_not_ends_with: String
}
```
</p>
</details>

---

<details><summary>The AND, OR and NOT properties can be used to construct conditional logic on our opArgs object</summary>
<p>

```javascript
opArgs.where = {
  OR: [{ name_contains: args.query }, { email_contains: args.query }]
}
```
</p>
</details>

---

Matching the name **or** the email would be the resulting behaviour.

##### Mutations

<details><summary>
A resolver for the createUser mutation could look like this</summary>
<p>

```javascript
async createUser(parent, { data }, { prisma }, info) {
  const { email } = data
  const isEmailTaken = await prisma.exists.User({ email })

  if (isEmailTaken) {
    throw new Error('Email taken')
  }

  return prisma.mutation.createUser({ data })
}
```
</p>
</details>

---

> In the above example, the `exists` check enables us to customize the error message. That's it. The "unique email" rule is already enforced at the database level because of the `@unique` directive.

<details><summary>The whole Mutation.js file was refactored to</summary>
<p>

```javascript
const Mutation = {
  createUser(parent, { data }, { prisma }, info) {
    return prisma.mutation.createUser({ data }, info)
  },
  deleteUser(parent, { id }, { prisma }, info) {
    return prisma.mutation.deleteUser({ where: { id } }, info)
  },
  updateUser(parent, { id, data }, { prisma }, info) {
    return prisma.mutation.updateUser({ where: { id }, data }, info)
  },
  createPost(parent, { data }, { prisma }, info) {
    const { title, body, published, author } = data
    return prisma.mutation.createPost(
      {
        data: {
          title,
          body,
          published,
          author: {
            connect: {
              id: author
            }
          }
        }
      },
      info
    )
  },
  deletePost(parent, { id }, { prisma }, info) {
    return prisma.mutation.deletePost({ where: { id } }, info)
  },
  updatePost(parent, { id, data }, { prisma }, info) {
    const { title, body, published } = data
    return prisma.mutation.updatePost(
      {
        where: { id },
        data: {
          title,
          body,
          published
        }
      },
      info
    )
  },
  createComment(parent, { data }, { prisma }, info) {
    const { text, author, post } = data
    return prisma.mutation.createComment(
      {
        data: {
          text,
          author: {
            connect: {
              id: author
            }
          },
          post: {
            connect: {
              id: post
            }
          }
        }
      },
      info
    )
  },
  deleteComment(parent, { id }, { prisma }, info) {
    return prisma.mutation.deleteComment({ where: { id } }, info)
  },
  updateComment(parent, { id, data }, { prisma }, info) {
    const { text } = data
    return prisma.mutation.updateComment(
      { where: { id }, data: { text } },
      info
    )
  }
}

export { Mutation as default }
```
</p>
</details>

---

<details><summary>schema.graphql</summary>
<p>

```graphql
type Query {
  users(query: String): [User!]!
  posts(query: String): [Post!]!
  comments: [Comment!]!
  me: User!
  post: Post!
}

type Mutation {
  createUser(data: CreateUserInput!): User!
  deleteUser(id: ID!): User!
  updateUser(id: ID!, data: UpdateUserInput!): User!
  createPost(data: CreatePostInput!): Post!
  deletePost(id: ID!): Post!
  updatePost(id: ID!, data: UpdatePostInput!): Post!
  createComment(data: CreateCommentInput!): Comment!
  deleteComment(id: ID!): Comment!
  updateComment(id: ID!, data: UpdateCommentInput!): Comment!
}

input CreateUserInput {
  name: String!
  email: String!
}

input UpdateUserInput {
  name: String
  email: String
}

input CreatePostInput {
  title: String!
  body: String!
  published: Boolean!
  author: ID!
}

input UpdatePostInput {
  title: String
  body: String
  published: Boolean
}

input CreateCommentInput {
  text: String!
  author: ID!
  post: ID!
}

input UpdateCommentInput {
  text: String
}

type User {
  id: ID!
  name: String!
  email: String!
  posts: [Post!]!
  comments: [Comment!]!
}

type Post {
  id: ID!
  title: String!
  body: String!
  published: Boolean!
  author: User!
  comments: [Comment!]!
}

type Comment {
  id: ID!
  text: String!
  author: User!
  post: Post!
}
```
</p>
</details>

---

Amazing - check out the [commit diff](https://github.com/eaverdeja/graphql-bootcamp/commit/b1556e25554a3bbc65b47eb698215dab74341cba?diff=unified). It's really brutal!

Seems like it's pretty easy to expose an application level API on top of the extra fancy Prisma API with Node.

<img src="https://media.giphy.com/media/yyZRSvISN1vvW/giphy.gif" style="margin-left: 30%" width="230" height="230" />

##### Final touch - Subscriptions

Since Prisma acts as a layer on top of the chosen storage, it easily handles the subscription work which was done with GraphQL Yoga's `pubsub`.

> The actual meat inside of what remains of the subscriptions file is related to our actual business needs: watching comments from a specific post and watching only the published posts.

<details><summary>Subscription.js</summary>
<p>

```javascript
const Subscription = {
  comment: {
    subscribe(parent, { postId }, { prisma }, info) {
      const subscribeToPostOptions = {
        where: {
          node: {
            post: {
              id: postId
            }
          }
        }
      }
      return prisma.subscription.comment(subscribeToPostOptions, info)
    }
  },
  post: {
    subscribe(parent, args, { prisma }, info) {
      const publishedPosts = {
        where: {
          node: {
            published: true
          }
        }
      }
      return prisma.subscription.post(publishedPosts, info)
    }
  }
}

export { Subscription as default }
```

</p>
</details>


### Authentication

#### Protecting the Prisma API

The first step we should take in order to secure our API should be restricting access to our Prisma API. By adding a `secret` field to `prisma.yml` we can achieve that. 

<details><summary>prisma.yml</summary>
<p>

```yaml
endpoint: http://localhost:4466
datamodel: datamodel.prisma
secret: somethingsupersecret
```

</p>
</details>

However, we still need to access the Prisma API from inside of our Node app. By adding the same `secret` informed in `prisma.yml` as we create the prisma instance we got that covered.

`prisma.js`

```javascript
import { Prisma } from 'prisma-binding'

const prisma = new Prisma({
  typeDefs: 'src/generated/schema.graphql',
  endpoint: 'http://localhost:4466',
  secret: 'somethingsupersecret'
})

export default prisma
```

We also need to create an extension point on `.graphqlconfig.yaml` so we can still use `graphql get-schema` to get our generated schema. Notice the `prisma` entry in the `extensions`. The `default` endpoint is our autogenerated Prisma API. The `app` endpoint is our custom Node app driven by the `prisma-binding`.

<details><summary>.graphqlconfig.yaml</summary>
<p>

```yaml
projects:
  graphql-bootcamp:
    schemaPath: 'src/generated/schema.graphql'
    extensions:
      prisma: prisma/prisma.yml
      endpoints:
        default:
          url: 'http://localhost:4466/'
          subscription: 'ws://localhost:4466/'
        app:
          url: 'http://localhost:4000/'
          subscription: 'ws://localhost:4000/'
```

</p>
</details>

#### JWT authentication workflow

For managing user authentication, JWT was chosen as the tool for the job. JWTs are awesome and are pretty solid in most of the popular languages. The tokens carry a **payload** that can be **decoded by anyone** and are **signed with a secret** only known to the server of the token, so **generating** and **validating** tokens is a breeze 💨

The `login` mutation:
> This takes care of the **validation** part

```graphql
  login(credentials: LoginCredentials!): AuthPayload!

  input LoginCredentials {
    email: String!
    password: String!
  }

  type AuthPayload {
    user: User!
    token: String!
  }
```

<details><summary>The resolver function</summary>
<p>

```javascript
async login(
  parent,
  {
    credentials: { email, password }
  },
  { prisma },
  info
) {
  const user = await prisma.query.user({
    where: {
      email
    }
  })
  const hashedPassword = user ? user.password : ''

  const matchPassword = await bcrypt.compare(password, hashedPassword)

  if (!user || !matchPassword) {
    throw new Error('Invalid credentials!')
  }

  return {
    user,
    // createToken() keeps the JWT related stuff out of our resolvers
    // We just need to give it a payload
    token: createToken({ userId: user.id })
  }
}

```

</p>
</details>

---

The return value of the `createUser` mutation also needs to return `AuthPayload` - `createUser` would probably be used in a user signup context. Given that, we need to give the new user a token so he can continue acting as himself.

```graphql
createUser(data: CreateUserInput!): AuthPayload!
```

<details><summary>The resolver function</summary>
<p>

```javascript
async createUser(parent, { data }, { prisma }, info) {
  const { password } = data
  if (password.length < 8) {
    throw new Error('Password must be 8 characters or longer.')
  }

  const hashedPassword = await bcrypt.hash(password, 10)

  const user = await prisma.mutation.createUser({
    data: {
      ...data,
      password: hashedPassword
    }
  })

  return {
    user,
    token: createToken({ userId: user.id })
  }
}

```

</p>
</details>

---

The `createToken` utility used in the resolvers above is pretty simple. It just signs our payload with a well kept and strong secret using the [popular `jsonwebtoken` package](https://www.npmjs.com/package/jsonwebtoken)

`createToken()` keeps the JWT related stuff out of our resolvers. We just need to give it a payload 🎉

```javascript
export const createToken = payload => jwt.sign(payload, JWT_SECRET)
```

#### Protecting our Queries and Mutations

Being to able to extract the current user's ID from the incoming request was the first step in making sure our queries and mutations would operate properly. This was added to an `auth` utility file together with `createToken()`.

`getUserId()` is able to recover the authorization token both from HTTP and websocket requests/connections and accepts and optional `requireAuth` argument for opting out of the error throwing. It defaults to `true`, blocking program execution by throwing an error if the token isn't valid, but passing `false` to `requireAuth` suppresses the error.

<details><summary><code>auth.js</code></summary>
<p>

```javascript
const JWT_SECRET = 'thisisasecret'

export const getUserId = (request, requireAuth = true) => {
  const { request: httpRequest, connection: socket } = request
  const authHeader = httpRequest
    ? httpRequest.headers.authorization
    : socket.context.Authorization

  if (authHeader) {
    const token = authHeader.replace('Bearer ', '')
    const decoded = jwt.verify(token, JWT_SECRET)

    return decoded.userId
  }

  if (requireAuth) {
    throw new Error('No auth token was given')
  }

  return null
}

...
```

</p>
</details>

This was injected via context, making it available to any resolver.

<details><summary>Injecting on the context</summary>
<p>

```javascript
import {
  getUserId,
  createToken,
  hashPassword,
  comparePassword
} from './utils/auth'

new GraphQLServer({
  typeDefs: './src/schema.graphql',
  resolvers,
  context(request) {
    return {
      prisma,
      request,
      auth: {
        getUserId,
        createToken
      }
    }
  }
})
```

</p>
</details>


<details><summary><code>Mutation.js</code></summary>
<p>

```javascript
createPost(
  parent,
  { data },
  {
    prisma,
    request,
    auth: { getUserId }
  },
  info
) {
  const userId = getUserId(request)

  const { title, body, published } = data
  return prisma.mutation.createPost(
    {
      data: {
        title,
        body,
        published,
        author: {
          connect: {
            id: userId
          }
        }
      }
    },
    info
  )
}
```

</p>
</details>


//TODO

- Provide other usages of the context in resolvers (like `createToken` for login or `isPostPublished` for `Post` related resolvers)
