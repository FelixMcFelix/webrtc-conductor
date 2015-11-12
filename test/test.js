var expect = require("chai").expect,
	resMan = require("../src/wrtc-res-man.js");

describe("WebRTC Conductor", () => {

	describe("Initialisation", () => {
		var firstChannel;

		before(() => {
			firstChannel = {
				internalID: "first",
				send: (a,b,c) => {},
				onmessage: (a,b) => {}
			};
		});

		it("should fail to initialise without a default channel", () => {
			expect(resMan.create).to.throw(TypeError);
		});

		it("should fail to initialise with an invalid default channel", () => {
			var conf = {channel: "valild"},
				fn = () => resMan.create(conf);
			expect(resMan.create).to.throw(TypeError);
		});

		it("should fail to initialise without an rtc_facade", () => {
			var conf = {rtc_facade: null, channel: "valild"},
				fn = () => resMan.create(conf);
			expect(fn).to.throw(TypeError);
		});
	});


	describe("Channel Registration", () => {
		var resManInst;
		var firstChannel;
		var stubChannel1;
		var stubChannel2;

		var badChannel;

		before(() => {
			stubChannel1 = {
				internalID: "stub",
				send: (a,b,c) => {},
				onmessage: (a,b) => {}
			};

			stubChannel2 = {
				internalID: "stub",
				send: (a,b,c) => {},
				onmessage: (a,b) => {}
			};

			badChannel = {};
		});

		beforeEach(() => {
			firstChannel = {
				internalID: "first",
				send: (a,b,c) => {},
				onmessage: (a,b) => {}
			};

			resManInst = resMan.create({ channel: firstChannel });
		});

		it("should allow addition of a channel which is not present", () => {
			var fn = () => resManInst.register(stubChannel1);
			expect(fn).to.not.throw(Error);
		});

		it("should close the old channel if trying to register another channel with the same ID", () => {
			resManInst.register(stubChannel1);
			resManInst.register(stubChannel2);
			expect(stubChannel1.state).to.equal(resMan.enums.CHANNEL_CLOSED);
		});

		it("should not throw if trying to register the same channel again", () => {
			resManInst.register(stubChannel1);
			var fn = () => resManInst.register(stubChannel1);
			expect(fn).to.not.throw(Error);
		});

		it("should throw if trying to register an invalid channel instance", () => {
			var fn = () => resManInst.register(badChannel);;
			expect(fn).to.throw(Error);
		});

	});

	describe("Connection Renaming", () => {
		var resManInst;
		var firstChannel;
		
		var conn;

		beforeEach(() => {
			firstChannel = {
				internalID: "first",
				send: (a,b,c) => {},
				onmessage: (a,b) => {}
			};

			resManInst = resMan.create({ channel: firstChannel });
		});

		it("should allow renaming a defined connection to an unused name", () => {
			var val = {test: "prop"};
			resManInst._connectionRegistry["initial"] = val;

			resManInst.renameConnection("initial", "final");

			expect(resManInst._connectionRegistry["final"]===val && resManInst._connectionRegistry["inital"]===undefined).to.be.true;
		});

		it("should throw if either connection name is not a string when renaming", () => {
			expect(()=>{resManInst.renameConnection(null, "aName");}).to.throw(TypeError);
		});

		it("should throw if the first connection is not defined when renaming", () => {
			expect(()=>{resManInst.renameConnection("initial", "final");}).to.throw(ReferenceError);
		});

		it("should throw if the second connection is defined when renaming", () => {
			var val = {test: "prop"};
			resManInst._connectionRegistry["final"] = val;

			expect(()=>{resManInst.renameConnection("initial", "final");}).to.throw(ReferenceError);
		});
	});

	describe("Active Connections", () => {
		var wrtc, manager;

		before("check to see if we have a usable webrtc stack", ()=>{
			wrtc = require("wrtc");
		});

		beforeEach(() => {
			manager = resMan.create({
				rtc_facade: wrtc,
				channel: {
					internalID: "stub",
					send: (a,b,c) => {},
					onmessage: (a,b) => {}
				} // TODO
			});
		});

		describe("Connection Creation", () => {
			it("should call the onconnection handler if a connection is opened by another client", () => {
				//TODO
				expect(true).false;
			});

			it("should return the TrackedConnection instance as part of the promise after .connectTo(...)", () => {
				//TODO
				expect(true).false;
			});
		});

		describe("Connection Fetching", () => {
			it("should return the connection with a matching name if one exists", () => {
				//TODO
				expect(true).false;
			});
		});

		describe("Data Channel Management", () => {
			it("should register a new datachannel when prompted by partner", () => {
				//TODO
				expect(true).false;
			});

			it("should close and overwrite the datachannel if one with a duplicate name is registered", () => {
				//TODO
				expect(true).false;
			});
		});

		describe("Connection Usage", ()=>{
			it("should send along the default channel when calling send on a TrackedConnection", () => {
				//TODO
				expect(true).false;
			});

			it("should send along the specified channel when calling send with a label on a TrackedConnection", () => {
				//TODO
				expect(true).false;
			});

			it("should set event handlers on the default connection when no label is specified", () => {
				//TODO
				expect(true).false;
			});

			it("should set event handlers on the specified connection when a label is specified", () => {
				//TODO
				expect(true).false;
			});

			it("should fire the onmessage event if the partner sends a message", () => {
				//TODO
				expect(true).false;
			});
		});

		describe("Response Delegation", () => {
			it("should pass down the chain of response handlers for several connected singalling channels", () => {
				//TODO
				expect(true).false;
			});
		});

		describe("Connection Closure", () => {
			it("should decrement a connection's usage count on .close()", () => {
				//TODO
				expect(true).false;
			});

			it("should increment a connection's usage count on .connectTo()", () => {
				//TODO
				expect(true).false;
			});

			it("should close a connection after TTL once usages=0 on both sides of the connection", () => {
				//TODO
				expect(true).false;
			});

			it("should not close a connection if it remains in use on one side", () => {
				//TODO
				expect(true).false;
			});
		});
		
	});
});