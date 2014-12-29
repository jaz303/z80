var tape = require('tape');
var realMemory = require('../lib/cpu');
var R = require('../lib/constants').registers;
var F = require('../lib/constants').flags;

function test(testCase, instructions, initialState, initialMemory, expectedState) {
	var actualMemory = new Uint8Array(65536);
	for (var i = 0; i < instructions.length; ++i) {
		actualMemory[i] = instructions[i];
	}
	initialMemory = initialMemory || [];
	for (var i = 0; i < initialMemory.length; ++i) {
		actualMemory[0x8000 + i] = instructions[i];
	}
	var cpu = createCPU(actualMemory);
	cpu.run();
	var actualState = cpu.state();
	for (var k in actualState) {
		if (!(k in expectedState)) {
			expectedState[k] = 0;
		}
	}
	tape(testCase, function(assert) {
		assert.deepEquals(actualState, expectedState);
	});
}

test("LD r, r'", {
	code: [
		0x40 | (R.A << 3) | (R.B << 0)
	],
	state: { A: 0, B: 1 },
	expectedState: { A: 1, B: 1 }
};