var EventEmitter = require('events').EventEmitter
var util = require('util')
var async = require('async')

var Dependency = function (name, component, container, dependencies) {
  EventEmitter.call(this)

  this.setMaxListeners(0)

  this.name = name
  this.ready = false
  this.component = component
  this.dependencies = dependencies || []

  // do this a little later to allow the user to register all dependencies
  setImmediate(function () {
    this._testForCircularDependencies(this.name, [this.name], this.dependencies, container)

    var tasks = this.dependencies.map(container._getDependency, container).map(function (dependency) {
      return function (callback) {
        if (!dependency || dependency.ready) {
          return callback()
        }

        dependency.once('ready', callback)
      }
    })

    setImmediate(async.parallel.bind(async, tasks, this._onDependenciesReady.bind(this, container)))
  }.bind(this))
}
util.inherits(Dependency, EventEmitter)

Dependency.prototype._onDependenciesReady = function (container, error) {
  if (error) {
    container.emit('error', error)
  }

  try {
    if (typeof this.component.containerAware === 'function') {
      this.component.containerAware(container)
    }

    if (typeof this.component.afterPropertiesSet === 'function') {
      return this._invokeAfterPropertiesSet(container)
    }
  } catch (e) {
    error = e
  }

  this.ready = true
  setImmediate(this.emit.bind(this, 'ready', error, this.component))
}

Dependency.prototype._invokeAfterPropertiesSet = function (container) {
  if (this.component.afterPropertiesSet.length === 1) {
    return this._invokeDeferredAfterPropertiesSet(container)
  }

  var error

  try {
    this.component.afterPropertiesSet()
  } catch (e) {
    error = e
  }

  this.ready = true
  setImmediate(this.emit.bind(this, 'ready', error, this.component))
}

Dependency.prototype._invokeDeferredAfterPropertiesSet = function (container) {
  var timeout

  if (container.timeout) {
    timeout = setTimeout(function () {
      setImmediate(this.emit.bind(this, 'ready', new Error("Component '" + this.name + "' has not initialised after " + container.timeout + 'ms - to extend this window, pass a timeout value to the Container constructor')))
    }.bind(this), container.timeout)
  }

  try {
    this.component.afterPropertiesSet(function (error) {
      clearTimeout(timeout)

      this.ready = true

      // emit the event later in case we were not invoked asynchronously
      setImmediate(this.emit.bind(this, 'ready', error, this.component))
    }.bind(this))
  } catch (error) {
    clearTimeout(timeout)

    this.ready = true
    setImmediate(this.emit.bind(this, 'ready', error, this.component))
  }
}

Dependency.prototype._testForCircularDependencies = function (name, path, dependencies, container) {
  dependencies.forEach(function (depName) {
    if (depName === name) {
      return container.emit('error', new Error('Circular dependency detected ' + path.concat(name).join(' -> ')))
    }

    var dependency = container._getDependency(depName, true)

    if (!dependency) {
      return
    }

    this._testForCircularDependencies(name, path.concat(depName), dependency.dependencies, container)
  }.bind(this))
}

module.exports = Dependency
