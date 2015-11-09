var WebSocketServer = require("ws").Server;
var wss = new WebSocketServer({port: 4860});

wss.on("connection", function(ws){
	ws.on("message", messageReceived);
	ws.on("close", closeConnection);
});

//Storage of data...
var connections = [];

function messageReceived(message){
	console.log(message)
	var obj = unwrap(message);
	var ws = this;

	switch(obj.type){
		//INITIAL NEGOTIATION.
		case "repool":
			log("Requeueing client.");
			delete ws.partner;
		case "register":
			connections.push(ws);
			log("New user added - now "+connections.length+" clients awaiting pairing.");

			if(connections.length > 1){
				log("Taking two users, instructing them to open a data channel.");
				var temp = connections.splice(0, 2);
				
				temp.forEach(function(curr, ind, arr){
					//Set some reference to the partner for connection.
					curr.partner = arr[(ind===0)?1:0];

					safeSend(curr, {
						type: "beginExchange",
						data: ind //The client who came first creates the initial connection proposal.
					});
					log("Client "+ind+" informed of new status.");
				});

			}
			break;
		case "finished":
			log("Client disconnecting, reason: "+obj.data);
			ws.close()
			break;
		default:
			safeSend(ws.partner, obj);
	}
}

function closeConnection(code, message){
	var ws = this;
	log("Connection removed.");
}

//Convenience functions
function safeSend(ws, obj){
	try{
		ws.send(wrap(obj));
	} catch(e){
		log("An error occurred while sending a WebSocket datagram. Check the console (F12) for the stack trace.");
		console.log(e);
	}
};

function wrap(obj){
	return JSON.stringify(obj);
};

function unwrap(str){
	return JSON.parse(str);
};

function log(string){
	console.log(string);
};