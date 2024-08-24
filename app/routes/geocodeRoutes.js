const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust the path if necessary
const authMiddleware = require('../middleware/authenticateToken');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");
const env = require("../../env.json"); // Ensure the path to env.json is correct
const opencage = require('opencage-api-client');
const geoKey = env.geocode_key;

router.get('/geocode', async (req, res) => {
    const { address } = req.query;
  
    if(!address) {
      return res.status(400).json({ error: 'Invalid Address Format' });
    }
    
    try {
        const response = await opencage.geocode({
            q: address,
            key: geoKey
        });
        console.log('Geocode API received');
  
        if(response.results && response.results.length > 0){
            const { geometry } = response.results[0];
            res.json(geometry);
        }
    
        else {
            res.status(404).json({ error: 'Address not found' });
        }
    } catch (error) {
      console.log("Error requesting from geocode API", error.message);
      res.status(500).json({});
    }
    console.log("Request sent to geocode API");
});
  
module.exports = router;