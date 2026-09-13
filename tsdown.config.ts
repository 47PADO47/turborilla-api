import { tsdown } from "@padosoft/config/compiler/tsdown";

export default tsdown({
  entry: ["src/**/*.ts"],
  // Library output stays readable and keeps the `#__PURE__` annotations
  // bundlers rely on to drop the default-export clients when unused.
  minify: false,
  unbundle: true,
});
