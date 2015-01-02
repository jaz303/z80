var K = require('./constants');

module.exports = create;

function create(MEM) {

    // flags
    const SIGN        = K.flags.SIGN;
    const ZERO        = K.flags.ZERO;
    const HALF_CARRY  = K.flags.HALF_CARRY;
    const PV          = K.flags.PV;
    const ADD         = K.flags.ADD;
    const CARRY       = K.flags.CARRY;

    // register offsets into R
    const B = K.registers.B;
    const C = K.registers.C;
    const D = K.registers.D;
    const E = K.registers.E;
    const H = K.registers.H;
    const L = K.registers.L;
    const F = K.registers.F;
    const A = K.registers.A;
    
    // register storage
    var R = [
        0,  // B
        0,  // C
        0,  // D
        0,  // E
        0,  // H
        0,  // L
        0,  // F
        0   // A
    ];

    var PC      = 0; // program counter
    var I       = 0; // interrupt vector register
    var MRR     = 0; // memory refresh register
    var IX      = 0;
    var IY      = 0;

    function inspect() {
        return [
            "+----------------------------+-----------+-----------+-----------+-----------+",
            "| F: S  Z  _  H  _  PV N  C  | PC: $_PC_ | IX: $_IX_ | IY: $_IY_ |           |",
            "|    s_ z_    h_    p_ n_ c_ | AF: $A $F | BC: $B $C | DE: $D $E | HL: $H $L |",
            "+----------------------------+-----------+-----------+-----------+-----------+",
        ].join("\n")
            .replace(/[szhpnc]_/g, function(m) {
                var val;
                switch (m) {
                    case 's_': val = (R[F] >> 7) & 1; break;
                    case 'z_': val = (R[F] >> 6) & 1; break;
                    case 'h_': val = (R[F] >> 4) & 1; break;
                    case 'p_': val = (R[F] >> 2) & 1; break;
                    case 'n_': val = (R[F] >> 1) & 1; break;
                    case 'c_': val = (R[F] >> 0) & 1; break;
                }
                return "" + val + " ";
            })
            .replace(/\$\w+/g, function(m) {
                var reg = m.substr(1);
                var val;

                function mk1(val) {
                    val = ('0000' + val.toString(16)).substr(-4);
                    return val.substr(0, 2) + ' ' + val.substr(2, 2);
                }

                switch (reg) {
                    case 'A': val = R[A]; break;
                    case 'F': val = R[F]; break;
                    case 'B': val = R[B]; break;
                    case 'C': val = R[C]; break;
                    case 'D': val = R[D]; break;
                    case 'E': val = R[E]; break;
                    case 'H': val = R[H]; break;
                    case 'L': val = R[L]; break;
                    case '_IX_': return mk1(IX);
                    case '_IY_': return mk1(IY);
                    case '_PC_': return mk1(PC);
                }
                val = '0000' + val.toString(16);
                return val.substr(-(reg.length+1));
            });

    }

    function setState(newState) {
        for (var k in newState) {
            var val = newState[k];
            if (k === 'IX') {
                IX = val;
            } else if (k === 'IY') {
                IY = val;
            } else if (k === 'PC') {
                PC = val;
            } else if (k === 'I') {
                I = val;
            } else if (k === 'MRR') {
                MRR = val;
            } else {
                R[K.registers[k]] = val;
            }
        }
    }

    function state() {
        return {
            A   : R[A],
            F   : R[F],
            B   : R[B],
            C   : R[C],
            D   : R[D],
            E   : R[E],
            H   : R[H],
            L   : R[L],
            IX  : IX,
            IY  : IY,
            PC  : PC,
            I   : I,
            MRR : MRR
        };
    }

    function run() {
        for (;;) {

            var op = MEM[PC++];

            if (op === 0x76) {
                return;
            }

            // LD r, r'
            if ((op & 0xC0) === 0x40) {
                R[(op >> 3) & 0x07] = R[op & 0x07];

            // LD r, n
            } else if ((op & 0xC7) === 0x06) {
                R[(op >> 3) & 0x07] = MEM[PC++];
            
            // LD r, (HL)
            } else if ((op & 0xC7) === 0x46) {
                R[(op >> 3) & 0x07] = MEM[(R[H] << 8) | R[L]];

            } else if (op === 0xDD) {

                var subop = MEM[PC++];

                // LD r, (IX+d)
                if ((subop & 0xC7) === 0x46) {
                    var disp = MEM[PC++]; // TODO(jwf): two's complement
                    R[(subop >> 3) & 0x07] = MEM[IX + disp];
                
                // LD (IX+d), r
                } else if ((subop & 0xF8) === 0x70) {
                    var disp = MEM[PC++]; // TODO:(jwf): two's comp
                    MEM[IX + disp] = R[subop & 0x07];

                // LD (IX+d), n
                } else if (subop === 0x36) {
                    var disp = MEM[PC++];
                    MEM[IX + disp] = MEM[PC++];

                }

            } else if (op === 0xFD) {

                var subop = MEM[PC++];

                // LD r, (IY+d)
                if (subop & 0xC7 === 0x46) {
                    var disp = MEM[PC++]; // TODO(jwf): two's comp
                    R[(subop >> 3) & 0x07] = MEM[IY + disp];
                
                // LD (IY+d), r
                } else if (subop & 0xF8 === 0x70) {
                    var disp = MEM[PC++]; // TODO(jwf): two's comp
                    MEM[IY + disp] = R[subop & 0x07];

                // LD (IY+d), n
                } else if (subop === 0x36) {
                    var disp = MEM[PC++]; // TODO(jwf): two's comp
                    MEM[IY + disp] = MEM[PC++];

                }

            // LD (HL), r
            } else if (op & 0xF8 === 0x70) {
                MEM[(R[H] << 8) | R[L]] = R[op & 0x07];

            // LD (HL), n
            } else if (op === 0x36) {
                MEM[(R[H] << 8) | R[L]] = MEM[PC++];

            // LD A, (BC)
            } else if (op === 0x0A) {
                R[A] = MEM[(R[B] << 8) | R[C]];

            // LD A, (DE)
            } else if (op === 0x1A) {
                R[A] = MEM[(R[D] << 8) | R[E]];

            // LD A, (nn)
            } else if (op === 0x3A) {
                var l = MEM[PC++];
                var h = MEM[PC++];
                R[A] = MEM[(h << 8) | l];

            // LD (BC), A
            } else if (op === 0x02) {
                MEM[(R[B] << 8) | R[C]] = R[A];

            // LD (DE), A
            } else if (op === 0x12) {
                MEM[(R[D] << 8) | R[E]] = R[A];

            // LD (nn), A
            } else if (op === 0x32) {
                var l = MEM[PC++];
                var h = MEM[PC++];
                MEM[(h << 8) | l] = R[A];

            // EXTD
            } else if (op === 0xED) {

                var subop = MEM[PC++];

                // LD A, I
                if (subop === 0x57) {
                    R[A] = I;
                    // TODO: set S if I is negative
                    // TODO: set Z if I is zero
                    // TODO: reset H
                    // TODO: P/V contains contents of IFF2
                    // TODO: reset N
                    // TODO: if interrupt occurs during execution of instruction
                    // parity flag contains zero
                
                // LD A, R
                } else if (subop === 0x5F) {
                    R[A] = MRR;
                    // TODO: set S if MRR is negative
                    // TODO: set Z if MRR is zero
                    // TODO: reset H
                    // TODO: P/V contains contents of IFF2
                    // TODO: reset N
                    // TODO: if interrupt occurs during execution of instruction
                    // parity flag contains zero

                // LD I, A
                } else if (subop === 0x47) {
                    I = R[A];

                // LR R, A
                } else if (subop === 0x4F) {
                    MRR = R[A];

                }

            // HALT
            } else if (op === 0x76) {
                return;

            }

        }
    }

    return {
        inspect     : inspect,
        state       : state,
        setState    : setState,
        run         : run
    };

}