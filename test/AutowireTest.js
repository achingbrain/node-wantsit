var Autowire = require("../lib/Autowire");

module.exports["Autowire"] = {
  "One autowire should equal another": function( test ) {
    test.equal(Autowire, require("../lib/Autowire"));

    test.done();
  },

  "The _autowire property should be present": function( test ) {
    test.ok(Autowire.__________autowire);
    test.ok(Autowire().__________autowire);
    test.ok(Autowire({optional: true}).__________autowire);
    test.ok(Autowire({name: 'foo'}).__________autowire);
    test.ok(Autowire({name: 'foo', optional: true}).__________autowire);

    test.done();
  },

  "The _optional property should be present when specified": function( test ) {
    test.ok(!Autowire.__________optional);
    test.ok(Autowire({optional: true}).__________optional);

    test.done();
  },

  "The _name property should be present when specified": function( test ) {
    test.ok(!Autowire.__________name);
    test.ok(Autowire({name: 'foo'}).__________name);

    test.done();
  }
};
