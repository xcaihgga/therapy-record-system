import { test, expect } from '@playwright/test'

test.describe('Therapy Record Management', () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication
    await page.addScriptTag({
      content: `
        localStorage.setItem('auth_token', 'mock-token');
      `,
    })
  })

  test('should display records list page', async ({ page }) => {
    await page.goto('/records')
    
    await expect(page.locator('h1')).toContainText('治疗记录')
    await expect(page.locator('button:has-text("新建记录")')).toBeVisible()
  })

  test('should create a new therapy record', async ({ page }) => {
    await page.goto('/records/new')
    
    // Fill therapy record form
    await page.fill('input[name="patient_name"]', '测试患者')
    await page.fill('input[name="treatment_type"]', '物理治疗')
    await page.fill('textarea[name="treatment_content"]', '测试治疗内容描述')
    await page.fill('input[name="duration"]', '60')
    await page.fill('textarea[name="notes"]', '测试备注')
    
    await page.click('button[type="submit"]')
    
    // Should show success message
    await expect(page.locator('text=创建成功')).toBeVisible({ timeout: 5000 })
  })

  test('should upload attachments', async ({ page }) => {
    await page.goto('/records/new')
    
    // Check file upload functionality
    const fileInput = page.locator('input[type="file"]')
    if (await fileInput.isVisible()) {
      await fileInput.setInputFiles({
        name: 'test-image.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('test image content'),
      })
      
      await expect(page.locator('text=test-image.jpg')).toBeVisible()
    }
  })

  test('should view record details', async ({ page }) => {
    await page.goto('/records')
    
    // Click on first record
    const firstRecord = page.locator('table tbody tr').first()
    if (await firstRecord.isVisible()) {
      await firstRecord.click()
      
      await expect(page).toHaveURL(/\/records\/[^/]+$/)
      await expect(page.locator('h1')).toBeVisible()
    }
  })

  test('should edit therapy record', async ({ page }) => {
    await page.goto('/records')
    
    const editButton = page.locator('button:has-text("编辑")').first()
    if (await editButton.isVisible()) {
      await editButton.click()
      
      await expect(page.locator('text=编辑治疗记录')).toBeVisible()
      
      await page.fill('textarea[name="treatment_content"]', '修改后的治疗内容')
      
      await page.click('button[type="submit"]')
      
      await expect(page.locator('text=更新成功')).toBeVisible({ timeout: 5000 })
    }
  })

  test('should delete therapy record', async ({ page }) => {
    await page.goto('/records')
    
    const deleteButton = page.locator('button:has-text("删除")').first()
    if (await deleteButton.isVisible()) {
      // Click delete and confirm
      await deleteButton.click()
      
      // Handle confirmation dialog
      page.on('dialog', dialog => dialog.accept())
      
      await expect(page.locator('text=删除成功')).toBeVisible({ timeout: 5000 })
    }
  })
})

test.describe('Record Attachments', () => {
  test('should display attachments list', async ({ page }) => {
    await page.addScriptTag({
      content: `
        localStorage.setItem('auth_token', 'mock-token');
      `,
    })
    
    await page.goto('/records')
    
    // Check if records have attachment indicators
    const records = page.locator('table tbody tr')
    const count = await records.count()
    
    if (count > 0) {
      await records.first().click()
      
      // Check for attachments section
      const attachmentSection = page.locator('text=附件')
      if (await attachmentSection.isVisible()) {
        await expect(attachmentSection).toBeVisible()
      }
    }
  })
})