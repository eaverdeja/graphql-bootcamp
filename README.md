# GraphQL Bootcamp - Production Deployment

[GraphQL Bootcamp - Production Deployment](#graphql-bootcamp---production-deployment)
- [Production Deployment](#production-deployment)
  - [Production Database](#production-database)
  - [Prisma Service](#prisma-service)
    - [Deploying](#deploying)
    - [Exploring](#exploring)
  - [Deploying our Node app](#deploying-our-node-app)
  - [This is never painfree](#this-is-never-painfree)

## Production Deployment

To enable our app to run in production, Andrew outlined three basic steps:

1. Configure our production database
1. Configure our production Prisma service
1. Configure our production Node app

The main service we're using here is [Prisma Cloud](https://www.prisma.io/cloud). It makes the deployment process easier and gives us a nice databrowser and metrics and top of our production instance.

I thought about posting pictures of the web interface for this whole process, but I will not for two reasons:

1. It's already dead simple;
1. Prisma's web GUI is changing frequently;

### Production Database

We can spin up a production DB by **creating a new server in Prisma Cloud**. Currently, they integrate automatically with Heroku. More vendors to come (AWS, Azure, Google Cloud)! Note that multiple vendors could satisfy our needs. We just need to host a Postgres database and a Docker container for the Prisma service. Lot's of vendors offer that for us 😉

Prisma's form wizard walks us through creating a database and server on Heroku a in a few simple steps. Connecting the production database to PgAdmin can be done in a similar fashion to what we did before. In the Heroku Dashboard, we have access to the database credentials for our production instance.

### Prisma Service

#### Deploying

To configure our Prisma service for production deployment, we need to edit the `prisma.yml` file. While in development, we had the `endpoint` value hardcoded as `http://localhost:4466`. To fix this, two `.env` files were created, each with the relevant endpoint value.

The endpoint value in `prisma.yml` should be as such:

```yml
endpoint: ${env:PRISMA_ENDPOINT}
```

By providing the `PRISMA_ENDPOINT` environment value, Prisma injects it whenever it deploys a service. To do that, we have to **specify the path to our `.env` file** when deploying with Prisma:

```bash
# Inside the /prisma folder

# For dev deploys
$ prisma deploy -e ../config/dev.env

# For prod deploys
$ prisma deploy -e ../config/prod.env
```

Before deploying to the production environment, we have to tell the Prisma CLI who we are. There's a nifty `prisma login` command to help us do so. It opens up a browser window and asks us for some permissions, authenticating us on the terminal as soon as we grant the permissions.

Creating the `dev.env` file is pretty easy: we just use the `http://localhost:4466` we were already using. The `prod.env` file is a bit trickier since it needs the production URL, which we don't have yet. Deploying to production to the Prisma CLI takes this into account, prompting us to choose the server when we are deploying without a configured endpoint. After the deployment process, Prisma will write the correct endpoint in our `prisma.yml` file. Cutting it from there and pasting it into `prod.env` fixes our problem!

#### Exploring

Opening up the production URL for the Prisma service in the browser spins up a GraphQL Playground instance. However, it's not very helpful because **we are not authenticated**. The schema isn't loaded (which is great!) and all we have is an empty playground, with not much for us to do.

Luckily, from the Prisma Cloud UI we have a link that opens up a Playground instance with the correct authorization headers baked in 😄

In the version of Prisma Cloud shown by Andrew, the UI had a **Data Browser** tab. That was replaced by a **Prisma Admin** tab, serving the same purpose though with a different interface. It gives us a nice little mix of a GraphQL query runner (like a mini playground) and a database explorer.

Lastly, Prisma Cloud offers us a **Metrics** tab for monitoring requests made to our production instance and a **Deployment History** tab showing us details on what was changed in each of our deployments.

### Deploying our Node app

The first step here was installing the Heroku CLI:

```bash
$ npm i -g heroku
```

Similar to the Prisma CLI, we have a login command: 

```bash
$ heroku login
```

After executing the above command, enabling our server to listen to the port dynamically was necessary. [`GraphQL Yoga` has an API ready for this](https://github.com/prisma/graphql-yoga#startoptions-options-callback-options-options--void----null-promisevoid):

```javascript
const server = new GraphQLServer({ ... })

server.start({ port: process.env.PORT || 4000 }, () => {
  console.log('The server is up!')
})
```

Heroku injects the `PORT` env variable when it runs our app.

The `prisma.js` file also needed some minor tweaks. The `endpoint` value used to create our Prisma instance was also hardcoded with `http://localhost:4466`. Naturally, we need to leverage our `.env` files. `package.json` is an excellent place to do that. The `env-cmd` library was used to enable us to reference our `.env` files in our `package.json` scripts. First, our `start` script was renamed to `dev` and our `dev.env` file was loaded with it:

```json
"scripts": {
  ...
  "dev": "env-cmd ./config/dev.env nodemon src/index.js --ext js,graphql --exec babel-node"
}
```

```js
const prisma = new Prisma({
  ...
  endpoint: process.env.PRISMA_ENDPOINT,
})
```

With those changes, our development server still works 😏.

For production it's a bit more complicated. Usage of `babel-node` is only recommended for development purposes. Given that, we need to run our `start` script using only `node`. To do that, we need to use `babel` in a moment moment prior to running our app so that our `.js` files can be transpiled and executed properly by `node`. Given that we used modern features (like async/await) in our project, [there is also one little gotcha](https://babeljs.io/docs/en/babel-polyfill). We need to install `@babel/polyfill` and enable it in our project by importing it in our `index.js` file, before all other imports:

```js
import '@babel/polyfill/noConflict'
... // rest of index.js
```

> `babel` recommends importing '@babel/polyfill/noConflict' when running the `dev` server. Since the polyfill is baked in `babel-node`, we don't have to worry about it, but we also shouldn't import it twice and create conflicts!

To inform Heroku it should use `babel` to transpile everything before actually trying to run our app, we have to create a postbuild hook in `package.json`:

```json
"scripts": {
  ... // The name 'heroku-postbuild' must be exact!
  "heroku-postbuild": "babel src --out-dir dist --copy-files",
}
```

> We use the `--copy-files` flag so our `.graphql` files get copied over.

Finally, our `start` script looks like this:

```json
"scripts": {
  "start": "env-cmd ./config/prod.env node dist/index.js",
  ...
}
```

We could stop here, but that forces us to commit our `.env` files so that the `prod.env` can be read by Heroku. To fix that, we'll supply the necessary values through Heroku itself. Our `start` script can be simplified:

```json
"scripts": {
  "start": "node dist/index.js",
  ...
}
```

With all that configuration done, we can use the Heroku CLI to create our app:

```bash
$ heroku create
```

Supposedly, that command should also configure a `heroku` git remote for us. In my case, that step had to be done manually for some reason. [Following the docs was pretty straightforward](https://devcenter.heroku.com/articles/git#creating-a-heroku-remote):

```bash
$ heroku git:remote -a thawing-earth-50309
```

> `thawing-earth-50309` is the app name/ID in Heroku

To tell Heroku about our `PRISMA_ENDPOINT` we use the `heroku config` CLI command:

```bash
$ heroku config:set PRISMA_ENDPOINT=https://gql-bootcamp-c33a512316.herokuapp.com/gql-bootcamp/prod --app=thawing-earth-50309
```

Running `$ git push heroku master` starts the deployment process. Note that this uses the local `master` branch. In my case, I was working on the `module/production-deployment` branch, so my command looked something like:

```bash
$ git push heroku module/production-deployment:master
```

> The syntax used above is documented [here](https://devcenter.heroku.com/articles/git#deploying-from-a-branch-besides-master)

It's worth noting a very similar process was also executed for the `PRISMA_SECRET` env variable!

### This is never painfree

Making code production-ready doesn't necessarily involve drastic code changes, but I always find the process a bit *rocky*. Commits [1](https://github.com/eaverdeja/graphql-bootcamp/commit/74d586e94f8b14e2dbd1c5eea5d35eb5a8229a82), [2](https://github.com/eaverdeja/graphql-bootcamp/commit/578b28a7a890cedaed720645f7ab93b701904b1d), [3](https://github.com/eaverdeja/graphql-bootcamp/commit/17e21fc0e9f1463aafaeadaecdbc00fabe0bf9a7), [4](https://github.com/eaverdeja/graphql-bootcamp/commit/f0bf1e198b2ce1016a44e1f39dfdafc61bc00dcc), [5](https://github.com/eaverdeja/graphql-bootcamp/commit/fa0ac58cf44385dfb2657a15071e407702b3ed58) and [6](https://github.com/eaverdeja/graphql-bootcamp/commit/98f41b681f2b657ff52f92e3618c4d2480a613eb) show this 🙁

In the end, it's all good! We have a live GraphQL endpoint on Heroku 🏆
