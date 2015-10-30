"use strict";

const wrtc_adapter = require("webrtc-adapter-test")
	, Options = require("options")
	, signalChannels = {
		id_free: require("./example_channels/id_free.js")
	}
	, enums = {
		RESPONSE_NONE: Symbol("Miscellaneous Response"),
		RESPONSE_ICE: Symbol("ICE Candidate Response"),
		RESPONSE_SDP_REPLY: Symbol("SDP Reply Response"),

		MSG_SDP_ANSWER: Symbol("SDP Reply Message"),
		MSG_SDP_REQUEST: Symbol("SDP Proposal Message"),
		MSG_ICE: Symbol("ICE Candidate Message")
	};

const defaultConfig = {
	channel: null,
	conn_ttl: 10000,
	rtc_facade: wrtc_adapter,
	rtc_config: { iceServers: [{urls: ["stun:stun.l.google.com:19302", "stun:stun.ekiga.net"] }] }
};

function WebRTCResourceManager(config){
	config = new Options(defaultConfig).merge(config);
	if (!config.isDefinedAndNonNull("rtc_facade") || !config.isDefinedAndNonNull("channel")) {
	    throw new TypeError("An 'rtc_facade' and 'channel' must be defined for WebRTC to be used.");
	}

	let _lookupChannel = function(id){
		// Takes a string id, and returns the channel matching that id.
		// TODO
	},
		_lookupConnection = function(id){
		// Check to see if a connection exists in the registry already.
		// TODO
	}

	this.config = config.value;

	this.connectTo = function(id, channel){
		// Return an instance of a given connection by its id.
		// This increments a connection's usage counter.
		// If the channel supplied is an id, look it up in the registry.
		//		If it has been bound to this, use it. If bound to another manager, throw.
		// 		Otherwise, add it to the registry if it has yet to be bound.
		// TODO
		// RETURN PROMISE
	};

	this.close = function(id){
		// Close a connection with the given id.
		// If you have a TrackedConnection instance you'd be better off just calling .close on that.
		// TODO
	}

	this.getConnection = function(id){
		// Return an instance of a given connection by its id.
		// This shouldn't affect a connection's usages counter.
		// TODO
	};

	this.response = function(msg, channel){
		// Call this function to to pass a response from a channel to the correct channel handler.
		// channel may either be a channel object or an id - in both cases the channel object MUST
		// be registered to the controller.
		// TODO
	};

	this.register = function(channel){
		// Called to add a channel handler to the channel registry.
		// Strict limit of one handler per id - duplicate entry should close the old before inserting the new.
		// TODO
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

	this.dataChannel = null;

	this.openStatus = "closed";

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
	signalChannels,
	enums
};
