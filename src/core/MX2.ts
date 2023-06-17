import { AbstractConstructorOptions } from "@/types/base";
import Base from "./base";
import { getUserDataOptsMX2 } from "../types/MX2";

class MX2 extends Base {
    constructor(options: AbstractConstructorOptions) {
        super({
            ...options,
            game: 'madskillsmotocross2',
        });
    };

    getUserDataMappings() {
        return {
            ...super.getUserDataMappings(),
            dailyDash: 'dailydash',
        }
    }
}

export default MX2;