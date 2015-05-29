var extend = require('extend');
//var Git = require('nodegit');

var fs = require('fs');
var path = require('path');

function Converter(options) {
  this._dir       = options.dir || ''; //the repo dir
  this._url       = options.url || ''; //the repo url
  this._manifest  = options.manifest || {}; //additional user-specified manifest info
}

Converter.prototype = {

  convert: function(callback) {

    //check if it is already converted
    if (fs.existsSync(path.join(this._dir, 'package.json'))) {
      callback(null, null);
      return this;
    }

    this.manifest(callback);

    return this;
  },

  clone: function(callback) {
    Git.clone(this._url, this._dir, null)
      .then(function() {

      })
      .catch(function(err) {

      })
    ;
  },

  /**
   * Generate the name of the package from the Github URL
   * @returns {string|null}
   */
  name: function() {
    var matches = this._url.match(/github.com[:\/]([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)\.git/);
    if (!matches) {
      return null;
    }
    return '@' + matches[1] + '/' + matches[2];
  },

  /**
   * Generate the package JSON
   * @param   {function(Error, manifest)} callback
   */
  manifest: function(callback) {

    //load the component manifest
    var component = require(path.join(this._dir, 'component.json'));

    var package = extend({
      name:       this.name(),
      repository: {
        type:   'git',
          url: this._url
      }
    }, this._manifest);

    //copy the dependencies and lookup their nodejs names or generate a name from the repo URL
    function convertDeps(deps, callback) {
      callback(null, {});
    }
    var deps = component.development || {};
    convertDeps(deps, function(err, deps) {

      if (err) return callback(err);
      package.dependencies = deps;

      var deps = component.development ? component.development.dependencies || {} : {};
      convertDeps(deps, function(err, deps) {

        if (err) return callback(err);
        package.devDependencies = deps;

        //check a script or style is specified - otherwise we have issues
        if (!package.main && !package['main.css']) {
          return callback(new Error('No entry script or style - requires user intervention'), package);
        }

        return callback(null, package);

      });

    });
    for (var dep in deps) {
      console.log(dep);
    }

    //"dependencies": {
    //  "emitter-on-steroids": "^2.0.4",
    //    "no-frills-request": "^1.1.0"
    //},
    //"development: {
    //    "dependencies": {
    //      "go-fetch-content-type": "^0.1.0",
    //        "go-fetch-parse-body": "^2.0.0",
    //        "simple-server-setup": "^0.1.0"
    //    },
    //}

  }

};

module.exports = Converter;