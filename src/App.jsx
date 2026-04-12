import { Routes, Route, Navigate } from 'react-router-dom';
import SurveyHome from './pages/survey/SurveyHome';
import Evaluation from './pages/survey/Evaluation';
import Success from './pages/survey/Success';
import AdminDashboard from './pages/admin/AdminDashboard';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<SurveyHome />} />
      <Route path="/evaluate/:id" element={<Evaluation />} />
      <Route path="/success" element={<Success />} />
      <Route path="/admin/*" element={<AdminDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
