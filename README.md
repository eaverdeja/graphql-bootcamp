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

### Database layer - Prisma

- With Prisma, we can use multiple databases in the same request! Currently, there is support for MySQL, Postgres, Amazon RDS and MongoDB. ElasticSearch, neo4j, Cassandra and Amazon DynamoDB are on their roadmap.
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


