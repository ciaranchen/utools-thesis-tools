// @ts-check
import { Ccf } from "./src/ccf"
import { citeUnknown, CiteStyled } from "./src/cite"
import { letpub } from "./src/letpub"
import { pdf } from "./src/pdf"
import { zotero } from "./src/zotero"

window.exports = {
    "ccf": { mode: "list", args: new Ccf("en") },
    "ccf_cn": { mode: "list", args: new Ccf("cn") },
    "letpub": { mode: "list", args: letpub },
    "pdf_replace": { mode: "none", args: pdf },
    "pdf_replace_linux": { mode: "none", args: pdf },
    "zotero_search": { mode: "list", args: zotero },
    "unknown_cite": { mode: "list", args: citeUnknown },
    "apa_cite": { mode: "list", args: new CiteStyled("APA") },
    "gbt_cite": { mode: "list", args: new CiteStyled("GB/T7714") },
    "mla_cite": { mode: "list", args: new CiteStyled("MLA") },
};