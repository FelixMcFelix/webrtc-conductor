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
		var resManInst = resMan.create({ channel: { internalID: "init" } });
		var stubChannel1 = { internalID: "stub" };
		var stubChannel2 = { internalID: "stub" };

		it("should allow addition of a channel which is not present", () => {
			var fn = () => resManInst.register(stubchannel1);
			expect(fn).to.be.true;
		});

		it("should close the old channel if trying to register another channel with the same ID", () => {
			resManInst.register(stubChannel1);
			var fn = () => resManInst.register(stubchannel2);
			expect(stubChannel1.closed).to.be.true;
		});

		it("should not throw if trying to register the same channel again", () => {
			resManInst.register(stubChannel1);
			var fn = () => resManInst.register(stubchannel1);
			expect(fn).to.not.throw(Error);
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