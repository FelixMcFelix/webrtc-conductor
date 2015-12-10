# WebRTC Conductor [![Build Status](https://travis-ci.org/FelixMcFelix/webrtc-conductor.svg)](https://travis-ci.org/FelixMcFelix/webrtc-conductor) [![Code Climate](https://codeclimate.com/github/FelixMcFelix/webrtc-conductor/badges/gpa.svg)](https://codeclimate.com/github/FelixMcFelix/webrtc-conductor)
A lightweight ES6 module to allow for efficient and simple management, creation, reuse and destruction of WebRTC DataChannels - independent of the signalling channel used for negotiation.

Presently, the module is extremely unstable and is functional up to the point where I can use it with a small amount of difficulty in my projects. Over time, I will fix and extend this module as needed.

## Overview
One of the main goals of this library is to decouple the signalling channel used to initialise WebRTC connections from the management library itself - a move that I'm surprised no other library appears to have taken a transport-agnostic approach like this.

To connect to another peer:
```javascript
//Assuming the existence of a channel implementation, FooChannel(webSocketAddr){...}
var Conductor = require("webrtc-conductor");

var myConductor = Conductor.create({
  channel: new FooChannel("ws://somesite.com:9999")
});

myConductor.onconnection = /* Function handling connections made to this system. */;
 
myConductor.connectTo(/* String containing your partner's id. */)
  .then(
    result => {
      //Code handling the connection.
    }, reason => {
      //Code handling a failed connection attempt.
    }
  );
```

## Channels
Although these are properly detailed in src/example_channels/structure_example.js, a rough description is as follows:

```javascript
function FooChannel(param){
	// A reference to the bound manager.
	// You may call:
	//	_manager.response(msg, channel):			alert the manager that a response 
	//												has been received, and delegate
	//												parsing it to the given channel.
	//
	//	_manager.renameConnection(name1, name2):	inform the manager that it must
	//												change a channel's name - typically
	//												used for bootstrapping into a
	//												P2P network.
	this._manager = null;

	// Internal ID used by the registry of the manager to help find
	// registered channels by name.
	this.internalID = "structure_example";

	// Function called by manager when opening a new WebRTC Data Channel. This function
	// is used to convert webrtc negotiation details into a form suitable for the
	// channel, as well as sending this information along the channel.
	this.send = function(id, type, data){
		/*...*/
	};

	// Function called by the manager if the _manager.response(msg, channel)
	// method is called. This function is used to parse and handle the data
	// actually received, and interpret what class of message has been received.
	this.onmessage = function(msg){
		/*...*/
	};

	// An optional function called by the manager once the channel has been bound to it.
	this.onbind = function(){
		/*...*/
	};

	// Function called by the manager or application code if the channel must be closed.
	// All cleanup and related logic should be handled here so that open connections
	// are not left inaccessible by the program.
	this.close = function(){
		/* ... */
	};
}
```

If you are implementing your own channel, I strongly recommend referring to the specification document to be aware of expected return
types, further conventions and so on.

## Changelog

***Note: Breaking changes will regularly occur before v1.0.0 due to instability of the library. Use at your own risk!***

### 0.1.5
* Added "ondatachannel" event to tracked connection objects, this should fire when a data channel is added to a connection - in particular, when a received connection becomes ready for use.

### 0.1.4
* Fixes #4, where configs did not correctly merge. This allows serverside applications to work as intended now.
* Fixes #2, #6. These bugs both resulted from incorrect handling of resources and promises.

### 0.1.3
* Addition of simple .close() method on connections. This closes a connection for real, and is not intelligently managed.

### 0.1.2
* Change of dependencies to get webrtc-adapter-test from the official git now that API changes have been merged.

### 0.1.1
* Removal of wrtc as an optional dependency.

### 0.1.0
* Addition of .renameConnection() method for channels to use in cases where the destination is not yet known.
* Addition of .onconnection property, called when a channel is opened to the current user from another source.

### 0.0.1
* Initial Implementation