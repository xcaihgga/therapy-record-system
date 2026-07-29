import { forwardRef } from 'react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
}

/**
 * 移动端优化的输入组件
 * - 最小触摸区域 44x44px
 * - 支持数字键盘
 * - 支持日期选择器
 */
export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, helperText, className, type, ...props }, ref) => {
    // 为移动设备优化input类型
    const getInputType = () => {
      if (type === 'number' || type === 'tel') {
        return 'tel' // 在移动设备上显示数字键盘
      }
      return type
    }

    // 为移动设备优化input模式
    const getInputMode = () => {
      if (type === 'number' || type === 'tel') {
        return 'numeric'
      }
      return undefined
    }

    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <Input
          ref={ref}
          type={getInputType()}
          inputMode={getInputMode()}
          className={cn(
            'min-h-[44px] touch-manipulation',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

MobileInput.displayName = 'MobileInput'

interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helperText?: string
}

/**
 * 移动端优化的文本域组件
 */
export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ label, error, helperText, className, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <textarea
          ref={ref}
          className={cn(
            'flex min-h-[100px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] touch-manipulation',
            error && 'border-red-500',
            className
          )}
          {...props}
        />
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

MobileTextarea.displayName = 'MobileTextarea'

interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label: string
  error?: string
  helperText?: string
  options: Array<{ value: string; label: string }>
}

/**
 * 移动端优化的选择组件
 */
export const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
  ({ label, error, helperText, className, options, ...props }, ref) => {
    return (
      <div className="space-y-1">
        <label className="text-sm font-medium text-foreground">
          {label}
          {props.required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <select
          ref={ref}
          className={cn(
            'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] touch-manipulation',
            error && 'border-red-500',
            className
          )}
          {...props}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {helperText && !error && (
          <p className="text-xs text-muted-foreground">{helperText}</p>
        )}
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
      </div>
    )
  }
)

MobileSelect.displayName = 'MobileSelect'

interface MobileDatePickerProps {
  label: string
  value: string
  onChange: (value: string) => void
  error?: string
  helperText?: string
  required?: boolean
  min?: string
  max?: string
}

/**
 * 移动端优化的日期选择器
 */
export function MobileDatePicker({
  label,
  value,
  onChange,
  error,
  helperText,
  required,
  min,
  max,
}: MobileDatePickerProps) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-foreground">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        min={min}
        max={max}
        className={cn(
          'flex h-11 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[44px] touch-manipulation',
          error && 'border-red-500'
        )}
      />
      {helperText && !error && (
        <p className="text-xs text-muted-foreground">{helperText}</p>
      )}
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
}