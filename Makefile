# See the README for installation instructions.

NODE_PATH ?= ./node_modules
JS_COMPILER = $(NODE_PATH)/uglify-js/bin/uglifyjs -nm --unsafe

SRC = \
	client/game.js \
	client/plugs.js

all: \
	$(SRC) \
	client/game.min.js

client/game.js: \
	src/start.js \
	Input.js \
	Render.js \
	src/Network.js \
	src/Engine.js \
	src/Controller.js \
	src/Stats.js \
	src/end.js 


client/plugs.js: \
	$(wildcard src/plugins/*.js)

Input.js: \
	$(wildcard src/Input/*.js)

Render.js: \
	$(wildcard src/Render/*.js)


client/%.min.js: client/%.js Makefile
	@rm -f $@
	$(JS_COMPILER) < $< > $@

client/%.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@
	@rm -f Input.js Render.js
	@chmod a-w $@

Input.js Render.js: Makefile
	@rm -f $@
	cat $(filter %.js,$^) > $@

clean:
	rm -f client/*.js Input.js Render.js