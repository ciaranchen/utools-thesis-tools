// @ts-check
/// <reference path="extra.d.ts" />
import axios from "axios"
import {console} from "./debug-shim";
// console.info("> letpub.js");

export const LetpubBaseUrl = "https://www.letpub.com.cn/";
/** @type {ReturnType<setTimeout>} */
let letpubTimeout;

/**
 * Get Element children or attributes
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
        } else if (c instanceof Element && typeof k === "string" && k[0] === "@") {
            if (k === "@") {
                /** @ts-ignore */
                c = Array.from(c.childNodes)
                    .filter(e => e.nodeType === Node.TEXT_NODE)
                    .map(e => e.nodeValue)
                    .join(" ");
            } else {
                /** @ts-ignore */
                c = c.getAttribute(k.substring(1));
            }
        } else {
            c = c[k];
        }
    }
    return c;
}

/**
 * 这部分代码可以用于解析列表形式的Letpub搜索结果表格，但是改版之后用不上了。
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
                description: `中科院${child(e, 4, "@")}  ${child(e, 5, "@")}  ${child(e, 3, "@")}`,
                url: LetpubBaseUrl + child(e, 1, 0, "@href"),
                selectable: true,
            };
        } else {
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
    cb([{title: searchWord + "..."}]);
    axios.request({
        method: "GET",
        url: 'https://www.letpub.com.cn/journalappAjaxXS.php',
        params: {querytype: 'autojournal', term: searchWord}
    }).then(response => {
        const data = response.data;
        if (data.length > 0) {
            cb(data.map(obj => {
                return {
                    type: 'journal', title: obj.label, description: `ISSN: ${obj.issn}`, id: obj.id
                }
            }));
        } else {
            cb([{type: 'msg', title: "Not Found."}]);
        }
    });
}

/**
 * 解析期刊详情页面。
 * @param {string} html
 * @returns {Preload.Item[]}
 */
function letpubJournalPageParser(html) {
    const body = html.match(/<body[\S ]*>[\s\S]*<\/body>/m)?.[0] || "";
    const doc = new DOMParser().parseFromString(body, "text/html");
    const trs = Array.from(doc.querySelectorAll("#yxyz_content>.table_yjfx>tbody>tr"));


    let basis = child(trs[3], 0, "@").toString().includes("影响因子") ? 3 : 4;
    let res = [{
        // 期刊名字
        type: 'info', title: child(trs[1], 0, 0, "@"), description: child(trs[1], 1, 0, 0, "@")
    }, {
        type: 'info', title: "名称缩写", description: child(trs[1], 1, 0, 3, "@")
    }, {
        // 期刊ISSN
        type: 'info', title: child(trs[2], 0, "@"), description: child(trs[2], 1, "@")
    }, {
        // 2022-2023最新影响因子
        type: 'info', title: child(trs[basis], 0, "@"), description: child(trs[basis], 1, "@")
    }, {
        // 出版商
        type: 'info', title: child(trs[basis + 12], 0, "@"), description: child(trs[basis + 12], 1, "@")
    }, {
        // 涉及的研究方向
        type: 'info', title: child(trs[basis + 13], 0, "@"), description: child(trs[basis + 13], 1, "@")
    }, {
        // WOS期刊SCI分区
        type: 'info', title: child(trs[basis + 21], 0).textContent, description: child(trs[basis + 21], 1, 0, "@")
    }];

    // 中科院SCI期刊分区（ 2023年12月最新升级版）
    const td = child(trs[basis + 23], 1);
    let partition_description;
    if (td.childNodes[2] instanceof HTMLTableElement) {
        // 这里会有一个表格，需解析出其中的分区信息。
        partition_description = Array.from(child(td, 2, 0).childNodes).slice(1)
            .map(tr => {
                // 大类学科
                let td = tr.childNodes[0];
                // 分区
                let text = Array.from(td.childNodes)
                    .filter(e => e.nodeType !== Node.TEXT_NODE)
                    .filter(e => !e.getAttribute('style').includes('display:none'))
                    .map(e => e.textContent).join(" ");
                return td.childNodes[0].nodeValue + " " + text;
            }).join("; ");
    } else {
        // （没有被最新的JCR升级版收录，仅供参考）
        partition_description = td.childNodes[2].textContent;
    }
    res.push({
        type: 'info',
        title: child(trs[basis + 23], 0).textContent,
        description: partition_description
    });
    // 期刊官方网址
    const official_website = child(trs[basis + 7], 1).textContent;
    if (official_website.length > 0) {
        res.push({
            type: 'url', title: child(trs[basis + 7], 0, "@"), description: official_website
        });
    }
    // 期刊投稿网址
    const publish_website = child(trs[basis + 8], 1).textContent;
    if (publish_website.length > 0) {
        res.push({
            type: 'url', title: child(trs[basis + 8], 0, "@"), description: publish_website
        });
    }
    return res;
}

/**
 * 产出期刊详情的搜索结果。
 * @param {string} journalId
 * @param {Preload.SetListCb} cb
 * @returns {void}
 */
function journalInformationSearch(journalId, cb) {
    console.log("letpub:journal", journalId);
    axios.request({
        method: 'GET', url: letpubJournalUrl(journalId)
    }).then(response => {
        const data = response.data;
        let result = letpubJournalPageParser(data);
        result.push({
            type: 'url', title: "更多内容 - 查看 LetPub 网站", description: letpubJournalUrl(journalId)
        });
        cb(result);
    });
}

function jsonToUrlParams(json) {
    return Object.keys(json)
        .map(key => encodeURIComponent(key) + '=' + encodeURIComponent(json[key]))
        .join('&');
}


// 此函数装配QueryUrl，目前需要指定学科类别才能响应。
export function letpubQueryUrl(searchWord) {
    const param = {
        page: 'journalapp', view: 'search', searchname: searchWord.replace(" ", "+")
    }
    return LetpubBaseUrl + "index.php?" + jsonToUrlParams(param);
}

export function letpubJournalUrl(journalId) {
    const param = {
        page: 'journalapp', view: 'detail', journalid: journalId
    }
    return LetpubBaseUrl + 'index.php?' + jsonToUrlParams(param)
}

/** @type {Preload.ListArgs} */
export const letpub = {
    search(action, searchWord, cb) {
        if (letpubTimeout) {
            clearTimeout(letpubTimeout);
        }
        // search after waiting for 0.5s 
        letpubTimeout = setTimeout(letpubSearch, 500, searchWord, cb);
    }, select(action, item, cb) {
        if (item.type === "msg") {
            // do nothing
        } else if (item.type === "journal") {
            journalInformationSearch(item.id, cb);
        } else if (item.type === "info") {
            window.utools.hideMainWindow();
            window.utools.copyText(item.description);
            window.utools.outPlugin();
        } else if (item.type === "href") {
            window.utools.hideMainWindow();
            window.utools.shellOpenExternal(item.description);
            window.utools.outPlugin();
        }
    },
};