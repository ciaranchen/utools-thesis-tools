// @ts-check
/// <reference path="extra.d.ts" />
import axios from "axios"
// console.info("> letpub.js");

export const LetpubBaseUrl = "https://www.letpub.com.cn/";
/** @type {ReturnType<setTimeout>} */
let letpubTimeout;

/**
 * Get Element chilren or attributes
 * @param {Element} root 
 * @param {...number | string} args number->child, \@x->attr[x], str->member 
 * @returns {Element | string} Empty string for invalid data
 */
function child(root, ...args) {
    /** @type {ReturnType<child>} */
    let c = root;
    for (const k of args) {
        if (null === c || undefined === c) {
            return "";
        }
        if (c instanceof Element && typeof k === "number") {
            // console.info("children", k, c.children[k])
            /** @ts-ignore */
            c = c.children[k];
        }
        else if (c instanceof Element && typeof k === "string" && k[0] === "@") {
            if (k === "@") {
                /** @ts-ignore */
                c = Array.from(c.childNodes)
                    .filter(e => e.nodeType === Node.TEXT_NODE)
                    .map(e => e.nodeValue)
                    .join(" ");
            }
            else {
                /** @ts-ignore */
                c = c.getAttribute(k.substring(1));
            }
        }
        else {
            c = c[k];
        }
    }
    return c;
}

/**
 * @param {string} html
 * @returns {Preload.Item[] | null}
 */
function letpubResultParser(html) {
    if (html.indexOf("暂无匹配结果，请确认您输入的期刊名和其他搜索条件是否正确。") >= 0) {
        return null;
    }
    const body = html.match(/<body[\S ]*>[\s\S]*<\/body>/m)?.[0] || "";
    console.log("letpub:body", body.length, body.substring(0, 60));
    const doc = new DOMParser().parseFromString(body, "text/html");
    const table = doc.querySelectorAll("#yxyz_content>.table_yjfx>tbody>tr");
    /** @ts-ignore @type {HTMLTableRowElement[]} */
    const trs = Array.from(table).slice(2);
    // console.log("letpub:all-tr", trs.length, trs);
    const res = trs.map(e => {
        console.log("letpub:tr", e.childElementCount, e.innerHTML.substring(0, 60))
        if (e.childElementCount > 1) {
            const fullName = child(e, 1, 3, "@");
            return {
                title: child(e, 1, 0, "@") + (fullName ? ` (${fullName})` : ""),
                description: `中科院${child(e, 4, 0, "@")}  ${child(e, 5, "@")}  ${child(e, 3, "@")}`,
                url: LetpubBaseUrl + child(e, 1, 0, "@href"),
                selectable: true,
            };
        }
        else {
            const td = e.children[0];
            return {
                title: "更多内容",
                description: "打开浏览器查看",
                url: LetpubBaseUrl + child(td, td.childElementCount - 3, "@href"),
                selectable: true,
            };
        }
    });
    return res;
}

/**
 * @param {string} searchWord 
 * @param {Preload.SetListCb} cb 
 * @returns {void}
 */
function letpubSearch(searchWord, cb) {
    if (!searchWord) {
        return;
    }
    console.log("letpub:search", searchWord);
    searchWord = searchWord.toLowerCase().trim();
    cb([{ title: searchWord + "..." }]);
    letpubQuery(searchWord, result => {
        if (result) {
            cb(result);
        } else {
            cb([{ title: "Not Found." }]);
        }
    });
}

export function letpubQueryUrl(searchWord) {
    return LetpubBaseUrl + "index.php?page=journalapp&view=search&searchname=" + encodeURIComponent(searchWord).replace(/%20/g, "+");
}

/**
 * @param {string} searchWord Search word
 * @param {Preload.SetListCb} cb Callback function, return `null` for not found
 * @returns {void}
 */
export function letpubQuery(searchWord, cb) {
    axios({
        url: letpubQueryUrl(searchWord),
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
    }).then(response => {
        const data = response.data;
        cb(letpubResultParser(data))
    });
}

/** @type {Preload.ListArgs} */
export const letpub = {
    search(action, searchWord, cb) {
        if (letpubTimeout) {
            clearTimeout(letpubTimeout);
        }
        // search after waiting for 0.5s 
        letpubTimeout = setTimeout(letpubSearch, 500, searchWord, cb);
    },
    select(action, item, cb) {
        if (!item.selectable) {
            return;
        }
        window.utools.hideMainWindow();
        if (item.title != "更多内容") {
            window.utools.copyText(item.title);
        }
        window.utools.shellOpenExternal(item.url);
        window.utools.outPlugin();
    },
};