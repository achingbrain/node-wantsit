var LOG = require("winston"),
	Autowire = require("./Autowire"),
	_s = require("underscore.string");

var Container = function() {
	this._store = {};
};

Container.prototype.register = function(name, component) {
	if(this._store[name]) {
		LOG.warn("ApplicationContext", "Component with name", name, "is being overridden");
	}

	this._store[name] = component;
};

Container.prototype.find = function(name) {
	if(typeof(name) === "string") {
		return this._getByName(name);
	}

	return this._getByType(name);
}

Container.prototype.autowire = function(component) {
	for(var key in component) {
		if(component[key] !== Autowire) {
			continue;
		}

		Object.defineProperty(component, key, {
			get: function(componentName) {
				return this._getByName(componentName);
			}.bind(this, _s.startsWith(key, "_") ? key.substring(1) : key)
		});
	}
}

Container.prototype.createAndRegister = function(name, component) {
	var managed = this.create.apply(this, Array.prototype.slice.call(arguments, 1));
	this.register(name, managed);

	return managed;
}

Container.prototype.create = function(component) {
	var managed = this._construct(component, Array.prototype.slice.call(arguments, 1));
	this.autowire(managed);

	if(typeof(managed["containerAware"]) === "function") {
		managed.containerAware(this);
	}

	if(typeof(managed["afterPropertiesSet"]) === "function") {
		managed.afterPropertiesSet();
	}

	return managed;
}

Container.prototype._getByName = function(name) {
	if(!this._store[name]) {
		throw new Error("No component with name " + name);
	}

	return this._store[name];
}

Container.prototype._getByType = function(type) {
	for(var key in this._store) {
		if(this._store[key] instanceof type) {
			return this._store[key];
		}
	}

	throw new Error("Could not look up component for type " + type);
}

Container.prototype._construct = function(constructor, args) {
	function f() {
		return constructor.apply(this, args);
	}

	f.prototype = constructor.prototype;

	return new f();
}

module.exports = Container;
