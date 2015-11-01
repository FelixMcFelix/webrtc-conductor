var expect = require("chai").expect,
	resMan = require("../src/wrtc-res-man.js");

describe("WebRTCResourceManager", () => {

	describe("Initialisation", () => {
		it("should fail to initialise without a default channel", () => {
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
			resManInst = resMan.create({ channel: { internalID: "init" } });
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


	describe("Connection Fetching", () => {

	});


	describe("Connection Creation", () => {

	});


	describe("Response Delegation", () => {

	});


	describe("Connection Closure", () => {

	});
});