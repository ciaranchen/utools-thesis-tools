// 暂时不考虑使用机器学习方法。

String.prototype.trim = function () {
  return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
}

// Harvard style
function harvard_style(sentence) {
  const harvard_match = /(.*),\s?(\d{4})\.(.*?)\.(.*)/i
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
  const gbt_match = /(.*?)\.(.*?)\[(.)\]\.(.*,\s?(\d{4}).*)$/i
  const found = sentence.match(gbt_match);
  // console.log(found);
  return found ? {
    author: found[1],
    year: found[5],
    title: found[2],
    info: found[4],
    type: found[3]
  } : null;
}

// MLA
function mla_style(sentence) {
  const mla_match = /(.*?)\.\s?"(.*?)"\s?(.*?\((\d{4})\).*?)$/i
  const found = sentence.match(mla_match);
  // console.log(found);
  return found ? {
    author: found[1],
    year: found[4],
    title: found[2],
    info: found[3],
  } : null;
}

// APA
function apa_style(sentence) {
  const apa_match = /(.*?)\.\s?\((\d{4})\)\.\s?(.*?)\.\s?(.*)$/i
  const found = sentence.match(apa_match);
  // console.log(found);
  return found ? {
    author: found[1],
    year: found[2],
    title: found[3],
    info: found[4],
  } : null;
}

function cite_parse(input) {
  style_functions = [harvard_style, gbt_style, mla_style, apa_style];
  for (let i = 0; i < style_functions.length; i++) {
    let res = style_functions[i](input);

    if (res) {
      return res;
    }
  }
}

console.log("Testing regex pattern... from Zotero")
// American Psychological Association 7th edition
console.log(cite_parse("Yang, B., Yih, W., He, X., Gao, J., & Deng, L. (2015). Embedding Entities and Relations for Learning and Inference in Knowledge Bases. ArXiv:1412.6575 [Cs]. http://arxiv.org/abs/1412.6575"))
// Modern Language Association 9th edition
// TODO: fix this.
// console.log(cite_parse("Yang, Bishan, et al. “Embedding Entities and Relations for Learning and Inference in Knowledge Bases.” ArXiv:1412.6575 [Cs], Aug. 2015. arXiv.org, http://arxiv.org/abs/1412.6575."))


console.log("Testing regex pattern... from Google Scholar")
// GB/T 7714
console.log(cite_parse("Yang B, Yih W, He X, et al. Embedding entities and relations for learning and inference in knowledge bases[J]. arXiv preprint arXiv:1412.6575, 2014."))
// MLA
console.log(cite_parse("Yang, Bishan, et al. \"Embedding entities and relations for learning and inference in knowledge bases.\" arXiv preprint arXiv:1412.6575 (2014)."))
// APA
console.log(cite_parse("Yang, B., Yih, W. T., He, X., Gao, J., & Deng, L. (2014). Embedding entities and relations for learning and inference in knowledge bases. arXiv preprint arXiv:1412.6575."))

// user input as test case.
if (process.argv.length > 2) {
  console.log("Testing regex pattern .... from user input");
  let input = process.argv.slice(2).join(' ');
  console.log(cite_parse(input));
}
