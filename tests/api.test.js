'use strict';

const request = require('supertest');

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const app = require('../src/app')(db);
const buildSchemas = require('../src/schemas');

var assert = require('assert');

describe('API tests', () => {
    before((done) => {
        db.serialize((err) => { 
            if (err) {
                return done(err);
            }

            buildSchemas(db);

            done();
        });
    });

    describe('GET /health', () => {
        it('should return health', (done) => {
            request(app)
                .get('/health')
                .expect('Content-Type', /text/)
                .expect(200, done);
        });
    });

    describe('GET /rides?page=2&limit=4', () => {
        it('should return correct pagination records', () => {

            db.serialize(() => {
                db.run("DELETE FROM Rides");
                for (let i=0; i<5; i ++) {
                    db.run("INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (0,0,0,0,?,?,?)",
                        [`rider${i}`, `driver${i}`, `vehicle${i}`]
                    )
                }

            });

            return request(app)
                .get('/rides?page=2&limit=4')
                .expect(200)
                .then(response => {
                    assert(response.body.length === 1);
                })
        });
    });
});