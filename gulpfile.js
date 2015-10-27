const gulp = require("gulp")
	, mocha = require("gulp-mocha")
	, config = {
		testDir: "./test/*.js"
	};

gulp.task("default", function() {
	gulp.start("test", "doc");
});

gulp.task("test", function(){
	return gulp.src(config.testDir, {read: false})
			   .pipe(mocha({reporter: "spec"}));
})

gulp.task("doc", function(){
	// No docs atm.
})