// @ts-check
/**
 * Apply `string.replace` in sequences
 * @param {string} str 
 * @param {[string | RegExp, string][]} rules 
 * @returns {string}
 */
function rs(str, rules) {
    for (const v of rules) {
        str = str.replace(v[0], v[1]);
    }
    return str;
}
/** LanguageMap */
const LM = { "中文": 0, "英文": 1, "中英文": 2 };
/** LanguageMapReverse */
const LMR = ["中文", "英文", "中英文"];
/** PublisherMap */
const PM = { "ACM": "$A", "Elsevier": "$E", "IEEE": "$I", "Springer": "$S" };
/** PublisherMapReverse */
const PMR = { "$A": "ACM", "$E": "Elsevier", "$I": "IEEE", "$S": "Springer" };
/** TierMap */
const TM = { "A": 0, "B": 1, "C": 2, "T1": 1, "T2": 2, "T3": 3 };

module.exports = { rs, LM, LMR, PM, PMR, TM };