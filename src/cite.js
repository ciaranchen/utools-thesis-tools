// @ts-check
import { ccfData } from "./ccf"
import { letpubQueryUrl, letpubQuery } from "./letpub"
import { rs as replaceSeq } from "./utils"
// console.info("> cite.js");

// Harvard style
function harvard_style(sentence) {
    const harvard_match = /^(.*),\s*(\d{4})\.(.*?)\.(.*)$/i
    const found = sentence.match(harvard_match);
    // console.log(found);
    return found ? {
        author: found[1],
        year: found[2],
        title: found[3],
        info: found[4]
    } : null;
}

// GB/T 7714
function gbt_style(sentence) {
    // 原本GBT中的[]中可能有两位字母作为标识的，但是可能会与Arxiv的[Cs]冲突。
    const gbt_match = /^(.*?)\.\s*(.*?)\[(.)\]\s*?[\.\/]\/?\s*((.*?)[,.]\s*.*\s*(\d{4}).*)$/i
    const found = sentence.match(gbt_match);
    // console.log(found);
    let res = found ? {
        cite: "GB/T7714",
        author: found[1],
        year: found[6],
        title: found[2],
        info: found[4],
        type: found[3],
    } : null;
    if (res && res.type === "J") {
        res.publisher = found[5];
        if (res.publisher.match(/^arxiv/ig)) {
            res.publisher = "ArXiv";
        }
    }
    if (res && res.type === "C") {
        let conf_text = found[5];
        // 去除括号中的内容
        conf_text = conf_text.replace(/\(.*\)/g, "").replace(/\{.*\}/g, "").replace(/\[.*\]/g, "");
        // 去除一些经常出现，但是可能导致错误的名词
        conf_text = conf_text.replace(/\d{4}/g, "").replace("IEEE", "").replace("ACM", "").replace("Workshops", "");
        // console.log(conf_text);
        res.conference = conf_text.trim();
    }
    return res;
}

