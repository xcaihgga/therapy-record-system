import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'
import { patientSchema, type PatientFormData } from '@/lib/validations'
import { Gender } from '@/types/database'
import type { Patient } from '@/types/database'
import { Loader2, User, Phone, FileText, Stethoscope } from 'lucide-react'

interface PatientFormProps {
  patient?: Patient | null
  onSubmit: (data: PatientFormData) => Promise<void>
  onCancel?: () => void
  isLoading?: boolean
  mode?: 'create' | 'edit' | 'quick'
}

export function PatientForm({
  patient,
  onSubmit,
  onCancel,
  isLoading = false,
  mode = 'create',
}: PatientFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
  } = useForm<PatientFormData>({
    resolver: zodResolver(patientSchema),
    defaultValues: patient
      ? {
          name: patient.name,
          age: patient.age,
          gender: patient.gender,
          phone: patient.phone,
          medical_record_number: patient.medical_record_number,
          diagnosis: patient.diagnosis || '',
        }
      : {
          name: '',
          age: undefined,
          gender: undefined,
          phone: '',
          medical_record_number: '',
          diagnosis: '',
        },
  })

  const gender = watch('gender')

  const handleFormSubmit = async (data: PatientFormData) => {
    try {
      await onSubmit(data)
    } catch (error) {
      console.error('提交表单失败:', error)
    }
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          {mode === 'create' && '添加新患者'}
          {mode === 'edit' && '编辑患者信息'}
          {mode === 'quick' && '快速添加患者'}
        </CardTitle>
      </CardHeader>
      <form onSubmit={handleSubmit(handleFormSubmit)}>
        <CardContent className="space-y-4">
          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">基本信息</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 姓名 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  姓名 <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    {...register('name')}
                    placeholder="请输入患者姓名"
                    className="pl-10"
                    disabled={isLoading || isSubmitting}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-500">{errors.name.message}</p>
                )}
              </div>

              {/* 年龄 */}
              <div className="space-y-2">
                <label className="text-sm font-medium">
                  年龄 <span className="text-red-500">*</span>
                </label>
                <Input
                  {...register('age', { valueAsNumber: true })}
                  type="number"
                  placeholder="请输入年龄"
                  min="0"
                  max="150"
                  disabled={isLoading || isSubmitting}
                />
                {errors.age && (
                  <p className="text-sm text-red-500">{errors.age.message}</p>
                )}
              </div>
            </div>

            {/* 性别 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                性别 <span className="text-red-500">*</span>
              </label>
              <div className="flex gap-4">
                {[
                  { value: Gender.MALE, label: '男' },
                  { value: Gender.FEMALE, label: '女' },
                  { value: Gender.OTHER, label: '其他' },
                ].map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <input
                      type="radio"
                      {...register('gender')}
                      value={option.value}
                      checked={gender === option.value}
                      disabled={isLoading || isSubmitting}
                      className="h-4 w-4"
                    />
                    <span className="text-sm">{option.label}</span>
                  </label>
                ))}
              </div>
              {errors.gender && (
                <p className="text-sm text-red-500">{errors.gender.message}</p>
              )}
            </div>
          </div>

          {/* 联系方式 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">联系方式</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                手机号码 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...register('phone')}
                  placeholder="请输入手机号码"
                  className="pl-10"
                  maxLength={11}
                  disabled={isLoading || isSubmitting}
                />
              </div>
              {errors.phone && (
                <p className="text-sm text-red-500">{errors.phone.message}</p>
              )}
            </div>
          </div>

          {/* 病历信息 */}
          <div className="space-y-4">
            <h3 className="text-sm font-medium text-muted-foreground">病历信息</h3>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                病历号 <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  {...register('medical_record_number')}
                  placeholder="请输入病历号"
                  className="pl-10"
                  disabled={isLoading || isSubmitting}
                />
              </div>
              {errors.medical_record_number && (
                <p className="text-sm text-red-500">
                  {errors.medical_record_number.message}
                </p>
              )}
              {mode === 'create' && (
                <p className="text-xs text-muted-foreground">
                  病历号必须唯一，用于标识患者身份
                </p>
              )}
            </div>

            {/* 诊断信息 */}
            <div className="space-y-2">
              <label className="text-sm font-medium">诊断信息</label>
              <div className="relative">
                <Stethoscope className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <textarea
                  {...register('diagnosis')}
                  placeholder="请输入诊断信息（可选）"
                  className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 pl-10 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={isLoading || isSubmitting}
                />
              </div>
              {errors.diagnosis && (
                <p className="text-sm text-red-500">{errors.diagnosis.message}</p>
              )}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-2">
          {onCancel && (
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isLoading || isSubmitting}
            >
              取消
            </Button>
          )}
          <Button type="submit" disabled={isLoading || isSubmitting}>
            {(isLoading || isSubmitting) && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {mode === 'create' && '添加患者'}
            {mode === 'edit' && '保存修改'}
            {mode === 'quick' && '快速添加'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}