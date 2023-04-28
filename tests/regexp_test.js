// 暂时不考虑使用机器学习方法。
const cite = require('../src/cite_parse');

function cite_parse(input) {
    let infos = [];
    for (const name in cite.CiteStyles) {
        // console.log(name)
        const res = cite.CiteStyles[name](input);
        if (res) {
            infos.push({
                title: name + " 引用格式",
                description: res.title,
                res: res,
                cite: "unknown"
            });
        }
    }
    return infos
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
// Harvard
console.log(cite_parse("Kandel, E., 2012. The age of insight: The quest to understand the unconscious in art, mind, and brain, from Vienna 1900 to the present. Random House."));
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
