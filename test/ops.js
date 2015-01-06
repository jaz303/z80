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
		actualMemory[0x8000 + i] = initialMemory[i];
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
		if (opts.expectedMemory) {
			var actualMemory = cpu.memory();
			var arrayCopy = [];
			for (var i = 0; i < opts.expectedMemory.length; ++i) {
				arrayCopy.push(actualMemory[0x8000 + i]);
			}
			assert.deepEquals(arrayCopy, opts.expectedMemory);
		}
		assert.end();
	});
}

//
// LD r, r'

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

//
// LD r, (HL)

['B', 'C', 'D', 'E', 'H', 'L', 'A'].forEach(function(rd) {

	var startState = { H: 0x80, L: 0x00 };

	var endState = {};
	endState[rd] = 0x7F;

	test("LD " + rd + ", (HL)", {
		code: [
			0x40 | (R[rd] << 3 ) | 0x06
		],
		memory: [ 0x7F ],
		state: startState,
		expectedState: endState
	});

});

//
// LD (HL), r

['B', 'C', 'D', 'E', 'H', 'L', 'A'].forEach(function(rs) {

	var startState = { H: 0x80, L: 0x01 };
	var expectedMemory = [ 0x00, 0x00 ];
	if (rs === 'H') {
		expectedMemory[1] = 0x80;
	} else if (rs === 'L') {
		expectedMemory[1] = 0x01;
	} else {
		startState[rs] = 0x23;
		expectedMemory[1] = 0x23;
	}

	test("LD (HL), " + rs, {
		code: [
			0x70 | R[rs]
		],
		memory: [ 0x00, 0x00 ],
		state: startState,
		expectedMemory: expectedMemory
	});

});