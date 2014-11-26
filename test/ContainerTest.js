var Container = require("../lib/Container"),
  Autowire = require("../lib/Autowire"),
  should = require("should");

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
  },

  "Should get a thing by type": function( test ) {
    var Foo = function() {};

    var container = new Container();
    var createdFoo = container.createAndRegister("bar", Foo);

    var returnedFoo = container.find(Foo);

    createdFoo.should.equal(returnedFoo);

    test.done();
  },

  "Should not get a thing": function( test ) {
    var Foo = function() {};

    var container = new Container();
    container.createAndRegister("bar", Foo);

    try {
      container.find("baz");

      test.fail("Did not object to being asked for baz when no baz was present");
    } catch(e) {

    }

    test.done();
  },

  "Should not get a thing by type": function( test ) {
    var Bar = function() {
      this._bar = "baz";
    };

    var Foo = function() {};

    var container = new Container();
    container.createAndRegister("bar", Bar);

    try {
      container.find(Foo);

      test.fail("Did not object to being asked for a Foo when no Foo was present");
    } catch(e) {

    }

    test.done();
  },

  "Should create and autowire all": function( test ) {
    var container = new Container();
    container.createAndRegisterAll(__dirname + "/create-and-autowire-all-test");

    container.find("foo").should.not.be.null;
    container.find("bar").should.not.be.null;

    try {
      container.find("baz");

      test.fail("Should not have a Baz.sh");
    } catch(e) {

    }

    test.done();
  },

  "Should create and autowire all apart from one thing": function( test ) {
    var container = new Container();
    container.createAndRegisterAll(__dirname + "/create-and-autowire-all-test", /Bar\.js/);

    container.find("foo").should.not.be.null;

    try {
      container.find("bar");

      test.fail("Should have excluded Bar.js");
    } catch(e) {

    }

    test.done();
  },

  "Should create and autowire all apart from more than one thing": function( test ) {
    var container = new Container();
    container.createAndRegisterAll(__dirname + "/create-and-autowire-all-test", [/Bar\.js/, /Foo\.js/]);

    try {
      container.find("foo");

      test.fail("Should have excluded Foo.js");
    } catch(e) {

    }

    try {
      container.find("bar");

      test.fail("Should have excluded Bar.js");
    } catch(e) {

    }

    test.done();
  },

  "Should register a function when it's declared in a file that starts with lower case": function( test ) {
    var container = new Container();
    container.createAndRegisterAll(__dirname + "/create-and-autowire-all-test");

    var qux = container.find("qux");
    qux().should.equal.true;

    test.done();
  },

  "Should register a function on a method": function( test ) {
    var Foo = function() {
      this._bar = 'baz';
    };
    Foo.prototype.qux = function() {
      return this._bar;
    }

    var container = new Container();
    container.createAndRegisterFunction('quux', 'qux', Foo);

    var quux = container.find("quux");
    quux().should.equal('baz');

    test.done();
  },

  "Should allow overriding name when autowiring": function( test ) {
    var Foo = function() {
      this.bar = Autowire({name: 'baz'});
    };
    var Baz = function() {

    };
    Baz.prototype.hello = function() {
      return 'world';
    }

    var container = new Container();
    container.createAndRegister('foo', Foo);
    container.createAndRegister('baz', Baz);

    var foo = container.find("foo");
    foo.bar.hello().should.equal('world');

    test.done();
  },

  "Should make autowired properties non-enumerable": function( test ) {
    var Foo = function() {
      this.bar = Autowire;
    };
    var Bar = function() {

    };

    var container = new Container();
    container.createAndRegister('foo', Foo);
    container.createAndRegister('bar', Bar);

    var foo = container.find("foo");
    Object.keys(foo).should.not.containEql('bar');

    test.done();
  },

  "Should call containerAware method after registering": function( test ) {
    var container = new Container();

    var Foo = function() {

    };
    Foo.prototype.containerAware = function(cont) {
      container.should.equal(cont)

      test.done();
    };

    container.createAndRegister('foo', Foo);
  },

  "Should call afterPropertiesSet method after autowiring": function( test ) {
    var Foo = function() {
      this._bar = Autowire;
    };
    Foo.prototype.afterPropertiesSet = function() {
      this._bar.should.equal(5)

      test.done();
    };

    var container = new Container();
    container.createAndRegister('foo', Foo);
    container.register('bar', 5);
  },

  "Should override logger": function( test ) {
    var Foo = function() {

    };

    var logger = {
      info: function() {},
      warn: function() {},
      error: function() {},
      debug: function() {}
    }

    var container = new Container();
    container.setLogger(logger);

    container.createAndRegister('foo', Foo);

    test.done();
  },

  "Should object when trying to register an invalid component": function( test ) {
    var container = new Container();

    try {
      container.register('foo');
      test.fail();
    } catch(e) {
      test.done();
    }
  }
};
