var expect = require("chai").expect,
	resMan = require("../wrtc-res-man.js");

describe("WebRTCResourceManager", function(){
	describe("Initialisation", function(){
		it("should fail to initialise without a default channel", function(){
			expect(resMan.create).to.throw(TypeError);
		});

		it("should fail to initialise without an rtc_facade", function(){
			var conf = {rtc_facade: null, channel: "valild"};
			expect(()=>resMan.create(conf)).to.throw(TypeError);
		});
	});
});