#!/usr/bin/env node
// @ts-check
const http = require("node:http");

const ListenAddr = "0.0.0.0";
const ListenPort = 5000;

const ERROR = 0, WARN = 1, LOG = 2, INFO = 3, UNK = 4;
/** @ts-ignore @type {{[i:string]:(str:string) => string}} */
const Style = (function () {
    ["black", "red", "green", "yellow", "blue", "magenta", "cyan", "white"]
        .forEach((color, idx) => {
            const code = 30 + idx;
            this[color] = /** @param {string} str */
                str => `\u001b[${code}m${str}\u001b[39m`;
        });
    return this;
})();

function getRequestType(url) {
    switch (url.toLowerCase()) {
        case "/error": return ERROR;
        case "/warn": return WARN;
        case "/info": return INFO;
        case "/": case "/log": return LOG;
        default: return UNK;
    }
}

const TypePrefix = [Style.red("[E]"), Style.yellow("[W]"), Style.blue("[L]"), Style.cyan("[I]"), "..."];

// Create an HTTP server
const server = http.createServer((req, res) => {
    const type = getRequestType(req.url);
    let result = "";
    req.on("data", chunk => {
        result += chunk.toString("utf-8");
    });
    req.on("end", () => {
        console.log(TypePrefix[type], result);
    });
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("OK");
});

// Listen port
server.listen(ListenPort, ListenAddr, () => {
    console.log(`Listen on ${ListenAddr}:${ListenPort}`);
});