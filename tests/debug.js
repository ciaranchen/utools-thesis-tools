// @ts-check
/** @ts-ignore @type {import("axios").AxiosStatic} */
const axios = require("axios");

/**
 * @param {string} path 
 * @param {any} data 
 */
function send(path, data = "") {
    axios(path, {
        baseURL: "http://localhost:5000/",
        data,
        method: "post",
        headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
}

/**
 * @param {any} obj 
 * @param {number} depth Recursion depth
 * @returns {string}
 */
function tostr(obj, depth = 0) {
    if (typeof obj === "number") {
        return obj.toString();
    }
    else if (typeof obj === "string") {
        if (obj.length < 64) {
            obj = obj.replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t");
            return `"${obj}"`;
        }
        return "`" + obj + "`";
    }
    else if (Array.isArray(obj)) {
        if (depth < 2) {
            const m = obj.map(e => tostr(e, depth + 1));
            return `[${m.join(", ")}]`;
        }
        return JSON.stringify(obj);
    }
    else if (obj === undefined) {
        return "\u001b[31mundefined\u001b[39m";
    }
    else if (obj === null) {
        return "\u001b[31mnull\u001b[39m";
    }
    else if (typeof obj === "bigint") {
        return obj.toString() + "n";
    }
    else if (obj instanceof Date) {
        return obj.toISOString();
    }
    else if (Buffer.isBuffer(obj)) {
        const N = "0123456789abcdef";
        let str = "<Buffer";
        for (const v of obj) {
            str += " " + N[v / 16 >> 0] + N[v % 16];
        }
        return str + ">";
    }
    return obj.toString();
}

/** @param {any[]} args */
function parseArgs(args) {
    let str = "";
    let nextJson = false;
    for (const i of args) {
        if (nextJson) {
            str += " " + JSON.stringify(i);
            nextJson = false;
        }
        else if ("@J" === i) {
            nextJson = true;
        }
        else {
            str += " " + tostr(i);
        }
    }
    return str.substring(1);
}

const debug = {
    /** @param {...any} args */
    error(...args) { send("error", parseArgs(args)); },
    /** @param {...any} args */
    info(...args) { send("info", parseArgs(args)); },
    /** @param {...any} args */
    log(...args) { send("log", parseArgs(args)); },
    /** @param {...any} args */
    warn(...args) { send("warn", parseArgs(args)); },
};

module.exports = debug;