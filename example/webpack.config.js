import HtmlWebpackPlugin from "html-webpack-plugin";
import { loader as FileSystemRoutingLoader } from "webpack-fsr-plugin";
import { fileURLToPath } from "node:url";

/** @type {import("webpack").Configuration} */
export default {
  entry: "./src/index.tsx",
  output: {
    path: fileURLToPath(import.meta.resolve("./dist")),
  },
  resolve: {
    extensions: [".ts", ".tsx", ".js", ".jsx"],
  },
  devServer: {
    historyApiFallback: true,
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "index.html",
      publicPath: "/",
    }),
    // new FileSystemRoutingPlugin(),
  ],
  module: {
    rules: [
      FileSystemRoutingLoader({
        base: "src/routes",
        ignore: ["**/_*", "**/_*/**"],
        importSync: ["loader"],
        importAsync: ["default"],
      }),
      {
        test: /\.[tj]sx?$/,
        exclude: /(node_modules)/,
        use: {
          loader: "swc-loader",
          options: {
            jsc: {
              parser: {
                syntax: "typescript",
                jsx: true,
              },
              transform: {
                react: {
                  runtime: "automatic",
                },
              },
            },
          },
        },
      },
    ],
  },
};
