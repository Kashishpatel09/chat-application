const express = require("express");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");

// App setup
const app = express();
const server = http.createServer(app);
const io = new Server(server); // Updated for the latest socket.io

// MongoDB connection
const dbName = "TOPS_DB";
mongoose
  .connect(`mongodb://localhost:27017/${dbName}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log(`Connected to MongoDB: ${dbName}`);
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

// Chat schema and model
const chatSchema = new mongoose.Schema({
  username: String,
  message: String,
  timestamp: { type: Date, default: Date.now },
});
const Chat = mongoose.model("Chat", chatSchema);

// Middleware
app.use(express.static("public"));
app.use(express.json());

// Routes
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

// WebSocket connection
io.on("connection", (socket) => {
  console.log("A user connected");

  // Load previous chat messages
  Chat.find()
    .sort({ timestamp: -1 })
    .limit(10)
    .then((messages) => {
      socket.emit("load messages", messages.reverse());
    })
    .catch((err) => console.error("Error loading messages:", err));

  // Listen for new messages
  socket.on("chat message", async (data) => {
    try {
      const chatMessage = new Chat(data);
      await chatMessage.save();
      io.emit("chat message", data);
    } catch (err) {
      console.error("Error saving message:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("A user disconnected");
  });
});

// Start the server
const PORT = 8080;
server.listen(PORT, () => {
   
  console.log(`Server running at http://localhost:${PORT}/`);
});