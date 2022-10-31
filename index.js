const express = require('express');
const app = express();
const dotenv = require('dotenv').config()


const PORT = process.env.PORT || 4000;

const fs = require('fs')
const messageData = fs.readFileSync('messages.json')

const messagesData = JSON.parse(messageData)

const http = require('http').Server(app);
const cors = require('cors');

app.use(cors());

const socketIO = require('socket.io')(http, {
    cors: {
        origin: "http://localhost:3000"
    }
});

let users = [];

socketIO.on('connection', (socket) => {
    console.log(`⚡: ${socket.id} user just connected!`);

    socket.on('friendID', (data) => {
        socketIO.emit('clickedID', data);
    })

    // socket.on('message', (data) => {
    //     if (data.clickedID === '') {
    //         socketIO.emit('messageResponse', data);
    //     } else {
    //         socketIO.to(data.clickedID).emit('messageResponse', data)
    //     }
    // });

    socket.on("message", data => {
        messagesData["messages"].push(data)
        const stringData = JSON.stringify(messagesData, null, 2)
        fs.writeFile("messages.json", stringData, (err) => {
            console.error(err)
        })
        socketIO.emit("messageResponse", data)
    })



    socket.on('joining-room', room => {
        socket.join(room)
    })


    socket.on('typing', (data) => socket.broadcast.emit('typingResponse', data));

    socket.on('newUser', (data) => {
        users.push(data);
        socketIO.emit('newUserResponse', users);
    });

    socket.on('disconnect', () => {
        console.log('🔥: A user disconnected');
        users = users.filter((user) => user.socketID !== socket.id);
        socketIO.emit('newUserResponse', users);
        socket.disconnect();
    });
});

app.get('/api', (req, res) => {
    res.json(messagesData);
});

http.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});
