import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import RegisterPage from './pages/RegisterPage'
import LoginPage from './pages/LoginPage'

function App() {
    return (
        <Router>
            <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
                <Routes>
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/" element={<Navigate to="/register" replace />} />
                </Routes>
            </div>
        </Router>
    )
}

export default App
