# 我愿api

我愿api 是世于我愿的模型接入与使用工作台。品牌叙事是「练习造世界」。

本分支基于上游 Sub2API `060d0160417782cd962a0c7f460f6cd4565d4916`（v0.2.17），保留原有 API、账户、密钥、计费与数据结构。

## 设计与动效

- 冷白、墨黑与电光蓝 `#2354f4`。
- 首页、认证页面、控制台、公开页面、浏览器图标使用统一标志。
- 原生 WebGL 三维拱门：六层管状几何体、法线光照与高光、520 个沿纵深流动的粒子、透视地面、鼠标惯性视角和滚动镜头；标题流光、卡片微倾斜、磁吸按钮、逐字滚动显影与阅读进度。
- 支持暂停/开启三维动效。遵循减少动态效果设置，触屏减少粒子和像素密度；离开视口或标签页隐藏时停止渲染；离开页面释放 GPU 资源。WebGL 不可用或上下文丢失时显示静态拱门，恢复后重建。
- Logo 原始图由品牌所有者提供，使用 imagegen 提取为透明图标。品牌素材不随上游项目的开源许可授予商标或品牌使用权。

## 构建

在具备足够内存的工作站构建，勿在 2GB 生产服务器上编译。

```sh
cd frontend
npx pnpm@9.15.9 install --frozen-lockfile
npx pnpm@9.15.9 build
cd ..
docker build -f Dockerfile.woyuan -t woyuan-api:0.2.17-woyuan.2 .
docker save woyuan-api:0.2.17-woyuan.2 | gzip > woyuan-api-image.tar.gz
```

`Dockerfile.woyuan` 将本地构建的前端嵌入 Linux/amd64 后端，并继承固定摘要的上游运行时。若镜像仓库无法访问，可以在生产机 `docker save` 导出现有上游镜像，在本地载入并指定 `--build-arg BASE_IMAGE=<本地镜像标签>`。

服务器载入镜像后，将 Compose 中应用服务的 `image` 改为该固定版本，仅重建应用服务。部署前应备份 PostgreSQL、应用 data、Compose 与环境文件，保留原镜像供回滚。不要把环境文件、数据库或任何凭据提交到源码仓库。

后台站点设置使用：名称 `我愿api`、Logo `/brand/logo.png`、副标题 `连接智能，让创造发生。`。

## 上游与许可

后端和既有功能来自 [Wei-Shaw/sub2api](https://github.com/Wei-Shaw/sub2api)。原有许可与版权声明见 [LICENSE](LICENSE) 及上游文档；本分支不代表上游作者的运营或商业授权。
