import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Users, Calendar, Shield } from 'lucide-react'

const features = [
  {
    icon: FileText,
    title: '治疗记录',
    description: '支持文字、照片、视频等多种记录方式，完整记录治疗过程',
  },
  {
    icon: Shield,
    title: '真实性证明',
    description: '拍照水印、数字签名、时间戳认证，确保记录真实性',
  },
  {
    icon: Users,
    title: '患者管理',
    description: '便捷的患者信息管理，快速检索和档案建立',
  },
  {
    icon: Calendar,
    title: '统计分析',
    description: '可视化数据统计，智能分析治疗效果',
  },
]

export default function HomePage() {
  return (
    <div className="space-y-6 md:space-y-8">
      {/* Hero Section */}
      <section className="text-center space-y-3 md:space-y-4 py-6 md:py-12">
        <h1 className="text-2xl md:text-4xl font-bold tracking-tight">
          专业治疗记录管理系统
        </h1>
        <p className="text-base md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
          为治疗师提供专业、可靠的治疗记录解决方案，确保记录的真实性和完整性
        </p>
        <div className="flex flex-col sm:flex-row justify-center gap-3 md:gap-4 px-4">
          <Link to="/register" className="w-full sm:w-auto">
            <Button size="lg" className="w-full min-h-[48px]">开始使用</Button>
          </Link>
          <Link to="/login" className="w-full sm:w-auto">
            <Button variant="outline" size="lg" className="w-full min-h-[48px]">
              登录系统
            </Button>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {features.map((feature) => (
          <Card key={feature.title} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <feature.icon className="h-8 w-8 md:h-10 md:w-10 text-primary mb-2" />
              <CardTitle className="text-base md:text-lg">{feature.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-sm">{feature.description}</CardDescription>
            </CardContent>
          </Card>
        ))}
      </section>

      {/* CTA Section */}
      <section className="bg-muted rounded-lg p-4 md:p-8 text-center">
        <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">立即开始使用</h2>
        <p className="text-sm md:text-base text-muted-foreground mb-4 md:mb-6">
          注册账户，体验专业的治疗记录管理服务
        </p>
        <Link to="/register">
          <Button size="lg" className="min-h-[48px]">免费注册</Button>
        </Link>
      </section>
    </div>
  )
}