// MLA
function mla_style(sentence) {
    sentence = sentence.replace(/Vol\.\s*\d{4}\./g, "")
    const mla_match = /^(.*?)\.\s*[“"](.*?)["”]\s*((.*?)(([,\.]\s+\d{4})|(\(\d{4}\))).*?)$/i
    const found = sentence.match(mla_match);
    // console.log(found);
    if (!found) return null;
    let years = found[5].replace(/[^\d]/g, "");
    let res = {
        cite: "MLA",
        author: found[1],
        year: years,
        title: found[2],
        info: found[3],
    }
    if (found[4].match(/^arxiv/ig)) {
        res.publisher = "ArXiv";
        return res;
    }
    // Journal or Conference
    let text = found[4];
    // 去除括号中的内容
    text = text.replace(/\(.*\)/g, "").replace(/\{.*\}/g, "").replace(/\[.*\]/g, "");
    // 取前半截
    text = text.split(/[,\.]/g)[0];
    // 过滤标点符号
    text = text.replace(/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\\\\[\]\{\}\;\"\"\,\<\.\>\/\?]/g, "");
    // 过滤数字
    text = text.replace(/(In\s)?\d{4}/ig, "").replace(/\d/g, "");
    // 去除一些经常出现，但是可能导致错误的名词
    text = text.replace(/\d{4}/g, "").replace("IEEE", "").replace("ACM", "").replace("Workshops", "");
    if (text.includes("onference")) {
        res.conference = text.trim();
        return res;
    }
    res.unknown = text.trim();
    return res;
}

// APA
function apa_style(sentence) {
    sentence = sentence.replace(/Vol\.\s*\d{4}\./g, "")
    const apa_match = /^(.*)\.\s*\((\d{4})(,\s*\w+)?\)\.\s*(.*?)\.\s*(.*)$/i
    const found = sentence.match(apa_match);
    // console.log(found);
    if (!found) return null;
    let res = {
        cite: "APA",
        author: found[1],
        year: found[2],
        title: found[4],
        info: found[5],
    };
    if (found[5].match(/^arxiv/ig)) {
        res.publisher = "ArXiv";
        return res;
    }
    // Journal or Conference
    let text = found[5];
    // 去除括号中的内容
    text = text.replace(/\(.*\)/g, "").replace(/\{.*\}/g, "").replace(/\[.*\]/g, "");
    // 取前半截
    text = text.split(/[,\.]/g)[0];
    // 过滤标点符号
    text = text.replace(/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\\\\[\]\{\}\;\"\"\,\<\.\>\/\?]/g, "");
    // 过滤数字
    text = text.replace(/(In\s)?\d{4}/ig, "").replace(/\d/g, "");
    // 去除一些经常出现，但是可能导致错误的名词
    text = text.replace(/\d{4}/g, "").replace("IEEE", "").replace("ACM", "").replace("Workshops", "");
    if (text.includes("onference")) {
        res.conference = text.trim();
        return res;
    }
    res.unknown = text.trim();
    return res;
}

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
    console.log(res);
    const title = res.title.trim();
    /** @type {{title: string, [index: string]: any}[]} */
    let info = [
        {
            title: title,
            description: "跳转谷歌学术搜索...",
            url: "https://scholar.google.com/scholar?q=" + encodeURIComponent(title).replace(/%20/g, "+"),
            cite: "google-scholar"
        },
        { title: "选择此项复制标题", description: title, cite: cite_style },
        { title: "作者", description: res.author, cite: cite_style },
        { title: "年份", description: res.year, cite: cite_style },
        { title: "其他信息", description: res.info, cite: cite_style }
    ];
    if (res.type) {
        let cite_content_type = res.type === "J" ? "期刊" : res.type === "C" ? "会议" : "其它";
        info.push({ title: "类型", description: cite_content_type, cite: cite_style });
    }
    if (typeof res.publisher === "string" && res.publisher) {
        if (res.publisher === "ArXiv") {
            info.push({
                title: "出版商: " + res.publisher,
                description: res.publisher,
                cite: cite_style
            });
        } else {
            const searchWord = res.publisher.trim();
            info.push({
                title: "期刊: " + searchWord,
                description: "跳转Letpub搜索...",
                cite: "letpub",
                url: letpubQueryUrl(searchWord)
            });
            const result = guessCcf(searchWord);
            if (result) {
                info.push(result);
            }
            // no await here
            letpubQuery(searchWord, result => {
                if (result) {
                    result[0].title += " (LetPub Guess)";
                    info.push(result[0]);
                }
                cb(info);
            });
        }
    } else if (res.conference) {
        const searchWord = res.conference.trim();
        info.push({ title: "会议", description: searchWord, cite: cite_style });
        const result = guessCcf(searchWord);
        if (result) {
            info.push(result);
        }
    } else {
        info.push({
            title: "未知类型: " + res.unknown,
            description: "抱歉无法识别此文献为期刊或会议。如果您认为这是一个BUG，请在插件评论区反馈"
        })
        return
    }
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

/** citing style map */
export const CiteStyles = {
    "APA": apa_style,
    "GB/T7714": gbt_style,
    "Harvard": harvard_style,
    "MLA": mla_style,
};

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
        const text = replaceSeq(action.payload, [
            [/[．。]/g, "."],
            [/，/g, ","],
            [/［/g, "["],
            [/］/g, "]"],
            [/^[\(\[]\d+[\(\]]/, ""],
        ]);
        console.log("citeUnk:enter", text);
        let infos = [];
        for (const name in CiteStyles) {
            const res = CiteStyles[name](text);
            if (res) {
                infos.push({
                    title: name + " 引用格式",
                    description: res.title,
                    res: res,
                    cite: "unknown"
                });
            }
        }
        console.log("citeUnk:infos", infos);
        if (infos.length === 0) {
            cb([{
                title: "未检出引用，可能的原因如下："
            }, {
                title: "未支持的引用类型",
                description: "可能您查询的引用类型不是MLA、APA、GB/T7714类型的，后期将尝试添加更多支持的引用类型"
            }, {
                title: "出现了BUG（更可能的情况）",
                description: "出现问题也是难免的啦，首先为带来的不便向您卖个萌。如果您希望帮助我修复此问题，请在插件评论区反馈"
            }]);
        } else {
            cb(infos);
        }
    },
    select(action, item, cb) {
        if (item.cite === "unknown") {
            generateInfo(item.res, item.cite, cb);
        } else {
            citeSelectCallback(item);
        }
    },
};