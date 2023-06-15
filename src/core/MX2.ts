import { AbstractConstructorOptions, FetchOptions, FetchResponse } from "@/types/base";
import Base from "./base";

class MX2 extends Base {
    constructor(options: AbstractConstructorOptions) {
        super({
            ...options,
            game: 'madskillsmotocross2',
        });
    }
    
    async getServerTime() {
        const data = await this.fetch({
            path: 'getservertime',
        });
        return data.serverTime;
    };
}

export default MX2;