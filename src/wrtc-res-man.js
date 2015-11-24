"use strict";

const wrtc_adapter = require("webrtc-adapter-test")
	, enums = {
		RESPONSE_NONE: Symbol("Miscellaneous Response"),
		RESPONSE_ICE: Symbol("ICE Candidate Response"),
		RESPONSE_SDP_ANSWER: Symbol("SDP Reply Response"),
		RESPONSE_SDP_OFFER: Symbol("SDP Offer Response"),

		MSG_SDP_ANSWER: Symbol("SDP Reply Message"),
		MSG_SDP_OFFER: Symbol("SDP Offer Message"),
		MSG_ICE: Symbol("ICE Candidate Message"),

		CHANNEL_BOUND: Symbol("Channel is bound to resource manager."),
		CHANNEL_CLOSED: Symbol("Channel is closed.")
	};

const defaultConfig = {
	channel: null,
	conn_ttl: 10000,
	rtc_facade: wrtc_adapter,
	rtc_config: { iceServers: [{urls: ["stun:stun.l.google.com:19302", "stun:stun.ekiga.net"] }] }
};

function WebRTCResourceManager(config){
	this._channelRegistry = {};
	this._connectionRegistry = {};

	let _lookupChannel = id => {
		// Takes a string id, and returns the channel matching that id.
		return this._channelRegistry[id];
	},
	_insertChannel = channel => {
		//Place a channel object into the registry based upon its internalID.
		this._channelRegistry[channel.internalID] = channel;
	},
	_newConnection = (id, channel, response) => {
		let conn = new this.config.rtc_facade.RTCPeerConnection(this.config.rtc_config),
			trConn = new TrackedConnection(id, conn);

		_insertConnection(id, trConn);

		conn.onicecandidate = function(evt) {
			if(evt.candidate)
				channel.send(id, enums.MSG_ICE, evt.candidate);
		}

		conn.ondatachannel = function(evt){
			console.log("Received Channel from other partner.")
			console.log(trConn.dataChannels.__default)
			console.log(evt.channel)
			trConn.registerDataChannel(evt.channel);
		}

		if(response)
			_fireOnConnected(conn);

		return trConn;
	},
	_lookupConnection = id => {
		// Check to see if a connection exists in the registry already.
		return this._connectionRegistry[id];
	},
	_insertConnection = (id, connection) => {
		//Place a Connection object into the registry based upon its internalID.
		this._connectionRegistry[id] = connection;
	},
	_validateChannel = channel => {
		// Check to see if an object is a valid channel
		return (channel.internalID && typeof channel.internalID === "string")
				&& (channel.send && typeof channel.send === "function")
				&& (channel.onmessage && typeof channel.onmessage === "function")
				&& (!channel.onbind || typeof channel.onbind === "function")
				&& (!channel.onclose || typeof channel.onclose === "function");
	},
	_bindChannel = channel => {
		// Bind a channel to this manager object. Change its state accordingly.
		_insertChannel(channel);
		channel._manager = this;
		channel.state = enums.CHANNEL_BOUND;

		let onbindresult;
		if(channel.onbind){
			onbindresult = channel.onbind();
		}

		if(!(onbindresult instanceof Promise))
			channel._ready = Promise.resolve(true);
		else
			channel._ready = onbindresult;

	},
	_closeChannel = channel => {
		// Close a channel properly, change its state.
		if(channel.close)
			channel.close();
		channel.state = enums.CHANNEL_CLOSED;
	},
	_channelFromObjectOrId = channel => {
		if(typeof channel === "string"){
			channel = _lookupChannel(channel);
		}

		if(channel === null || channel === undefined)
			throw new Error("Channel lookup failed - id does not correspond to a registered channel instance.");
		else if(channel._manager !== this)
			throw new Error("Channel is not bound to this manager instance.");
		else
			return channel;

		return null;
	},
	_validateConfig = config => {
		return (config.channel && _validateChannel(config.channel))
				&& (config.rtc_facade && typeof config.rtc_facade === "object")
				&& (config.rtc_config && typeof config.rtc_config === "object");
	},
	_mergeConfig = (config1, config2)=>{
		let out = {};
		
		for(var propName in config1)
			if(config1.hasOwnProperty(propName))
				out[propName] = config1[propName];

		for(var propName in config2)
			if(config2.hasOwnProperty(propName))
				out[propName] = config2[propName];

		return out;
	},
	_fireOnConnected = (conn) => {
		if(this.onconnection)
			this.onconnection(conn);
	};

	//Public methods.

	this.connectTo = (id, channel) => {
		// Return an instance of a given connection by its id.
		// This increments a connection's usage counter.
		// If the channel supplied is an id, look it up in the registry.
		//		If it has been bound to this, use it. If bound to another manager, throw.
		// 		Otherwise, add it to the registry if it has yet to be bound.

		let look = _lookupConnection(id),
			prom;

		if(!look){
			if(!channel)
				channel = this.config.channel;
			else{
				try{
					channel = _channelFromObjectOrId(channel);
				} catch (e){
					if(channel.state === enums.CHANNEL_BOUND || channel.state === enums.CHANNEL_CLOSED)
						throw e;
					else
						this.register(channel);
				}
			}
	
			look = _newConnection(id, channel);
	
			// let dataChan = look.connection.createDataChannel("__default", null);
			let dataChan = {};
	
			let ready = channel._ready
				.then(result => {
					if(result){
						dataChan = look.addDataChannel("__default");
						return look.connection.createOffer({});
					}
					else
						return new Promise((res,rej)=>{rej("Channel failed to become ready for connection or is not allowing outbound offers.");});
				})
				.then(result => {
					return look.connection.setLocalDescription(result);
				})
				.then(
					result => {
						channel.send(id, enums.MSG_SDP_OFFER, look.connection.localDescription);
						return true;
					},
					reason => {
						console.log(reason);
						return false;
					}
				);

			prom = new Promise((resolve,reject)=>{
				// dataChan.then(
				// 	result => resolve(look),
				// 	reason => reject(reason)
				// );
				// if(ready){
					dataChan.onopen = () => resolve(look);
					dataChan.onerror = err => reject(err);
				// }
			});

		} else {
			prom = new Promise((resolve, reject)=>{
				resolve(look);
			});
		}

		return prom;
	};

	this.close = id => {
		// Close a connection with the given id.
		// If you have a TrackedConnection instance you'd be better off just calling .close on that.
		_lookupConnection(id).close();
	};

	this.getConnection = id => {
		// Return an instance of a given connection by its id.
		// This shouldn't affect a connection's usages counter.
		return _lookupConnection(id);
	};

	this.response = (msg, channel) => {
		// Call this function to to pass a response from a channel to the correct channel handler.
		// channel may either be a channel object or an id - in both cases the channel object MUST
		// be registered to the controller.
		channel = _channelFromObjectOrId(channel);

		let input = channel.onmessage(msg),
			target = _lookupConnection(input.id),
			data = input.data;

		if(!target && input.id)
			target = _newConnection(input.id, channel, true);

		switch(input.type){
			case(enums.RESPONSE_NONE):
				break;
			case(enums.RESPONSE_ICE):
				console.log("ICE candidate picked up by manager.");
				console.log(data);
				target.connection.addIceCandidate(new this.config.rtc_facade.RTCIceCandidate(data))
					.then(
					  	result => console.log("Successfully added ICE candidate to connection "+input.id),
					  	reason => console.log("Unsuccessful in adding ICE candidate to connection "+input.id+": "+reason)
					);
				break;
			case(enums.RESPONSE_SDP_OFFER):
				console.log("SDP offer picked up by manager.")
				target.connection.setRemoteDescription(new this.config.rtc_facade.RTCSessionDescription(data))
					.then((res) => {
						return target.connection.createAnswer()
					})
					.then((res) => {
						return target.connection.setLocalDescription(res)
					})
					.then(
						result => channel.send(input.id, enums.MSG_SDP_ANSWER, target.connection.localDescription),
						reason => {throw new Error("Failed to respond to SDP offer: "+reason);}
					);
				break;
			case(enums.RESPONSE_SDP_ANSWER):
				console.log("SDP answer picked up by manager.");
				target.connection.setRemoteDescription(new this.config.rtc_facade.RTCSessionDescription(data))
				.then(
					  	result => console.log("Successfully added SDP Answer to connection "+input.id),
					  	reason => console.log("Unsuccessful in adding SDP Answer to connection "+input.id+": "+reason)
					);
				break;
			default:
				throw new Error("Illegal input type sent as response to connection driver.");
		}
	};

	this.register = channel => {
		// Called to add a channel handler to the channel registry.
		// Strict limit of one handler per id - duplicate entry should close the old before inserting the new.
		let lookup = _lookupChannel(channel.internalID);

		if(lookup && lookup !== channel)
			_closeChannel(lookup);

		if(_validateChannel(channel))
			_bindChannel(channel);
		else
			throw new TypeError("The supplied channel is not of a valid format.");
	};

	this.renameConnection = (oldName, newName) => {
		if(!(typeof oldName === "string" && typeof newName === "string"))
			throw new TypeError("Invalid parameters for renameConnection - one or both are not of type \"string\".");
		if(!this._connectionRegistry[oldName])
			throw new ReferenceError("Invalid parameter for old name at renameConnection - no corresponding connection exists.");
		if(this._connectionRegistry[newName])
			throw new ReferenceError("Error for new name at renameConnection - connection of name "+newName+" already exists.");

		this._connectionRegistry[newName] = this._connectionRegistry[oldName]
		delete this._connectionRegistry[oldName];
	}

	this.onconnection = undefined;

	// Initialisation code
	this.config = _mergeConfig(defaultConfig, config);

	if(!_validateConfig(this.config))
		throw new TypeError("An 'rtc_facade', 'rtc_config' and 'channel' must be defined for WebRTC to be used.");

	this.register(this.config.channel);
}



