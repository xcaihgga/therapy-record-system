import { Routes, Route } from 'react-router-dom'
import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
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
import WatermarkSettingsPage from './pages/WatermarkSettingsPage'
import SignatureManagementPage from './pages/SignatureManagementPage'
import ProofGenerationPage from './pages/ProofGenerationPage'
import ProofVerificationPage from './pages/ProofVerificationPage'
import StatisticsPage from './pages/StatisticsPage'
import { OfflineIndicator, SyncProgressBar } from './components/ui/offline-indicator'

function App() {
  return (
    <>
      <OfflineIndicator />
      <SyncProgressBar />

      <Routes>
        {/* 真实性验证公开路由 */}
        <Route path="/verify/:proofNumber" element={<ProofVerificationPage />} />
        <Route path="/verify" element={<ProofVerificationPage />} />

        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="dashboard" element={<DashboardPage />} />

          <Route path="patients" element={<PatientsPage />} />
          <Route path="patients/:id" element={<PatientDetailPage />} />
          <Route path="patients/:id/edit" element={<PatientEditPage />} />
          <Route path="patients/:id/archive" element={<PatientArchivePage />} />

          <Route path="statistics" element={<StatisticsPage />} />

          <Route path="records" element={<RecordsPage />} />
          <Route path="records/new" element={<RecordCreatePage />} />
          <Route path="records/:id" element={<RecordDetailPage />} />
          <Route path="records/:id/edit" element={<RecordEditPage />} />

          <Route path="profile" element={<ProfilePage />} />
          <Route path="watermark-settings" element={<WatermarkSettingsPage />} />
          <Route path="signatures" element={<SignatureManagementPage />} />
          <Route path="records/:recordId/proof" element={<ProofGenerationPage />} />
        </Route>
      </Routes>
    </>
  )
}

export default App
