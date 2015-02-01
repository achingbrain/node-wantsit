var Autowire = require('./Autowire'),
  _s = require('underscore.string'),
  check = require('check-types'),
  fs = require('fs'),
  toarray = require('toarray'),
  EventEmitter = require('events').EventEmitter,
  util = require('util'),
  Dependency = require('./Dependency')

var Container = function(options) {
  EventEmitter.call(this)

  this._store = {}
  this._options = options || {}
  this.timeout = isNaN(this._options.timeout) ? 5000 : this._options.timeout
  this._logger = this._options.logger || {
    info: console.info,
    warn: console.warn,
    error: console.error,
    debug: function() {}
  }
  this._immediate = null
}
util.inherits(Container, EventEmitter)

Container.prototype.setLogger = function(logger) {
  check.assert.function(logger.info, 'Logger should declare an info method')
  check.assert.function(logger.warn, 'Logger should declare an warn method')
  check.assert.function(logger.error, 'Logger should declare an error method')
  check.assert.function(logger.debug, 'Logger should declare a debug method')

  this._logger = logger
}

Container.prototype.register = function(name, component) {
  check.assert.string(name, 'Please pass a string as the component name')

  if(!component) {
    throw new Error('Please pass a component to register')
  }

  if(this._store[name]) {
    this._logger.debug('ApplicationContext', 'Component with name', name, 'is being overridden')
  }

  component = component instanceof Dependency ? component : new Dependency(name, component, this)

  this._store[name] = component

  component.once('ready', this._checkReady.bind(this))
}

Container.prototype.find = function(name) {
  if(typeof(name) === 'string' || name instanceof String) {
    return this._getByName(name)
  }

  return this._getByType(name)
}

Container.prototype.autowire = function(component) {
  check.assert.object(component, 'Please pass an object to autowire')

  var dependencies = []

  for(var key in component) {
    var autowire = component[key]

    // can't use instanceof in case the Autowire object was loaded from different
    // source files e.g. different versions of wantsit
    if(!autowire || !autowire.__________autowire) {
      continue
    }

    var name = _s.startsWith(key, '_') ? key.substring(1) : key

    if(autowire.__________name) {
      name = autowire.__________name
    }

    var optional = !!autowire.__________optional

    delete component[key]

    dependencies.push(name)

    Object.defineProperty(component, key, {
      get: function(name, optional) {
        return this._getByName(name, optional)
      }.bind(this, name, optional)
    })
  }

  return dependencies
}

Container.prototype.createAndRegister = function(name, component, constructorArgs, callback) {
  check.assert.string(name, 'Please pass a string as the component name')
  check.assert.function(component, 'Please pass a function to use as the component constructor')

  var dependency = this._createDependency(name, component, constructorArgs, callback)

  this.register(name, dependency)
}

Container.prototype.createAndRegisterFunction = function(name, method, component, constructorArgs, callback) {
  check.assert.string(name, 'Please pass a string as the component name')
  check.assert.function(component, 'Please pass a function to use as the component constructor')

  var dependency = this._createDependency(name, component, constructorArgs, callback)
  dependency.component = dependency.component[method].bind(dependency.component)

  this.register(name, dependency)
}

Container.prototype.create = function(component, constructorArgs, callback) {
  check.assert.function(component, 'Please pass a function to use as the component constructor')

  this._createDependency('', component, constructorArgs, callback)
}

Container.prototype._createDependency = function(name, component, constructorArgs, callback) {
  constructorArgs = constructorArgs || []

  if(typeof constructorArgs == 'function') {
    callback = constructorArgs
    constructorArgs = []
  }

  var managed

  try {
    managed = this._construct(component, constructorArgs)
  } catch(error) {
    if(callback) {
      return callback(error)
    } else {
      return this.emit('error', error)
    }
  }

  var dependencies = this.autowire(managed)
  var dependency = new Dependency(name, managed, this, dependencies)

  dependency.once('ready', function(error) {
    if(callback) {
      callback.apply(this, arguments)
    } else if(error) {
      this.emit('error', error)
    }
  }.bind(this))

  return dependency
}

Container.prototype.createAndRegisterAll = function(path, excludes) {
  check.assert.string(path, 'Please pass a path to recurse into')

  excludes = toarray(excludes)

  var readDirectory = function(directory) {
    fs.readdirSync(directory).forEach(function(file) {
      var fullPath = directory + '/' + file
      var stats = fs.statSync(fullPath)

      if(stats.isDirectory()) {
        return readDirectory(fullPath)
      }

      if(!_s.endsWith(file, '.js')) {
        return
      }

      var include = true

      excludes.forEach(function(excludes) {
        if(fullPath.match(excludes)) {
          include = false
        }
      })

      if(!include) {
        return
      }

      if(file.substr(0, 1).toUpperCase() == file.substr(0, 1)) {
        // Foo is a class definition, create and register it
        var name = file.substr(0, 1).toLowerCase() + file.substr(1).replace('.js', '')
        this._logger.debug('Container', 'Creating', name, 'from', fullPath)
        this.createAndRegister(name, require(fullPath))
      } else {
        // foo is a function, just register it
        var name = file.replace('.js', '')
        this._logger.debug('Container', 'Registering', name, 'from', fullPath)
        this.register(name, require(fullPath))
      }
    }.bind(this))
  }.bind(this)
  readDirectory(path)
}

Container.prototype._getByName = function(name, optional) {
  if(!this._store[name] && !optional) {
    throw new Error('No component with name ' + name + ' has been registered')

    return
  }

  return this._store[name].component
}

Container.prototype._getByType = function(type) {
  for(var key in this._store) {
    if(this._store[key].component instanceof type) {
      return this._store[key].component
    }
  }

  throw new Error('No component with type ' + type + ' has been registered')
}

Container.prototype._getDependency = function(name) {
  if(!this._store[name]) {
    this.emit('error', new Error('No component with name ' + name + ' has been registered'))

    return
  }

  return this._store[name]
}

Container.prototype._construct = function(constructor, args) {
  function f() {
    return constructor.apply(this, args)
  }

  f.prototype = constructor.prototype

  return new f()
}

Container.prototype._checkReady = function() {
  if(this._immediate) {
    clearImmediate(this._immediate)
  }

  this._immediate = setImmediate(function() {
    var ready = true

    for(var key in this._store) {
      if(!this._store[key].ready) {
        ready = false
        break
      }
    }

    if(ready) {
      this.emit('ready')
    }
  }.bind(this))
}

module.exports = Container
