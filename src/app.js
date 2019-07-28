'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

module.exports = (db) => {

    /**
     * @swagger
     * /health:
     *   get:
     *     summary: Check health of system
     *     description: Returns Healthy if system is healthy
     *     tags:
     *       - internal
     *     responses:
     *       200:
     *         description: Health Status
     *         schema:
     *           type: string
     */
    app.get('/health', (req, res) => res.send('Healthy'));



    /**
     * @swagger
     * /rides:
     *   post:
     *     summary: Create a Ride
     *     description: Add a ride in system
     *     tags:
     *       - external
     *     requestBody:
     *       content:
     *         application/json:
     *           schema:
     *             type: object
     *             properties:
     *               start_lat:
     *                 type: number
     *               start_long:
     *                  type: number
     *               end_lat:
     *                  type: number
     *               end_long:
     *                  type: number
     *               rider_name:
     *                  type: number
     *               driver_name:
     *                  type: string
     *               driver_vehicle:
     *                  type: string
     *
     *     responses:
     *       200:
     *         description: Details of Ride added
     *         schema:
     *           type: array
     *           items:
     *               type: object
     *               properties:
     *                  startLat:
     *                      type: number
     *                      description: Starting Lat Coordinate
     *                  startLong:
     *                      type: number
     *                      description: Starting Lng Coordinate
     *       404:
     *          description: Ride add failed
     *          schema:
     *              type: object
     *              properties:
     *                  error_code:
     *                      type: string
     *                      description : possible values (SERVER_ERROR, VALIDATION_ERROR)
     *                  message:
     *                      type: string
     *                      description: error message from server
     */
    app.post('/rides', jsonParser, (req, res) => {
        const startLatitude = Number(req.body.start_lat);
        const startLongitude = Number(req.body.start_long);
        const endLatitude = Number(req.body.end_lat);
        const endLongitude = Number(req.body.end_long);
        const riderName = req.body.rider_name;
        const driverName = req.body.driver_name;
        const driverVehicle = req.body.driver_vehicle;

        if (startLatitude < -90 || startLatitude > 90 || startLongitude < -180 || startLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Start latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (endLatitude < -90 || endLatitude > 90 || endLongitude < -180 || endLongitude > 180) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'End latitude and longitude must be between -90 - 90 and -180 to 180 degrees respectively'
            });
        }

        if (typeof riderName !== 'string' || riderName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverName !== 'string' || driverName.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        if (typeof driverVehicle !== 'string' || driverVehicle.length < 1) {
            return res.send({
                error_code: 'VALIDATION_ERROR',
                message: 'Rider name must be a non empty string'
            });
        }

        var values = [req.body.start_lat, req.body.start_long, req.body.end_lat, req.body.end_long, req.body.rider_name, req.body.driver_name, req.body.driver_vehicle];
        
        const result = db.run('INSERT INTO Rides(startLat, startLong, endLat, endLong, riderName, driverName, driverVehicle) VALUES (?, ?, ?, ?, ?, ?, ?)', values, function (err) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            db.all('SELECT * FROM Rides WHERE rideID = ?', this.lastID, function (err, rows) {
                if (err) {
                    return res.send({
                        error_code: 'SERVER_ERROR',
                        message: 'Unknown error'
                    });
                }

                res.send(rows);
            });
        });
    });


    /**
     * @swagger
     * /rides:
     *   get:
     *     summary: List all the rides
     *     description: Returns a list of all the rides booked
     *     tags:
     *       - external
     *     responses:
     *       200:
     *         description: List of rides
     *         schema:
     *           type: array
     *           items:
     *               type: object
     *               properties:
     *                  startLat:
     *                      type: number
     *                      description: Starting Lat Coordinate
     *                  startLong:
     *                      type: number
     *                      description: Starting Lng Coordinate
     *       404:
     *          description: Rides not found
     *          schema:
     *              type: object
     *              properties:
     *                  error_code:
     *                      type: string
     *                      description : possible values (SERVER_ERROR)
     *                  message:
     *                      type: string
     *                      description: error message from server
     *
     */

    app.get('/rides', (req, res) => {
        db.all('SELECT * FROM Rides', function (err, rows) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            res.send(rows);
        });
    });


    /**
     * @swagger
     * /rides/:id:
     *   get:
     *     summary: Get Ride by id
     *     description: Returns ride by id
     *     tags:
     *       - external
     *     parameters:
     *       - in: path
     *         name: id
     *         type: integer
     *         required: true
     *
     *     responses:
     *       200:
     *         description: Ride Object
     *         schema:
     *          type: object
     *          properties:
     *                  startLat:
     *                      type: number
     *                      description: Starting Lat Coordinate
     *                  startLong:
     *                      type: number
     *                      description: Starting Lng Coordinate
     *       404:
     *          description: Rides not found
     *          schema:
     *              type: object
     *              properties:
     *                  error_code:
     *                      type: string
     *                      description : possible values (SERVER_ERROR, RIDES_NOT_FOUND_ERROR)
     *                  message:
     *                      type: string
     *                      description: error message from server
     *
     */
    app.get('/rides/:id', (req, res) => {
        db.all(`SELECT * FROM Rides WHERE rideID='${req.params.id}'`, function (err, rows) {
            if (err) {
                return res.send({
                    error_code: 'SERVER_ERROR',
                    message: 'Unknown error'
                });
            }

            if (rows.length === 0) {
                return res.send({
                    error_code: 'RIDES_NOT_FOUND_ERROR',
                    message: 'Could not find any rides'
                });
            }

            res.send(rows);
        });
    });

    return app;
};
