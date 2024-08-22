const express = require('express');
const router = express.Router();
const pool = require('../db'); // Adjust the path if necessary
const authMiddleware = require('../middleware/authenticateToken');
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const axios = require("axios");
const env = require("../../env.json"); // Ensure the path to env.json is correct
const ytKey = env.yt_key;

router.get('/:videoId', async (req, res) => {
    const { videoId } = req.params;
    const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoId}&key=${ytKey}`;
  
    console.log("Client requested /video/:videoId with URL:", url);
  
    axios.get(url).then(response => {
      console.log("API response received");
  
      if(response.data.items.length > 0){
        const videoData = response.data.items[0];
        const video = {
          title: videoData.snippet.title,
          embedUrl: `https://www.youtube.com/embed/${videoId}`,
        };
        res.json(video);
      }
  
      else{
        res.status(404).json({ error: 'Video not found' });
      }
      
    }).catch(error => {
      console.log("Error requesting from API", error.message);
      res.status(500).json({});
    });
    console.log("Request sent to API");
  });


module.exports = router;