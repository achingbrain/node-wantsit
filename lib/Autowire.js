/**
 * A placeholder for autowired values
 */
var Autowire = function(options) {
  if(!options) {
    return;
  }

  if(options.qualifier) {
    this.__________qualifier = options.qualifier;
  }

  if(options.optional) {
    this.__________optional = true;
  }

  return this;
};
Autowire.__________autowire = true;

module.exports = Autowire;
