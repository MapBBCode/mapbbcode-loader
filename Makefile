MapBBCodeLoader.min.js: MapBBCodeLoader.js
	jshint MapBBCodeLoader.js
	uglifyjs MapBBCodeLoader.js -m -c -o MapBBCodeLoader.min.js

download:
	wget http://mapbbcode.org/dist/mapbbcode-latest.zip
	rm -rf mapbbcode
	unzip mapbbcode-latest.zip
	rm mapbbcode-latest.zip

npm:
	npm install -g jshint
	npm install -g uglify-js
