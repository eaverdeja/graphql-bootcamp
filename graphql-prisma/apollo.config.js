module.exports = {
  client: {
    service: {
      name: 'graphql-bootcamp',
      url: 'http://localhost:4466',
    },
    includes: ['src/**/*.js'],
    excludes: ['src/generated/**', 'prisma/datamodel.prisma'],
  },
}
