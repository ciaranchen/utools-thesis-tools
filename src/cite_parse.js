// Harvard style
function harvard_style(sentence) {
    const harvard_match = /^(\[(?<number>\d+)\]\s*)?(?<author>[\u4E00-\u9FFFA-Za-z\s]+((,\s?)[\u4E00-\u9FFFA-Za-z\.]+)*)\p{P}\s*(?<year>\d{4})?\p{P}\s*(?<title>.*)\p{P}\s*(?<publisher>[\u4E00-\u9FFFA-Za-z\s\p{P}]*)\p{P}(?:\s*\bAvailable\sfrom:\s*(\S+)\b)?$/u;
    const found = sentence.match(harvard_match);
    return found ? found.groups : null;
}

// GB/T 7714
function gbt_style(sentence) {
    // 原本GBT中的[]中可能有两位字母作为标识的，但是可能会与Arxiv的[Cs]冲突。
    const gbt_match = /^(\[(?<number>\d+)\]\s*)?(?<author>.*?)\.\s*(?<title>.*?)\[(?<type>.)\]\s*?[\.\/]\/?\s*(?<publisher>(.*?)[,.]\s*.*\s*(?<year>\d{4}).*)$/
    // ^(\[(?<number>\d+)\]\s*)?(?<author>.*?)\.\s*(?<title>.*?)\[(?<type>.)\]\s*?[\.\/]\/?\s*(?<publisher>(.*?)[,.]\s*.*\s*(?<year>\d{4}).*)$
    const found = sentence.match(gbt_match);
    // console.log(found);
    // let res = found ? {
    //     cite: "GB/T7714", author: found[1], year: found[6], title: found[2], info: found[4], type: found[3],
    // } : null;
    // if (res && res.type === "J") {
    //     res.publisher = found[5];
    //     if (res.publisher.match(/^arxiv/ig)) {
    //         res.publisher = "ArXiv";
    //     }
    // }
    // if (res && res.type === "C") {
    //     let conf_text = found[5];
    //     // 去除括号中的内容
    //     conf_text = conf_text.replace(/\(.*\)/g, "").replace(/\{.*\}/g, "").replace(/\[.*\]/g, "");
    //     // 去除一些经常出现，但是可能导致错误的名词
    //     conf_text = conf_text.replace(/\d{4}/g, "").replace("IEEE", "").replace("ACM", "").replace("Workshops", "");
    //     // console.log(conf_text);
    //     res.conference = conf_text.trim();
    // }
    return found ? found.groups : null;
    // return res;
}

// G
function gbt_cn_style(sentence) {
    const gbt_match = /^([\u4E00-\u9FFFA-Za-z]+,?[\s\u4E00-\u9FFFA-Za-z]*)\.?\s*([\u4E00-\u9FFFA-Za-z\s\p{P}]+)\.\s*(?:\[[\u4E00-\u9FFFA-Za-z]+\]\s*)?[\u4E00-\u9FFFA-Za-z\s]*?[\.\[]*?(?:\bDissertation\b|\bThesis\b|\b毕业论文\b|\b学位论文\b)\b[\u4E00-\u9FFFA-Za-z\s\p{P}]*\b(\d{4})\.$/u
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
        cite: "MLA", author: found[1], year: years, title: found[2], info: found[3],
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
        cite: "APA", author: found[1], year: found[2], title: found[4], info: found[5],
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
    text = text.replace(/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\\\\[\]\{\}\;\"\'\,\<\.\>\/\?]/g, "");
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

/** citing style map */
const CiteStyles = {
    "APA": apa_style,
    "GB/T7714": gbt_style,
    "Harvard": harvard_style,
    "MLA": mla_style,
};

module.exports = {
    CiteStyles: CiteStyles
}