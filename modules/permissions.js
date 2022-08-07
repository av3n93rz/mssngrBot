const fs = require('fs')

class PermissionManager {
  constructor () {
    this.perms = {}
    this.filePath = null
  }

  load (file) {
    this.perms = fs.existsSync(file)
      ? JSON.parse(fs.readFileSync(file, 'utf8'))
      : {}
    this.filePath = file
  }

  write (file) {
    if (!file && !this.filePath) throw Error('No file path specified')
    file = file || this.filePath
    fs.writeFileSync(file, JSON.stringify(this.perms))
  }

  _touchUser (userID) {
    if (!(userID in this.perms)) this.perms[userID] = {}
  }

  allow (userID, commandStr) {
    this._touchUser(userID)
    this.perms[userID][commandStr] = true
  }

  revoke (userID, commandStr) {
    this._touchUser(userID)
    this.perms[userID][commandStr] = false
  }

  unset (userID, commandStr) {
    this._touchUser(userID)
    delete this.perms[userID][commandStr]
  }

  view (userID) {
    this._touchUser(userID)
    return this.perms[userID]
  }

  check (userID, commandStr) {
    return this.view(userID)[commandStr]
  }

  dump () {
    return this.perms
  }
}

PermissionManager = new PermissionManager()
PermissionManager.load(__dirname + '/../' + '.permissions.json')

module.exports = function (api) {
  const permissionsFunctionWrapper = function (func) {
    return async function (messageObj) {
      const commandStr = messageObj.body
        .split(' ')[0]
        .toLowerCase()
        .replace(api.command_prefix.toLowerCase(), '')
      const check = (() => {
        const check = PermissionManager.check(messageObj.sender, commandStr)
        if (check) return true
        if (typeof check === 'undefined') {
          if (!api.commandMap[commandStr]._admin) return true
          if (api.admins.indexOf(Number(messageObj.sender)) > -1) return true
        }
        return false
      })()

      if (!check) { throw Error('You do not have permission to execute this command!') }
      return await func(...arguments)
    }
  }

  api.commandRequiresAdmin = function (commandStr) {
    return api.commandMap[commandStr]._admin
  }

  const funcs = {
    list: function () {
      return [
        'Availabe command permission strings:',
        ...Object.keys(api.commandMap).sort()
      ].join('\n')
    },

    check: async function (messageObj, userID) {
      if (!userID) throw Error('Invalid arguments')

      const permissions = PermissionManager.view(userID)
      if (Object.keys(permissions).length === 0) {
        return `User ${userID} has no custom permissions`
      }

      const _permissions = []
      for (const permission of Object.keys(permissions).sort()) {
        _permissions.push(
          `${permissions[permission] ? '+' : '-'} ${permission}`
        )
      }
      return [`User ${userID} has the permissions:`, ..._permissions].join(
        '\n'
      )
    },

    allow: async function (messageObj, userID, permission) {
      if (!userID || !permission) throw Error('Invalid arguments')

      PermissionManager.allow(userID, permission)
      PermissionManager.write()
      return `User ${userID} given permission \`${permission}\``
    },

    revoke: async function (messageObj, userID, permission) {
      if (!userID || !permission) throw Error('Invalid arguments')

      PermissionManager.revoke(userID, permission)
      PermissionManager.write()
      return `User ${userID} revoked permission \`${permission}\``
    },

    unset: async function (messageObj, userID, permission) {
      if (!userID || !permission) throw Error('Invalid arguments')

      PermissionManager.unset(userID, permission)
      PermissionManager.write()
      return `Permission \`${permission}\` reset for user ${userID}`
    }
  }

  return {
    name: ['permissions'],
    admin: true,
    description: 'Provides help',

    function: async function (messageObj, args) {
      args = args.split(' ')
      if (args.length === 0 || Object.keys(funcs).indexOf(args[0]) === -1) {
        return [
          'Permissions Commands',
          '----------------',
          '`list`',
          '`check` <name>',
          '`allow` <name> <command>',
          '`revoke` <name> <command>',
          '`unset` <name> <command>',
          '----------------'
        ].join('\n')
      }

      const command = args[0]
      const nameStr = args.slice(1, -1).join(' ')
      const permission = args.slice(-1)

      // Badly written code yeet
      return await funcs[command](messageObj, nameStr || permission, permission)
    },
    onFinishLoad: function () {
      // Set wrapper
      for (const commandStr in api.commandMap) {
        api.commandMap[commandStr].function = permissionsFunctionWrapper(
          api.commandMap[commandStr].function
        )
        api.commandMap[commandStr]._admin =
          api.commandMap[commandStr].admin || false
        api.commandMap[commandStr].admin = false
      }
    }
  }
}
