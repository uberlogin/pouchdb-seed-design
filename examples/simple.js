var PouchDB = require('pouchdb');
var pouchSeed = require('../index');
var db = new PouchDB('http://localhost:5984/pouch_simple_test');

var designDoc = {
  person: {
    views: {
      byFirstName: {
        map: function (doc) {
          emit(doc.firstName);
        }
      },
      byLastName: {
        map: function (doc) {
          emit(doc.lastName);
        }
      },
      byFullName: {
        map: function (doc) {
          emit(doc.firstName + ' ' + doc.lastName);
        }
      }
    },
    updates: {
      firstName: function (doc, req) {
        doc.firstName = req.body;
        return [doc, 'ok'];
      }
    }
  }
};

pouchSeed(db, designDoc)
  .then(function(result) {
    console.log(result);
  })
  .catch(function(err) {
    console.log(err)
  });
