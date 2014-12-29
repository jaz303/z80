var tape = require('tape');
var createCPU = require('../lib/cpu');
var R = require('../lib/constants').registers;
var F = require('../lib/constants').flags;

function test(testCase, opts) {

	var actualMemory = new Uint8Array(65536);

	var instructions = opts.code || [];
	for (var i = 0; i < instructions.length; ++i) {
		actualMemory[i] = instructions[i];
	}
	actualMemory[i++] = 0x76; // HALT
	
	var initialMemory = opts.memory || [];
	for (var i = 0; i < initialMemory.length; ++i) {
		actualMemory[0x8000 + i] = instructions[i];
	}

	var cpu = createCPU(actualMemory);

	if (opts.state) {
		cpu.setState(opts.state);
	}

	cpu.run();
	
	tape(testCase, function(assert) {
		if (opts.expectedState) {
			var actualState = cpu.state();
			var compareState = {};
			for (var k in opts.expectedState) {
				compareState[k] = actualState[k];
			}
			assert.deepEquals(compareState, opts.expectedState);
		}
		assert.end();
	});
}

test("LD r, r'", {
	code: [
		0x40 | (R.A << 3) | (R.B << 0)
	],
	state: { A: 0, B: 1 },
	expectedState: { A: 1, B: 1 }
});