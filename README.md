# pouchdb-seed-design
Seed CouchDB design documents with [`PouchDB`](http://pouchdb.com).

##Build status

[![Build Status](https://travis-ci.org/colinskow/pouchdb-seed-design.png?branch=master)](https://travis-ci.org/colinskow/pouchdb-seed-design)

## Installation

```sh
npm install pouchdb-seed-design
```

## Usage

```js
var PouchDB = require('pouchdb');
var pouchSeed = require('pouchdb-seed-design');
var db = new PouchDB('http://localhost:5984/design');

var ddoc = {
 person: {
   views: {
     byFirstName: function (doc) {
       emit(doc.firstName);
     },
     byLastName: function (doc) {
       emit(doc.lastName);
     },
     byFullName: function (doc) {
       emit(doc.firstName + ' ' + doc.lastName);
     }
   }
 }
};

var promise = pouchSeed(db, ddoc).then(function(updated) {
  if(updated) {
    console.log('DDocs updated!');
  } else {
    console.log('No update was necessary');
  }
});
```

## API

### `pouchSeed(db, design, cb)`

* `db` (`object`, required) - `PouchDB` (or compatible) database object
* `design` (`object`, required) - design object
* `cb` (`function`, optional) - callback

Creates a set of CouchDB design documents basing on `design` object. Each key in `design` object becomes a separate design document called (`'_design/' + key`).

If no changes between remote design documents and `design` object are detected, no updates are sent to CouchDB.

Seed will return a Promise that fulfills with `false` if no updates were necessary, or the result of the `bulkDocs` operation if changes were pushed. (You will need a `Promise` shim if you are using an older browser or version of Node.)

The browser version will export `window.pouchSeed`.

## Updates

##### (0.3.0) 2016-05-08
You can now use docs with absolutely any JSON schema. All functions in the tree are converted to strings. This will future proof `pouchdb-seed-design` as the design doc standards evolve. Added browser support.

##### (0.2.0) 2015-09-16 
Added support for `filters`, `lists`, `shows`, and `validate_doc_update` thanks to [Will Holley](https://github.com/colinskow/pouchdb-seed-design/pull/2).

## Credits

This project is forked from [couchdb-seed-design](https://github.com/mmalecki/couchdb-seed-design) by Maciej Małecki.

A huge round of applause goes to [Dale Harvey](https://github.com/daleharvey), [Calvin Metcalf](https://github.com/calvinmetcalf), and [Nolan Lawson](https://github.com/nolanlawson) for all the tireless work they put into maintaining PouchDB!

And a special thanks goes to [Mirco Zeiss](http://www.mircozeiss.com) for all the awesome blog articles on how to use Node.js, Express, and CouchDB!