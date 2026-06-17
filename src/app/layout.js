import './globals.css';

export const metadata = {
  title: '京东客服内部知识库 MVP',
  description: '纯静态、免登录、localStorage 演示持久化的客服话术与 SOP 检索系统'
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-paper text-ink antialiased">
        {/*
          TODO: 二期登录拦截/权限控制
          位置 ①：未来如果要接入登录页面，可以在这里包一层 AuthProvider。
          注意：当前 MVP 按要求完全免登录，不使用 Middleware，不做服务端校验。
          如果二期要做真正权限，请新增 middleware.js 或前端路由守卫，
          并把“管理员 / 普通客服”的角色信息注入到这里。
        */}
        {children}
      </body>
    </html>
  );
}
