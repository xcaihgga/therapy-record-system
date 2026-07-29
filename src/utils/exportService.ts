import jsPDF from 'jspdf'
import * as XLSX from 'xlsx'
import type { TreatmentRecord } from '@/types/database'
import type { 
  StatisticsOverview, 
  TreatmentCountStatistics, 
  PatientDistributionStatistics
} from '@/api/statistics'

// 治疗类型中文映射
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

// 性别中文映射
const genderMap: Record<string, string> = {
  male: '男',
  female: '女',
  other: '其他'
}

// PDF导出配置
export interface PDFExportOptions {
  title: string
  subtitle?: string
  author?: string
  includeWatermark?: boolean
  watermarkText?: string
}

// Excel导出配置
export interface ExcelExportOptions {
  filename: string
  sheets: {
    name: string
    data: any[]
  }[]
}

// JSON导出配置
export interface JSONExportOptions {
  filename: string
  data: any
  pretty?: boolean
}

// 导出服务
export const exportService = {
  // 导出为PDF
  exportToPDF: async (
    records: TreatmentRecord[],
    options: PDFExportOptions
  ): Promise<void> => {
    const doc = new jsPDF()
    
    // 设置字体大小
    doc.setFontSize(20)
    doc.text(options.title, 105, 20, { align: 'center' })
    
    if (options.subtitle) {
      doc.setFontSize(12)
      doc.text(options.subtitle, 105, 30, { align: 'center' })
    }
    
    // 添加水印
    if (options.includeWatermark && options.watermarkText) {
      doc.setFontSize(10)
      doc.setTextColor(150)
      doc.text(options.watermarkText, 105, 287, { align: 'center' })
    }
    
    // 添加表格
    doc.setFontSize(10)
    doc.setTextColor(0)
    
    let y = 50
    const lineHeight = 10
    
    // 表头
    doc.setFont('helvetica', 'bold')
    doc.text('治疗日期', 20, y)
    doc.text('患者ID', 50, y)
    doc.text('治疗类型', 80, y)
    doc.text('状态', 120, y)
    
    y += lineHeight
    
    // 表格内容
    doc.setFont('helvetica', 'normal')
    records.forEach((record) => {
      if (y > 270) {
        doc.addPage()
        y = 20
      }
      
      doc.text(new Date(record.treatment_date).toLocaleDateString(), 20, y)
      doc.text(record.patient_id.toString(), 50, y)
      doc.text(treatmentTypeMap[record.treatment_type] || record.treatment_type, 80, y)
      doc.text(record.status, 120, y)
      
      y += lineHeight
    })
    
    // 添加页脚
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`第 ${i} 页 / 共 ${pageCount} 页`, 105, 290, { align: 'center' })
    }
    
    // 保存文件
    doc.save(`${options.title}.pdf`)
  },

  // 导出为Excel
  exportToExcel: async (options: ExcelExportOptions): Promise<void> => {
    const workbook = XLSX.utils.book_new()
    
    options.sheets.forEach(sheet => {
      const worksheet = XLSX.utils.json_to_sheet(sheet.data)
      XLSX.utils.book_append_sheet(workbook, worksheet, sheet.name)
    })
    
    XLSX.writeFile(workbook, `${options.filename}.xlsx`)
  },

  // 导出为JSON
  exportToJSON: async (options: JSONExportOptions): Promise<void> => {
    const jsonStr = options.pretty 
      ? JSON.stringify(options.data, null, 2) 
      : JSON.stringify(options.data)
    
    const blob = new Blob([jsonStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${options.filename}.json`
    link.click()
    URL.revokeObjectURL(url)
  },

  // 导出治疗记录为Excel
  exportRecordsToExcel: async (
    records: TreatmentRecord[],
    filename: string = '治疗记录'
  ): Promise<void> => {
    const data = records.map(record => ({
      '记录ID': record.id,
      '患者ID': record.patient_id,
      '治疗师ID': record.therapist_id,
      '治疗日期': new Date(record.treatment_date).toLocaleDateString(),
      '治疗时间': record.treatment_time || '',
      '治疗类型': treatmentTypeMap[record.treatment_type] || record.treatment_type,
      '治疗内容': record.content,
      '状态': record.status,
      '地点': record.location || '',
      '创建时间': new Date(record.created_at).toLocaleString(),
    }))
    
    await exportService.exportToExcel({
      filename,
      sheets: [{ name: '治疗记录', data }]
    })
  },

  // 导出统计报告为PDF
  exportStatisticsReportToPDF: async (
    overview: StatisticsOverview,
    treatmentCount: TreatmentCountStatistics,
    patientDistribution: PatientDistributionStatistics,
    options: PDFExportOptions
  ): Promise<void> => {
    const doc = new jsPDF()
    
    // 标题
    doc.setFontSize(20)
    doc.text(options.title, 105, 20, { align: 'center' })
    
    if (options.subtitle) {
      doc.setFontSize(12)
      doc.text(options.subtitle, 105, 30, { align: 'center' })
    }
    
    // 概览统计
    doc.setFontSize(14)
    doc.text('统计概览', 20, 50)
    
    doc.setFontSize(10)
    let y = 60
    const lineHeight = 8
    
    doc.text(`患者总数: ${overview.totalPatients}`, 20, y)
    doc.text(`记录总数: ${overview.totalRecords}`, 20, y + lineHeight)
    doc.text(`治疗师总数: ${overview.totalTherapists}`, 20, y + lineHeight * 2)
    doc.text(`本月记录: ${overview.recordsThisMonth}`, 20, y + lineHeight * 3)
    doc.text(`本周记录: ${overview.recordsThisWeek}`, 20, y + lineHeight * 4)
    doc.text(`今日记录: ${overview.recordsToday}`, 20, y + lineHeight * 5)
    
    // 患者分布统计
    y = 120
    doc.setFontSize(14)
    doc.text('患者分布', 20, y)
    
    doc.setFontSize(10)
    doc.text('年龄分布:', 20, y + 10)
    patientDistribution.byAgeGroup.forEach((group, index) => {
      doc.text(`  ${group.ageRange}: ${group.count}人 (${group.percentage.toFixed(1)}%)`, 20, y + 18 + index * 7)
    })
    
    y += 60
    doc.text('性别分布:', 20, y)
    patientDistribution.byGender.forEach((group, index) => {
      doc.text(`  ${genderMap[group.gender] || group.gender}: ${group.count}人 (${group.percentage.toFixed(1)}%)`, 20, y + 8 + index * 7)
    })
    
    // 治疗类型统计
    y = 250
    doc.setFontSize(14)
    doc.text('治疗类型统计', 20, y)
    
    doc.setFontSize(10)
    treatmentCount.byTreatmentType.forEach((item, index) => {
      if (y + 8 + index * 7 > 280) {
        doc.addPage()
        y = 20
      }
      doc.text(
        `  ${treatmentTypeMap[item.treatmentType] || item.treatmentType}: ${item.count}次`,
        20,
        y + 8 + index * 7
      )
    })
    
    // 页脚
    const pageCount = doc.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i)
      doc.setFontSize(8)
      doc.text(`第 ${i} 页 / 共 ${pageCount} 页`, 105, 290, { align: 'center' })
      doc.text(`生成时间: ${new Date().toLocaleString()}`, 105, 295, { align: 'center' })
    }
    
    doc.save(`${options.title}.pdf`)
  },

  // 导出完整数据为Excel（多sheet）
  exportFullDataToExcel: async (
    records: TreatmentRecord[],
    overview: StatisticsOverview,
    treatmentCount: TreatmentCountStatistics,
    patientDistribution: PatientDistributionStatistics,
    filename: string = '完整统计报告'
  ): Promise<void> => {
    // Sheet 1: 概览
    const overviewData = [{
      '指标': '患者总数',
      '数值': overview.totalPatients
    }, {
      '指标': '记录总数',
      '数值': overview.totalRecords
    }, {
      '指标': '治疗师总数',
      '数值': overview.totalTherapists
    }, {
      '指标': '本月记录数',
      '数值': overview.recordsThisMonth
    }, {
      '指标': '本周记录数',
      '数值': overview.recordsThisWeek
    }, {
      '指标': '今日记录数',
      '数值': overview.recordsToday
    }, {
      '指标': '日均记录数',
      '数值': overview.averageRecordsPerDay.toFixed(2)
    }, {
      '指标': '患者增长率(%)',
      '数值': overview.patientGrowthRate.toFixed(2)
    }]
    
    // Sheet 2: 治疗记录
    const recordsData = records.map(record => ({
      '记录ID': record.id,
      '患者ID': record.patient_id,
      '治疗师ID': record.therapist_id,
      '治疗日期': new Date(record.treatment_date).toLocaleDateString(),
      '治疗时间': record.treatment_time || '',
      '治疗类型': treatmentTypeMap[record.treatment_type] || record.treatment_type,
      '治疗内容': record.content,
      '状态': record.status,
      '地点': record.location || '',
    }))
    
    // Sheet 3: 患者分布
    const patientDistData = [
      ...patientDistribution.byAgeGroup.map(item => ({
        '类别': '年龄分布',
        '分组': item.ageRange,
        '数量': item.count,
        '占比(%)': item.percentage.toFixed(2)
      })),
      ...patientDistribution.byGender.map(item => ({
        '类别': '性别分布',
        '分组': genderMap[item.gender] || item.gender,
        '数量': item.count,
        '占比(%)': item.percentage.toFixed(2)
      })),
      ...patientDistribution.byDiagnosis.map(item => ({
        '类别': '诊断分布',
        '分组': item.diagnosis,
        '数量': item.count,
        '占比(%)': item.percentage.toFixed(2)
      }))
    ]
    
    // Sheet 4: 治疗类型统计
    const treatmentTypeData = treatmentCount.byTreatmentType.map(item => ({
      '治疗类型': treatmentTypeMap[item.treatmentType] || item.treatmentType,
      '次数': item.count
    }))
    
    await exportService.exportToExcel({
      filename,
      sheets: [
        { name: '统计概览', data: overviewData },
        { name: '治疗记录', data: recordsData },
        { name: '患者分布', data: patientDistData },
        { name: '治疗类型', data: treatmentTypeData }
      ]
    })
  },

  // 导出原始数据为JSON
  exportRawDataToJSON: async (
    data: any,
    filename: string = '数据备份'
  ): Promise<void> => {
    await exportService.exportToJSON({
      filename,
      data,
      pretty: true
    })
  }
}