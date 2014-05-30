var Autowire = require("./Autowire"),
  _s = require("underscore.string"),
  check = require("check-types"),
  fs = require("fs"),
  toarray = require("toarray");

var Container = function(options) {
  this._store = {};

  this._options = options || {};

  this._logger = this._options.logger || console;
};

Container.prototype.register = function(name, component) {
  check.verify.string(name, "Please pass a string as the component name");

  if(!check.object(component) && !check.fn(component)) {
    throw new Error("Please pass a component to register");
  }

  if(this._store[name]) {
    this._logger.warn("ApplicationContext", "Component with name", name, "is being overridden");
  }

  this._store[name] = component;

  return component;
};

Container.prototype.find = function(name) {
  if(typeof(name) === "string" || name instanceof String) {
    return this._getByName(name);
  }

  return this._getByType(name);
}

Container.prototype.autowire = function(component) {
  check.verify.object(component, "Please pass an object to autowire");

  for(var key in component) {
    if(!component[key] || !component[key].__________autowire) {
      continue;
    }

    Object.defineProperty(component, key, {
      get: function(componentName) {
        return this._getByName(componentName, component[key]);
      }.bind(this, _s.startsWith(key, "_") ? key.substring(1) : key)
    });
  }

  return component;
}

Container.prototype.createAndRegister = function(name, component) {
  check.verify.string(name, "Please pass a string as the component name");
  check.verify.fn(component, "Please pass a function to use as the component constructor");

  var managed = this.create.apply(this, Array.prototype.slice.call(arguments, 1));
  this.register(name, managed);

  return managed;
}

Container.prototype.createAndRegisterFunction = function(name, method, component) {
  check.string(name, "Please pass a string as the component name");
  check.fn(component, "Please pass a function to use as the component constructor");

  var managed = this.create.apply(this, Array.prototype.slice.call(arguments, 2));
  managed = managed[method].bind(managed);
  this.register(name, managed);

  return managed;
}

Container.prototype.create = function(component) {
  check.verify.fn(component, "Please pass a function to use as the component constructor");

  var managed = this._construct(component, Array.prototype.slice.call(arguments, 1));
  this.autowire(managed);

  if(typeof(managed["containerAware"]) === "function") {
    process.nextTick(managed.containerAware.bind(managed, this));
  }

  if(typeof(managed["afterPropertiesSet"]) === "function") {
    process.nextTick(managed.afterPropertiesSet.bind(managed));
  }

  return managed;
}

Container.prototype.createAndRegisterAll = function(path, excludes) {
  check.verify.string(path, "Please pass a path to recurse into");

  excludes = toarray(excludes);

  var readDirectory = function(directory) {
    fs.readdirSync(directory).forEach(function(file) {
      var fullPath = directory + "/" + file;
      var stats = fs.statSync(fullPath);

      if(stats.isDirectory()) {
        return readDirectory(fullPath);
      }

      if(!_s.endsWith(file, ".js")) {
        return;
      }

      var include = true;

      excludes.forEach(function(excludes) {
        if(fullPath.match(excludes)) {
          include = false;
        }
      });

      if(!include) {
        return;
      }

      if(file.substr(0, 1).toUpperCase() == file.substr(0, 1)) {
        // Foo is a class definition, create and register it
        var name = file.substr(0, 1).toLowerCase() + file.substr(1).replace(".js", "");
        this._logger.info("Container", "Creating", name, "from", fullPath);
        this.createAndRegister(name, require(fullPath));
      } else {
        // foo is a function, just register it
        var name = file.replace(".js", "");
        this._logger.info("Container", "Registering", name, "from", fullPath);
        this.register(name, require(fullPath));
      }
    }.bind(this));
  }.bind(this);
  readDirectory(path);
}

Container.prototype._getByName = function(name, autowire) {
  if(autowire.__________qualifier) {
    name = autowire.__________qualifier;
  }

  if(!this._store[name] && !autowire.__________optional) {
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
