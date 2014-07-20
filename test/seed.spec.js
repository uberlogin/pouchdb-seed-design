var PouchDB = require("pouchdb");
var expect = require("chai").expect;
var seed = require("../index");
var db = new PouchDB("http://localhost:5984/pouch_simple_test");

var designDoc = {
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
    }
  }
};

describe("pouchdb_seed_design", function(){

  var previous, step1, step2, step3;

  it("should add design docs to an empty database (returning a promise)", function(done) {
    previous = seed(db, designDoc)
      .then(function(result) {
        expect(result[0].id).to.equal("_design/person");
        step1 = true;
        done();
      });
  });

  it("should not try to write over a design document that hasn't changed (with callback)", function(done) {
    previous
      .then(function() {
        return seed(db, designDoc, function(err, result) {
          expect(err).to.equal(null);
          expect(result).to.equal(false);
          step2 = true;
          done();
        });
      });
  });

  it("should write over a design document that has changed", function(done) {
    previous
      .then(function() {
        designDoc.person.views.byLastName = function(doc) {
          emit("Mr. " + doc.lastName);
        };
        return seed(db, designDoc);
      })
      .then(function(result) {
        expect(result[0].id).to.equal("_design/person");
        step3 = true;
        done();
      });
  });

  it("should make sure all the steps ran and clean up", function(done) {
    previous
      .then(function() {
        return db.destroy();
      })
      .then(function() {
        expect(step1).to.equal(true);
        expect(step2).to.equal(true);
        expect(step3).to.equal(true);
        done();
      })
      .done();
  });


});
