# WebRTC Conductor [![Build Status](https://travis-ci.org/FelixMcFelix/webrtc-conductor.svg)](https://travis-ci.org/FelixMcFelix/webrtc-conductor)
A lightweight ES6 module to allow for efficient and simple management, creation, reuse and destruction of WebRTC DataChannels - independent of the signalling channel used for negotiation.

Presently, the module is extremely unstable and is functional up to the point where I can use it with a small amount of difficulty in my projects. Over time, I will fix and extend this module as needed.

## Overview
One of the main goals of this library is to decouple the signalling channel used to initialise WebRTC connections from the management library itself - a move that I'm surprised no other library appears to have taken.

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
