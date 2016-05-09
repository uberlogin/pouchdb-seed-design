var objmap = require('object-map');
var objkeysmap = require('object-keys-map');
var deepEqual = require('deep-equal');

var extend = typeof Object.assign === 'function' ? Object.assign : require('node-extend');

function addDesign(s) {
  return '_design/' + s;
}

function normalizeDoc(doc, id) {

  function normalize(doc) {
    doc = extend({}, doc);
    Object.keys(doc).forEach(function(prop) {
      var type = typeof doc[prop];
      if(type === 'object') {
        doc[prop] = normalize(doc[prop]);
      } else if(type === 'function') {
        doc[prop] = doc[prop].toString();
      }
    });
    return doc;
  }

  var output = normalize(doc);
  output._id = id || doc._id;
  output._rev = doc._rev;
  return output;
}

function docEqual(local, remote) {
  if(!remote) return false;
  return deepEqual(local, remote, {strict: true});
}

var pouchSeed = module.exports = function (db, design, cb) {
  if (!db || !design) {
    throw new TypeError('`db` and `design` are required');
  }

  var local = objmap(objkeysmap(design, addDesign), normalizeDoc);

  var seedPromise = db.allDocs({ include_docs: true, keys: Object.keys(local) })

    .then(function (docs) {

      var remote = {};

      docs.rows.forEach(function (doc) {
        if (doc.doc) {
          remote[doc.key] = doc.doc;
        }
      });

      var update = Object.keys(local).filter(function(key) {
        if(!remote[key]) return true;
        local[key]._rev = remote[key]._rev;
        return !docEqual(local[key], remote[key]);
      }).map(function(key) {
        return local[key];
      });

      if (update.length > 0) {
        return db.bulkDocs({ docs: update });
      } else {
        return Promise.resolve(false);
      }
    })
    .then(function(result) {
      if(typeof cb === 'function') {
        cb(null, result);
      }
      return Promise.resolve(result);
    })
    .catch(function(err) {
      if(typeof cb === 'function') {
        cb(err, null);
      }
      console.log(err);
      return Promise.reject(err);
    });

  return seedPromise;

};

if(typeof window === 'object') {
  window.pouchSeed = pouchSeed;
}
