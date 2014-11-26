var Autowire = require('./Autowire')

var ObjectFactory = function(constructor) {
  this._constructor = constructor
}

ObjectFactory.prototype.containerAware = function(container) {
  this._container = container
}

ObjectFactory.prototype.create = function() {
  var args = Array.prototype.slice.call(arguments)
  args.unshift(this._constructor)

  return this._container.create.apply(this._container, args)
}

module.exports = ObjectFactory
