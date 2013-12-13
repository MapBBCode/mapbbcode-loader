MapBBCodeLoader.min.js: MapBBCodeLoader.js
	jshint MapBBCodeLoader.js
	head -n 18  MapBBCodeLoader.js | uglifyjs - -b > MapBBCodeLoader.min.js
	tail -n +18 MapBBCodeLoader.js | uglifyjs - -m -c >> MapBBCodeLoader.min.js

download:
	wget http://mapbbcode.org/dist/mapbbcode-latest.zip
	rm -rf mapbbcode
	unzip mapbbcode-latest.zip
	rm mapbbcode-latest.zip

npm:
	npm install -g jshint
	npm install -g uglify-js
