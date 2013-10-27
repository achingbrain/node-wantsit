# wantsit

Super lightweight dependency resolution, autowiring and lifecycle management.

Or, yet another dependency injection framework.

## Wat?

Using dependency injection decouples your code and makes it more maintainable, readable and testable.

Imagine I have some code like this:

```javascript
var MadeUpDb = require("madeupdb");

var MyClass = function() {
	this._db = new Madeupdb("localhost", "database_name", "username", "password");
};

MyClass.prototype.getTheThings() {
	return this._db.query("SELECT foo FROM bar");
}
```

`MyClass` is tightly coupled to `MadeUpDb`, which is to say I can't use this class now without having `MadeUpDb` available on `localhost` and `database_name` configured for `username:password@localhost`, nor can I use a different implementation (a mock object, in memory db, etc - perhaps for testing purposes).

If instead I did this:

```javascript
var Autowire = require("wantsit").Autowire;

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
var Autowire = require("wantsit").Autowire,
	Container = require("wantsit").Container;

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
	console.log("hello!");
}

...

var container = new Container();
container.register("bar", new Bar());

var foo = new Foo();
container.autowire(foo);

foo.doSomething(); // prints "hello!"
```

## Lifecycle management

For people with an aversion to the `new` keyword, `container.create` will instantiate your object, autowire it and return it.

```javascript

var foo = container.create(Foo);

foo.doSomething(); // prints "hello!"
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
container.register("bar", function() {
	console.log("hello");
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

foo.doSomething(); // prints "hello!"

// overwrite bar
container.register("bar", function() {
	console.log("world");
});

foo.doSomething(); // prints "world!"
```

## Full API

`Container.register(name, component)` Store a thing

`Container.find(name)` Retrieve a thing - can by by name (e.g. `"foo"`) or by type (e.g. `Foo`)

`Container.autowire(component)` Autowire a thing

`Container.create(constructor, arg1, arg2...)` Create and autowire a thing

`Container.createAndRegister(name, constructor, arg1, arg2...)` Create, autowire and register a thing

In `create` and `createAndRegister` above, `arg1, arg2...` are passed to `constructor`
