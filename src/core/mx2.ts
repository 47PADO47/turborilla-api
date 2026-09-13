import type { AbstractConstructorOptions } from "@/types/base";

import type { getUserDataOptsMX2 } from "../types/mx2";
import Base from "./base";

class MX2 extends Base {
  constructor(options: AbstractConstructorOptions) {
    super({
      ...options,
      game: "madskillsmotocross2",
    });
  }

  override getUserDataMappings() {
    return {
      ...super.getUserDataMappings(),
      dailyDash: "dailydash",
    };
  }

  override async getUserData(options: getUserDataOptsMX2) {
    return await super.getUserData(options);
  }
}

export default MX2;
