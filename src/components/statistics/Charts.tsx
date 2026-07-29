import { useEffect, useRef } from 'react'
import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'

interface BaseChartProps {
  option: EChartsOption
  height?: string
  className?: string
  onChartClick?: (params: any) => void
}

export function BaseChart({ option, height = '400px', className, onChartClick }: BaseChartProps) {
  const chartRef = useRef<HTMLDivElement>(null)
  const chartInstance = useRef<echarts.ECharts | null>(null)

  useEffect(() => {
    if (!chartRef.current) return

    // 初始化图表
    if (!chartInstance.current) {
      chartInstance.current = echarts.init(chartRef.current)
    }

    // 设置配置项
    chartInstance.current.setOption(option, true)

    // 点击事件
    if (onChartClick) {
      chartInstance.current.on('click', onChartClick)
    }

    // 响应式
    const handleResize = () => {
      chartInstance.current?.resize()
    }
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
      if (chartInstance.current && !onChartClick) {
        chartInstance.current.off('click')
      }
    }
  }, [option, onChartClick])

  return <div ref={chartRef} style={{ height, width: '100%' }} className={className} />
}

// 折线图
interface LineChartProps {
  data: { name: string; value: number }[]
  title?: string
  color?: string
  height?: string
}

export function LineChart({ data, title, color = '#3b82f6', height = '400px' }: LineChartProps) {
  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'cross' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: data.map(d => d.name),
      boundaryGap: false
    },
    yAxis: {
      type: 'value'
    },
    series: [{
      name: title || '数值',
      type: 'line',
      data: data.map(d => d.value),
      smooth: true,
      itemStyle: { color },
      areaStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color },
          { offset: 1, color: `${color}20` }
        ])
      }
    }]
  }

  return <BaseChart option={option} height={height} />
}

// 柱状图
interface BarChartProps {
  data: { name: string; value: number }[]
  title?: string
  color?: string
  horizontal?: boolean
  height?: string
}

export function BarChart({ data, title, color = '#3b82f6', horizontal = false, height = '400px' }: BarChartProps) {
  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: horizontal ? 'value' : 'category',
      data: horizontal ? undefined : data.map(d => d.name)
    },
    yAxis: {
      type: horizontal ? 'category' : 'value',
      data: horizontal ? data.map(d => d.name) : undefined
    },
    series: [{
      name: title || '数值',
      type: 'bar',
      data: data.map(d => d.value),
      itemStyle: {
        color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
          { offset: 0, color: color },
          { offset: 1, color: `${color}80` }
        ])
      },
      barMaxWidth: 60
    }]
  }

  return <BaseChart option={option} height={height} />
}

// 饼图
interface PieChartProps {
  data: { name: string; value: number }[]
  title?: string
  height?: string
}

export function PieChart({ data, title, height = '400px' }: PieChartProps) {
  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      top: 'middle'
    },
    series: [{
      name: title || '分布',
      type: 'pie',
      radius: ['40%', '70%'],
      center: ['60%', '50%'],
      avoidLabelOverlap: false,
      itemStyle: {
        borderRadius: 10,
        borderColor: '#fff',
        borderWidth: 2
      },
      label: {
        show: false,
        position: 'center'
      },
      emphasis: {
        label: {
          show: true,
          fontSize: 20,
          fontWeight: 'bold'
        }
      },
      labelLine: {
        show: false
      },
      data: data.map(d => ({ name: d.name, value: d.value }))
    }]
  }

  return <BaseChart option={option} height={height} />
}

// 多折线图
interface MultiLineChartProps {
  series: { name: string; data: number[] }[]
  xAxisData: string[]
  title?: string
  height?: string
}

export function MultiLineChart({ series, xAxisData, title, height = '400px' }: MultiLineChartProps) {
  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']
  
  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: series.map(s => s.name),
      bottom: 0
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '15%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData
    },
    yAxis: {
      type: 'value'
    },
    series: series.map((s, index) => ({
      name: s.name,
      type: 'line',
      data: s.data,
      smooth: true,
      itemStyle: { color: colors[index % colors.length] }
    }))
  }

  return <BaseChart option={option} height={height} />
}

// 雷达图
interface RadarChartProps {
  data: { name: string; value: number[] }[]
  indicators: { name: string; max: number }[]
  title?: string
  height?: string
}

export function RadarChart({ data, indicators, title, height = '400px' }: RadarChartProps) {
  const colors = ['#3b82f6', '#10b981']
  
  const option: EChartsOption = {
    title: {
      text: title,
      left: 'center',
      textStyle: { fontSize: 16 }
    },
    tooltip: {},
    legend: {
      data: data.map(d => d.name),
      bottom: 0
    },
    radar: {
      indicator: indicators,
      center: ['50%', '55%'],
      radius: '65%'
    },
    series: [{
      type: 'radar',
      data: data.map((d, index) => ({
        name: d.name,
        value: d.value,
        itemStyle: { color: colors[index % colors.length] },
        areaStyle: { opacity: 0.3 }
      }))
    }]
  }

  return <BaseChart option={option} height={height} />
}

// 仪表盘
interface GaugeChartProps {
  value: number
  title?: string
  max?: number
  height?: string
}

export function GaugeChart({ value, title, max = 100, height = '300px' }: GaugeChartProps) {
  const option: EChartsOption = {
    series: [{
      type: 'gauge',
      progress: {
        show: true,
        width: 18
      },
      axisLine: {
        lineStyle: {
          width: 18
        }
      },
      axisTick: {
        show: false
      },
      splitLine: {
        length: 15,
        lineStyle: {
          width: 2,
          color: '#999'
        }
      },
      axisLabel: {
        distance: 25,
        fontSize: 12
      },
      pointer: {
        itemStyle: {
          color: '#3b82f6'
        }
      },
      detail: {
        valueAnimation: true,
        fontSize: 24,
        offsetCenter: [0, '45%'],
        formatter: '{value}'
      },
      data: [{ value, name: title || '' }],
      max
    } as any]
  }

  return <BaseChart option={option} height={height} />
}

// 环形进度图
interface ProgressRingProps {
  value: number
  total: number
  title: string
  color?: string
  height?: string
}

export function ProgressRing({ value, total, title, color = '#3b82f6', height = '200px' }: ProgressRingProps) {
  const percentage = total > 0 ? Math.round((value / total) * 100) : 0
  
  const option: EChartsOption = {
    series: [{
      type: 'pie',
      radius: ['65%', '85%'],
      avoidLabelOverlap: false,
      label: {
        show: true,
        position: 'center',
        formatter: `${percentage}%`,
        fontSize: 24,
        fontWeight: 'bold'
      },
      labelLine: {
        show: false
      },
      data: [
        { value, name: title, itemStyle: { color } },
        { value: total - value, name: '剩余', itemStyle: { color: '#e5e7eb' } }
      ]
    }],
    title: {
      text: title,
      left: 'center',
      top: 'bottom',
      textStyle: { fontSize: 14 }
    }
  }

  return <BaseChart option={option} height={height} />
}