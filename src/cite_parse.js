// Harvard style
function harvard_style(sentence) {
    const harvard_match = /^(\[(?<number>\d+)\]\s*)?(?<author>[\u4E00-\u9FFFA-Za-z\s.]+(,[\u4E00-\u9FFFA-Za-z\s.]+)*)\p{P}\s*(?<year>\d{4})?\p{P}\s*(?<title>[\u4E00-\u9FFFA-Za-z\s\p{S}\p{P}\d]+)\p{P}\s*(?<publisher>[\u4E00-\u9FFFA-Za-z\s\p{S}\p{P}\d]*)\p{P}?(?:\s*\bAvailable\sfrom:\s*(\S+)\b)?$/u;
    const found = sentence.match(harvard_match);
    return found ? found.groups : null;
}

// GB/T 7714
function gbt_style(sentence) {
    const gbt_match = /^(\[(?<number>\d+)\]\s*)?(?<author>[\u4E00-\u9FFFA-Za-z\s.]+(,[\u4E00-\u9FFFA-Za-z\s.]+)*)\.\s*(?<title>[\u4E00-\u9FFFA-Za-z\s\p{S}\p{P}\d]+)\[(?<type>.+)\][\.(//)]\s*(?<publisher>[\u4E00-\u9FFFA-Za-z\s\P{S}\p{P}\d]+)\.?$/u
    const found = sentence.match(gbt_match);
    return found ? found.groups : null;
}

// G
function gbt_cn_style(sentence) {
    const gbt_match = /^([\u4E00-\u9FFFA-Za-z]+,?[\s\u4E00-\u9FFFA-Za-z]*)\.?\s*([\u4E00-\u9FFFA-Za-z\s\p{P}]+)\.\s*(?:\[[\u4E00-\u9FFFA-Za-z]+\]\s*)?[\u4E00-\u9FFFA-Za-z\s]*?[\.\[]*?(?:\bDissertation\b|\bThesis\b|\b毕业论文\b|\b学位论文\b)\b[\u4E00-\u9FFFA-Za-z\s\p{P}]*\b(\d{4})\.?$/u
    const found = sentence.match(gbt_match);
    return found ? found.groups : null;
}


// MLA
function mla_style(sentence) {
    const mla_match = /^(\[(?<number>\d+)\]\s*)?(?<author>[\u4E00-\u9FFFA-Za-z\s.]+(,[\u4E00-\u9FFFA-Za-z\s.&]+)*)\s*[“"](?<title>[\u4E00-\u9FFFA-Za-z\s\p{P}\p{S}\d]+)["”]\p{P}?\s*(?<publisher>[\u4E00-\u9FFFA-Za-z\s\P{S}\p{P}\d]+)\.?$/u
    const found = sentence.match(mla_match);
    return found ? found.groups : null;
}

// APA
function apa_style(sentence) {
    const apa_match = /^(\[(?<number>\d+)\]\s*)?(?<author>[\u4E00-\u9FFFA-Za-z\s.]+(,[\u4E00-\u9FFFA-Za-z\s.&]+)*)\p{P}?\s*\((?<year>[\d\sA-Za-z,]+)\)\.\s*(?<title>[\u4E00-\u9FFFA-Za-z\s\p{S}\d:-]+)\.\s*(?<publisher>[\u4E00-\u9FFFA-Za-z\s\P{S}\p{P}\d]+)\.?(?:\s*\bAccessed\s*(\d{1,2}\s\w{3}\.\s\d{4})\b)?$/u
    const found = sentence.match(apa_match);
    // console.log(found);
    return found ? found.groups : null;
}

// IEEE
function ieee_style(sentence) {
    const ieee_match = /^(\[(?<number>\d+)\]\s*)?(?<author>[\u4E00-\u9FFFA-Za-z\s.]+(,[\u4E00-\u9FFFA-Za-z\s.&]+)*)\p{P}\s*[“"](?<title>[\u4E00-\u9FFFA-Za-z\s\p{P}\p{S}\d]+)["”]\s*(?<publisher>[\u4E00-\u9FFFA-Za-z\s\P{S}\p{P}\d]+)\.?$/u;
    const found = sentence.match(ieee_match);
    // console.log(found);
    return found ? found.groups : null;
}

// ACM
function acm_style(sentence) {
    const acm_match = /^(\[(?<number>\d+)\]\s*)?(?<author>[\u4E00-\u9FFFA-Za-z\s.]+(,[\u4E00-\u9FFFA-Za-z\s.&]+)*)\.?\s*(?<title>[\u4E00-\u9FFFA-Za-z\s\p{P}\p{S}\d]+)\.\s*(?<publisher>[\u4E00-\u9FFFA-Za-z\s\P{S}\p{P}\d]+)\.?$/u;
    const found = sentence.match(acm_match);
    // console.log(found);
    return found ? found.groups : null;
}

/** citing style map */
const CiteStyles = {
    "APA": apa_style,
    "GB/T7714": gbt_style,
    "Harvard": harvard_style,
    "MLA": mla_style,
    "IEEE": ieee_style,
    "ACM": acm_style
};

module.exports = {
    CiteStyles: CiteStyles
}