import { useState, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  Calendar,
  Clock,
  MapPin,
  FileText
} from 'lucide-react'
import type { TreatmentRecord, Attachment } from '@/types/database'
import { format } from 'date-fns'
import { zhCN } from 'date-fns/locale'

interface TimelineEvent {
  id: number
  date: Date
  title: string
  description?: string
  type: 'treatment' | 'attachment' | 'milestone'
  data: TreatmentRecord | Attachment
  attachments?: Attachment[]
}

interface TreatmentTimelineProps {
  records: TreatmentRecord[]
  attachments?: Record<number, Attachment[]>
  onEventClick?: (event: TimelineEvent) => void
  height?: string
}

const treatmentTypeMap: Record<string, string> = {
  physiotherapy: '物理治疗',
  occupational_therapy: '作业治疗',
  speech_therapy: '言语治疗',
  psychotherapy: '心理治疗',
  traditional_chinese: '中医治疗',
  massage: '按摩',
  acupuncture: '针灸',
  rehabilitation: '康复治疗',
  other: '其他'
}

const statusColorMap: Record<string, string> = {
  draft: 'bg-gray-500',
  completed: 'bg-green-500',
  reviewed: 'bg-blue-500',
  archived: 'bg-purple-500'
}

const statusTextMap: Record<string, string> = {
  draft: '草稿',
  completed: '已完成',
  reviewed: '已审核',
  archived: '已归档'
}

export function TreatmentTimeline({ 
  records, 
  attachments = {}, 
  onEventClick,
  height = '500px' 
}: TreatmentTimelineProps) {
  const [zoom, setZoom] = useState(1)
  const timelineRef = useRef<HTMLDivElement>(null)

  // 按日期排序记录
  const sortedRecords = [...records].sort((a, b) => 
    new Date(b.treatment_date).getTime() - new Date(a.treatment_date).getTime()
  )

  // 创建时间线事件
  const events: TimelineEvent[] = sortedRecords.map(record => ({
    id: record.id,
    date: new Date(record.treatment_date),
    title: treatmentTypeMap[record.treatment_type] || record.treatment_type,
    description: record.content,
    type: 'treatment' as const,
    data: record,
    attachments: attachments[record.id] || []
  }))

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.2, 2))
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.2, 0.5))
  const handleScroll = (direction: 'left' | 'right') => {
    if (timelineRef.current) {
      const scrollAmount = direction === 'left' ? -200 : 200
      timelineRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' })
    }
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            治疗时间线
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => handleScroll('left')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={handleZoomOut}>
              <ZoomOut className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <Button variant="outline" size="sm" onClick={handleZoomIn}>
              <ZoomIn className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={() => handleScroll('right')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div 
          ref={timelineRef}
          className="relative overflow-x-auto overflow-y-hidden"
          style={{ height }}
        >
          {events.length === 0 ? (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              暂无治疗记录
            </div>
          ) : (
            <div 
              className="relative h-full"
              style={{ 
                minWidth: `${events.length * 300 * zoom}px`,
                paddingLeft: '50px'
              }}
            >
              {/* 时间线轴 */}
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-primary transform -translate-y-1/2" />
              
              {/* 事件节点 */}
              {events.map((event, index) => (
                <div
                  key={event.id}
                  className="absolute top-1/2 transform -translate-y-1/2"
                  style={{ 
                    left: `${index * 300 * zoom + 50}px`,
                    width: `${250 * zoom}px`
                  }}
                >
                  {/* 时间线节点 */}
                  <div className={`absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full border-2 border-primary bg-background z-10`} />
                  
                  {/* 事件卡片 */}
                  <div 
                    className={`ml-4 bg-card border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer ${index % 2 === 0 ? 'translate-y-[-70px]' : 'translate-y-[20px]'}`}
                    onClick={() => onEventClick?.(event)}
                  >
                    {/* 日期 */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                      <Calendar className="h-3 w-3" />
                      {format(event.date, 'yyyy年MM月dd日', { locale: zhCN })}
                      {event.data instanceof Object && 'treatment_time' in event.data && event.data.treatment_time && (
                        <>
                          <Clock className="h-3 w-3 ml-2" />
                          {event.data.treatment_time}
                        </>
                      )}
                    </div>
                    
                    {/* 标题 */}
                    <div className="font-medium mb-2">{event.title}</div>
                    
                    {/* 状态 */}
                    {event.data instanceof Object && 'status' in event.data && (
                      <Badge className={`${statusColorMap[event.data.status]} text-white mb-2`}>
                        {statusTextMap[event.data.status]}
                      </Badge>
                    )}
                    
                    {/* 描述 */}
                    {event.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                        {event.description}
                      </p>
                    )}
                    
                    {/* 附件数量 */}
                    {event.attachments && event.attachments.length > 0 && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <FileText className="h-3 w-3" />
                        {event.attachments.length} 个附件
                      </div>
                    )}
                    
                    {/* 地点 */}
                    {event.data instanceof Object && 'location' in event.data && event.data.location && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                        <MapPin className="h-3 w-3" />
                        {event.data.location}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// 简化版时间线（垂直布局）
interface VerticalTimelineProps {
  records: TreatmentRecord[]
  attachments?: Record<number, Attachment[]>
  onRecordClick?: (record: TreatmentRecord) => void
  maxItems?: number
}

export function VerticalTimeline({ 
  records, 
  attachments = {}, 
  onRecordClick,
  maxItems 
}: VerticalTimelineProps) {
  const displayRecords = maxItems ? records.slice(0, maxItems) : records

  return (
    <div className="relative">
      {/* 时间线轴 */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
      
      {/* 事件列表 */}
      <div className="space-y-6 pl-10">
        {displayRecords.map((record) => (
          <div key={record.id} className="relative">
            {/* 时间线节点 */}
            <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-primary" />
            
            {/* 事件卡片 */}
            <Card 
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => onRecordClick?.(record)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {format(new Date(record.treatment_date), 'yyyy年MM月dd日', { locale: zhCN })}
                      {record.treatment_time && (
                        <>
                          <Clock className="h-3 w-3 ml-2" />
                          {record.treatment_time}
                        </>
                      )}
                    </div>
                    <div className="font-medium mt-1">
                      {treatmentTypeMap[record.treatment_type] || record.treatment_type}
                    </div>
                  </div>
                  <Badge className={`${statusColorMap[record.status]} text-white`}>
                    {statusTextMap[record.status]}
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {record.content}
                </p>
                
                {/* 附件预览 */}
                {attachments[record.id] && attachments[record.id].length > 0 && (
                  <div className="flex gap-2 mt-3 overflow-x-auto">
                    {attachments[record.id].slice(0, 3).map(att => (
                      <div 
                        key={att.id} 
                        className="flex-shrink-0 w-16 h-16 rounded border bg-muted flex items-center justify-center"
                      >
                        {att.file_type === 'image' ? (
                          <img 
                            src={att.file_path} 
                            alt={att.file_name}
                            className="w-full h-full object-cover rounded"
                          />
                        ) : (
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                    ))}
                    {attachments[record.id].length > 3 && (
                      <div className="flex-shrink-0 w-16 h-16 rounded border bg-muted flex items-center justify-center">
                        <span className="text-xs text-muted-foreground">
                          +{attachments[record.id].length - 3}
                        </span>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        ))}
        
        {records.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            暂无治疗记录
          </div>
        )}
      </div>
    </div>
  )
}