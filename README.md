# wantsit

[![Dependency Status](https://david-dm.org/achingbrain/node-wantsit.svg?theme=shields.io)](https://david-dm.org/achingbrain/node-wantsit) [![devDependency Status](https://david-dm.org/achingbrain/node-wantsit/dev-status.svg?theme=shields.io)](https://david-dm.org/achingbrain/node-wantsit#info=devDependencies) [![Build Status](https://img.shields.io/travis/achingbrain/node-wantsit/master.svg)](https://travis-ci.org/achingbrain/node-wantsit) [![Coverage Status](http://img.shields.io/coveralls/achingbrain/node-wantsit/master.svg)](https://coveralls.io/r/achingbrain/node-wantsit)

Super lightweight dependency resolution, autowiring and lifecycle management.

Or, yet another dependency injection framework.

## Wat?

Using dependency injection decouples your code and makes it more maintainable, readable and testable.

Imagine I have some code like this:

```javascript
var MadeUpDb = require('madeupdb');

var MyClass = function() {
  this._db = new Madeupdb('localhost', 'database_name', 'username', 'password');
};

MyClass.prototype.getTheThings() {
  return this._db.query('SELECT foo FROM bar');
}
```

`MyClass` is tightly coupled to `MadeUpDb`, which is to say I can't use this class now without having `MadeUpDb` available on `localhost` and `database_name` configured for `username:password@localhost`, nor can I use a different implementation (a mock object, in memory db, etc - perhaps for testing purposes).

If instead I did this:

```javascript
var Autowire = require('wantsit').Autowire;

var MyClass = function() {
  this._db = Autowire;
};

...
```

Not only is there less boilerplate, `MyClass` has been freed from configuring and acquiring a data source (a beard might call this [Inversion of Control](http://en.wikipedia.org/wiki/Inversion_of_control)) which lets me:

 * Concentrate on the interesting bits of `MyClass` (e.g. `getTheThings()`)
 * Easily mock behaviour in tests by setting `_db`
 * Control resources centrally (were I to have two instances of `MyClass`, the can now share a db connection)
 * Introduce new functionality without changing `MyClass`. Want a connection pool? No problem, want to wrap `MadeUpDb`, [AOP](http://en.wikipedia.org/wiki/Aspect-oriented_programming) style? Done.  Swap `MadeUpDb` for `NewHotDB`? Easy.

Amazing, right?

## I'm sold, show me an example

```javascript
var Autowire = require('wantsit').Autowire,
  Container = require('wantsit').Container;

var Foo = function() {
  // works with this._bar or this.bar
  this._bar = Autowire;
};

Foo.prototype.doSomething() {
 this._bar.sayHello();
}

...

var Bar = function() {

}

Bar.prototype.sayHello() {
  console.log('hello!');
}

...

var container = new Container();
container.register('bar', new Bar());

var foo = new Foo();
container.autowire(foo);

foo.doSomething(); // prints 'hello!'
```

## Lifecycle management

For people with an aversion to the `new` keyword, `container.create` will instantiate your object, autowire it and return it.

```javascript

var foo = container.create(Foo);

...
```

Constructor arguments are also supported:

```javascript

var Foo = function(message) {
  console.log(message);
}

var foo = container.create(Foo, 'Hello world!');

...
```

## Magic methods

There are optional methods you can implement to be told when things happen.

```javascript
// called after autowiring and before afterPropertiesSet
Foo.prototype.containerAware = function(container) {

};

// called after autowiring and after containerAware
Foo.prototype.afterPropertiesSet = function() {

};
```
## Dynamic getters

Look-ups occur at runtime, so you can switch out application behaviour without a restart:

```javascript

// create a bar
container.register('bar', function() {
  console.log('hello');
});

// this is our autowired component
var Foo = function() {
  this._bar = Autowire;
};

Foo.prototype.doSomething = function() {
  this._bar();
}

// create and autowire it
var foo = container.create(Foo);

foo.doSomething(); // prints 'hello!'

// overwrite bar
container.register('bar', function() {
  console.log('world');
});

foo.doSomething(); // prints 'world!'
```

## I want to register all of the things!

```javascript
container.createAndRegisterAll(__dirname + '/lib');
```

To use this, all your components must be in or under the lib directory.  Anything that ends in `.js` will be newed up and autowired.

No constructor arguments are supported, it's `Autowire` all the way down.

### Woah, not literally all of the things

Ok, specify a regex as the second argument - anything that matches it will be excluded

```javascript
container.createAndRegisterAll(__dirname + '/lib', /excludeme\.js/);
```

Regex?  Great, now I've got two problems.  Why stop there?  Pass in an array of regexes:

```javascript
container.createAndRegisterAll(__dirname + '/lib', [/pattern1/, /pattern2/]);
```

### I want to have functions automatically registered

Declare them in a file with a lowercase letter.  Eg:

```javascript
// myFunc.js
module.exports = function() {
  return true;
}
```

..as opposed to a class which should be in a file that starts with a capital letter:

```javascript
// MyClass.js
var MyClass = function() {};

MyClass.prototype.foo = function() {
  return true
}

module.exports = MyClass;
```

```javascript
container.createAndRegisterAll(__dirname + '/lib');

// find and invoke our function
var foo = container.find('myFunc);
foo();

// find and invoke a method on our singleton
var myClass = container.find('myClass');
myClass.foo();
```

### I want to register a function on a class

No problem, just use the `createAndRegisterFunction` method.  The first argument is the name to register the
function under, the second is the name of the method on the class, the third is the class constructor. Any
subsequent arguments will be passed to the constructor.

```javascript
// MyClass.js
var MyClass = function() {};

MyClass.prototype.foo = function() {
  return true
}

module.exports = MyClass;
```

```javascript
container.createAndRegisterFunction('fooFunc', 'foo', MyClass);

// find and invoke our function
var foo = container.find('fooFunc');
foo();
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
});

// MyClass.js
var MyClass = function() {
  this._foo = Autowired({name: 'bar'})
};

MyClass.prototype.doSomething = function() {
  // this._foo is 'bar' from the container
  this._foo.baz();
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
container.createAndRegister('fooFactory', ObjectFactory, Foo);

// MyClass.js
var MyClass = function() {
  this._fooFactory = Autowired
};

MyClass.prototype.doSomething = function() {
  var foo = this._fooFactory.create('one', 'two')

  foo._arg1 // 'one'
  foo._arg2 // 'two'
}
```

## Full API

### Constructor

```
var container = new Container({
  // an optional logger (e.g. Winston). Defaults to the console.
  logger: {}
});
```

### Methods

`container.register(name, component)` Store a thing

`container.find(name)` Retrieve a thing - can by by name (e.g. `'foo'`) or by type (e.g. `Foo`)

`container.autowire(component)` Autowire a thing

`container.create(constructor, arg1, arg2...)` Create and autowire a thing

`container.createAndRegister(name, constructor, arg1, arg2...)` Create, autowire and register a thing

`container.createAndRegisterAll(path, excludes)` Create, autowire and register anything under `path` that doesn't match `excludes`

In `create` and `createAndRegister` above, `arg1, arg2...` are passed to `constructor`

`container.setLogger(logger)` Override the default logging implementation - the passed object must have `info`, `warn`, `error` and `debug` methods.
