if(typeof window === 'undefined') {
  var PouchDB = require("pouchdb");
  var chai = require("chai");
  var pouchSeed = require("../index");
}
var expect = chai.expect;

var db = new PouchDB("http://localhost:5984/pouchdb_seed_test");

var designDoc1 = {
  person: {
    views: {
      byFirstName: function (doc) {
        emit(doc.firstName);
      },
      byLastName: function (doc) {
        emit(doc.lastName);
      },
      byFullName: function (doc) {
        emit(doc.firstName + " " + doc.lastName);
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

  it("should add design docs to an empty database (returning a promise)", function() {
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
      });
  });

  it("should not try to write over a design document that hasn't changed (with callback)", function() {
    return previous
      .then(function() {
        return new Promise(function(resolve, reject) {
          pouchSeed(db, designDoc1, function(err, result) {
            if(err) reject(err);
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