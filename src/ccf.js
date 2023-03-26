// @ts-check
/// <reference path="extra.d.ts" />
import csvDataEn from "../assets/ccf-2022-en.csv"
import csvDataCn from "../assets/ccf-2022-cn.csv"
import { LMR as LangMap, PMR as PublisherMap } from "./utils"
// console.info("> ccf.js");

const DblpBaseUrl = "https://dblp.org/db/";
const TopicMap = {
    CA: "计算机体系结构/并行与分布计算/存储系统",
    CN: "计算机网络",
    IS: "网络与信息安全",
    SE: "软件工程/系统软件/程序设计语言",
    DB: "数据库/数据挖掘/内容检索",
    CS: "计算机科学理论",
    GM: "计算机图形学与多媒体",
    AI: "人工智能",
    HC: "人机交互与普适计算",
    SN: "交叉/综合/新兴"
};
const TierMap = ["A", "B", "C"];
const TypeMap = ["会议", "期刊"];

/**
 * @param {CsvDataEnRow} row
 * @returns {CcfItem}
 */
function ccfEnParser(row) {
    const pub = PublisherMap[row.pub] ?? row.pub;
    const publisher = pub.length <= 16 ? pub : (pub.substring(0, 16) + "...");
    const url = row.url.replace("$dblpc", DblpBaseUrl + "conf").replace("$dblpj", DblpBaseUrl + "journals");
    return {
        title: row.a ? `${row.a} (${row.name})` : row.name,
        description: `${TopicMap[row.tp]}  CCF-${TierMap[row.i]}  ${TypeMap[row.t]}  ${publisher}`,
        url: url,
        searchKey: row.a + row.name + row.pub,
    };
}

/**
 * @param {CsvDataCnRow} row
 * @returns {CcfItem}
 */
function ccfCnParser(row) {
    const publisher = row.pub.length <= 20 ? row.pub : (row.pub.substring(0, 20) + "...");
    return {
        title: row.name,
        description: `CCF-T${row.i}  ${LangMap[row.l]}  ${row.c}  ${publisher}`,
        url: "https://qikan.cqvip.com/Qikan/Search/Index?objectType=7&key=CN%3D" + encodeURIComponent(row.c),
        searchKey: row.name + row.pub,
    };
}

export const ccfData = {
    // @ts-ignore
    cn: csvDataCn.map(ccfCnParser),
    // @ts-ignore
    en: csvDataEn.map(ccfEnParser),
};

export class Ccf {
    /** @param {keyof ccfData} source */
    constructor(source) {
        console.info("Ccf:ctor", source);
        /** @type {keyof ccfData} */
        this.src = source;
    }
    /** 
     * @param {Preload.Action} action
     * @param {Preload.SetListCb} cb
     */
    enter(action, cb) {
        console.log("ccf:enter", this.src, ccfData[this.src].length);
        cb(ccfData[this.src]);
    }
    /**
     * @param {Preload.Action} action
     * @param {string} searchWord
     * @param {Preload.SetListCb} cb
     */
    search(action, searchWord, cb) {
        console.log("ccf:search", this.src, searchWord);
        const regexp = new RegExp(searchWord.trim().replace(/\s+/ig, "\\s"), "i");
        const result = ccfData[this.src].filter(row => row.searchKey.match(regexp));
        cb(result);
    }
    /**
     * @param {Preload.Action} action
     * @param {Preload.Item} item
     * @param {Preload.SetListCb} cb
     */
    select(action, item, cb) {
        window.utools.hideMainWindow();
        window.utools.shellOpenExternal(item.url);
        window.utools.outPlugin();
    }
}