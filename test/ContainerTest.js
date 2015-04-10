var Container = require('../lib/Container'),
  Autowire = require('../lib/Autowire'),
  expect = require('chai').expect

describe('Container', function() {
  it('should register a thing', function() {
    var container = new Container()
    container.register('bar', {})

    expect(container.find('bar')).to.exist
  })

  it('should autowire a field', function() {
    var Foo = function() {
      this.bar = Autowire
    }

    var bar = {}

    var container = new Container()
    container.register('bar', bar)

    var foo = new Foo()
    container.autowire(foo)

    expect(foo.bar).to.equal(bar)
  })

  it('should always get latest component', function() {
    var Foo = function() {
      this.bar = Autowire
    }

    var originalBar = {}
    var newBar = {}

    // they should not be the same object
    expect(originalBar).to.not.equal(newBar)

    var container = new Container()
    container.register('bar', originalBar)

    var foo = new Foo()
    container.autowire(foo)

    // original bar should have been set
    expect(foo.bar).to.equal(originalBar)

    // overwrite original bar
    container.register('bar', newBar)

    // should have the new bar
    expect(foo.bar).to.equal(newBar)
  })

  it('should get a thing by type', function(done) {
    var Foo = function() {}

    var container = new Container()
    container.createAndRegister('bar', Foo)
    container.once('ready', function(container) {
      expect(container.find(Foo)).to.exist

      done()
    })
  })

  it('should not get a thing', function() {
    var Foo = function() {}

    var container = new Container()
    container.createAndRegister('bar', Foo)

    expect(container.find.bind(container, 'baz')).to.throw()
  })

  it('should error when failing to get a thing', function(done) {
    var Foo = function() {}

    var container = new Container()
    container.createAndRegister('bar', Foo)
    container.on('error', function(error) {
      expect(error.message).to.contain('No component with name baz has been registered')

      done()
    })

    container.find('baz')
  })

  it('should not get a thing by type', function() {
    var Bar = function() {
      this._bar = 'baz'
    }

    var Foo = function() {}

    var container = new Container()
    container.createAndRegister('bar', Bar)

    expect(container.find.bind(container, Foo)).to.throw()
  })

  it('should create and autowire all', function(done) {
    var container = new Container()
    container.createAndRegisterAll(__dirname + '/create-and-autowire-all-test')
    container.once('ready', function(container) {
      expect(container.find('foo')).to.exist
      expect(container.find('bar')).to.exist

      expect(container.find.bind(container, 'baz')).to.throw()

      done()
    })
  })

  it('should create and autowire all apart from one thing', function(done) {
    var container = new Container()
    container.createAndRegisterAll(__dirname + '/create-and-autowire-all-test', /Bar\.js/)
    container.once('ready', function() {
      expect(container.find('foo')).to.exist

      expect(container.find.bind(container, 'bar')).to.throw()

      done()
    })
  })

  it('should create and autowire all apart from more than one thing', function(done) {
    var container = new Container()
    container.createAndRegisterAll(__dirname + '/create-and-autowire-all-test', [/Bar\.js/, /Foo\.js/])
    container.once('ready', function() {
      expect(container.find.bind(container, 'foo')).to.throw()
      expect(container.find.bind(container, 'bar')).to.throw()

      done()
    })
  })

  it('should register a function when it\'s declared in a file that starts with lower case', function(done) {
    var container = new Container()
    container.createAndRegisterAll(__dirname + '/create-and-autowire-all-test')
    container.once('ready', function() {
      var qux = container.find('qux')
      expect(qux()).to.be.true

      done()
    })
  })

  it('should register a function on a method', function(done) {
    var Foo = function() {
      this._bar = 'baz'
    }
    Foo.prototype.qux = function() {
      return this._bar
    }

    var container = new Container()
    container.createAndRegisterFunction('quux', 'qux', Foo)
    container.once('ready', function() {
      var quux = container.find('quux')
      expect(quux()).to.equal('baz')

      done()
    })
  })

  it('should allow overriding name when autowiring', function(done) {
    var Foo = function() {
      this.bar = Autowire({name: 'baz'})
    }
    var Baz = function() {

    }
    Baz.prototype.hello = function() {
      return 'world'
    }

    var container = new Container()
    container.createAndRegister('foo', Foo)
    container.createAndRegister('baz', Baz)
    container.once('ready', function() {
      var foo = container.find('foo')
      expect(foo.bar.hello()).to.equal('world')

      done()
    })
  })

  it('should make autowired properties non-enumerable', function(done) {
    var Foo = function() {
      this.bar = Autowire
    }
    var Bar = function() {

    }

    var container = new Container()
    container.createAndRegister('foo', Foo)
    container.createAndRegister('bar', Bar)
    container.once('ready', function() {
      var foo = container.find('foo')
      expect(Object.keys(foo)).to.not.contain('bar')

      done()
    })
  })

  it('should call containerAware method after registering', function(done) {
    var container = new Container()

    var Foo = function() {

    }
    Foo.prototype.containerAware = function(cont) {
      expect(container).to.equal(cont)

      done()
    }

    container.createAndRegister('foo', Foo)
  })

  it('should call afterPropertiesSet method after autowiring', function(done) {
    var Foo = function() {
      this._bar = Autowire
    }
    Foo.prototype.afterPropertiesSet = function() {
      expect(this._bar).to.equal(5)

      done()
    }

    var container = new Container()
    container.createAndRegister('foo', Foo)
    container.register('bar', 5)
  })

  it('should override logger', function() {
    var Foo = function() {

    }

    var logger = {
      info: function() {},
      warn: function() {},
      error: function() {},
      debug: function() {}
    }

    var container = new Container()
    container.setLogger(logger)

    container.createAndRegister('foo', Foo)
  })

  it('should object when trying to register an invalid component', function() {
    var container = new Container()

    expect(container.register.bind(container, 'foo')).to.throw()
  })

  it('should create an object and pass it to a callback', function(done) {
    var constructor = function() {}
    var container = new Container()

    container.create(constructor, function(error, instance) {
      expect(instance).to.be.an.instanceof(constructor)
      done()
    })
  })

  it('should pass an error to the callback when initialisation fails', function(done) {
    var constructor = function() {}
    constructor.prototype.afterPropertiesSet = function() {
      throw new Error('panic!')
    }

    var container = new Container()
    container.create(constructor, function(error) {
      expect(error.message).to.contain('panic!')
      done()
    })
  })

  it('should emit error when initialisation fails and no callback is specified', function(done) {
    var Dep = function() {

    }
    Dep.prototype.afterPropertiesSet = function() {
      throw new Error('Urk!')
    }

    var container = new Container()
    container.on('error', function(error) {
      expect(error).to.be.ok
      expect(error.message).to.equal('Urk!')

      done()
    })
    container.create(Dep)
  })

  it('should pass an error to the callback when constructor fails', function(done) {
    var constructor = function() {
      throw new Error('panic!')
    }

    var container = new Container()
    container.create(constructor, function(error) {
      expect(error.message).to.contain('panic!')
      done()
    })
  })

  it('should emit error when constructor fails and no callback is specified', function(done) {
    var Dep = function() {
      throw new Error('Urk!')
    }

    var container = new Container()
    container.on('error', function(error) {
      expect(error).to.be.ok
      expect(error.message).to.equal('Urk!')

      done()
    })
    container.create(Dep)
  })

  it('should pass an error to the callback when containerAware fails', function(done) {
    var constructor = function() {}
    constructor.prototype.containerAware = function() {
      throw new Error('panic!')
    }

    var container = new Container()
    container.create(constructor, function(error) {
      expect(error.message).to.contain('panic!')
      done()
    })
  })

  it('should emit error when containerAware fails and no callback is specified', function(done) {
    var Dep = function() {

    }
    Dep.prototype.containerAware = function() {
      throw new Error('Urk!')
    }

    var container = new Container()
    container.on('error', function(error) {
      expect(error).to.be.ok
      expect(error.message).to.equal('Urk!')

      done()
    })
    container.create(Dep)
  })

  it('should defer callback until afterPropertiesSet callback is invoked', function(done) {
    var deferred = false

    var constructor = function() {}
    constructor.prototype.afterPropertiesSet = function(done) {
      setTimeout(function() {
        deferred = true
        done()
      }, 500)
    }
    var container = new Container()

    container.create(constructor, function() {
      expect(deferred).to.be.true
      done()
    })
  })

  it('should wait for dependencies to be ready', function(done) {
    var Dep = function(timeout) {
      this._timeout = timeout
      this.ready = false
    }
    Dep.prototype.afterPropertiesSet = function(done) {
      setTimeout(function() {
        this.ready = true
        done()
      }.bind(this), this._timeout)
    }

    var Component = function() {
      this._dep1 = Autowire
      this._dep2 = Autowire
    }
    Component.prototype.afterPropertiesSet = function() {
      expect(this._dep1.ready).to.be.true
      expect(this._dep2.ready).to.be.true
      done()
    }

    var container = new Container()
    container.createAndRegister('dep1', Dep, [100])
    container.createAndRegister('dep2', Dep, [200])
    container.createAndRegister('component', Component)
  })

  it('should error on circular dependencies', function(done) {
    var d = false
    var Dep1 = function() {
      this._dep2 = Autowire
    }
    var Dep2 = function() {
      this._dep1 = Autowire
    }
    var container = new Container()
    container.on('error', function(error) {
      expect(error.message).to.contain('Circular')

      if(!d) {
        d = true
        done()
      }
    })

    container.createAndRegister('dep1', Dep1)
    container.createAndRegister('dep2', Dep2)
  })

  it('should allow overriding timeouts', function() {
    var container = new Container({
      timeout: 0
    })

    expect(container.timeout).to.equal(0)
  })
})
