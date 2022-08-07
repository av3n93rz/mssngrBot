const readLastLines = require('read-last-lines');

module.exports = function () {
  return {
    name: ['logs'],
    admin: true,
    description: 'Return last n lines of logs',
    function: async function (messageObj, query) {
      if(query.length === 0) {
        query = 15;
      }

      if (typeof query !== 'number') {
        query = parseInt(query, 10);
      }

      if (isNaN(query)) {
        throw new Error('Not a number')
      }

      const path = `${__dirname}/${process.env.LOGS_PATH}`
      try {
        const get_logs = () => new Promise((resolve) =>{
          readLastLines.read(path, query).then((lines) => {
            resolve(lines);
          })
        });
        const lines = await get_logs();
        return { 
          type: 'message',
          message: lines
        }
      } catch (err) {
        return { 
          type: 'message',
          message: err
        }
      }
    }
  }
}
