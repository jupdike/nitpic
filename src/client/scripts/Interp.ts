export class Interpolator {
    public UseMissing: boolean = false;

    private updateWithGetter(opt: boolean, c: number, fromsy_1: number, fromsy0: number, fromsy1: number, fromsy2) {
        //int c = 0;
        //int ch = 1;
        // optimization: still interpolating from the same four pixels ... don't do any new work!
        if (opt && this.fromsx[3] == this.oldfromsx[3]) {
            return;
        }
        //else
        //  leading edge changed

        for (let i = 0; i < 4; i++) {
            // optimization: reuse old work!
            if (i < 3 && opt && this.fromsx[i] == this.oldfromsx[i]+1) {
                this.oldfromsx[i]++;// = fromsx[i];
                this.xabcd[c][i] = this.xabcd[c][i+1];
                continue;
            }
            this.oldfromsx[i] = this.fromsx[i];
            this.yabcd[i][c][0] = this.getter(c,fromsy_1,this.oldfromsx[i]);
            this.yabcd[i][c][1] = this.getter(c,fromsy0,this.oldfromsx[i]);
            this.yabcd[i][c][2] = this.getter(c,fromsy1,this.oldfromsx[i]);
            this.yabcd[i][c][3] = this.getter(c,fromsy2,this.oldfromsx[i]);
            this.xabcd[c][i] = Interp.dot4(this.coeffsY, this.yabcd[i][c], this.MISSING, this.UseMissing);
        }
    }

    ch: number = 1;
    coeffsY: number[];
    coeffsX: number[];
    yabcd: number[][][];
    xabcd: number[][];
    fromsx: number[];
    oldfromsx: number[];
    w: number = 1;
    h: number = 1;
    getter: any = null; // Func<int,int,int,  int>   ch, y, x --> int
    public MISSING: number = -32; //-32767;

    // interpolate 1 to 4 channels, by passing ch = 1 or 2 or 3 or 4
    public constructor(ch: number, h: number, w: number, getter: any) {
        this.w = w;
        this.h = h;
        this.getter = getter;
        this.ch = ch;
        this.coeffsY = [0, 0, 0, 0];
        this.coeffsX = [0, 0, 0, 0];
        this.yabcd = [null, null, null, null];
        this.xabcd = [null, null, null, null];
        this.yabcd[0] = [null, null, null, null];
        this.yabcd[1] = [null, null, null, null];
        this.yabcd[2] = [null, null, null, null];
        this.yabcd[3] = [null, null, null, null];
        for (let c = 0; c < ch; c++) {
            this.yabcd[0][c] = [0, 0, 0, 0];
            this.yabcd[1][c] = [0, 0, 0, 0];
            this.yabcd[2][c] = [0, 0, 0, 0];
            this.yabcd[3][c] = [0, 0, 0, 0];
            this.xabcd[c] = [0, 0, 0, 0];
        }
        this.fromsx = [0, 0, 0, 0];
        this.oldfromsx = [0, 0, 0, 0];
    }

    public BicubicGet(c: number, fromyDouble: number, fromxDouble: number): number {
        c = c|0;

        // // nearest neighbor for testing
        // let y0: number = (Math.round(fromyDouble))|0;
        // let x0: number = (Math.round(fromxDouble))|0;
        // return this.getter(c, y0, x0);

        // a = -1 b = 0 c = 1 d = 2
        //
        //double fromyDouble = 1.0 * (h)*(y-0.5) / (1.0 * (nuh));
        let fromy0: number = ((fromyDouble))|0;
        let fromy_1: number = Math.max(0, fromy0-1);
        let fromy1: number = Math.min(this.h-1, fromy0+1);
        let fromy2: number = Math.min(this.h-1, fromy0+2);
        let yt: number = fromyDouble - fromy0;
        Interp.spline4_setCoeffs(yt, this.coeffsY);
        this.oldfromsx[0] = -1;
        this.oldfromsx[1] = -1;
        this.oldfromsx[2] = -1;
        this.oldfromsx[3] = -1;
        this.fromsx[0] = -1;
        this.fromsx[1] = -1;
        this.fromsx[2] = -1;
        this.fromsx[3] = -1;

        let fromx0: number = ((fromxDouble))|0;
        let fromx_1: number = Math.max(0, fromx0-1);
        let fromx1: number = Math.min(this.w-1, fromx0+1);
        let fromx2: number = Math.min(this.w-1, fromx0+2);
        let xt: number = fromxDouble - fromx0;
        Interp.spline4_setCoeffs(xt, this.coeffsX);
        this.fromsx[0] = fromx_1;
        this.fromsx[1] = fromx0;
        this.fromsx[2] = fromx1;
        this.fromsx[3] = fromx2;
        let opt: boolean = fromx0 >= 4 && fromx0 < this.w-4;
        // (C# comment) I tried copying the code from update() here and it made it slower!
        //update(opt, ch, chans, yabcd, xabcd, oldfromsx, fromsx, coeffsY, fromy_1, fromy0, fromy1, fromy2);
        this.updateWithGetter(opt, c, fromy_1, fromy0, fromy1, fromy2);

        let val: number = Interp.dot4(this.coeffsX, this.xabcd[c], this.MISSING, this.UseMissing);
        //if (val < 0) val = 0;
        //if (val > 255) val = 255;
        //byte result = (byte)val;
        //int result = (int)val;
        return val; // could use val|0 to make into an integer
    }

}

