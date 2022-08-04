module.exports = function (api) {
  return {
    name: ['help'],
    admin: false,
    description: 'Provides help',
    function: function (messageObj) {
      console.log(messageObj)
      const builder = ['Commands', '-------------']
      for (const commandStr of Object.keys(api.commandMap.all).sort()) {
        if (api.commandRequiresAdmin(commandStr) && api.admins.indexOf(messageObj.authorId) == -1) continue
        builder.push(`\`${api.command_prefix}${commandStr}\` - ${api.commandMap.all[commandStr].description}`)
      }
      return { 
        type: 'message',
        message: builder.join('\n')
      }
    }
  }
}
