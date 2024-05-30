import type { Compiler } from "webpack";
const base = "src/pages";

export class FileSystemRoutingPlugin {
  // Define `apply` as its prototype method which is supplied with compiler as its argument
  apply(compiler: Compiler) {
    compiler.hooks.normalModuleFactory.tap(
      { name: "Webpack FSR" },
      (normalModuleFactory) => {
        console.log(normalModuleFactory.hooks.module);
        normalModuleFactory.hooks.resolve.tapPromise(
          { name: "Webpack FSR" },
          async (resolveData) => {
            if (resolveData.request !== "webpack-fsr-plugin/routes") {
              return;
            }

            // console.log(resolveData);

            // normalModuleFactory.create({
            //   context: resolveData.context,

            // })
          }
        );
      }
    );
    // // Specify the event hook to attach to
    // compiler.hooks.emit.tapAsync(
    //   "MyExampleWebpackPlugin",
    //   (compilation, callback) => {
    //     console.log("This is an example plugin!");
    //     console.log(
    //       "Here’s the `compilation` object which represents a single build of assets:",
    //       compilation
    //     );

    //     // Manipulate the build using the plugin API provided by webpack
    //     compilation.addModule(/* ... */);

    //     callback();
    //   }
    // );
  }
}
