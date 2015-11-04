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
	let channelRegistry = {},
		connectionRegistry = {};

	let _lookupChannel = id => {
		// Takes a string id, and returns the channel matching that id.
		return channelRegistry[id];
	},
	_insertChannel = channel => {
		//Place a channel object into the registry based upon its internalID.
		channelRegistry[channel.internalID] = channel;
	},
	_newConnection = (id, channel) => {
		let conn = new this.config.rtc_facade.RTCPeerConnection(this.config.rtc_config),
			trConn = new TrackedConnection(id, conn);

		_insertConnection(id, trConn);

		conn.onicecandidate = function(evt) {
			if(evt.candidate)
				channel.send(id, enums.MSG_ICE, evt.candidate);
		}

		return trConn;
	},
	_lookupConnection = id => {
		// Check to see if a connection exists in the registry already.
		return connectionRegistry[id];
	},
	_insertConnection = (id, connection) => {
		//Place a Connection object into the registry based upon its internalID.
		connectionRegistry[id] = connection;
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
	_mergeConfig = config => {
		let out = {};
		
		for(var propName in defaultConfig)
			if(defaultConfig.hasOwnProperty(propName))
				out[propName] = defaultConfig[propName];

		for(var propName in config)
			if(config.hasOwnProperty(propName) && (out[propName] === null || out[propName] === undefined))
				out[propName] = config[propName];

		return out;
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
	
			let dataChan = look.connection.createDataChannel("__default", null);
	
			dataChan.onopen = ()=>{console.log("a")};
			dataChan.onclose = ()=>{console.log("b")};
			dataChan.onerror = ()=>{console.log("c")};
			dataChan.onmessage = ()=>{console.log("d")};
	
			channel._ready
				.then(result => {
					if(result)
						return look.connection.createOffer({});
					else
						return new Promise((res,rej)=>{rej("Channel failed to become ready for connection or is not allowing outbound offers.");})
				})
				// .then(look.connection.setLocalDescription)
				.then((res) => {
						console.log(res)
						console.log(look);
						return look.connection.setLocalDescription(res)
					},
					(reason)=>console.log(reason))
				.then(
					result => {
						channel.send(id, enums.MSG_SDP_OFFER, look.connection.localDescription);
					},
					reason => console.log(reason)
				);

			prom = new Promise((resolve,reject)=>{

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

		// debugger;

		let input = channel.onmessage(msg),
			target = _lookupConnection(input.id),
			data = input.data;

		if(!target && input.id)
			target = _newConnection(input.id, channel);

		switch(input.type){
			case(enums.RESPONSE_NONE):
				break;
			case(enums.RESPONSE_ICE):
				console.log("ICE candidate picked up by manager.");
				console.log(data);
				target.connection.addIceCandidate(new RTCIceCandidate(data))
					.then(
					  	result => console.log("Successfully added ICE candidate to connection "+input.id),
					  	reason => console.log("Unsuccessful in adding ICE candidate to connection "+input.id+": "+reason)
					);
				break;
			case(enums.RESPONSE_SDP_OFFER):
				console.log("SDP offer picked up by manager.")
				target.connection.setRemoteDescription(new RTCSessionDescription(data))
					.then((res) => {
						console.log(res)
						return target.connection.createAnswer()
					},
					(reason)=>console.log(reason))
					// .then(target.connection.setLocalDescription)
					.then((res) => {
						console.log(res)
						return target.connection.setLocalDescription(res)
					},
					(reason)=>console.log(reason))
					.then(
						result => channel.send(input.id, enums.MSG_SDP_ANSWER, target.connection.localDescription),
						reason => {throw new Error("Failed to respond to SDP offer: "+reason);}
					);
				break;
			case(enums.RESPONSE_SDP_ANSWER):
				console.log("SDP answer picked up by manager.");
				target.connection.setRemoteDescription(new RTCSessionDescription(data))
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

	// Initialisation code

	this.config = _mergeConfig(config);

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

	this.connection = rtcConn;

	this.dataChannels = {
		__default: null
	};

	this.openStatus = "closed";

	this.addDataConnection = function(name){
		// Add another data connection onto this RTCPeerConnection.
		// If we use a duplicate name, just take that connection instead.
		// Return a promise.
		// TODO
	}

	this.close = function(){
		// Decrement usages by 1.
		// If _usages hits zero, place a timeout function to kill this item if it gains no more users
		// before TTL
		// TODO
	}
}

module.exports = {
	create(config){
		return new WebRTCResourceManager(config);
	},

	WebRTCResourceManager,
	TrackedConnection,
	enums
};
