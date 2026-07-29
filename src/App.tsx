import { Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/layout/Layout'
import ProtectedRoute from './components/auth/ProtectedRoute'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import PatientsPage from './pages/PatientsPage'
import PatientDetailPage from './pages/PatientDetailPage'
import PatientEditPage from './pages/PatientEditPage'
import PatientArchivePage from './pages/PatientArchivePage'
import RecordsPage from './pages/RecordsPage'
import RecordCreatePage from './pages/RecordCreatePage'
import RecordDetailPage from './pages/RecordDetailPage'
import RecordEditPage from './pages/RecordEditPage'
import ProfilePage from './pages/ProfilePage'
import UsersPage from './pages/UsersPage'
import WatermarkSettingsPage from './pages/WatermarkSettingsPage'
import SignatureManagementPage from './pages/SignatureManagementPage'
import ProofGenerationPage from './pages/ProofGenerationPage'
import ProofVerificationPage from './pages/ProofVerificationPage'
import StatisticsPage from './pages/StatisticsPage'
import SecurityManagementPage from './pages/SecurityManagementPage'
import { UserRole } from './types/database'
import { OfflineIndicator, SyncProgressBar } from './components/ui/offline-indicator'

function App() {
  return (
    <>
      {/* 离线状态指示器 */}
      <OfflineIndicator />
      <SyncProgressBar />

      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify/:proofNumber" element={<ProofVerificationPage />} />
        <Route path="/verify" element={<ProofVerificationPage />} />

        {/* 需要登录的路由 */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />

          {/* 患者管理路由 */}
          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="patients/:id/edit" element={<PatientEditPage />} />
          <Route path="patients/:id/archive" element={<PatientArchivePage />} />

          {/* 统计分析路由 */}
          <Route path="statistics" element={<StatisticsPage />} />

          {/* 治疗记录路由 */}
          <Route path="records" element={<RecordsPage />} />
          <Route path="records/new" element={<RecordCreatePage />} />
          <Route path="records/:id" element={<RecordDetailPage />} />
          <Route path="records/:id/edit" element={<RecordEditPage />} />

          <Route path="profile" element={<ProfilePage />} />

          {/* 水印配置路由 */}
          <Route path="watermark-settings" element={<WatermarkSettingsPage />} />

          {/* 签名管理路由 */}
          <Route path="signatures" element={<SignatureManagementPage />} />

          {/* 治疗证明生成路由 */}
          <Route path="records/:recordId/proof" element={<ProofGenerationPage />} />

          {/* 仅管理员可访问的用户管理页面 */}
          <Route
            path="users"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          {/* 安全管理中心路由 */}
          <Route
            path="security"
            element={
              <ProtectedRoute requiredRoles={[UserRole.ADMIN]}>
                <SecurityManagementPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 404 重定向 */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

export default App