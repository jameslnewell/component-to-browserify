var assert = require('assert');
var Converter = require('../lib/Converter');

describe('manifest', function() {

  describe('.name()', function() {

    it('should return @nib-styles/control from a SSH URL', function() {
      var converter = new Converter({
        url: 'git@github.com:nib-styles/control.git'
      });
      assert.equal(converter.name(), '@nib-styles/control');
    });

    it('should return @nib-styles/control from a HTTPS URL', function() {
      var converter = new Converter({
        url: 'https://github.com/nib-styles/control.git'
      });
      assert.equal(converter.name(), '@nib-styles/control');
    });

    it('should return @jameslnewell/xhr-mock from a SSH URL', function() {
      var converter = new Converter({
        url: 'git@github.com:jameslnewell/xhr-mock.git'
      });
      assert.equal(converter.name(), '@jameslnewell/xhr-mock');
    });

    it('should return @jameslnewell/xhr-mock from a HTTPS URL', function() {
      var converter = new Converter({
        url: 'https://github.com/jameslnewell/xhr-mock.git'
      });
      assert.equal(converter.name(), '@jameslnewell/xhr-mock');
    });

  });

  describe('.convert()', function() {

    it('should return a null manifest when the package already has a manifest', function() {

      var converter = new Converter({
        dir: __dirname+'/fixture/already-converted',
        url: ''
      });

    converter.convert(function(err, manifest) {
      assert.equal(manifest, null);
    });

  });

  });

});
