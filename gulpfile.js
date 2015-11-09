const gulp = require("gulp")
	, mocha = require("gulp-mocha")
	, jsdoc = require("gulp-jsdoc")
	, config = {
		testDir: "./test/*.js",
		srcDir: "./src/",
		docDir: "./docs/"
	};

gulp.task("default", function() {
	gulp.start("test", "doc");
});

gulp.task("test", function(){
	return gulp.src(config.testDir, {read: false})
			   .pipe(mocha({reporter: "spec"}));
})

gulp.task("doc", function(){
	gulp.src(config.srcDir+"*.js")
		.pipe(jsdoc(config.docDir));
});