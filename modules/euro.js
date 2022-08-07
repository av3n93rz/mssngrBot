const request = require('request')

module.exports = function() {
    return {
      name: ['euro'],
      admin: false,
      description: 'Returns euro to huf exchange rate',
      function: async function () {
        return new Promise(function(resolve, reject) {
          request(
            {
              url: 'https://www.google.com/search?q=euro+to+huf',
              method: 'GET',
            }, (err, status, body) => {
                const expression = /([0-9]{3},[0-9]{2}).magyar forint/g
                console.log(body)
                const res = body.match(expression)[0].split(' ')[0]
                resolve({ 
                  type: 'message',
                  message: '1 euro = ' + res + 'HUF',
                })
            }
          )
        })
      }
    }
  }
  