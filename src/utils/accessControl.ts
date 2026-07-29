/**
 * 访问控制系统
 * 实现细粒度的权限控制和数据范围限制
 */

import { Therapist, UserRole } from '@/types/database'

// 资源类型
export enum ResourceType {
  PATIENT = 'patient',
  RECORD = 'record',
  THERAPIST = 'therapist',
  ATTACHMENT = 'attachment',
  STATISTICS = 'statistics',
  USER = 'user',
}

// 操作类型
export enum ActionType {
  CREATE = 'create',
  READ = 'read',
  UPDATE = 'update',
  DELETE = 'delete',
  EXPORT = 'export',
  IMPORT = 'import',
  APPROVE = 'approve',
  ARCHIVE = 'archive',
}

// 权限规则
export interface PermissionRule {
  resource: ResourceType
  actions: ActionType[]
  conditions?: PermissionCondition
}

// 权限条件
export interface PermissionCondition {
  ownerOnly?: boolean
  departmentOnly?: boolean
  fieldRestrictions?: string[]
  timeRestrictions?: {
    start?: string
    end?: string
  }
}

// 权限配置
const PERMISSION_CONFIG: Record<UserRole, PermissionRule[]> = {
  [UserRole.ADMIN]: [
    // 管理员拥有所有权限
    {
      resource: ResourceType.PATIENT,
      actions: [
        ActionType.CREATE,
        ActionType.READ,
        ActionType.UPDATE,
        ActionType.DELETE,
        ActionType.EXPORT,
        ActionType.ARCHIVE,
      ],
    },
    {
      resource: ResourceType.RECORD,
      actions: [
        ActionType.CREATE,
        ActionType.READ,
        ActionType.UPDATE,
        ActionType.DELETE,
        ActionType.EXPORT,
        ActionType.APPROVE,
        ActionType.ARCHIVE,
      ],
    },
    {
      resource: ResourceType.THERAPIST,
      actions: [
        ActionType.CREATE,
        ActionType.READ,
        ActionType.UPDATE,
        ActionType.DELETE,
      ],
    },
    {
      resource: ResourceType.STATISTICS,
      actions: [ActionType.READ, ActionType.EXPORT],
    },
    {
      resource: ResourceType.USER,
      actions: [
        ActionType.CREATE,
        ActionType.READ,
        ActionType.UPDATE,
        ActionType.DELETE,
      ],
    },
  ],

  [UserRole.THERAPIST]: [
    // 治疗师可以管理患者和记录
    {
      resource: ResourceType.PATIENT,
      actions: [
        ActionType.CREATE,
        ActionType.READ,
        ActionType.UPDATE,
      ],
      conditions: {
        ownerOnly: true, // 只能访问自己创建的患者
      },
    },
    {
      resource: ResourceType.RECORD,
      actions: [
        ActionType.CREATE,
        ActionType.READ,
        ActionType.UPDATE,
      ],
      conditions: {
        ownerOnly: true, // 只能访问自己创建的记录
      },
    },
    {
      resource: ResourceType.ATTACHMENT,
      actions: [ActionType.CREATE, ActionType.READ],
      conditions: {
        ownerOnly: true,
      },
    },
    {
      resource: ResourceType.STATISTICS,
      actions: [ActionType.READ],
      conditions: {
        ownerOnly: true,
      },
    },
  ],

  [UserRole.ASSISTANT]: [
    // 助手只能查看和基本操作
    {
      resource: ResourceType.PATIENT,
      actions: [ActionType.READ],
      conditions: {
        ownerOnly: true,
      },
    },
    {
      resource: ResourceType.RECORD,
      actions: [ActionType.CREATE, ActionType.READ],
      conditions: {
        ownerOnly: true,
      },
    },
    {
      resource: ResourceType.ATTACHMENT,
      actions: [ActionType.READ],
      conditions: {
        ownerOnly: true,
      },
    },
  ],

  [UserRole.VIEWER]: [
    // 观察者只能查看
    {
      resource: ResourceType.PATIENT,
      actions: [ActionType.READ],
      conditions: {
        fieldRestrictions: ['name', 'age', 'gender'], // 只能查看部分字段
      },
    },
    {
      resource: ResourceType.RECORD,
      actions: [ActionType.READ],
      conditions: {
        fieldRestrictions: ['treatment_type', 'treatment_date'],
      },
    },
  ],
}

/**
 * 权限检查器类
 */
export class AccessControl {
  private user: Therapist | null = null

  /**
   * 设置当前用户
   */
  setUser(user: Therapist | null) {
    this.user = user
  }

