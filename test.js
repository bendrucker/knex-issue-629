'use strict';

var Promise = require('bluebird');
var uuid    = require('uuid');
var child   = Promise.promisifyAll(require('child_process'));
var argv    = require('minimist')(process.argv);

child.execAsync('psql -c "create database knex_629" -U postgres')
  .bind({})
  .then(function () {
    this.knex = require('knex')({
      client: 'pg',
      connection: {
        database: 'knex_629'
      }
    });
  })
  .then(function () {
    return this.knex.raw('create extension if not exists "uuid-ossp"');
  })
  .then(function () {
    return this.knex.schema.createTable('users', function (t) {
      t.uuid('id');
      t.text('name');
      t.uuid('user_id');
      t.timestamps();
    });
  })
  .return(new Array(argv.n || 1000))
  .tap(function () {
    console.time('records');
  })
  .map(function (row) {
    return {
      id: uuid.v4(),
      name: null,
      user_id: uuid.v4(),
      created_at: new Date(),
      updated_at: new Date()
    };
  })
  .tap(function () {
    console.timeEnd('records');
  })
  .then(function (rows) {
    console.time('inserts');
    return this.knex('users').insert(rows);
  })
  .then(function () {
    console.timeEnd('inserts');
  })
  .finally(function () {
    return this.knex.destroy();
  })
  .finally(function () {
    return child.execAsync('psql -c "drop database knex_629" -U postgres');
  });
