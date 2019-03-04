# GraphQL Bootcamp

## Things I Learned

I'll use this `README` to document stuff I learned while working on the [GraphQL Bootcamp](https://www.udemy.com/graphql-bootcamp) course at Udemy.

## Tools used so far

Eventually I'll collect all (or most of the) tools used in the course in this list, with a short and objective description of each:

- uuid
- nodemon
- babel
- graphql yoga
- prisma
- graphql playground

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
    - *The articles are in portuguese*
    - [Postgres & Docker](https://medium.com/@renato.groffe/postgresql-docker-executando-uma-inst%C3%A2ncia-e-o-pgadmin-4-a-partir-de-containers-ad783e85b1a4)
    - [Creating a docker-compose file for Postgres & PgAdmin4](https://medium.com/@renato.groffe/postgresql-pgadmin-4-docker-compose-montando-rapidamente-um-ambiente-para-uso-55a2ab230b89)
    - The resulting compose file looks like this:

```yml
version: '3'
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

- With Prisma, we can use multiple databases in the same request! Currently, there is support for MySQL, Postgres, Amazon RDS and MongoDB. ElasticSearch, neo4j, Cassandra and Amazon DynamoDB are on their roadmap.
- Prisma hides the database implementation details from us. The same datamodel should always yield the same schema, no matter the database driver(s) used. That's pretty cool! It's making me more prone to look into another DB vendor, seeing as I've never messed with postgres before.
- The current of workflow of changing the `datamodel.prisma` will probably be affected by [official migration support by Prisma](https://github.com/prisma/rfcs/blob/migrations/text/0000-migrations.md). The [motivation](https://github.com/prisma/rfcs/blob/migrations/text/0000-migrations.md#motivation) section is clear and straight to the point. The new spec aims to be more explicit, having the `cli` generate editable migration files and using those as a source of truth instead of using the actual schema. Personally it seems like a good idea to strike balance between declarative and imperative paradigms since declarative tools can get pretty magic ✨ pretty fast 🏎. For example, not knowing the **actual** database changes, I have to trust Prisma as a user that all will go well. With migrations support, I could see that adding a `@unique` directive to a field would give me a unique index on postgres.
