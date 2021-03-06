
$(function () {


    let socket = io();
    let divVideoChatLobby = document.getElementById("video-chat-lobby");
    let divVideoChat = document.getElementById("video-chat-room");
    let joinButton = document.getElementById("join");
    let userVideo = document.getElementById("user-video");
    let peerVideo = document.getElementById("peer-video");
    let roomInput = document.getElementById("roomName");
    let buttonOption = document.getElementById("option-button");


    let muteBool   = true;
    let cameraBool = true; 

    let creator   = false; 
    let rtcPeerConnection;
    let userStream ;
    let constraints = { audio: true, video: { width: 500, height: 500 } };


    $("#Mute").click(function(){
        muteBool = !muteBool ;
        if(muteBool){
            $(this).text("Voice");
            console.log(constraints);
            userStream.getTracks()[0].enabled = false;
        }else{
            $(this).text("Mute");
            userStream.getTracks()[0].enabled = true;
        }
    });

    $("#Hide-camera").click(function(){
        cameraBool = !cameraBool ;
        if(cameraBool){
            $(this).text("Show Camera");
            userStream.getTracks()[1].enabled = true;
            console.log(userStream.getTracks());
        }else{
            $(this).text("Hide Camera");
            userStream.getTracks()[1].enabled = false;
        }
    });
     
    $("#Leave-room").click(function(){
        socket.emit("leave", roomInput.value);
        divVideoChatLobby.style= "display:block";
        buttonOption.style = "display:none";

        console.log(userVideo.srcObject);
        if(userVideo.srcObject){
            
            userVideo.srcObject.getTracks()[0].stop();
            userVideo.srcObject.getTracks()[1].stop();
        }

        if(peerVideo.srcObject){
            peerVideo.srcObject.getTracks()[0].stop();
            peerVideo.srcObject.getTracks()[1].stop();
        }

        if(rtcPeerConnection){
            rtcPeerConnection.ontrack = null ;
            rtcPeerConnection.onicecandidate = null ;
            rtcPeerConnection.close() ;
            rtcPeerConnection = null ;
        }

    });

    
    socket.on("leave", function(){
        creator = true;
        console.log(" je suis dans leave 3emmiiii ");
        if(rtcPeerConnection){
            rtcPeerConnection.ontrack = null ;
            rtcPeerConnection.onicecandidate = null ;
            rtcPeerConnection.close() ;
            rtcPeerConnection = null ;
        }
        if(peerVideo.srcObject){
            peerVideo.srcObject.getTracks()[0].stop();
            peerVideo.srcObject.getTracks()[1].stop();
        }

    });


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

    window.addEventListener("keydown", function(event){
        if(event.key == "Enter"){
            joinButton.click();
        }
    });

    socket.on("created" , function(){
        creator = true;
        console.log("Room Created");
        // constraints = { audio: false, video: { width: 500, height: 500 } };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (mediaStream) { 
                userStream = mediaStream;
                userVideo.srcObject = mediaStream;
                console.log(userVideo.srcObject);
                userVideo.onloadedmetadata = function (e) {
                    userVideo.play();
                };
                divVideoChatLobby.style= "display:none";
                buttonOption.style = "display:flex";
            })
            .catch(function (err) { console.log(err.name + ": " + err.message); }); // always check for errors at the end.
    });

    socket.on("joined" , function(){
        console.log("Room Joined");
        // let constraints = { audio: false, video: { width: 500, height: 500 } };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(function (mediaStream) {
                userStream = mediaStream;
                userVideo.srcObject = mediaStream;
                
                userVideo.onloadedmetadata = function (e) {
                    userVideo.play();
                };
                divVideoChatLobby.style= "display:none";
                buttonOption.style = "display:flex";
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
            // 0 -> audio / 1 -> vid??o
            rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
            rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

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
        let ice = new RTCIceCandidate(candidate);
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
            // 0 -> audio / 1 -> vid??o
            rtcPeerConnection.addTrack(userStream.getTracks()[0], userStream);
            rtcPeerConnection.addTrack(userStream.getTracks()[1], userStream);

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


