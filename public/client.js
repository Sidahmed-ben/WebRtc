
$(function () {


    var socket = io.connect("http://localhost:4000");
    var divVideoChatLobby = document.getElementById("video-chat-lobby");
    var divVideoChat = document.getElementById("video-chat-room");
    var joinButton = document.getElementById("join");
    var userVideo = document.getElementById("user-video");
    var peerVideo = document.getElementById("peer-video");
    var roomInput = document.getElementById("roomName");
    var creator   = false; 
    var rtcPeerConnection;
    var userStream ;


    // Create Ice Framework 
    let iceServers = {
        //  Stun Servers list.
        iceServers: [
          { urls: "stun:stun.services.mozilla.com" },
          { urls: "stun:stun.l.google.com:19302" },
        ]
        // It can also contain a list of Turn Servers.
    };


    joinButton.addEventListener("click", function () {
        if (roomInput.value == "") {
            alert("please enter a room name");
        } else {
            socket.emit('join',roomInput.value);
        }
    });

    socket.on("created" , function(){
        creator = true;
        console.log("Room Created");
        var constraints = { audio: false, video: { width: 1280, height: 720 } };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (mediaStream) {
                userStream = mediaStream;
                userVideo.srcObject = mediaStream;
                userVideo.onloadedmetadata = function (e) {
                    userVideo.play();
                };
                divVideoChatLobby.style= "display:none";
            })
            .catch(function (err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.
    });

    socket.on("joined" , function(){
        console.log("Room Joined");
        var constraints = { audio: false, video: { width: 1280, height: 720 } };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (mediaStream) {
                userStream = mediaStream;
                userVideo.srcObject = mediaStream;
                userVideo.onloadedmetadata = function (e) {
                    userVideo.play();
                };
                divVideoChatLobby.style= "display:none";
                socket.emit("ready", roomInput.value);
            })
            .catch(function (err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.
    });

    socket.on("full", function(){
        alert("OUps !! the room is full ");
    });


    // Establish Peer connection
    socket.on("ready" , function(){
        //  If the it is the client who creats the room
        if(creator){
            //  Create peer-ti-peer connection .
            rtcPeerConnection = new RTCPeerConnection(iceServers);
            //  Each time an iceCandidate is created the function "onicecandidate" trigers.
            rtcPeerConnection.onicecandidate = onIceCandidateFunction;
            console.log("je suis dans le on('ready') du creator ");
            // This function is trigerred when the client receive the media from the other peer
            rtcPeerConnection.ontrack = OntrackFunction;
            // This function sends the stream to the other client.
            // 0 -> audio / 1 -> vidéo
            rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
            // rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

            // send offer to other client(peer)
            rtcPeerConnection.createOffer(
                function(offer){
                    console.log(" je suis dans CREATEOFFER");
                    rtcPeerConnection.setLocalDescription(offer);
                    socket.emit("offer",offer, roomInput.value);
                }, 
                function(error){
                    console.log(error);
                },
                
            );
        }
    });

    socket.on("candidate" , function(candidate){
        var ice = new RTCIceCandidate(candidate);
        console.log("candidate => ");
        console.log(ice);
        rtcPeerConnection.addIceCandidate(ice);
    });

    socket.on("offer", function(offer){
        if(!creator){
            console.log("je suis dans offer  client");
            //  Create peer-ti-peer connection .
            rtcPeerConnection = new RTCPeerConnection(iceServers);
            //  Each time an iceCandidate is created the function "onicecandidate" trigers.
            rtcPeerConnection.onicecandidate = onIceCandidateFunction;
            // This function is trigerred when the client receive the media from the other peer
            rtcPeerConnection.ontrack = OntrackFunction;
            // This function sends the stream to the other client.
            // 0 -> audio / 1 -> vidéo
            rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
            // rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);S
            rtcPeerConnection.setRemoteDescription(offer);
            // send offer to other client(peer)
            rtcPeerConnection
            .createAnswer()
            .then((answer) => {
              rtcPeerConnection.setLocalDescription(answer);
              socket.emit("answer", answer, roomInput.value);
            })
            .catch((error) => {
              console.log(error);
            });
        }
    });

    socket.on("answer", function(answer){
        if(creator){
            rtcPeerConnection.setRemoteDescription(answer);
        }
    });



    function onIceCandidateFunction(event){
        if(event.candidate){
            socket.emit("candidate",event.candidate,roomInput.value);
        }   
    }


    function OntrackFunction(event){
        peerVideo.srcObject = event.streams[0];
        peerVideo.onloadedmetadata = function(e){
            peerVideo.play();
        }
    }

});


