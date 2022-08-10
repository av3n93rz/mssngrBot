module.exports = function () {
  return {
    name: ['ping'],
    admin: false,
    description: 'Health status check',
    function: () => ({
      type: 'message',
      message: 'Pong!'
    })
  }
}
