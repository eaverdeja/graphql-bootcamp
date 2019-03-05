module.exports = {
  client: {
    service: {
      name: 'graphql-bootcamp',
      url: 'http://localhost:4466/reviews/default'
    },
    includes: ['src/**/*.js'],
    excludes: ['src/generated/**', '*/**/datamodel.prisma']
  }
}
