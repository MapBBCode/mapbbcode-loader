LINE := $(shell grep -n -B 1 ons.set MapBBCodeLoader.js | head -n 1 | cut -d - -f 1)

MapBBCodeLoader.min.js: MapBBCodeLoader.js
	jshint $<
	head -n $(LINE) $< | uglifyjs - -b > $@
	tail -n +$(LINE) $< | uglifyjs - -m -c >> $@

download:
	wget http://mapbbcode.org/dist/mapbbcode-latest.zip
	rm -rf mapbbcode
	unzip mapbbcode-latest.zip
	rm mapbbcode-latest.zip

npm:
	npm install -g jshint
	npm install -g uglify-js
