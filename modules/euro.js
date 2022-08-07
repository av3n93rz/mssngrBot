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
              url: 'https://www.exchange-rates.org/converter/EUR/HUF/1',
              method: 'GET',
            }, (err, status, body) => {
                const expression = /(1 EUR = [0-9].*\.[0-9].* HUF)/g
                const res = body.match(expression)[0]
                resolve({ 
                  type: 'message',
                  message: res,
                })
            }
          )
        })
      }
    }
  }
  