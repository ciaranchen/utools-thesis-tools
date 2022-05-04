// 暂时不考虑使用机器学习方法。

String.prototype.trim = function () {
  return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

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
    cite: "GBT 7714",
    author: found[1],
    year: found[6],
    title: found[2],
    info: found[4],
    type: found[3],
  } : null;
  if (res && res.type === 'J') {
    res.publisher = found[5];
    if (res.publisher.match(/^arxiv/ig)) {
      res.publisher = 'ArXiv';
    }
  }
  if (res && res.type === 'C') {
    let conf_text = found[5];
    // 去除括号中的内容
    conf_text = conf_text.replace(/\(.*\)/g, '').replace(/\{.*\}/g, '').replace(/\[.*\]/g, '');
    // 去除一些经常出现，但是可能导致错误的名词
    conf_text = conf_text.replace(/\d{4}/g, '').replace('IEEE', '').replace('ACM', '').replace('Workshops', '');
    // console.log(conf_text);
    res.conference = conf_text.trim();
  }
  return res;
}

// MLA
function mla_style(sentence) {
  sentence = sentence.replace(/Vol\.\s*\d{4}\./g, '')
  const mla_match = /^(.*?)\.\s*[“"](.*?)["”]\s*((.*?)(([,\.]\s+\d{4})|(\(\d{4}\))).*?)$/i
  const found = sentence.match(mla_match);
  // console.log(found);
  if (!found) return null;
  let years = found[5].replace(/[^\d]/g, '');
  let res = {
    cite: "MLA",
    author: found[1],
    year: years,
    title: found[2],
    info: found[3],
  }
  if (found[4].match(/^arxiv/ig)) {
    res.publisher = 'ArXiv';
    return res;
  }
  // Journal or Conference
  let text = found[4];
  // 去除括号中的内容
  text = text.replace(/\(.*\)/g, '').replace(/\{.*\}/g, '').replace(/\[.*\]/g, '');
  // 取前半截
  text = text.split(/[,\.]/g)[0];
  // 过滤标点符号
  text = text.replace(/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\\\\[\]\{\}\;\"\'\,\<\.\>\/\?]/g, "");
  // 过滤数字
  text = text.replace(/(In\s)?\d{4}/ig, '').replace(/\d/g, '');
  // 去除一些经常出现，但是可能导致错误的名词
  text = text.replace(/\d{4}/g, '').replace('IEEE', '').replace('ACM', '').replace('Workshops', '');
  if (text.includes('onference')) {
    res.conference = text.trim();
    return res;
  }
  res.unknown = text.trim();
  return res;
}

// APA
function apa_style(sentence) {
  sentence = sentence.replace(/Vol\.\s*\d{4}\./g, '')
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
    res.publisher = 'ArXiv';
    return res;
  }
  // Journal or Conference
  let text = found[5];
  // 去除括号中的内容
  text = text.replace(/\(.*\)/g, '').replace(/\{.*\}/g, '').replace(/\[.*\]/g, '');
  // 取前半截
  text = text.split(/[,\.]/g)[0];
  // 过滤标点符号
  text = text.replace(/[\~\`\!\@\#\$\%\^\&\*\(\)\-\_\+\=\\\\[\]\{\}\;\"\'\,\<\.\>\/\?]/g, "");
  // 过滤数字
  text = text.replace(/(In\s)?\d{4}/ig, '').replace(/\d/g, '');
  // 去除一些经常出现，但是可能导致错误的名词
  text = text.replace(/\d{4}/g, '').replace('IEEE', '').replace('ACM', '').replace('Workshops', '');
  if (text.includes('onference')) {
    res.conference = text.trim();
    return res;
  }
  res.unknown = text.trim();
  return res;
}

function cite_parse(input) {
  let style_functions = [harvard_style, gbt_style, mla_style, apa_style];
  for (let i = 0; i < style_functions.length; i++) {
    let res = style_functions[i](input);
    if (res) {
      return res;
    }
  }
}

console.log("Testing regex pattern... from Zotero")
// Modern Language Association 9th edition
console.log(cite_parse("Yang, Bishan, et al. “Embedding Entities and Relations for Learning and Inference in Knowledge Bases.” ArXiv:1412.6575 [Cs], Aug. 2015. arXiv.org, http://arxiv.org/abs/1412.6575."))
// American Psychological Association 7th edition
console.log(cite_parse("Yang, B., Yih, W., He, X., Gao, J., & Deng, L. (2015). Embedding Entities and Relations for Learning and Inference in Knowledge Bases. ArXiv:1412.6575 [Cs]. http://arxiv.org/abs/1412.6575"))
// China National Standard GB/T 7714-1987 (numeric, 中文)
console.log(cite_parse("Yang B, Yih W, He X, 等. Embedding Entities and Relations for Learning and Inference in Knowledge Bases[J]. arXiv:1412.6575 [cs], 2015."));

// arXiv论文、期刊论文、会议论文
console.log("Testing regex pattern... from Google Scholar")
// GB/T 7714
console.log(cite_parse("Yang B, Yih W, He X, et al. Embedding entities and relations for learning and inference in knowledge bases[J]. arXiv preprint arXiv:1412.6575, 2014."))
console.log(cite_parse("Gourisetti S N G, Mylrea M, Patangia H. Cybersecurity vulnerability mitigation framework through empirical paradigm: Enhanced prioritized gap analysis[J]. Future Generation Computer Systems, 2020, 105: 410-431."))
console.log(cite_parse("Tao Y, Li M, Hu W. Research on Knowledge Graph Model for Cybersecurity Logs Based on Ontology and Classified Protection[C]//Journal of Physics: Conference Series. IOP Publishing, 2020, 1575(1): 012018."))
console.log(cite_parse("Yang S, Zhu W, Zhu Y. Residual encoder-decoder network for deep subspace clustering[C]//2020 IEEE International Conference on Image Processing (ICIP). IEEE, 2020: 2895-2899."))
console.log(cite_parse("Neumeyer L, Robbins B, Nair A, et al. S4: Distributed stream computing platform[C]//2010 IEEE International Conference on Data Mining Workshops. IEEE, 2010: 170-177."))
// MLA
console.log(cite_parse("Yang, Bishan, et al. \"Embedding entities and relations for learning and inference in knowledge bases.\" arXiv preprint arXiv:1412.6575 (2014)."))
console.log(cite_parse("Gourisetti, Sri Nikhil Gupta, Michael Mylrea, and Hirak Patangia. \"Cybersecurity vulnerability mitigation framework through empirical paradigm: Enhanced prioritized gap analysis.\" Future Generation Computer Systems 105 (2020): 410-431."))
console.log(cite_parse("Tao, Yuan, Moyan Li, and Wei Hu. \"Research on Knowledge Graph Model for Cybersecurity Logs Based on Ontology and Classified Protection.\" Journal of Physics: Conference Series. Vol. 1575. No. 1. IOP Publishing, 2020."))
console.log(cite_parse("Yang, Shuai, Wenqi Zhu, and Yuesheng Zhu. \"Residual encoder-decoder network for deep subspace clustering.\" 2020 IEEE International Conference on Image Processing (ICIP). IEEE, 2020."))
console.log(cite_parse("Neumeyer, Leonardo, et al. \"S4: Distributed stream computing platform.\" 2010 IEEE International Conference on Data Mining Workshops. IEEE, 2010."))
// APA
console.log(cite_parse("Yang, B., Yih, W. T., He, X., Gao, J., & Deng, L. (2014). Embedding entities and relations for learning and inference in knowledge bases. arXiv preprint arXiv:1412.6575."))
console.log(cite_parse("Gourisetti, S. N. G., Mylrea, M., & Patangia, H. (2020). Cybersecurity vulnerability mitigation framework through empirical paradigm: Enhanced prioritized gap analysis. Future Generation Computer Systems, 105, 410-431."))
console.log(cite_parse("Tao, Y., Li, M., & Hu, W. (2020, June). Research on Knowledge Graph Model for Cybersecurity Logs Based on Ontology and Classified Protection. In Journal of Physics: Conference Series (Vol. 1575, No. 1, p. 012018). IOP Publishing."))
console.log(cite_parse("Yang, S., Zhu, W., & Zhu, Y. (2020, October). Residual encoder-decoder network for deep subspace clustering. In 2020 IEEE International Conference on Image Processing (ICIP) (pp. 2895-2899). IEEE."))
console.log(cite_parse("Neumeyer, L., Robbins, B., Nair, A., & Kesari, A. (2010, December). S4: Distributed stream computing platform. In 2010 IEEE International Conference on Data Mining Workshops (pp. 170-177). IEEE."))


// user input as test case.
if (process.argv.length > 2) {
  console.log("Testing regex pattern .... from user input");
  let input = process.argv.slice(2).join(' ');
  console.log(cite_parse(input));
}
