if(typeof window === 'undefined') {
  var PouchDB = require("pouchdb");
  var chai = require("chai");
  var pouchSeed = require("../index");
}
var expect = chai.expect;
var path = require('path');
require('dotenv').config({
  silent: true,
  path: path.join(__dirname, '../.env')
});

var config = {
  protocol: process.env.COUCH_PROTOCOL || 'http://',
  host:     process.env.COUCH_HOST     || 'localhost:5984',
  user:     process.env.COUCH_USER     || '',
  password: process.env.COUCH_PASS     || '',
};

var serverUrlWithAuth = `${config.protocol}${config.user ? `${config.user}:${config.password}@` : ''}${config.host}/pouchdb_seed_test`;
var db = new PouchDB(serverUrlWithAuth);

var designDoc1 = {
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
          emit(doc.firstName + " " + doc.lastName);
        }
      }
    },
    updates: {
      firstName: function (doc, req) {
        doc.firstName = req.body;
        return [doc, "ok"];
      }
    },
    filters: {
      byType: function(doc, req) {
        return doc.type == "person";
      }
    },
    lists: {
      zoom: function() { return "zoom!"; },
    },
    shows: {
      people: function(doc, req) { return "foo"; }
    },
    validate_doc_update: function(newDoc, oldDoc, userCtx, secObj) {
      if (newDoc.address === undefined) {
        throw({forbidden: 'Document must have an address.'});
      }
    }
  }
};

var designDoc2 = {
  person: {
    updates: {
      firstName: function (doc, req) {
        doc.firstName = req.body;
        return [doc, "ok"];
      }
    },
    filters: {
      byType: function(doc, req) {
        return doc.type == "person";
      }
    }
  }
};

describe("pouchdb_seed_design", function() {

  var previous = Promise.resolve();

  after(function() {
    return db.destroy();
  });

  it("should add design docs to an empty database (returning a promise)", function(done) {
    return previous.then(function() {
      return pouchSeed(db, designDoc1);
    })
      .then(function(result) {
        expect(result[0].id).to.equal("_design/person");
        return db.get(result[0].id);
      })
      .then(function(ddoc) {
        expect(ddoc.filters.byType).to.be.a('string');
        expect(ddoc.lists.zoom).to.be.a('string');
        expect(ddoc.shows.people).to.be.a('string');
        expect(ddoc.validate_doc_update).to.be.a('string');
      })
      .then(function () {
        done();
      })
      .catch(function(err) {
        done(err);
      });
  });

  it("should not try to write over a design document that hasn't changed (with callback)", function() {
    return previous
      .then(function() {
        return new Promise(function(resolve, reject) {
          pouchSeed(db, designDoc1, function(err, result) {
            if(err) {
              reject(err);
            }
            expect(err).to.equal(null);
            expect(result).to.equal(false);
            resolve();
          });
        });
      });
  });

  it("should write over a design document that has changed", function() {
    return previous
      .then(function() {
        designDoc1.person.views.byLastName = function(doc) {
          emit("Mr. " + doc.lastName);
        };
        return pouchSeed(db, designDoc1);
      })
      .then(function(result) {
        expect(result[0].id).to.equal("_design/person");
      });
  });

  it("should correctly remove views on update if they no longer exist", function() {
    return previous
      .then(function() {
        return pouchSeed(db, designDoc2);
      })
      .then(function(result) {
        return db.get(result[0].id);
      })
      .then(function(ddoc) {
        expect(ddoc.validate_doc_update).to.be.an('undefined');
      });
  });

  it("should not update a doc that hasn't changed (without all fields specified)", function() {
    return previous
      .then(function() {
        return pouchSeed(db, designDoc2);
      })
      .then(function(result) {
        expect(result).to.equal(false);
      });
  });
});