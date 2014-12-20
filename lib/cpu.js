function create(memory) {

    var SIGN        = (1 << 7);
    var ZERO        = (1 << 6);
    var HALF_CARRY  = (1 << 4);
    var PV          = (1 << 2);
    var ADD         = (1 << 1);
    var CARRY       = (1 << 0);

    // register offsets into R
    const A = 7;
    const F = 6;
    const B = 0;
    const C = 1;
    const D = 2;
    const E = 3;
    const H = 4;
    const L = 5;

    var R = [
        0,      // B
        0,      // C
        0,      // D
        0,      // E
        0,      // H
        0,      // L
        0,      // F
        0       // A
    ];

    var I;      // Interrupt Vector Register
    var MRR;    // Memory Refresh Register
    var IX;
    var IY;

    for (;;) {

        var op = MEM[PC++];

        // LD r, r'
        if (op & 0xC0 === 0x40) {
            R[(op >> 3) & 0x07] = R[op & 0x07];

        // LD r, n
        } else if (op & 0xC7 === 0x06) {
            R[(op >> 3) & 0x07] = MEM[PC++];
        
        // LD r, (HL)
        } else if (op & 0xC7 === 0x46) {
            R[(op >> 3) & 0x07] = MEM[(R[H] << 8) | R[L]];

        } else if (op === 0xDD) {

            var subop = MEM[PC++];

            // LD r, (IX+d)
            if (subop & 0xC7 === 0x46) {
                var disp = MEM[PC++]; // TODO(jwf): two's complement
                R[(subop >> 3) & 0x07] = MEM[IX + disp];
            
            // LD (IX+d), r
            } else if (subop & 0xF8 === 0x70) {
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

        }

    }

}