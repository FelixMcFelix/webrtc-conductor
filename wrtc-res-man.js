"use strict";

const wrtc_adapter = require("webrtc-adapter-test")
	, Options = require("options")
	, signalChannels = {
		id_free: require("./example_channels/id_free.js")
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

	this.config = config.value;

	this.connectTo = function(id, channel){
		// TODO
	};

	this.getConnection = function(id){
		// TODO
	};
}

function TrackedConnection(){
	//TODO
}

module.exports = {
	create(config){
		return new WebRTCResourceManager(config);
	},

	WebRTCResourceManager,

	signalChannels
};
