import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import {
  Camera, Users, FileText, BarChart3, Clock, MapPin,
  Shield, FolderOpen, ArrowRight, Plus, Zap
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { usePatientStore } from '@/stores/patientStore'
import { useTherapyRecordStore } from '@/stores/therapyRecordStore'

// 快速开始治疗类型（按热度排列，巡查相机分类思路）
const QUICK_TYPES = [
  { key: 'physiotherapy', label: '物理治疗', color: 'bg-blue-100 text-blue-700 border-blue-200', emoji: '💪' },
  { key: 'traditional_chinese', label: '中医理疗', color: 'bg-amber-100 text-amber-700 border-amber-200', emoji: '🌿' },
  { key: 'massage', label: '推拿按摩', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', emoji: '🤲' },
  { key: 'rehabilitation', label: '康复训练', color: 'bg-teal-100 text-teal-700 border-teal-200', emoji: '🏃' },
  { key: 'acupuncture', label: '针灸', color: 'bg-purple-100 text-purple-700 border-purple-200', emoji: '💉' },
  { key: 'other', label: '更多…', color: 'bg-slate-100 text-slate-700 border-slate-200', emoji: '➕' },
]

// 真实性 5 道校验（今日水印相机思路 + 草料留痕）
const PROOF_CHECKS = [
  { icon: Clock, label: '时间防篡改', desc: '秒级时间戳', tint: 'text-blue-600' },
  { icon: MapPin, label: 'GPS 定位', desc: 'GCJ-02 坐标', tint: 'text-emerald-600' },
  { icon: Shield, label: '哈希完整性', desc: '像素级校验', tint: 'text-amber-600' },
  { icon: FolderOpen, label: '本地归档', desc: '多份备份', tint: 'text-purple-600' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const { fetchPatients, patients } = usePatientStore()
  const { fetchRecords, records } = useTherapyRecordStore()
  const [todayCount, setTodayCount] = useState(0)

  useEffect(() => {
    fetchPatients()
    fetchRecords()
  }, [fetchPatients, fetchRecords])

  useEffect(() => {
    const today = new Date().toDateString()
    const n = records.filter(r => new Date(r.created_at).toDateString() === today).length
    setTodayCount(n)
  }, [records])

  const now = new Date()
  const dateStr = `${now.getMonth() + 1}月${now.getDate()}日 · ${['周日','周一','周二','周三','周四','周五','周六'][now.getDay()]}`

  // 最新 3 条记录（草料：一拍即一记录）
  const recent = [...records].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 3)

  const recentPatients = [...patients].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 4)

  return (
    <div className="space-y-4 md:space-y-6">
      {/* 顶部今日概览卡片（参考打卡类 App） */}
      <section>
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-600 via-teal-500 to-emerald-500 text-white p-5 shadow-lg">
          <div className="absolute -right-10 -top-10 w-48 h-48 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -right-16 top-20 w-40 h-40 rounded-full bg-white/10 blur-2xl" />

          <div className="relative">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[13px] opacity-90">{dateStr}</div>
                <div className="text-xl md:text-2xl font-semibold mt-1 tracking-wide">治疗师工作首页</div>
              </div>
              <Badge className="bg-white/15 border-white/25 text-white backdrop-blur">
                <Zap className="w-3 h-3 mr-1" /> 离线可用
              </Badge>
            </div>

            {/* 三个核心指标 */}
            <div className="mt-5 grid grid-cols-3 gap-2">
              <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                <div className="text-[11px] opacity-90">今日记录</div>
                <div className="text-2xl md:text-3xl font-bold mt-1">{todayCount}</div>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                <div className="text-[11px] opacity-90">客户总数</div>
                <div className="text-2xl md:text-3xl font-bold mt-1">{patients.length}</div>
              </div>
              <div className="rounded-2xl bg-white/15 backdrop-blur p-3">
                <div className="text-[11px] opacity-90">累计记录</div>
                <div className="text-2xl md:text-3xl font-bold mt-1">{records.length}</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 中心 CTA：拍照记录（参考草料留痕） */}
      <section>
        <Card className="rounded-2xl border-dashed border-teal-200 bg-gradient-to-r from-white to-teal-50/50 overflow-hidden">
          <CardContent className="p-4 md:p-5 flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Badge className="bg-teal-50 text-teal-700 border-teal-200">一拍即一记录</Badge>
                <span className="text-xs text-slate-400">借鉴：草料留痕相机</span>
              </div>
              <h2 className="mt-2 text-lg md:text-xl font-semibold">拍一张照，就是一条治疗记录</h2>
              <p className="mt-1 text-sm text-slate-500 leading-relaxed">
                自动叠加 6 要素水印：<span className="font-medium text-slate-700">时间 + 地点 + 治疗师 + 客户名 + 治疗类型 + 专属追溯二维码</span>
              </p>
            </div>
            <div className="w-full md:w-auto">
              <Button
                size="lg"
                onClick={() => navigate('/records/new')}
                className="w-full md:w-auto min-h-[52px] px-7 rounded-2xl bg-teal-600 hover:bg-teal-700 text-[15px] font-semibold shadow-lg shadow-teal-600/20"
              >
                <Camera className="w-5 h-5 mr-2" /> 立即拍照记录
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 快速分类（巡查相机的文件夹/分类思路） */}
      <section>
        <div className="flex items-center justify-between px-1">
          <h3 className="text-[15px] font-semibold text-slate-800">快速分类</h3>
          <Link to="/records/new" className="text-xs text-teal-600 flex items-center gap-0.5">
            查看全部 <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="mt-3 grid grid-cols-3 md:grid-cols-6 gap-2">
          {QUICK_TYPES.map(t => (
            <button
              key={t.key}
              onClick={() => navigate(`/records/new?type=${t.key}`)}
              className={`group rounded-2xl border p-3 text-center transition-all active:scale-95 ${t.color}`}
            >
              <div className="text-2xl mb-1">{t.emoji}</div>
              <div className="text-[12px] font-medium">{t.label}</div>
            </button>
          ))}
        </div>
      </section>

      {/* 真实性存证能力展示 */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
        {PROOF_CHECKS.map(c => (
          <div key={c.label} className="rounded-2xl bg-white border border-slate-200 p-3 md:p-4">
            <c.icon className={`w-5 h-5 md:w-6 md:h-6 ${c.tint}`} />
            <div className="mt-2 text-sm font-semibold text-slate-800">{c.label}</div>
            <div className="text-[11px] text-slate-500 mt-0.5">{c.desc}</div>
          </div>
        ))}
      </section>

      {/* 两个入口卡 */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <Link to="/patients" className="group">
          <Card className="h-full rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 md:p-5 flex items-start gap-3 md:gap-4">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Users className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-semibold">客户管理</h3>
                  <Plus className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
                <p className="text-xs md:text-sm text-slate-500 mt-1">新建客户 / 查档案 / 按文件夹分类（巡查相机思路）</p>
                <div className="mt-2 text-xs text-slate-400">{patients.length} 位客户</div>
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link to="/statistics" className="group">
          <Card className="h-full rounded-2xl hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 md:p-5 flex items-start gap-3 md:gap-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <BarChart3 className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="text-base md:text-lg font-semibold">统计归档</h3>
                  <FileText className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
                <p className="text-xs md:text-sm text-slate-500 mt-1">Excel 导出 / 趋势图 / 3-2-1 备份（Immich 思路）</p>
                <div className="mt-2 text-xs text-slate-400">{records.length} 条记录可统计</div>
              </div>
            </CardContent>
          </Card>
        </Link>
      </section>

      {/* 最近客户 */}
      {recentPatients.length > 0 && (
        <section>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[15px] font-semibold text-slate-800">最近客户</h3>
            <Link to="/patients" className="text-xs text-teal-600 flex items-center gap-0.5">
              全部客户 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recentPatients.map(p => (
              <Link
                key={p.id}
                to={`/patients/${p.id}`}
                className="flex items-center gap-3 rounded-2xl bg-white border border-slate-200 px-4 py-3 hover:bg-slate-50 active:bg-slate-100 transition-colors"
              >
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center font-semibold shrink-0">
                  {p.name.slice(0, 1)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-slate-800 truncate">{p.name}</div>
                  <div className="text-xs text-slate-500 truncate">
                    {p.medical_record_number || '—'} · {p.diagnosis?.slice(0, 20) || '无诊断信息'}
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => { e.preventDefault(); navigate(`/records/new?patientId=${p.id}`) }}
                  className="shrink-0 h-8 text-xs rounded-lg border-teal-200 text-teal-700 hover:bg-teal-50"
                >
                  <Camera className="w-3.5 h-3.5 mr-1" /> 拍照
                </Button>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 最近记录 */}
      {recent.length > 0 && (
        <section>
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[15px] font-semibold text-slate-800">最近记录</h3>
            <Link to="/records" className="text-xs text-teal-600 flex items-center gap-0.5">
              全部记录 <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="mt-3 space-y-2">
            {recent.map(r => (
              <Link
                key={r.id}
                to={`/records/${r.id}`}
                className="block rounded-2xl bg-white border border-slate-200 p-4 hover:shadow-sm transition-shadow"
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 text-white flex items-center justify-center shrink-0">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-800">#{r.id}</span>
                      <Badge className="text-[10px] px-1.5 h-4">
                        {Object.entries({
                          physiotherapy: '物理治疗',
                          occupational_therapy: '作业治疗',
                          speech_therapy: '言语治疗',
                          psychotherapy: '心理治疗',
                          traditional_chinese: '中医',
                          massage: '按摩',
                          acupuncture: '针灸',
                          rehabilitation: '康复',
                          other: '其他',
                        }).find(([k]) => k === r.treatment_type)?.[1] || '其他'}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-slate-600 line-clamp-2">{r.content?.slice(0, 60) || '（无文字描述）'}</p>
                    <div className="mt-1 text-xs text-slate-400">
                      {new Date(r.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* 底部空状态提示（无任何数据时） */}
      {patients.length === 0 && records.length === 0 && (
        <section className="rounded-3xl bg-white border border-dashed border-slate-300 p-8 text-center">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-teal-50 text-teal-500 flex items-center justify-center">
            <Camera className="w-8 h-8" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-800">还没有记录</h3>
          <p className="mt-1 text-sm text-slate-500 max-w-sm mx-auto">
            先创建一个客户档案，然后点击「立即拍照记录」开始第一条治疗记录
          </p>
          <div className="mt-5 flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => navigate('/records/new')}>
              <Camera className="w-4 h-4 mr-2" /> 立即拍照记录
            </Button>
            <Button variant="outline" onClick={() => navigate('/patients')}>
              <Users className="w-4 h-4 mr-2" /> 新建客户
            </Button>
          </div>
        </section>
      )}
    </div>
  )
}
