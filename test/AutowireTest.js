var Autowire = require("../lib/Autowire");

module.exports["Autowire"] = {
	"One autowire should equal another": function( test ) {
		test.equal(Autowire, require("../lib/Autowire"));

		test.done();
	}
};
