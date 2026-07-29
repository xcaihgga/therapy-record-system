import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should display login page', async ({ page }) => {
    await page.goto('/login')
    
    await expect(page.locator('h2')).toContainText('登录')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
    await expect(page.locator('button[type="submit"]')).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('button[type="submit"]')
    
    await expect(page.locator('text=请输入邮箱')).toBeVisible()
    await expect(page.locator('text=请输入密码')).toBeVisible()
  })

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login')
    
    await page.fill('input[type="email"]', 'invalid@example.com')
    await page.fill('input[type="password"]', 'wrongpassword')
    await page.click('button[type="submit"]')
    
    // Wait for error message
    await expect(page.locator('[role="alert"]')).toBeVisible({ timeout: 5000 })
  })

  test('should navigate to register page', async ({ page }) => {
    await page.goto('/login')
    
    await page.click('text=注册新账号')
    
    await expect(page).toHaveURL(/\/register/)
    await expect(page.locator('h2')).toContainText('注册')
  })

  test('should register new user successfully', async ({ page }) => {
    await page.goto('/register')
    
    // Fill registration form
    await page.fill('input[name="name"]', 'Test Therapist')
    await page.fill('input[type="email"]', `test${Date.now()}@example.com`)
    await page.fill('input[name="certificate_number"]', 'CERT123456')
    await page.fill('input[name="phone"]', '13800138000')
    await page.fill('input[name="department"]', 'Test Department')
    await page.fill('input[type="password"]', 'TestPassword123!')
    await page.fill('input[name="confirmPassword"]', 'TestPassword123!')
    
    await page.click('button[type="submit"]')
    
    // Should show success message or redirect to login
    await expect(page.locator('text=注册成功')).toBeVisible({ timeout: 5000 })
  })
})

test.describe('Protected Routes', () => {
  test('should redirect to login when not authenticated', async ({ page }) => {
    await page.goto('/patients')
    
    await expect(page).toHaveURL(/\/login/)
  })

  test('should access protected route when authenticated', async ({ page }) => {
    // Mock authentication
    await page.addScriptTag({
      content: `
        localStorage.setItem('auth_token', 'mock-token');
      `,
    })
    
    await page.goto('/patients')
    
    // Should stay on patients page
    await expect(page).toHaveURL(/\/patients/)
  })
})