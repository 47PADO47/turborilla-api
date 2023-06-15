import { AbstractConstructorOptions } from "../types/MadSkillsMx";
import Base from "./base";

class MX2 extends Base {
    constructor(options: AbstractConstructorOptions) {
        super({
            ...options,
            gameVersion: 2,
        });
    }
}

export default MX2;