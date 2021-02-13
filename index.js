const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

function usernameFromId(id) {
    var username = "";
    var letter = 0;
    for (var i = 0; i < id.length; i++) {
        letter += id.charCodeAt(i);
        if ((i + 1) % 5 == 0 && i != 0) {
            letter %= 26;
            username += String.fromCharCode(65 + letter);
            letter = 0;
        }
    }
    return username;
}


var banned = ["hello"];

function getBanned(message) {
    for (var i = 0; i < banned.length; i++) {
        while (message.indexOf(banned[i]) >= 0) {
            message = message.replace(banned[i], "*".repeat(banned[i].length));
        }
    }

    return message;
}

io.on('connection', (socket) => {

    socket.username = usernameFromId(socket.id);

    socket.broadcast.emit("user joined", socket.username);
    socket.emit("user joined", socket.username);

    socket.on("get username", () => {
        socket.emit("get username", usernameFromId(socket.id));
    });

    socket.on("chat message", (message) => {

        // check if message contains banned words
        message = getBanned(message);
        socket.broadcast.emit("chat message", socket.username, message);
        socket.emit("chat message", socket.username, message)
    });

    socket.on("ban word", (message) => {
        if (banned.indexOf(message) >= 0) return;
        if (message.length <= 2) return;
        banned.push(message);
        socket.broadcast.emit("word banned", message, socket.username);
        socket.emit("word banned", message, socket.username);
    });

    socket.on("disconnect", () => {
        socket.broadcast.emit("user left", socket.username);
    });
});

http.listen(3000, () => {
    console.log('listening on http://localhost:3000');
});