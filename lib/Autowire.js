/**
 * A placeholder for autowired values
 */
var Autowire = function (options) {
  if (!(this instanceof Autowire)) {
    return new Autowire(options)
  }

  this.__________autowire = true

  if (!options) {
    return this
  }

  if (options.name) {
    this.__________name = options.name
  }

  if (options.optional) {
    this.__________optional = true
  }

  return this
}
Autowire = Autowire.bind(Autowire)
Autowire.__________autowire = true

module.exports = Autowire
