# napcat-plugin-ssqq

这是 Stapxs QQ Lite 项目的 NapCat 插件封装（`napcat-plugin-ssqq`），用于将主应用的 Web UI 打包为 NapCat 插件可部署的静态资源包，并提供插件打包（zip）脚本与 NapCat 特殊构建流程。

## 构建

### 常规构建

```bash
# 生成 web 前端到 dist/
yarn build
```

生成后的静态资源位于 `dist/`。

### 构建 NapCat 插件包

```bash
# 生成 NapCat 插件包到 napcat-plugin-ssqq.zip
yarn build:zip
```
