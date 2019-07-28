'use strict';

const express = require('express');
const app = express();

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const model = require("./model");
const util = require("./utils");

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
     *                  endLat:
     *                      type: number
     *                      description: End Lat Coordinate
     *                  endLong:
     *                      type: number
     *                      description: End Lng Coordinate
     *                  riderName:
     *                      type: string
     *                  driverName:
     *                      type: string
     *                  driverVehicle:
     *                      type: string
     *
     *
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

        (async () => {

            try {

                const startLatitude = Number(req.body.start_lat);
                const startLongitude = Number(req.body.start_long);
                const endLatitude = Number(req.body.end_lat);
                const endLongitude = Number(req.body.end_long);
                const riderName = req.body.rider_name;
                const driverName = req.body.driver_name;
                const driverVehicle = req.body.driver_vehicle;

                let validationError = util.validateCreateRideRequest(startLatitude, startLongitude, endLatitude,
                    endLongitude, riderName, driverName, driverVehicle);
                if (validationError !== "") {
                    return res.send({
                        error_code: util.ERR_CODE_VALIDATION_ERROR,
                        message: validationError
                    });
                }

                let rows = await model(db).createRide(startLatitude, startLongitude, endLatitude,
                    endLongitude, riderName, driverName, driverVehicle);
                res.send(rows);

            } catch (e) {
                return res.send({
                    error_code: util.ERR_CODE_SERVER_ERROR,
                    message: util.ERR_UNKNOWN
                });
            }

        })();

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
     *                  endLat:
     *                      type: number
     *                      description: End Lat Coordinate
     *                  endLong:
     *                      type: number
     *                      description: End Lng Coordinate
     *                  riderName:
     *                      type: string
     *                  driverName:
     *                      type: string
     *                  driverVehicle:
     *                      type: string
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
        (async () => {
            const LIMIT = 10;
            let page = req.query.page || 1;
            let offset = (page * LIMIT) - LIMIT;

            try {
                let rows = await model(db).getRides(offset, LIMIT);

                if (rows.length === 0) {
                    return res.send({
                        error_code: util.ERR_CODE_RIDE_NOT_FOUND,
                        message: util.ERR_RIDE_NOT_FOUND
                    });
                }

                res.send(rows);
            } catch (e) {
                res.send({
                    error_code: util.ERR_CODE_SERVER_ERROR,
                    message: util.ERR_UNKNOWN
                });
            }
        })()
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
     *                  endLat:
     *                      type: number
     *                      description: End Lat Coordinate
     *                  endLong:
     *                      type: number
     *                      description: End Lng Coordinate
     *                  riderName:
     *                      type: string
     *                  driverName:
     *                      type: string
     *                  driverVehicle:
     *                      type: string
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

        (async () => {

            try {

                let rows = await model(db).getRide(req.params["id"]);

                if (rows.length === 0) {
                    return res.send({
                        error_code: util.ERR_CODE_RIDE_NOT_FOUND,
                        message: util.ERR_RIDE_NOT_FOUND
                    });
                }

                res.send(rows);

            } catch (e) {
                res.send({
                    error_code: util.ERR_CODE_SERVER_ERROR,
                    message: util.ERR_UNKNOWN
                });
            }
        })();
    });

    return app;
};
