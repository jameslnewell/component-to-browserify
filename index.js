//var Converter = require('./lib/Converter');
//var converter = new Converter({
//  dir: __dirname+'/test/fixture/needs-converting',
//  url: 'git@github.com:jameslnewell/xhr-mock.git',
//  manifest: {
//    license: 'MIT'
//  }
//});
//
//converter.convert(function(err, manifest) {
//  console.log(err, manifest);
//});

var Component = require('./lib/Component');
var component = new Component(
  'git@github.com:nib-styles/v2-typography.git',
  'C:\\Development\\Github\\nib-styles\\v2-typography',
  require('C:\\Development\\Github\\nib-styles\\v2-typography\\component.json')
);

var convert = require('./lib/manifest').convert;
convert(component, function(err, manifest) {
  console.log(err);
  console.log(JSON.stringify(manifest, null, '  '));
});