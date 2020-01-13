# Silence command output by default
.SILENT:

# We're just using make as a task runner
.PHONY: all build run test

# C compiler
CC := gcc

# Debugger
DB := lldb

# Source files & entry point (main.c)
SRC := $(filter-out %_test.c, $(wildcard *.c **/*.c))

# Source file & test files (*_test.c)
TST := $(filter-out main.c, $(wildcard *.c **/*.c))

# System libraries (be sure to have these installed)
LIB := \
	-lraylib

# Executable name
BIN := platformer

# Default task
all: build

raylib.so: raylib.c
	$(CC) $(LIB) -shared -o $@ -fPIC quickjs/libquickjs.a  $<

js: raylib.so
	./quickjs/qjsc -o test test.js && ./test

# Builds the app
build:
	clear
	rm -f $(BIN)
	$(CC) $(LIB) $(SRC) -g -o $(BIN)
	echo "Successfully built $(BIN)"

# Builds and runs the app
run: build
	./$(BIN)

# Runs a new build with the debugger
debug: build
	DYLD_PRINT_LIBRARIES=1 $(DB) ./$(BIN)

# Runs the test suite
test:
	clear
	$(CC) $(LIB) $(TST) -o test && ./test || rm test
	rm test
	