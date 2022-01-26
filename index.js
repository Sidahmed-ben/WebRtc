const express = require('express');
const socket  = require('socket.io'); 
const app = express();

// Create a server 
var server = app.listen(4000,function(){
    console.log("Server is runing : Listening in port 4000");
});


// link our server with the html/css/js folder.
app.use(express.static("public"));

// Upgrade the previous server to bidirectional server,
// to accept websocket connection. 
var io = socket(server);

io.on("connection", function (socket) {
    console.log("User Connected :",socket.id);
    socket.on("join", function(roomName/* args */ ){
        // Get the list of clients that are connected to the socket.
        var rooms_liste = io.sockets.adapter.rooms;
        var room = rooms_liste.get(roomName);
        // Get the room that has the same name like room_name arg
        if(room == undefined){
            // if room doesn't exist
            //  Join the new room to the liste of rooms.
            socket.join(roomName);
            //  Send the event created to the client
            socket.emit("created");
            // console.log(room);
            console.log("CCCCCCCCCCCCCCCCCCCCCC");

        }else if(room.size == 1){
            console.log("JJJJJJJJJJJJJJJJJJJJJJJJJJJ");
            // if the room exists
            socket.join(roomName);
            // send the event joined to the client
            socket.emit("joined");
            // console.log(room);

        }else{
            socket.emit("full");
        }

        // console.log(rooms_liste);
    });

    

    socket.on("ready", function(roomName){
        // socket.broadcast.to => broadcast to all sockets
        // in the same room(roomName) expect to the socket on which it was 
        // called (the socket called is the socket who sends the event ready).
        socket.broadcast.to(roomName).emit("ready"); //Informs the other peer in the room.
        console.log("Ready");
    });


    socket.on("candidate" , function(candidate, roomName){
        socket.broadcast.to(roomName).emit('candidate', candidate);
        // console.log("Candidate = "+ candidate);
    });

    socket.on("offer", function(offer, roomName){
        socket.broadcast.to(roomName).emit("offer",offer);
        // console.log(offer);
    });

    socket.on("answer", function(answer, roomName){
        console.log(" je suis dans Answer ");
        socket.broadcast.to(roomName).emit("answer", answer);
        console.log("Answer = "+answer);
    });

});

