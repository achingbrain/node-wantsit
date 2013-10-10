# wantsit

Super lightweight dependency resolution and autowiring.

Or, yet another dependency injection framework.

## An example

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

# Lifecycle management

```javascript

var foo = container.create(Foo);

foo.doSomething(); // prints "hello!"

```

# Magic methods

There are optional methods you can implement to be told when things happen.

```javascript
// called after autowiring and before afterPropertiesSet
Foo.prototype.containerAware = function(container) {

};

// called after autowiring and after containerAware
Foo.prototype.afterPropertiesSet = function() {

};
```

# Full API

`Container.register(name, component)` Store a thing

`Container.find(name)` Retrieve a thing - can by by name (e.g. `"foo"`) or by type (e.g. `Foo`)

`Container.autowire(component)` Autowire a thing

`Container.create(constructor, arg1, arg2...)` Create and autowire a thing

`Container.createAndRegister(name, constructor, arg1, arg2...)` Create, autowire and register a thing
