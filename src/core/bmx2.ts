import type { AbstractConstructorOptions } from "@/types/base";

import Base from "./base";

class BMX2 extends Base {
  constructor(options: AbstractConstructorOptions) {
    super({
      ...options,
      baseJson: {
        includeUserDataSession: true,
      },
      game: "bmx2",
    });
  }

  async getGameConfig() {
    const data = await this.fetch({
      path: "app/madskillsmx2/config.json",
    });
    return data;
  }
}

export default BMX2;
