var ObjectFactory = require('../lib/ObjectFactory'),
  expect = require('chai').expect

describe('ObjectFactory', function() {
  it('should create and autowire an object', function() {
    var foo = function(arg1, arg2) {
      this._arg1 = arg1
      this._arg2 = arg2
    }

    var factory = new ObjectFactory(foo)
    factory.containerAware({
      create: function(constructor, arg1, arg2) {
        return new constructor(arg1, arg2)
      }
    })

    var created = factory.create('one', 'two')

    expect(created).to.be.an.instanceof(foo)
    expect(created._arg1).to.equal('one')
    expect(created._arg2).to.equal('two')
  })
})
