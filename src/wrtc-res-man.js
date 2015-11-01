"use strict";

const wrtc_adapter = require("webrtc-adapter-test")
	, Options = require("options")
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

	config = new Options(defaultConfig).merge(config);
	if (!config.isDefinedAndNonNull("rtc_facade") || !config.isDefinedAndNonNull("channel")) {
	    throw new TypeError("An 'rtc_facade' and 'channel' must be defined for WebRTC to be used.");
	}

	let _lookupChannel = id => {
		// Takes a string id, and returns the channel matching that id.
		return channelRegistry[id];
	},
	_insertChannel = channel => {
		//Place a channel object into the registry based upon its internalID.
		channelRegistry[channel.internalID] = channel;
	},
	_lookupConnection = id => {
		// Check to see if a connection exists in the registry already.
		return connectionRegistry[id];
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
	},
	_closeChannel = channel => {
		// Close a channel properly, change its state.
		if(channel.close)
			channel.close();
		channel.state = enums.CHANNEL_CLOSED;
	};

	//Public methods.

	this.config = config.value;

	this.connectTo = (id, channel) => {
		// Return an instance of a given connection by its id.
		// This increments a connection's usage counter.
		// If the channel supplied is an id, look it up in the registry.
		//		If it has been bound to this, use it. If bound to another manager, throw.
		// 		Otherwise, add it to the registry if it has yet to be bound.
		// TODO
		// RETURN PROMISE
	};

	this.close = id => {
		// Close a connection with the given id.
		// If you have a TrackedConnection instance you'd be better off just calling .close on that.
		_lookupConnection(id).close();
	}

	this.getConnection = id => {
		// Return an instance of a given connection by its id.
		// This shouldn't affect a connection's usages counter.
		return _lookupConnection(id);
	};

	this.response = (msg, channel) => {
		// Call this function to to pass a response from a channel to the correct channel handler.
		// channel may either be a channel object or an id - in both cases the channel object MUST
		// be registered to the controller.
		if(typeof channel === "string"){
			channel = _lookupChannel(channel);
		}

		if(channel === null || channel === undefined)
			throw new Error("Channel lookup failed - id does not correspond to a registered channel instance.");
		else if(channel._manager !== this)
			throw new Error("Channel is not bound to this manager instance.");
		else
			channel.onmessage(msg);
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
}

function TrackedConnection(id, rtcConn){
	let _usages = 0;

	Object.defineProperty(this, {
		"usages": {
			"get": () => {return _usages;}
		}
	})

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
