module.exports = function () {
  return {
    name: ['rollfor'],
    admin: false,
    description: 'Roll for target value',
    function: function (messageObj, str) {
      if (!(str = str.trim())) throw Error('No input')

      if (isNaN(str) ) throw Error('The target should be a number')
	  
	  const rolledValue = Math.floor(Math.random() * (20)) + 1
	  
	  if (rolledValue == 1)
		return {
			type: 'message',
			message: '1, Critical Fail!'
		}
		
	  if (rolledValue == 20)
		return {
			type: 'message',
			message: '20, Critical Hit!'
		}
		
	  if (rolledValue >= str)
		return {
			type: 'message',
			message: rolledValue + ', target met!'
		}

      return {
			type: 'message',
			message: rolledValue + ', target not met!'
	  }
    }
  }
}
