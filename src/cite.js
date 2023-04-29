// @ts-check
import {ccfData} from "./ccf"
import {letpubQueryUrl} from "./letpub"
import {rs as replaceSeq} from "./utils"
import {CiteStyles} from "./cite_parse";

// console.info("> cite.js");


/**
 * Guess from CCF lists
 * @param {string} title
 * @returns {{title:string, description: string, url: string} | undefined}
 */
function guessCcf(title) {
    const regexp = new RegExp(title.trim().replace(/\s+/ig, "\\s"), "i");
    let res = ccfData.en.filter(row => row.searchKey.match(regexp))[0];
    if (res) {
        res.title += " (CCF Guess)";
        return res;
    }
    res = ccfData.cn.filter(row => row.searchKey.match(regexp))[0];
    if (res) {
        res.title += " (CCF Guess)";
    }
    return res;
}

async function generateInfo(res, cite_style, cb) {
    // console.log(res);
    const title = res.title.trim();
    /** @type {{title: string, [index: string]: any}[]} */
    let info = [{
        title: title,
        description: "跳转谷歌学术搜索...",
        url: "https://scholar.google.com/scholar?q=" + encodeURIComponent(title).replace(/%20/g, "+"),
        cite: "google-scholar"
    }, {title: "选择此项复制标题", description: title, cite: cite_style}, {
        title: "作者", description: res.author, cite: cite_style
    }, {
        title: "出版商信息", description: res.publisher, cite: cite_style
    }];
    if (res.type) {
        let cite_content_type = res.type === "J" ? "期刊" : res.type === "C" ? "会议" : "其它";
        info.push({title: "类型", description: cite_content_type, cite: cite_style});
    }
    if (res.year) {
        info.push({title: "年份", description: res.year, cite: cite_style});
    }
    // TODO: 尝试解析出版商信息（通过搜索）

    // if (typeof res.publisher === "string" && res.publisher) {
    //     if (res.publisher === "ArXiv") {
    //         info.push({
    //             title: "出版商: " + res.publisher, description: res.publisher, cite: cite_style
    //         });
    //     } else {
    //         const searchWord = res.publisher.trim();
    //         info.push({
    //             title: "期刊: " + searchWord,
    //             description: "跳转Letpub搜索...",
    //             cite: "letpub",
    //             url: letpubQueryUrl(searchWord)
    //         });
    //         const result = guessCcf(searchWord);
    //         if (result) {
    //             info.push(result);
    //         }
    //         // // no await here
    //         // letpubQuery(searchWord, result => {
    //         //     if (result) {
    //         //         result[0].title += " (LetPub Guess)";
    //         //         info.push(result[0]);
    //         //     }
    //         //     cb(info);
    //         // });
    //     }
    // } else if (res.conference) {
    //     const searchWord = res.conference.trim();
    //     info.push({title: "会议", description: searchWord, cite: cite_style});
    //     const result = guessCcf(searchWord);
    //     if (result) {
    //         info.push(result);
    //     }
    // } else {
    //     info.push({
    //         title: "未知类型: " + res.unknown, description: "抱歉无法识别此文献为期刊或会议。如果您认为这是一个BUG，请在插件评论区反馈"
    //     })
    //     return
    // }
    cb(info);
}

function citeSelectCallback(item) {
    window.utools.hideMainWindow();
    if (item.url) {
        // jump if url exists
        window.utools.shellOpenExternal(item.url);
    } else {
        window.utools.copyText(item.description);
    }
    window.utools.outPlugin();
}


export class CiteStyled {
    /** @param {keyof CiteStyles} style */
    constructor(style) {
        console.info("CiteStyled:ctor", style);
        /** @type {keyof CiteStyles} */
        this.style = style;
    }

    /**
     * @param {Preload.Action} action
     * @param {Preload.SetListCb} cb
     */
    enter(action, cb) {
        /** @type {string} */
        const text = action.payload;
        console.log("cite:enter", this.style, text);
        const res = CiteStyles[this.style](text);
        generateInfo(res, this.style, cb);
    }

    /**
     * @param {Preload.Action} action
     * @param {Preload.Item} item
     * @param {Preload.SetListCb} cb
     */
    select(action, item, cb) {
        citeSelectCallback(item);
    }
}

/** @type {Preload.ListArgs} */
export const citeUnknown = {
    enter(action, cb) {
        const text = replaceSeq(action.payload, [[/[．。]/g, "."], [/，/g, ","], [/［/g, "["], [/］/g, "]"], [/^[\(\[]\d+[\(\]]/, ""],]);
        console.log("citeUnk:enter", text);
        let infos = [];
        for (const name in CiteStyles) {
            const res = CiteStyles[name](text);
            if (res) {
                let publisher = res.publisher;
                if ("year" in res) {
                    publisher += ` (${res.year})`;
                }
                if ("type" in res) {
                    publisher += ` [${res.type}]`;
                }

                infos.push({
                    title: `${name} 引用格式 | ${res.title}`,
                    description: `${res.author} | ${publisher}`,
                    res: res,
                    cite: "unknown"
                });
            }
        }
        console.log("citeUnk:infos", infos);
        if (infos.length === 0) {
            cb([{
                title: "未检出引用 / 未支持的引用类型", description: "我们暂时无法解析这个引用对应的信息"
            }]);
        } else {
            cb(infos);
        }
    }, select(action, item, cb) {
        if (item.cite === "unknown") {
            generateInfo(item.res, item.cite, cb);
        } else {
            citeSelectCallback(item);
        }
    },
};