class Interp {
    public static spline4p(t: number, p_1: number, p0: number, p1: number, p2: number): number {
        return ( t*((2-t)*t - 1) * p_1 + (t*t*(3*t - 5) + 2) * p0 + t*((4 - 3*t)*t + 1) * p1 + (t-1)*t*t * p2 ) / 2.0;
    }

    public static spline4p_arr(t: number, p: Array<number>): number {
        return ( t*((2-t)*t - 1) * p[0] + (t*t*(3*t - 5) + 2) * p[1] + t*((4 - 3*t)*t + 1) * p[2] + (t-1)*t*t * p[3] ) / 2.0;
    }

    public static spline4_setCoeffs(t: number, outp: Array<number>) {
        outp[0] = t*((2-t)*t - 1) / 2.0;
        outp[1] = (t*t*(3*t - 5) + 2) / 2.0;
        outp[2] = t*((4 - 3*t)*t + 1) / 2.0;
        outp[3] = ( (t-1)*t*t ) / 2.0;
    }

    public static linear_setCoeffs(t: number, outp: Array<number>) {
        outp[0] = 0;//t*((2-t)*t - 1) / 2.0;
        outp[1] = 1.0-t;//(t*t*(3*t - 5) + 2) / 2.0;
        outp[2] = t;//t*((4 - 3*t)*t + 1) / 2.0;
        outp[3] = 0;//( (t-1)*t*t ) / 2.0;
    }

    public static dot4(a: Array<number>, b: Array<number>, MISSING: number, UseMissing: boolean): number {
        if (UseMissing) {
            if (b[0] == MISSING || b[1] == MISSING || b[2] == MISSING || b[3] == MISSING) {
                //Console.WriteLine("Missing Contagion 0: " + b[0]);
                //Console.WriteLine("Missing Contagion 1: " + b[1]);
                //Console.WriteLine("Missing Contagion 2: " + b[2]);
                //Console.WriteLine("Missing Contagion 3: " + b[3]);
                //Console.WriteLine("Missing:             " + MISSING + " <-- ");
                //throw new Exception("HERE");
                return MISSING;
            }
        }
        return a[0]*b[0] + a[1]*b[1] + a[2]*b[2] + a[3]*b[3];
    }
}



// exercise for the reader... port this from C# to TypeScript
/*
public BilinearGet(int c, double fromyDouble, double fromxDouble): number {
    // a = -1 b = 0 c = 1 d = 2
    // 
    //double fromyDouble = 1.0 * (h)*(y-0.5) / (1.0 * (nuh));
    int fromy0 = (int)(fromyDouble);
    int fromy_1 = Math.Max(0, fromy0-1);
    int fromy1 = Math.Min(h-1, fromy0+1);
    int fromy2 = Math.Min(h-1, fromy0+2);
    double yt = fromyDouble - fromy0;
    Interp.linear_setCoeffs(yt, coeffsY);
    oldfromsx[0] = -1;
    oldfromsx[1] = -1;
    oldfromsx[2] = -1;
    oldfromsx[3] = -1;
    fromsx[0] = -1;
    fromsx[1] = -1;
    fromsx[2] = -1;
    fromsx[3] = -1;

    int fromx0 = (int)(fromxDouble);
    int fromx_1 = Math.Max(0, fromx0-1);
    int fromx1 = Math.Min(w-1, fromx0+1);
    int fromx2 = Math.Min(w-1, fromx0+2);
    double xt = fromxDouble - fromx0;
    Interp.linear_setCoeffs(xt, coeffsX);
    fromsx[0] = fromx_1;
    fromsx[1] = fromx0;
    fromsx[2] = fromx1;
    fromsx[3] = fromx2;
    bool opt = fromx0 >= 4 && fromx0 < w-4;

    updateWithGetter(opt, c, fromy_1, fromy0, fromy1, fromy2);
    //for (int c = 0; c < ch; c++)
    double val = Interp.dot4(coeffsX, xabcd[c], MISSING, UseMissing);
    //if (val < 0) val = 0;
    //if (val > 255) val = 255;
    //byte result = (byte)val;
    int result = (int)val;
    return result;
}
*/
