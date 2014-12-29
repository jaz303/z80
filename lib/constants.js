exports.flags = {};

exports.flags.SIGN        = (1 << 7);
exports.flags.ZERO        = (1 << 6);
exports.flags.HALF_CARRY  = (1 << 4);
exports.flags.PV          = (1 << 2);
exports.flags.ADD         = (1 << 1);
exports.flags.CARRY       = (1 << 0);

exports.registers = {};

exports.registers.B = 0;
exports.registers.C = 1;
exports.registers.D = 2;
exports.registers.E = 3;
exports.registers.H = 4;
exports.registers.L = 5;
exports.registers.F = 6;
exports.registers.A = 7;