var expect = require('chai').expect
var lib = require('../')

describe('library', function () {
  it('should export something useful', function () {
    expect(lib.Container).to.be.a('function')
    expect(lib.Autowire).to.be.a('function')
    expect(lib.ObjectFactory).to.be.a('function')
  })
})