  /**
   * 获取当前用户
   */
  getUser(): Therapist | null {
    return this.user
  }

  /**
   * 检查是否有权限执行某个操作
   */
  can(
    resource: ResourceType,
    action: ActionType,
    resourceData?: any
  ): boolean {
    if (!this.user) {
      return false
    }

    const userRole = this.user.role
    const permissions = PERMISSION_CONFIG[userRole]

    if (!permissions) {
      return false
    }

    // 查找匹配的权限规则
    const rule = permissions.find(p => p.resource === resource)

    if (!rule) {
      return false
    }

    // 检查是否有该操作的权限
    if (!rule.actions.includes(action)) {
      return false
    }

    // 检查条件
    if (rule.conditions) {
      return this.checkConditions(rule.conditions, resourceData)
    }

    return true
  }

  /**
   * 检查权限条件
   */
  private checkConditions(
    conditions: PermissionCondition,
    resourceData?: any
  ): boolean {
    // 检查是否仅限所有者
    if (conditions.ownerOnly && resourceData) {
      const ownerId = resourceData.therapist_id || resourceData.created_by
      if (ownerId && ownerId !== this.user?.id) {
        return false
      }
    }

    // 检查时间限制
    if (conditions.timeRestrictions) {
      const now = new Date()
      const currentTime = now.getHours() * 60 + now.getMinutes()

      if (conditions.timeRestrictions.start) {
        const [startHour, startMin] = conditions.timeRestrictions.start
          .split(':')
          .map(Number)
        const startTime = startHour * 60 + startMin
        if (currentTime < startTime) {
          return false
        }
      }

      if (conditions.timeRestrictions.end) {
        const [endHour, endMin] = conditions.timeRestrictions.end
          .split(':')
          .map(Number)
        const endTime = endHour * 60 + endMin
        if (currentTime > endTime) {
          return false
        }
      }
    }

    return true
  }

  /**
   * 获取字段限制
   */
  getFieldRestrictions(resource: ResourceType): string[] | null {
    if (!this.user) {
      return null
    }

    const permissions = PERMISSION_CONFIG[this.user.role]
    const rule = permissions.find(p => p.resource === resource)

    if (!rule || !rule.conditions || !rule.conditions.fieldRestrictions) {
      return null
    }

    return rule.conditions.fieldRestrictions
  }

  /**
   * 过滤字段（基于权限）
   */
  filterFields<T extends Record<string, any>>(
    resource: ResourceType,
    data: T
  ): Partial<T> {
    const restrictions = this.getFieldRestrictions(resource)

    if (!restrictions) {
      return data // 没有限制，返回所有字段
    }

    const filtered: Partial<T> = {}
    for (const field of restrictions) {
      if (field in data) {
        filtered[field as keyof T] = data[field as keyof T]
      }
    }

    return filtered
  }

  /**
   * 过滤数据列表（基于所有权）
   */
  filterByOwnership<T extends { therapist_id?: number; created_by?: number }>(
    resource: ResourceType,
    dataList: T[]
  ): T[] {
    if (!this.user) {
      return []
    }

    const permissions = PERMISSION_CONFIG[this.user.role]
    const rule = permissions.find(p => p.resource === resource)

    if (!rule || !rule.conditions || !rule.conditions.ownerOnly) {
      return dataList // 没有所有权限制
    }

    // 过滤只返回用户自己的数据
    return dataList.filter(item => {
      const ownerId = item.therapist_id || item.created_by
      return ownerId === this.user?.id
    })
  }

  /**
   * 检查是否是管理员
   */
  isAdmin(): boolean {
    return this.user?.role === UserRole.ADMIN
  }

  /**
   * 检查是否是治疗师或以上
   */
  isTherapistOrAbove(): boolean {
    return (
      this.user?.role === UserRole.THERAPIST ||
      this.user?.role === UserRole.ADMIN
    )
  }

  /**
   * 获取用户的所有权限
   */
  getAllPermissions(): PermissionRule[] {
    if (!this.user) {
      return []
    }

    return PERMISSION_CONFIG[this.user.role] || []
  }
}

// 创建全局实例
export const accessControl = new AccessControl()

/**
 * 快速权限检查函数
 */
export function canAccess(
  resource: ResourceType,
  action: ActionType,
  resourceData?: any
): boolean {
  return accessControl.can(resource, action, resourceData)
}

/**
 * 快速字段过滤函数
 */
export function filterFields<T extends Record<string, any>>(
  resource: ResourceType,
  data: T
): Partial<T> {
  return accessControl.filterFields(resource, data)
}