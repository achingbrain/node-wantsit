var Autowire = require('../lib/Autowire'),
  expect = require('chai').expect

describe('Autowire', function () {
  it('One autowire should equal another', function() {
    expect(Autowire).to.equal(require('../lib/Autowire'))
  })

  it('should have the _autowire property', function() {
    expect(Autowire.__________autowire).to.be.ok
    expect(Autowire().__________autowire).to.be.ok
    expect(Autowire({optional: true}).__________autowire).to.be.ok
    expect(Autowire({name: 'foo'}).__________autowire).to.be.ok
    expect(Autowire({name: 'foo', optional: true}).__________autowire).to.be.ok
  })

  it('The _optional property should be present when specified', function() {
    expect(!Autowire.__________optional).to.be.ok
    expect(Autowire({optional: true}).__________optional).to.be.ok
  })

  it('The _name property should be present when specified', function() {
    expect(Autowire.__________name).to.not.exist
    expect(Autowire({name: 'foo'}).__________name).to.be.ok
  })
})
