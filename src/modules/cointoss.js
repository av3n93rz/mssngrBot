module.exports = function () {
    return {
      name: ['cointoss'],
      admin: false,
      description: 'Returns heads or tails',
      function: function () {
        const result = Math.round(Math.random()) === 0 ? 'heads': 'tails';
        return { 
          type: 'message',
          message: result
        }
      }
    }
  }
  