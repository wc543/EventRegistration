const express = require("express");
const path = require('path');
const http = require('http');
const socketIo = require('socket.io');
const cookieParser = require("cookie-parser");
const session = require('express-session');
const pool = require('./db'); // Ensure this path is correct and you have pool defined
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const port = 3000;
const hostname = "localhost";

const env = require("../env.json");
const passport = require('./middleware/facebookConfig');
const accountRoutes = require('./routes/accountRoutes.js');
const eventRoutes = require('./routes/eventRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const videoRoutes = require('./routes/videoRoutes');
const geocodeRoutes = require('./routes/geocodeRoutes');
const emailRoutes = require('./routes/emailRoutes');
const commentRoutes = require('./routes/commentRoutes');
const messageRoutes = require('./routes/messageRoutes');

app.use(express.static(path.join(__dirname, 'style')));
app.use(express.static(path.join(__dirname, 'helpers')));
app.use(cookieParser());
app.use(session({
  secret: env.session_key || 'fallbackSecret',
  saveUninitialized: true,
  resave: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(passport.initialize());
app.use(passport.session());
app.use('/api/events', eventRoutes);
app.use('/api/account', accountRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/video', videoRoutes);
app.use('/api/comments', commentRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api', geocodeRoutes);
app.use('/api', emailRoutes);

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'home.html'));
});
app.get('/events', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'events.html'));
});
app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'login.html'));
});
app.get('/signup', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'signup.html'));
});
app.get('/messages', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'messages.html'));
});
app.get('/event/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'view', 'event.html'));
});

server.listen(port, () => {
  console.log(`Server running at http://${hostname}:${port}`);
});

// Socket.io configuration
const userSocketMap = {}; // Maps user IDs to socket IDs

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Map user ID to socket ID when a user connects
  socket.on('registerUser', (userId) => {
    userSocketMap[userId] = socket.id;
    console.log(`User ${userId} is connected with socket ID ${socket.id}`);
  });

  // Handle message sending
  socket.on('sendMessage', async (data) => {
    const { senderId, recipientId, message } = data;
    console.log('Message data received:', data); // Add this log
  
    try {
      await pool.query(
        `INSERT INTO direct_message (body, poster_id, recepient_id, sent_at)
        VALUES ($1, $2, $3, NOW())`,
        [message, senderId, recipientId]
      );
      console.log('Message saved to the database'); // Add this log
  
      const recipientSocketId = userSocketMap[recipientId];
      if (recipientSocketId) {
        console.log(`Emitting message to recipient: ${recipientSocketId}`); // Add this log
        io.to(recipientSocketId).emit('receiveMessage', { senderId, message });
      } else {
        console.log(`Recipient ${recipientId} is not connected`);
      }
    } catch (error) {
      console.error('Error storing message:', error);
    }
  });
  

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    // Remove the socket ID from the userSocketMap
    for (let userId in userSocketMap) {
      if (userSocketMap[userId] === socket.id) {
        delete userSocketMap[userId];
        break;
      }
    }
  });
});
