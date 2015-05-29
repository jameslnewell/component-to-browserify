var extend  = require('extend');
var exec = require('child_process').exec

var client = require('go-fetch');
var useragent = require('go-fetch-useragent');
var contentType = require('go-fetch-content-type');
var bodyParser = require('go-fetch-parse-body');
var auth = require('go-fetch-auth');

var github = {
  user:   'nib-build-agent',
  token:  'P@ssw0rd21'
};

function name(component) {
  var matches = component.url.match(/github.com[:\/]([a-zA-Z0-9-]+)\/([a-zA-Z0-9-]+)\.git/);
  if (!matches) {
    return null;
  }
  return '@' + matches[1] + '/' + matches[2];
}

/**
 * Convert the component's semver version
 * @param   {Component} component
 * @param   {function}  callback
 */
function version(component, callback) {
  exec('git describe --always --tag --abbrev=0', {cwd: component.dir}, function(err, stdout, stderr) {
    if (err) return callback(err);

    var version = stdout.split('\n').join('');
    if (/^[0-9]+\.[0-9]+\.[0-9]+$/.test(version)) {
      callback(null, version);
    } else {
      throw new Error('The current commit is not tagged according to semver')
    }

  });
}

/**
 * Fetch the dependency information
 * @param   {string}    oldDep
 * @param   {string}    oldVersion
 * @param   {function}  callback
 */
function dependency(oldDep, oldVersion, callback) {
  client()
    .use(useragent())
    .use(contentType)
    .use(bodyParser.json())
    .use(auth(github.user, github.token))
    .get('https://api.github.com/repos/'+oldDep+'/contents/package.json', function(err, res) {
      if (err) return callback(err);
      if (res.getStatus() == 403) return callback(new Error('Authorisation issue.'));
      if (res.getStatus() != 200) return callback(new Error(oldDep+' has not been coverted yet'));

      var manifest = JSON.parse(new Buffer(res.getBody().content, res.getBody().encoding).toString())
      callback(null, manifest.name, manifest.version);

  });
}

/**
 * Convert the component's dependencies
 * @param   {Component} component
 * @param   {Objecet}   oldDeps
 * @param   {function}  callback
 */
function dependencies(component, oldDeps, callback) {
  var i= 0, repos = Object.keys(oldDeps), newDeps = {}, mappings = {};//TODO: browserify options

  function next() {

    if (i>=repos.length) {
      return callback(null, newDeps, mappings);
    }

    var oldDep = repos[i];
    var oldVerison = oldDeps[repos[i]];

    dependency(oldDep, oldVerison, function(err, newDep, newVersion) {
      if (err) return callback(err);
      newDeps[newDep] = oldVerison;
      mappings[oldDep] = newDep; //todo: get name from component.json
      ++i;
      next();
    });
  }

  next();

}

/**
 * Check the component for issues
 * @param   {Component} component
 * @param   {function}  callback
 */
function check(component, callback) {
  var manifest = component.manifest;

  //check an entry script or entry style  specified - otherwise we have issues
  if (!manifest.main && (!manifest.scripts || !manifest.scripts.length) && (!manifest.styles || !manifest.styles.length)) {
    return callback(new Error('No entry script or style - requires user intervention'));
  }

  if (manifest.styles && manifest.styles.length>1) {
    return callback(new Error('Multiple entry styles. Requires manual editing for SASS Composer.'));
  }

  callback(null);
}

/**
 * Convert the manifest file
 * @param   {Component} component
 * @param   {function}  callback
 */
function convert(component, callback) {

  var oldManifest = component.manifest;

  var newManifest = extend({
    name: name(component)
  });

  //use the most recent git tag or use the component.version
  version(component, function(err, version) {
    if (err) return callback(err, newManifest);

    //add the version
    newManifest.version = version;

    //add the description
    if (oldManifest.description) {
      newManifest.description = oldManifest.description;
    }

    //add the keywords
    if (oldManifest.keywords) {
      newManifest.keywords = oldManifest.keywords;
    }

    //add the license
    if (oldManifest.license) {
      newManifest.license = oldManifest.license;
    }

    //add the main script if the component lists one which isn't the default node one
    if (oldManifest.main) {
      newManifest.main = oldManifest.main;
    } else if (oldManifest.scripts) {
      var script = oldManifest.scripts[0];
      if (script) {
        newManifest.main = script;
      }
    }

    //add the main style if the component lists one which isn't the default node one
    if (oldManifest.styles) {
      var style = oldManifest.styles[0];
      if (style) {
        newManifest['main.css'] = style;
      }
    }

    //add the package repository
    newManifest.repository = {
      type:   'git',
      url:    component.url
    };

    //add the package dependencies
    var deps = oldManifest.dependencies || {};
    dependencies(component, deps, function(err, deps, mappings) {
      if (err) return callback(err, newManifest);

      //add dev dependencies
      newManifest.dependencies = deps;
      newManifest.browser = mappings;

      var deps = oldManifest.development ? oldManifest.development.dependencies || {} : {};
      dependencies(component, deps, function(err, deps) {
        if (err) return callback(err, newManifest);

        //add dev dependencies
        newManifest.devDependencies = deps;
        newManifest.browser = extend(newManifest.browser, mappings);

        //check stuff and emit warnings
        check(component, function (err) {
          if (err) return callback(err, newManifest);

          //finished
          callback(null, newManifest);

        });

      });

    });

  });

}

module.exports = {
  convert: convert
};