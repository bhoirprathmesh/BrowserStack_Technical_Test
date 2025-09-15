const express = require("express");
const { createServer } = require("node:http");
const { join } = require("node:path");
const { Server } = require("socket.io");
const path = require("path");
const fs = require("fs");

const app = express();
const server = createServer(app);
const io = new Server(server);

const Log_File = path.join(__dirname, "log.log");
const Max_Line = 10;
const Chunk_Size = 1024; 

let log = [];

function readLastLines(filePath, maxLines, callback) {
  fs.stat(filePath, (err, stats) => {
    if (err) return callback(err);

    let fileSize = stats.size;
    let buffer = Buffer.alloc(0);
    let position = fileSize;
    let lines = [];

    const readNextChunk = () => {
      let chunkSize = Math.min(Chunk_Size, position);
      position -= chunkSize;

        let chunkBuffer = Buffer.alloc(chunkSize);
        
      fs.open(filePath, "r", (err, fd) => {
        if (err) return callback(err);

        fs.read(fd, chunkBuffer, 0, chunkSize, position, (err, bytesRead) => {
          fs.close(fd, () => {});
          if (err) return callback(err);

          buffer = Buffer.concat([chunkBuffer, buffer]);
          lines = buffer.toString("utf8").split("\n").filter(Boolean);

          if (lines.length >= maxLines || position === 0) {
            lines = lines.slice(-maxLines);
            callback(null, lines);
          } else {
            readNextChunk();
          }
        });
      });
    };

    readNextChunk();
  });
}

function initializeLogBuffer() {
  readLastLines(Log_File, Max_Line, (err, lines) => {
    if (!err) {
      log = lines;
    }
  });
}

initializeLogBuffer();


fs.watchFile(Log_File, { interval: 200 }, (curr, prev) => {
  if (curr.size > prev.size) {
    const stream = fs.createReadStream(Log_File, {
      start: prev.size,
      end: curr.size,
      encoding: "utf8",
    });

    let buffer = "";
    stream.on("data", (chunk) => {
      buffer += chunk;
    });

    stream.on("end", () => {
      const newLines = buffer.trim().split("\n").filter(Boolean);
      newLines.forEach((line) => log.push(line));

      if (log.length > Max_Line) {
        log = log.slice(-Max_Line);
      }

      io.emit("update", log);
    });
  }
});

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, "index.html"));
});

app.get("/log", (req, res) => {
  res.type("text/plain");
  res.send(log.join("\n"));
});

io.on("connection", (socket) => {
  console.log("a user connected");
  socket.emit("update", log);

  socket.on("disconnect", () => {
    console.log("user disconnected");
  });
});

server.listen(3000, () => {
  console.log("server running at http://localhost:3000");
});
