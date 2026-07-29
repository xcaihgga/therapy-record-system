import { test, expect } from '@playwright/test'

test.describe('Patient Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addScriptTag({
      content: `
        localStorage.setItem('auth_token', 'mock-token');
      `,
    })
  })

  test('should display patients list page', async ({ page }) => {
    await page.goto('/patients')
    
    await expect(page.locator('h1')).toContainText('患者管理')
    await expect(page.locator('button:has-text("添加患者")')).toBeVisible()
  })

  test('should open patient creation form', async ({ page }) => {
    await page.goto('/patients')
    
    await page.click('button:has-text("添加患者")')
    
    await expect(page.locator('text=创建患者档案')).toBeVisible()
    await expect(page.locator('input[name="name"]')).toBeVisible()
    await expect(page.locator('input[name="medical_number"]')).toBeVisible()
  })

  test('should create a new patient', async ({ page }) => {
    await page.goto('/patients/new')
    
    // Fill patient form
    await page.fill('input[name="name"]', '测试患者')
    await page.fill('input[name="medical_number"]', `MED${Date.now()}`)
    await page.fill('input[name="age"]', '45')
    await page.selectOption('select[name="gender"]', 'male')
    await page.fill('input[name="phone"]', '13800138001')
    await page.fill('textarea[name="diagnosis"]', '测试诊断')
    
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=创建成功')).toBeVisible({ timeout: 5000 })
  })

  test('should search patients', async ({ page }) => {
    await page.goto('/patients')
    
    await page.fill('input[placeholder*="搜索"]', '测试')
    await page.press('input[placeholder*="搜索"]', 'Enter')
    
    // Should filter patients
    await expect(page.locator('table')).toBeVisible()
  })

  test('should view patient details', async ({ page }) => {
    await page.goto('/patients')
    
    // Click on first patient row
    const firstPatient = page.locator('table tbody tr').first()
    if (await firstPatient.isVisible()) {
      await firstPatient.click()
      
      // Should navigate to patient detail page
      await expect(page).toHaveURL(/\/patients\/[^/]+$/)
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('should edit patient information', async ({ page }) => {
    await page.goto('/patients')
    
    // Navigate to edit page
    const editButton = page.locator('button:has-text("编辑")').first()
    if (await editButton.isVisible()) {
      await editButton.click()
      
      await expect(page.locator('text=编辑患者信息')).toBeVisible()
      
      // Modify patient name
      await page.fill('input[name="name"]', '修改后的患者名')
      
      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=更新成功')).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Patient Archive', () => {
  test('should display archived patients', async ({ page }) => {
    await page.addScriptTag({
      content: `
        localStorage.setItem('auth_token', 'mock-token');
      `,
    })
    
    await page.goto('/patients/archive')
    
    await expect(page.locator('h1')).toContainText('患者档案库')
  })
})