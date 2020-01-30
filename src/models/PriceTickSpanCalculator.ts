import { isBaseDecimal, log10, greaterOrEquals, equal } from "../helpers/math";

const TICK_SPAN_EPSILON = 1e-9;

export class PriceTickSpanCalculator {
    private readonly _base: number;
    private readonly _integralDividers: number[];
    private readonly _fractionalDividers: number[];

    public constructor(base: number, integralDividers: number[]) {
        this._base = base;
        this._integralDividers = integralDividers;

        if(isBaseDecimal(this._base)) {
            this._fractionalDividers = [2, 2.5, 2];
        } else {
            this._fractionalDividers = [];

            for(let baseRest = this._base; baseRest !== 1;) {
                if((baseRest % 2) === 0) {
                    this._fractionalDividers.push(2);
                    baseRest /= 2;
                } else if((baseRest % 5) === 0) {
                    this._fractionalDividers.push(2);
                    this._fractionalDividers.push(2.5);
                    baseRest /= 5;
                } else {
                    throw new Error('unexpected base');
                }

                if(this._fractionalDividers.length > 100) {
                    throw new Error('somthing wrong base');
                }
            }
        }
    }

    public tickSpan(high: number, low: number, maxTickSpan: number): number {
        const minMov = (this._base === 0) ? (0) : (1 / this._base);
        const tickSpanEpsilon = TICK_SPAN_EPSILON;

        let resultTickSpan = Math.pow(10, Math.max(0, Math.ceil(log10(high - low))));

        let index = 0;
        let c = this._integralDividers[0];

        while(true) {
            // the second part is actual for small with very small values like 1e-10
            // greaterOrEqual fails for such values
            const resultTickSpanLargerMinMovement = greaterOrEquals(resultTickSpan, minMov, tickSpanEpsilon) && resultTickSpan > (minMov + tickSpanEpsilon);
            const resultTickSpanLargerMaxTickSpan = greaterOrEquals(resultTickSpan, maxTickSpan * c, tickSpanEpsilon);
            const resultTickSpanLarger1 = greaterOrEquals(resultTickSpan, 1, tickSpanEpsilon);
            const haveToContinue = resultTickSpanLargerMinMovement && resultTickSpanLargerMaxTickSpan && resultTickSpanLarger1;

            if(!haveToContinue) {
                break;
            }

            resultTickSpan /= c;
            c = this._integralDividers[++index % this._integralDividers.length];
        }

        if(resultTickSpan <= (minMov + tickSpanEpsilon)) {
            resultTickSpan = minMov;
        }

        resultTickSpan = Math.max(1, resultTickSpan);

        if((this._fractionalDividers.length > 0) && equal(resultTickSpan, 1, tickSpanEpsilon)) {
            index = 0;

            c = this._fractionalDividers[0];

            while(greaterOrEquals(resultTickSpan, maxTickSpan * c, tickSpanEpsilon) && resultTickSpan > (minMov + tickSpanEpsilon)) {
                resultTickSpan /= c;
                c = this._fractionalDividers[++index % this._fractionalDividers.length];                
            }
        }

        return resultTickSpan;
    }
}