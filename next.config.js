/** @type {import('next').NextConfig} */
const nextConfig = {
  // 核心白嫖配置：Next.js 14 使用 output: 'export' 后，
  // 执行 npm run build 会直接在根目录生成 out 纯静态文件夹。
  output: 'export',

  // 纯静态部署更稳：图片 URL 使用普通 img 标签展示，不走 Next 图片优化服务。
  images: {
    unoptimized: true
  },

  // 拖拽到 Netlify / GitHub Pages 时，避免严格模式下重复执行演示逻辑带来的困惑。
  reactStrictMode: true
};

module.exports = nextConfig;
