// @ts-check
const { build, analyzeMetafile } = require("esbuild");
const { copy } = require("esbuild-plugin-copy");
// @ts-ignore
const { dsvPlugin } = require("esbuild-plugin-dsv");
const fs = require("fs");
const path = require("path");
const { LM: LangMap, PM: PublisherMap, TM: TierMap } = require("./src/utils");

const ModeMap = {
    /** @type {0} */ development: 0,
    /** @type {1} */ dropconsole: 1,
    /** @type {2} */ production: 2,
}

/** @type {ModeMap[keyof ModeMap]} */
const Mode = ModeMap[process.env.NODE_ENV] || 0;

(async () => {
    "use strict";
    console.log(">", Object.keys(ModeMap)[Mode]);

    /**
     * CSV pre-processor
     * @param {object} row CSV row
     */
    function transformCsv(row) {
        if (row.hasOwnProperty("n")) {
            delete row.n;
        }
        if (row.hasOwnProperty("lang")) {
            row.l = LangMap[row.lang];
            delete row.lang;
        }
        if (row.hasOwnProperty("pub")) {
            if (PublisherMap.hasOwnProperty(row.pub)) {
                row.pub = PublisherMap[row.pub];
            }
        }
        if (row.hasOwnProperty("tier")) {
            row.i = TierMap[row.tier];
            delete row.tier;
        }
        if (row.hasOwnProperty("type")) {
            row.t = row.type === "J" ? 1 : 0;
            delete row.type;
        }
        if (row.hasOwnProperty("url")) {
            row.url = row.url
                .replace("https://dblp.org/db/conf", "$dblpc")
                .replace("https://dblp.org/db/journals", "$dblpj");
        }
        return row;
    }

    /**
     * set external packages
     * @param {{include?: string[], exclude?: string[]}} options
     * @returns {import("esbuild").Plugin}
     */
    function extPkg(options) {
        const include = options?.exclude || [];
        const exclude = options?.exclude || [];
        function getDep(dep) { return dep ? Object.keys(dep) : []; }
        /** @param {import("esbuild").PluginBuild} build */
        async function setup(build) {
            const pkg = JSON.parse(await fs.readFileSync("./package.json", { encoding: "utf-8" }));
            const external = [...include, ...getDep(pkg?.dependencies), ...getDep(pkg?.devDependencies)]
                .filter(e => !exclude.includes(e));
            if (Mode <= 1) {
                console.log("[external]", external);
            }
            if (build.initialOptions.external) {
                build.initialOptions.external.concat(external);
            }
            else {
                build.initialOptions.external = external;
            }
        }
        return { name: "external-package", setup };
    }

    /**
     * redirect `mime-db` and `axios`
     * @param {object} options
     * @returns {import("esbuild").Plugin}
     */
    function replPkg(options = {}) {
        return {
            name: "replace-mime-db",
            setup(build) {
                build.onResolve({ filter: /^mime-db$/ }, args => {
                    console.log("[replace] mime-db -> src/mimedb.js");
                    return { path: path.join(__dirname, "src/mimedb.js") };
                });
                if (Mode >= 2) {
                    build.onResolve({ filter: /^axios$/ }, args => {
                        console.log("[replace] axios -> node_modules/axios/dist/esm/axios.min");
                        return { path: path.join(__dirname, "node_modules/axios/dist/esm/axios.min.js") };
                    });
                }
            },
        };
    }

    /**
     * Build result analyze processor
     * @param {import("esbuild").Metafile} metafile esbuild metafile
     */
    async function analyze(metafile, verbose = false) {
        for (const file in metafile.outputs) {
            /** @type {(typeof metafile.outputs)[""]["inputs"]} */
            const newInputs = {};
            let modulesBytes = 0;
            for (const k in metafile.outputs[file].inputs) {
                const v = metafile.outputs[file].inputs[k];
                if (!verbose && k.startsWith("node_modules")) {
                    modulesBytes += v.bytesInOutput;
                }
                else if (k.startsWith("dsv:")) {
                    const newPath = k.replace(__dirname, ".").replace(/\\/g, "/");
                    newInputs[newPath] = v;
                }
                else {
                    newInputs[k] = v;
                }
            }
            if (modulesBytes) {
                newInputs["node_modules"] = { bytesInOutput: modulesBytes };
            }
            metafile.outputs[file].inputs = newInputs;
        }
        console.log(await analyzeMetafile(metafile, { color: true }));
    }

    // run esbuild
    const result = await build({
        entryPoints: ["preload.js"],
        outdir: "dist",
        bundle: true,
        charset: "utf8",
        drop: Mode >= 1 ? ["console"] : [],
        format: "cjs",
        inject: Mode <= 0 ? ["src/debug-shim.js"] : [],
        legalComments: "none",
        metafile: true,
        minify: Mode >= 2,
        platform: "node",
        target: ["chrome91"],
        plugins: [
            replPkg(),
            // extPkg(),
            copy({
                assets: [
                    { from: "plugin.json", to: "plugin.json" },
                    { from: "assets/logo.png", to: "logo.png" },
                    { from: "node_modules/sql.js/dist/sql-wasm.wasm", to: "sql-wasm.wasm" },
                ]
            }),
            dsvPlugin({
                transform(data, ext) {
                    if ("CSV" === ext) {
                        return data.map(transformCsv);
                    }
                    return data;
                }
            }),
        ],
    });

    analyze(result.metafile, Mode >= 2);
})();
