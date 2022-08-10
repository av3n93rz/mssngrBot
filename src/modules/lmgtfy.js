module.exports = function () {
  return {
    name: ['lmgtfy'],
    admin: false,
    description: '( ͡° ͜ʖ ͡°)',
    function: function (messageObj, query) {
      if (!query) throw Error('No query')
      var url = 'http://lmgtfy.com/?q=' + encodeURIComponent(query)
      return {
        type: 'message',
        message: url
      }
    }
  }
}