function TrackedConnection(id, rtcConn){
	// let _usages = 0;

	// Object.defineProperty(this, {
	// 	"usages": {
	// 		"get": () => {return _usages;}
	// 	}
	// })

	let _lookupExisting = label => {
		let look;

		if(label)
			look = this.dataChannels[label];
		else
			look = this.dataChannels.__default;

		if(!look)
			throw new Error(label ? "No such data channel for label "+label+"."
				: "No default channel present to send data."
			);

		return look;
	};

	this.id = id;

	this.connection = rtcConn;

	this.dataChannels = {
		__default: null
	};

	// this.openStatus = "closed";

	this.addDataChannel = label => {
		// Add another data connection onto this RTCPeerConnection.
		// If we use a duplicate label, just take that connection instead.
		// Return a promise.
		let dChan = this.dataChannels[label];
		if(!dChan){
			this.registerDataChannel(this.connection.createDataChannel(label, null));
			dChan = this.dataChannels[label];
		}

		return dChan;
	};

	this.registerDataChannel = (dChan) => {
		// let prom = new Promise((resolve, reject) => {
		// 	dChan.onopen = () => {resolve(dChan)};
		// 	dChan.onerror = err => reject(err);
		// 	dChan.onmessage = (msg) => console.log("MESSAGE: "+msg)
		// });

		this.dataChannels[dChan.label] = dChan;

		// return prom;
		return dChan;
	};

	this.send = (msg, label) => {
		_lookupExisting(label)
		// .then(result => result.send(msg));
		.send(msg)
	};

	this.close = () => {
		// Decrement usages by 1.
		// If _usages hits zero, place a timeout function to kill this item if it gains no more users
		// before TTL
		// TODO - closes for real right now.

		this.connection.close();
	};

	this.on = (event, handler, label) => {
		debugger;
		_lookupExisting(label)["on"+event] = handler
		// .then(result => {console.log(result);result["on"+event] = handler;console.log(result.onmessage);});
	};
}

module.exports = {
	create(config){
		return new WebRTCResourceManager(config);
	},

	WebRTCResourceManager,
	TrackedConnection,
	enums
};
