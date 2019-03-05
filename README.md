# GraphQL Bootcamp

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

## Things I Learned

I'll use this `README` to document stuff I learned while working on the [GraphQL Bootcamp](https://www.udemy.com/graphql-bootcamp) course at Udemy.

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
  - The resulting compose file looks like this:

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

#### Prisma

##### Database agnostic

With Prisma, we can use multiple databases in the same request! Currently, there is support for MySQL, Postgres, Amazon RDS and MongoDB. ElasticSearch, neo4j, Cassandra and Amazon DynamoDB are on their roadmap.

##### Service abstraction

Prisma hides the database implementation details from us. The same datamodel should always yield the same schema, no matter the database driver(s) used. That's pretty cool! It's making me more prone to look into another DB vendor, seeing as I've never messed with postgres before.

##### Migrations

The current of workflow of changing the `datamodel.prisma` will probably be affected by [official migration support by Prisma](https://github.com/prisma/rfcs/blob/migrations/text/0000-migrations.md). The [motivation](https://github.com/prisma/rfcs/blob/migrations/text/0000-migrations.md#motivation) section is clear and straight to the point. The new spec aims to be more explicit, having the `cli` generate editable migration files and using those as a source of truth instead of using the actual schema.

Personally it seems like a good idea to strike balance between declarative and imperative paradigms since declarative tools can get pretty magic ✨ pretty fast 🏎. For example, not knowing the **actual** database changes, I have to trust Prisma as a user that all will go well. With migrations support, I could see that adding a `@unique` directive to a field would give me a unique index on postgres.

##### Nested mutations

We can easily do cool stuff like the query below straight from GraphQL Playground:

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

Just by defining simple relations between the `User`, `Comment` and `Post` types, Prisma exposed some pretty handy **input types** (as in `createUser(data: {...}`). It looks like this:

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

At the same time we are **creating a user**, we are **creating a comment** attached to an **existing post**. Having that kind of operation resumed in a query is very powerful for clients of the API. Sweet!

These input types are available throughtout the API:

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

Here we're **creating a comment** while connecting it to an **existing user** and an **existing post**. I was surprised to see that the `email` field on the `User` type was added as an option to `connect` other than the id, seeing as it used the `@unique` directive in the datamodel definition:

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

##### Prisma binding

The `prisma-binding` library gives us an API to use Prisma with Node.js. After setting up the Prisma client using the factory exported from `prisma-binding`, we can use the created object for interacting with our Prisma API:

###### Queries

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
  .then(prettyLog);

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
  .then(prettyLog);
```

`prettyLog()` gives us the following ouput:

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

###### Mutations

Similarly, we can do use the client for executing mutations:

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
  .then(prettyLog);
```

`prettyLog()` gives us the following ouput:

```json
// prettyLog() with the result of mutation.createPost()
{
  "id": "cjsurame5001x07905emg5yrc",
  "title": "A post created with the prisma-node binding!",
  "body": "like.. wow",
  "published": false
}[
  // prettyLog with the result from query.posts() after calling mutation.updatePost()
  {
    "id": "cjsurame5001x07905emg5yrc",
    "body": "Some ~killer~ description",
    "published": true
  }
]
```

###### Async / Await

We could also do the above with `async/await`:

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
  );

  prettyLog(newPost);

  const updatedPost = await prisma.mutation.updatePost({
    where: {
      id: newPost.id
    },
    data: {
      published: true,
      body: "Some ~killer~ description"
    }
  });

  const allPosts = await prisma.query.posts(
    null,
    `
      {
          id
          body
          published
      }
    `
  );

  prettyLog(allPosts);
};

runPrisma();
```

> Note: prettyLog() is quite simple:

```javascript
export const prettyLog = data => {
  console.log(JSON.stringify(data, null, 3));

  // Keep the ability to continue on the promise chain
  return Promise.resolve(data);
};
```

###### Exists

We can use the `exists` binding to check if a certain instance of a type exists:

```javascript
prisma.exists
  .Comment({
    id: "cjsuf0of900hz0790137xt91r"
  })
  .then(prettyLog); // bool
```

We can use any attribute from our model for the search criteria:

```javascript
prisma.exists
  .Post({
    published: true
  })
  .then(prettyLog); // bool
