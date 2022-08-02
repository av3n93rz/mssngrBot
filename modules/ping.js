module.exports = function (api) {
  return {
    name: ['ping'],
    admin: false,
    description: 'Health status check',
    function: () => 'Pong!'
  }
}
