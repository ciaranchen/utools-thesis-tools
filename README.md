# uTools_thesisTools 学术工具集

一些解决在查看论文中可能产生的诡异需求的工具。

## Letpub

在Letpub网站查询期刊的中科院分区情况。

使用方法：在uTools中使用关键字"letpub"。

## CCF查询

查询期刊/会议在CCF 2019年发布的目录中的分区情况。

使用方法：在uTools中使用关键字"ccf"。

使用的文件参考： <https://github.com/magichan/CCF-Recommended-Catalog-2019>

## pdf换行替换

从pdf中复制时，常常句子被换行分开了。

这个功能可以替换全半角、换行；在英文的情况下，替换连字符。

使用方法：

1. 从pdf正常复制,呼出uTools菜单。
2. 选择"替换pdf换行"
3. 正常粘贴

<!-- TODO: 处理uTools插件中来自应用的情况。 -->

## 解析引用格式

基于正则表达式拆解论文的引用格式。可能不准确，但是在大多数情况下（从谷歌学术中拷贝的引用）都能用。

测试用例可以参见[本项目下的regexp.js文件](https://ciaranchen.coding.net/public/dotfiles/utools_thesis_tools/git/files/master/regexp_test.js)

使用方法：

1. 复制论文的引用,呼出uTools菜单。
2. 如有识别：“APA引用”、“MLA引用”、“GB/T 7714引用”
3. 如无识别：“未知引用”
4. 选择内容以复制。

## Zotero-Search

连接Zotero数据库查询Zotero中的文献资料。（标题匹配）

使用方法：

使用方法：在uTools中使用关键字"zotero"或者"zs"。

## 建议

您的建议非常宝贵。如果您有任何新功能或者改进的建议，可以在uTools的评论区留言，我会尽力回复。

代码目前开源在：[coding.net](https://ciaranchen.coding.net/public/dotfiles/utools_thesis_tools/git/files)

## TODO

- 知网查是否为中科院核心
- EngineVillage查是否为EI
- 常见引用格式转换。
- Zotero-Search 搜索线上可同步的内容
- 从引用文献直接向 Zotero 添加内容
