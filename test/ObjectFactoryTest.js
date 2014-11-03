var ObjectFactory = require("../lib/ObjectFactory");

module.exports["ObjectFactory"] = {
  "Should create and autowire an object": function( test ) {
    var foo = function(arg1, arg2) {
      this._arg1 = arg1
      this._arg2 = arg2
    }

    var factory = new ObjectFactory(foo)
    factory.containerAware({
      create: function(constructor, arg1, arg2) {
        return new constructor(arg1, arg2)
      }
    })

    var created = factory.create("one", "two")

    test.ok(created instanceof foo);
    test.equal("one", created._arg1)
    test.equal("two", created._arg2)

    test.done();
  }
};
