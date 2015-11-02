"use strict";

const WebSocket = require("ws")
	, resManEnum = require("../wrtc-res-man.js").enums;

IDFreeChannel = function(serverAddr){
	// Example connection to show connection over WebSockets where id is not used meaningfully.
	// This channel is only designed to allow one connection to be opened over a WebSocket relay.

	// Channel Specific code.
	let ws = new WebSocket(serverAddr);

	ws.onopen = () => {
		
	};

	ws.onclose = () => {

	};

	let currentId = null;
	let myCurrId = null;
	let handling = false;
	
	let selected = false;
	let offer = null;

	function sendOffer(){
		if(selected && offer)
			safeSend(offer);
	}

	//Standard Channel Structure.

	this._manager = null;

	// Internal ID used by the registry of the manager to help find registered channels by name.
	this.internalID = "id_free";

	this.send = function(id, type, data){
		if(handling && id !== myCurrId)
			throw new Error("Can't open two connections over this link.");

		handling = true;
		myCurrId = id;

		let obj = {
			type: null,
			data
		};

		switch(type){
			case resManEnum.MSG_SDP_OFFER:
				obj.type = "sdpOffer";
				offer = obj;
				sendOffer();
				break;
			case resManEnum.MSG_SDP_ANSWER:
				obj.type = "sdpReply";
				safeSend(obj);
				break;
			case resManEnum.MSG_ICE:
				obj.type = "iceCand";
				safeSend(obj);
				break;
			default:
				throw new Error("Illegal class "+type+" of message sent to id_free channel!");
		}
	};

	this.onmessage = function(msg){
		var obj = unwrap(msg.data);
		var out = {type: null, data: obj.data, id: myCurrId};

		switch(obj.type){
			case "beginExchange":
				if(obj.data === 0){
					//We have been selected to send the offer.
					selected = true;
				} else{
					//We must await an offer.
				}
				out.type = resManEnum.RESPONSE_NONE;
				break;
			case "sdpOffer":
				out.type = resManEnum.RESPONSE_SDP_OFFER;
				break;
			case "sdpReply":
				out.type = resManEnum.RESPONSE_SDP_ANSWER;
				break;
			case "iceCand":
				out.type = resManEnum.RESPONSE_ICE;
				break;
			default:
				out.type = resManEnum.RESPONSE_NONE;
				break;
		}

		return out;
	};

	this.onbind = function(){
		ws.onmessage = (msg) => {
			this._manager.response(msg, this);
		};

		ws.onopen = () => {
			safeSend({
				type: "register"
			});
		};
	};

	this.close = function(){
		ws.close();
	};

	//Helpers
	function safeSend(obj){
		try{
			ws.send(wrap(obj));
		} catch(e){
			console.log("An error occurred while sending a WebSocket datagram. Check the console (F12) for the stack trace.");
			console.log(e);
		}
	};

	function wrap(obj){
		return JSON.stringify(obj);
	};

	function unwrap(str){
		return JSON.parse(str);
	};
}

module.exports = IDFreeChannel;