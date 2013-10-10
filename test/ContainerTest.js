var Container = require("../lib/Container"),
	Autowire = require("../lib/Autowire");

module.exports["Container"] = {
	"Should register a thing": function( test ) {
		var container = new Container();
		container.register("bar", {});

		test.ok(container.find("bar"));

		test.done();
	},

	"Should autowire a field": function( test ) {
		var Foo = function() {
			this.bar = Autowire;
		}

		var bar = {};

		var container = new Container();
		container.register("bar", bar);

		var foo = new Foo();
		container.autowire(foo);

		test.ok(foo.bar === bar);

		test.done();
	},

	"Should always get latest component": function( test ) {
		var Foo = function() {
			this.bar = Autowire;
		}

		var originalBar = {};
		var newBar = {};

		// they should not be the same object
		test.ok( originalBar !== newBar);

		var container = new Container();
		container.register("bar", originalBar);

		var foo = new Foo();
		container.autowire(foo);

		// original bar should have been set
		test.ok(foo.bar === originalBar);

		// overwrite original bar
		container.register("bar", newBar);

		// should have the new bar
		test.ok(foo.bar === newBar);

		test.done();
	}
};
