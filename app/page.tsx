import Link from 'next/link';
import { Button } from '@/app/_components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/app/_components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* 顶部导航 */}
      <header className="bg-primary text-primary-foreground py-4 px-6 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold">学生心理咨询与评估系统</h1>
          <div className="space-x-2">
            <Link href="/auth/login">
              <Button variant="outline" className="bg-white text-primary hover:bg-gray-100">登录</Button>
            </Link>
            <Link href="/auth/register">
              <Button variant="outline" className="bg-white text-primary hover:bg-gray-100">注册</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* 主要内容 */}
      <main className="flex-grow container mx-auto py-8 px-4">
        <section className="mb-12 text-center">
          <h2 className="text-3xl font-bold mb-4">欢迎使用学生心理咨询与评估系统</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            我们致力于为学生提供专业的心理健康评估、咨询和资源服务，帮助您保持良好的心理状态。
          </p>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <CardTitle>心理健康评估</CardTitle>
              <CardDescription>完成专业的心理健康评估问卷</CardDescription>
            </CardHeader>
            <CardContent>
              <p>通过科学的评估工具，了解自己的心理健康状况，获取专业的分析和建议。</p>
            </CardContent>
            <CardFooter>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full">开始评估</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>心理咨询服务</CardTitle>
              <CardDescription>获取专业的心理咨询和指导</CardDescription>
            </CardHeader>
            <CardContent>
              <p>我们提供专业的心理咨询服务，帮助您解决学习、生活和情感方面的困扰。</p>
            </CardContent>
            <CardFooter>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full">预约咨询</Button>
              </Link>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>心理健康资源</CardTitle>
              <CardDescription>获取丰富的心理健康资源</CardDescription>
            </CardHeader>
            <CardContent>
              <p>浏览和学习丰富的心理健康知识，包括文章、视频和自助工具。</p>
            </CardContent>
            <CardFooter>
              <Link href="/auth/login" className="w-full">
                <Button className="w-full">浏览资源</Button>
              </Link>
            </CardFooter>
          </Card>
        </section>
      </main>

      {/* 页脚 */}
      <footer className="bg-muted py-6 px-4">
        <div className="container mx-auto text-center text-muted-foreground">
          <p>© {new Date().getFullYear()} 学生心理咨询与评估系统 | 版权所有</p>
        </div>
      </footer>
    </div>
  );
}