import { AbstractConstructorOptions, FetchOptions, FetchResponse } from "@/types/base";
import Base from "./base";

class BMX2 extends Base {
    constructor(options: AbstractConstructorOptions) {
        super({
            ...options,
            game: 'bmx2',
        });
    }
    
    async getServerTime() {
        const data = await this.fetch({
            path: 'getservertime',
        });
        return data.serverTime;
    };
}

export default BMX2;