import type { RuleSetRule, LoaderDefinitionFunction } from "webpack";
import { createRequire } from "node:module";
import { glob } from "glob";
import { join, resolve } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
import {
  parseFile,
  type ExportDeclaration,
  type ExportNamedDeclaration,
} from "@swc/core";

const require = createRequire(import.meta.url);

interface LoaderOptions {
  /**
   * Directory from which to search for files. Can an absolute or relative path.
   */
  base?: string | URL;
  /**
   * Function to convert a file path to a URL Pattern path that can be used by a routing library
   *
   * Default:
   * - `./about/index.js` -> `/about/`
   * - `./books/[id].js` -> `/books/:id`
   * - `./[...404].js` -> `/*`
   */
  toPath(filepath: string): string;
  /**
   * Glob pattern to search for files.
   */
  pattern?: string | string[];
  /**
   * Files to ignore.
   */
  ignore?: string | string[];
  /**
   * Imports to include in the sync bundle.
   *
   * Use `"*"` to include all exports.
   */
  importSync?: string[] | "*";
  /**
   * Imports to include in the async bundle.
   *
   * They can be accessed lazily by doing:
   *
   * ```js
   * import routes from "webpack-fsr-plugin/routes";
   *
   * for (const route of routes) {
   *  const lazy = routes.async();
   *  // lazy.default, lazy.foo, lazy.bar, ...
   * }
   * ```
   */
  importAsync?: string[];
}

function isFileURL(value: unknown): boolean {
  try {
    const url = new URL(value as string | URL);
    if (url.protocol === "file:") {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}

function defaultPathTransform(filepath: string): string {
  return filepath
    .replace(/^\.\//, "/")
    .replace(/\[\.\.\.(.+)\]/g, "*")
    .replace(/\[(.+?)\]/g, ":$1")
    .replace(/\.(.+)$/g, "")
    .replace(/\/index$/g, "/");
}

const loaderFn: LoaderDefinitionFunction<LoaderOptions> = async function () {
  const {
    base = "src/routes",
    pattern = ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    ignore = ["**/_**/*", "**/_*"],
    toPath = defaultPathTransform,
    importSync = "*",
    importAsync = [],
  } = this.getOptions();

  const resolvedBasePath = isFileURL(base)
    ? fileURLToPath(base)
    : resolve(this.rootContext, base.toString());

  this.addContextDependency(resolvedBasePath);

  const paths = await glob(pattern, {
    cwd: resolvedBasePath,
    ignore,
    posix: true,
    dotRelative: true,
  });

  let imports = [];
  let exports = [];
  for (const index in paths) {
    const path = paths[index];
    const absolutePath = join(resolvedBasePath, path);
    const absolutePathUrl = pathToFileURL(absolutePath);
    const availableImports = [];

    const ast = await parseFile(absolutePath, {
      syntax: "typescript",
      tsx: true,
    });

    // export default ...
    const defaultDeclaration = ast.body.find(
      (node) => node.type === "ExportDefaultDeclaration"
    );

    if (defaultDeclaration) {
      availableImports.push("default");
    }

    // export const ...
    // export function ...
    // export class ...

    (
      ast.body.filter(
        (node) => node.type === "ExportDeclaration"
      ) as ExportDeclaration[]
    ).forEach((declaration) => {
      if (declaration.declaration.type === "FunctionDeclaration") {
        availableImports.push(declaration.declaration.identifier.value);
      } else if (declaration.declaration.type === "VariableDeclaration") {
        for (const variables of declaration.declaration.declarations) {
          if (variables.id.type === "Identifier") {
            availableImports.push(variables.id.value);
          }
        }
      }
    });

    // export { ... };
    (
      ast.body.filter(
        (node) => node.type === "ExportNamedDeclaration"
      ) as ExportNamedDeclaration[]
    ).forEach((declaration) => {
      for (const specifier of declaration.specifiers) {
        if (specifier.type === "ExportSpecifier") {
          if (!specifier.exported) {
            availableImports.push(specifier.orig.value);
          } else {
            availableImports.push(specifier.exported.value);
          }
        }
      }
    });

    if (importSync === "*") {
      const variable = `__${index}`;
      imports.push(`import * as ${variable} from "${absolutePathUrl}";`);
      exports.push(variable);
    } else {
      const syncMapping = importSync
        .filter((name) => availableImports.includes(name))
        .map((name, i) => ({
          name,
          alias: `__${index}_${i}`,
        }));

      imports.push(
        `import { ${syncMapping
          .map(({ name, alias }) => `${name} as ${alias}`)
          .join(", ")} } from "${absolutePathUrl}";`
      );

      const availableAsyncImports = importAsync.filter((name) =>
        availableImports.includes(name)
      );

      exports.push(
        `{ 
          path: ${JSON.stringify(toPath(path))},
          sync: {
            ${syncMapping
              .map(({ name, alias }) => `${name}: ${alias}`)
              .join(", ")}
          },
          ${
            availableAsyncImports.length > 0
              ? `async: () => import(/* webpackExports: [${availableAsyncImports
                  .filter((name) => availableImports.includes(name))
                  .map((name) => `"${name}"`)
                  .join(", ")}] */ "${absolutePathUrl}?async"),`
              : "async: () => Promise.resolve({}),"
          }
        }`
      );
    }
  }

  return `${imports.join("\n")}\n\nexport default [${exports.join(", ")}];`;
};

export default loaderFn;

export function loader(options: LoaderOptions): RuleSetRule {
  return {
    include: require.resolve("webpack-fsr-plugin/routes"),
    use: {
      loader: require.resolve("./loader.js"),
      options,
    },
  };
}
