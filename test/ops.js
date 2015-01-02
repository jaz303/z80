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

['B', 'C', 'D', 'E', 'H', 'L', 'A'].forEach(function(rd) {
	['B', 'C', 'D', 'E', 'H', 'L', 'A'].forEach(function(rs) {

		var startState = {};
		startState[rd] = 0;
		startState[rs] = 1;
		
		var endState = {};
		endState[rs] = 1;
		endState[rd] = 1;

		test("LD " + rd + ", " + rs, {
			code: [
				0x40 | (R[rd] << 3) | (R[rs])
			],
			state: startState,
			expectedState: endState
		});
			
	});
});
