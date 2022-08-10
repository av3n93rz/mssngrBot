module.exports = function () {
    return {
      name: ['yorn'],
      admin: false,
      description: 'Returns yes or no',
      function: function (messageObj, query) {
        if(query.length === 0) {
            return { 
                type: 'message',
                message: 'Error: Nincs kérdés'
              }
        }
        const result = Math.round(Math.random()) === 0 ? 'Igen': 'Nem';
        return { 
          type: 'message',
          message: result
        }
      }
    }
  }
  