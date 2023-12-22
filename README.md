## description
personal blog, accessible through [link](https://cliff0412.github.io/)

the blog is buit by [hexo](https://hexo.io/zh-cn/docs/)

## dev deps
```
npm install -g hexo-cli
hexo -h
```

## run
```
npx hexo <command>
hexo new [layout] <title> ## e.g hexo new page --path about/me "About me
hexo generate ## 生成静态文件
hexo publish [layout] <filename>
hexo server
hexo clean && hexo deploy
```
## project structure
```
.
├── _config.yml
├── package.json
├── scaffolds   // 模版文件夹。新建文章时，Hexo 会根据 scaffold 来建立文件。
├── source  // 资源文件夹, 除 _posts 文件夹之外，开头命名为 _ (下划线)的文件 / 文件夹和隐藏的文件将会被忽略。Markdown 和 HTML 文件会被解析并放到 public 文件夹，而其他文件会被拷贝过去
|   ├── _drafts
|   └── _posts
└── themes // Hexo 会根据主题来生成静态页面
```