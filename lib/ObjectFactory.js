var Autowire = require('./Autowire')

var ObjectFactory = function(constructor) {
  this._constructor = constructor
}

ObjectFactory.prototype.containerAware = function(container) {
  this._container = container
}

ObjectFactory.prototype.create = function(args, callback) {
  return this._container.create(this._constructor, args, callback)
}

module.exports = ObjectFactory
