var Dependency = require('../lib/Dependency')
var sinon = require('sinon')
var expect = require('chai').expect
var it = require('mocha').it
var describe = require('mocha').describe

describe('Dependency', function () {
  it('should propagate Dependency initialisation errors', function (done) {
    var container = {
      _getDependency: sinon.stub(),
      timeout: 5000
    }

    var dep = new Dependency('dep', {
      afterPropertiesSet: function (done) {
        done(new Error('urk!'))
      }
    }, container, [])
    dep.on('ready', function (error) {
      expect(error.message).to.contain('urk!')
      done()
    })
  })

  it('should catch exceptions thrown during afterPropertiesSet', function (done) {
    var container = {
      _getDependency: sinon.stub(),
      timeout: 5000
    }

    var dep = new Dependency('dep', {
      afterPropertiesSet: function () {
        throw new Error('urk!')
      }
    }, container, [])
    dep.on('ready', function (error) {
      expect(error.message).to.contain('urk!')
      done()
    })
  })

  it('should catch exceptions thrown during deferred afterPropertiesSet', function (done) {
    var container = {
      _getDependency: sinon.stub(),
      timeout: 5000
    }

    var dep = new Dependency('dep', {
      afterPropertiesSet: function (done) {
        throw new Error('urk!')
      }
    }, container, [])
    dep.on('ready', function (error) {
      expect(error.message).to.contain('urk!')
      done()
    })
  })

  it('should propagate dependency exceptions', function (done) {
    var container = {
      _getDependency: sinon.stub(),
      emit: sinon.stub(),
      timeout: 5000
    }

    var dep = new Dependency('dep', {
      afterPropertiesSet: function (done) {
        setTimeout(function () {
          done(new Error('urk!'))
        }, 100)
      }
    }, container, [])
    container._getDependency.withArgs('dep').returns(dep)

    var component = new Dependency('foo', {}, container, ['dep'])
    component.once('ready', function (error) {
      expect(error.message).to.contain('urk!')
      done()
    })
  })

  it("should time out if dependency doesn't initialise", function (done) {
    var container = {
      _getDependency: sinon.stub(),
      timeout: 10
    }

    var dep = new Dependency('dep', {
      afterPropertiesSet: function (done) {}
    }, container, [])
    dep.on('ready', function (error) {
      expect(error.message).to.contain("Component 'dep' has not initialised after 10ms")
      done()
    })
  })

  it('should not time out when timeouts are disabled', function (done) {
    var container = {
      _getDependency: sinon.stub(),
      timeout: 0
    }

    new Dependency('dep', {
      afterPropertiesSet: function (d) {
        setTimeout(done, 50)
      }
    }, container, []).toString()

    container.emit = function () {
      done(new Error('oops'))
    }
  })

  it('should not register for ready even on dependencies that are already ready', function (done) {
    var container = {
      _getDependency: sinon.stub(),
      timeout: 0
    }
    var depDep = {
      ready: true,
      on: sinon.stub()
    }

    var dep = new Dependency('dep', {
      afterPropertiesSet: function (d) {
        setTimeout(done, 50)
      }
    }, container, [depDep])

    dep.on('ready', function () {
      expect(depDep.on.called).to.be.false
      done()
    })
  })
})
