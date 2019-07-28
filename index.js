'use strict';
const path = require('path');
const express = require('express');
const app = express();
const port = 8010;


const winston = require("winston");
const logger = winston.createLogger({
    level: 'info',
    transports: [
        new winston.transports.File({ filename: 'error.log', level: 'error' }),
        new winston.transports.File({ filename: 'combined.log' })
    ]
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.simple()
    }));
}

const bodyParser = require('body-parser');
const jsonParser = bodyParser.json();

const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database(':memory:');

const buildSchemas = require('./src/schemas');
const swaggerJSDoc = require('swagger-jsdoc');
// -- setup up swagger-jsdoc --
const swaggerDefinition = {
    info: {
        title: 'Rides API',
        version: '1.0.0',
        description: 'Manages Rides',
    },
    host: 'localhost:'+port,
    basePath: '/',
};
const options = {
    swaggerDefinition,
    apis: [path.resolve(__dirname, 'src/*.js')],
};
const swaggerSpec = swaggerJSDoc(options);



db.serialize(() => {
    buildSchemas(db);

    const app = require('./src/app')(db);

    app.listen(port, () => logger.info(`App started and listening on port ${port}`));

    app.get('/swagger.json', (req, res) => {
        res.setHeader('Content-Type', 'application/json');
        res.send(swaggerSpec);
    });
    app.get('/docs', (req, res) => {
        res.sendFile(path.join(__dirname, 'html/redoc.html'));
    });
});