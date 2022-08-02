module.exports = function (api) {
  return {
    name: ['choice'],
    admin: false,
    description: 'Consult the mystical RNG!11oneone',
    function: function (messageObj, str) {
      if (!(str = str.trim())) throw Error('No input')
      const elems = str.split(' ')
      return 'RNG has chosen ' + elems[Math.floor(Math.random() * elems.length)] + '!'
    }
  }
}
