#!/usr/bin/env node
// @ts-check
const debug = require('./debug')

/**
 * @param {keyof debug} level
 * @param  {...any} args
 */
function T(level, ...args) {
    console[level](...args);
    debug[level](...args);
}

T('log', 1, 90n)
T('log', "abc")
T('log', undefined, null, NaN, Infinity)

T('warn', [], [1], ["1", 99, new Date(), {}])
T('warn', { a: 'a' }, Buffer.from([0, 1, 2, 3, 100]))

T('info', "@J", { a: 1, b: [2, "3"] })
T('info', "Short Texts \r\nShow\tEscape Chars")
T('info', "Long Long Long Texts Texts Texts Are Are Are \nSurrounded Surrounded\n  Surrounded By By By Backquotes Backquotes Backquotes")