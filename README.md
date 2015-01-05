# wantsit

[![Dependency Status](https://david-dm.org/achingbrain/node-wantsit.svg?theme=shields.io)](https://david-dm.org/achingbrain/node-wantsit) [![devDependency Status](https://david-dm.org/achingbrain/node-wantsit/dev-status.svg?theme=shields.io)](https://david-dm.org/achingbrain/node-wantsit#info=devDependencies) [![Build Status](https://img.shields.io/travis/achingbrain/node-wantsit/master.svg)](https://travis-ci.org/achingbrain/node-wantsit) [![Coverage Status](http://img.shields.io/coveralls/achingbrain/node-wantsit/master.svg)](https://coveralls.io/r/achingbrain/node-wantsit)

Super lightweight dependency resolution, autowiring and lifecycle management.

Or, yet another dependency injection framework.

## Wat?

Using dependency injection decouples your code and makes it more maintainable, readable and testable.

Imagine I have some code like this:

```javascript
var MadeUpDb = require('madeupdb')

var MyClass = function() {
  this._db = new Madeupdb('localhost', 'database_name', 'username', 'password')
}

MyClass.prototype.getTheThings() {
  return this._db.query('SELECT foo FROM bar')
}
```

`MyClass` is tightly coupled to `MadeUpDb`, which is to say I can't use this class now without having `MadeUpDb` available on `localhost` and `database_name` configured for `username:password@localhost`, nor can I use a different implementation (a mock object, in memory db, etc - perhaps for testing purposes).

If instead I did this:

```javascript
var Autowire = require('wantsit').Autowire

var MyClass = function() {
  this._db = Autowire
};

...
```

Not only is there less boilerplate, `MyClass` has been freed from the responsibility of configuring and acquiring a data source (a beard might call this [Inversion of Control](http://en.wikipedia.org/wiki/Inversion_of_control)) which lets me:

 * Concentrate on the interesting bits of `MyClass` (e.g. `getTheThings()`)
 * Easily mock behaviour in tests by setting `_db`
 * Control resources centrally (were I to have two instances of `MyClass`, the can now share a db connection)
 * Introduce new functionality without changing `MyClass`. Want a connection pool? No problem, want to wrap `MadeUpDb`, [AOP](http://en.wikipedia.org/wiki/Aspect-oriented_programming) style? Done.  Swap `MadeUpDb` for `NewHotDB`? Easy.

Amazing, right?

## I'm sold, show me an example

```javascript
var Autowire = require('wantsit').Autowire,
  Container = require('wantsit').Container

var Foo = function() {
  // works with this._bar or this.bar
  this._bar = Autowire
};

Foo.prototype.doSomething() {
 this._bar.sayHello()
}

...

var Bar = function() {

}

Bar.prototype.sayHello() {
  console.log('hello!')
}

...

var container = new Container()
container.register('bar', new Bar())

var foo = new Foo()
container.autowire(foo)

foo.doSomething() // prints 'hello!'
```

## Lifecycle management

`container.create` will instantiate your object and autowire it:

```javascript
container.create(Foo)
...
```

Pass a callback function if you require access to your object after creation:

```javascript
container.create(Foo, function(error, foo) {
  ...
})
```

Constructor arguments are also supported by passing an array of arguments:

```javascript
var Foo = function(message) {
  console.log(message)
}

var foo = container.create(Foo, ['Hello world!'])
...
```

## Magic methods

There are optional methods you can implement to be told when things happen.

```javascript
// called after autowiring and before afterPropertiesSet
Foo.prototype.containerAware = function(container) {

}

// called after autowiring and after containerAware
Foo.prototype.afterPropertiesSet = function([done]) {

}
```

If you specify an argument to `afterPropertiesSet`, you can defer execution of the callback:

```javascript
// called after autowiring and after containerAware
Foo.prototype.afterPropertiesSet = function(done) {
  this._dep(function(error) {
    done(error)
  })
}
...

container.create(Foo, function(error, foo) {
  // will not be invoked until foo._dep (above) has returned 
})
```

`afterPropertiesSet` will be invoked on your class after is has been invoked on all dependencies that also declare it:

```javascript
Foo = function() {}
Foo.prototype.afterPropertiesSet = function(done) {
  // do something that takes a while
  setTimeout(done, 1000)
}

Bar = function() {
  this._foo = Autowire
}
Bar.prototype.afterPropertiesSet = function() {
  // will not be invoked until the callback passed to 
  // foo.afterPropertiesSet has been called
}

...

container.createAndRegister('foo', Foo)
container.createAndRegister('bar', Bar)
```

N.b. this means that circular dependencies are not allowed as they will never initialise!

### Initialisation timeouts

By default we wait up to 5000ms for a deferring `afterPropertiesSet` to invoke the passed callback.  To override this timeout, pass an option to the container constructor:

```javascript
var container = new Container({
  timeout: 10000 // or 0 to disable the timeout
})
```

## Dynamic getters

Look-ups occur at runtime, so you can switch out application behaviour without a restart:

```javascript
// create a bar
container.register('bar', function() {
  console.log('hello')
})

// this is our autowired component
var Foo = function() {
  this._bar = Autowire
}

Foo.prototype.doSomething = function() {
  this._bar();
}

// create and autowire it
var foo = container.create(Foo)

foo.doSomething() // prints 'hello!'

// overwrite bar
container.register('bar', function() {
  console.log('world')
})

foo.doSomething() // prints 'world!'
```

All autowired properties are converted to non-enumerable fields so we can `JSON.stringify` without serialising the entire object graph.

## I want to register all of the things!

```javascript
container.createAndRegisterAll(__dirname + '/lib')
```

To use this, all your components must be in or under the lib directory.  Anything that ends in `.js` will be newed up and autowired.

No constructor arguments are supported, it's `Autowire` all the way down.

### Woah, not literally all of the things

Ok, specify a regex as the second argument - anything that matches it will be excluded

```javascript
container.createAndRegisterAll(__dirname + '/lib', /excludeme\.js/)
```

Regex?  Great, now I've got two problems.  Why stop there?  Pass in an array of regexes:

```javascript
container.createAndRegisterAll(__dirname + '/lib', [/pattern1/, /pattern2/])
```

### I want to have functions automatically registered

Declare them in a file with a lowercase letter.  Eg:

```javascript
// myFunc.js
module.exports = function() {
  return true
}
```

..as opposed to a class which should be in a file that starts with a capital letter:

```javascript
// MyClass.js
var MyClass = function() {}

MyClass.prototype.foo = function() {
  return true
}

module.exports = MyClass
```

```javascript
container.createAndRegisterAll(__dirname + '/lib')

// find and invoke our function
var foo = container.find('myFunc')
foo()

// find and invoke a method on our singleton
var myClass = container.find('myClass')
myClass.foo()
```

### I want to register a function on a class

No problem, just use the `createAndRegisterFunction` method.  The first argument is the name to register the
function under, the second is the name of the method on the class, the third is the class constructor. Any
subsequent arguments will be passed to the constructor.

```javascript
// MyClass.js
var MyClass = function() {}

MyClass.prototype.foo = function() {
  return true
}

module.exports = MyClass
```

```javascript
container.createAndRegisterFunction('fooFunc', 'foo', MyClass)

// find and invoke our function
var foo = container.find('fooFunc')
foo()
```

### My dependency is optional

Pass the `optional` option to Autowired:

```javascript
// MyClass.js
var MyClass = function() {
  this._foo = Autowired({optional: true})
};

MyClass.prototype.doSomething = function() {
  // we are now responsible for making sure this._foo is not null before using it
  if(this._foo) {
    // ...
  }
}
```

### I don't want to use the property name to resolve my dependency

Pass the `name` option to Autowired:

```javascript
// index.js
container.register('bar', {
  baz: function() {
    return 'hello!'
  }
})

// MyClass.js
var MyClass = function() {
  this._foo = Autowired({name: 'bar'})
};

MyClass.prototype.doSomething = function() {
  // this._foo is 'bar' from the container
  this._foo.baz()
}
```

## Object Factories

You can also automate the creation and autowiring of classes

```javascript
var ObjectFactory = require('wantsit').ObjectFactory

var Foo = function(arg1, arg2) {
  this._arg1 = arg1
  this._arg2 = arg2

  // Autowired fields will be populated automatically
  this._dep = Autowired
}

// place an instance of the factory in the container
container.createAndRegister('fooFactory', ObjectFactory, [Foo]);

// MyClass.js
var MyClass = function() {
  this._fooFactory = Autowired
}

MyClass.prototype.doSomething = function() {
  this._fooFactory.create(['one', 'two'], function(error, foo) {
    foo._arg1 // 'one'
    foo._arg2 // 'two'
  })
}
```

## Events

### `error`

The `error` event will be emitted if a component throws an error event during invocation of it's constructor, or `afterPropertiesSet`/`containerAware` methods, or if it passes an error object to the the `afterPropertiesSet` callback.  If a callback was passed to the `create` method, it will receive the error instead:

```javascript
// class that throws an error during construction
var Foo = function() {
  throw new Error('Panic!')
}

...

// no callback passed to `createAndRegister` so container emits error event
var container = new Container()
container.createAndRegister('foo', Foo)
container.on('error', function(error) {
  // receives error event
})

...

// here we pass a callback which will receive the error instead
var container = new Container()
container.createAndRegister('foo', Foo, function(error) {
  // receives error event
})
```

### `ready`

The `ready` event will be emitted once all currently registered components have initialised.  If you subsequently register new components, this event will fire again.

## Full API

### Constructor

```javascript
var container = new Container({
  // an optional logger (e.g. Winston). Defaults to the console.
  logger: {
    info: function(message) {},
    warn: function(message) {},
    error: function(message) {},
    debug: function(message) {}
  },
  
  // how long to wait for deferred `afterPropertiesSet` methods to invoke the callback
  timeout: 5000
})
```

### Methods

`container.register(name, component)` Store a thing

`container.find(name)` Retrieve a thing - can by by name (e.g. `'foo'`) or by type (e.g. `Foo`)

`container.autowire(component)` Autowire a thing

`container.create(constructor, [arg1, arg2...], callback)` Create and autowire a thing

`container.createAndRegister(name, constructor, [arg1, arg2...], callback)` Create, autowire and register a thing

`container.createAndRegisterAll(path, excludes)` Create, autowire and register anything under `path` that doesn't match `excludes`

In `create` and `createAndRegister` above, `arg1, arg2...` are passed to `constructor`

`container.setLogger(logger)` Override the default logging implementation - the passed object must have `info`, `warn`, `error` and `debug` methods.