```

Using the `exists` property, we can build error workflows before actually calling mutations:

```javascript
const createPostForUser = async (authorId, data) => {
  const userExists = await prisma.exists.User({
    id: authorId
  });

  if (!userExists) {
    throw new Error("User not found!");
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
  );
  return user;
};
```

###### @relation

The `@relation` directive customizes the database behaviour when a determined record is deleted. Related records need to be kept or deleted, depending on bussiness needs. Prisma offers two behaviour types: `SET_NULL` and `CASCADE`. For our datamodel, the following config probably makes the most sense:

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

#### Challenge - Modeling a review system

Andrew proposed that a review system for _something_ should be modeled separate from our blog model. I chose memes.

It is possible to configure multiple _prisma services_ using the same docker service. A separate schema is created in the postgres database and a new endpoint is made available after editing both the `prisma.yml` and `.graphqlconfig.yaml` files.

After the setup, a small exercise was proposed, where 2 users should be created and both of them should review a single meme. One of the users should be deleted and the reviews should also get deleted automatically given the use of `@relation (..., onDelete: CASCADE)`.

The final snippet was looking like this:

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

```javascript
import { Prisma } from "prisma-binding";
import { prettyLog } from "./utils";

const prisma = new Prisma({
  typeDefs: "src/generated/schema.graphql",
  endpoint: "http://localhost:4466/reviews/default"
});

const truncateTables = async () => {
  // No ID would ever match 'xxx'
  const deleteAll = {
    where: {
      id_not: "xxx"
    }
  };

  // Order is important here!
  const mutations = [
    prisma.mutation.deleteManyReviews,
    prisma.mutation.deleteManyMemes,
    prisma.mutation.deleteManyUsers
  ];

  for (const mutation of mutations) {
    // We need to respect the
    // foreign key structures
    /* eslint-disable no-await-in-loop */
    await mutation.call(null, deleteAll);
  }
};

const run = async () => {
  try {
    await truncateTables();

    // Creating 2 users
    const user = await prisma.mutation.createUser(
      {
        data: {
          name: "John",
          email: "John's email"
        }
      },
      "{ id name email }"
    );
    const user2 = await prisma.mutation.createUser(
      {
        data: {
          name: "Jack",
          email: "Jack's email"
        }
      },
      "{ id name email }"
    );
    const chosenUser = user;

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
    );

    prettyLog(meme, "Meme");

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
    );
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
    );

    prettyLog(review, "John's review");
    prettyLog(review2, "Jack's review");

    // Delete the user
    console.log(`Deleting ${chosenUser.name}!`);
    await prisma.mutation.deleteUser({
      where: {
        id: chosenUser.id
      }
    });

    // Make sure the user's reviews were deleted
    const reviews = await prisma.query.reviews(
      null,
      `
      {
        id
        score
      }
    `
    );
    prettyLog(reviews, "All reviews");

    console.log(`Checking if ${chosenUser.name} still has reviews`);
    const userHasReviews = async userId =>
      prisma.exists.Review({
        reviewer: {
          id: userId
        }
      });
    if (await userHasReviews(chosenUser.id)) {
      throw new Error(
        `The reviews for ${chosenUser.name} should have been deleted!`
      );
    } else {
      console.log("All is good!");
    }

    console.log(`Checking if ${meme.description} still has reviews`);
    const memeHasReviews = async userId =>
      prisma.exists.Review({
        meme: {
          id: userId
        }
      });
    if (await memeHasReviews(meme.id)) {
      throw new Error(
        `The reviews for ${meme.description} should have been deleted!`
      );
    } else {
      console.log("All is good!");
    }
  } catch (e) {
    console.log(e);
  }
};

run();

export default prisma;
```

The console output looks like this:

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

##### Using the binding in our API

Using `prisma-binding`, a typical resolver could look something like this:

```javascript
users(parent, args, { prisma }, info) {
  return prisma.query.users(null, info)
}
```

The first argument is `null` because we have no **operation arguments**. In other words, the client can't modify the behaviour of this query by passing in `args`. The second argument should have the desired **selection set**. In the examples above, we hardcoded the selection set as the second argument. **Given that our clients are now in control of the incoming queries**, we leverage the `info` argument as the second parameter to our query. That ensures we fetch the fields asked for by the client!
