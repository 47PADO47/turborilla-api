import { AbstractConstructorOptions } from "@/types/base";
import Base from "./base";

class BMX2 extends Base {
    constructor(options: AbstractConstructorOptions) {
        super({
            ...options,
            game: 'bmx2',
            baseJson: {
                includeUserDataSession: true,
            }
        });
    };
    
    async getGameConfig() {
        const data = await this.fetch({
            path: 'app/madskillsmx2/config.json',
        });
        return data;
    };
}

export default BMX2;