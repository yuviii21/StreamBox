import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GradientButton } from '@/components/ui/gradient-button'
import axios from 'axios'

const API_URL = '/api'

function LoginPage() {
    const [formData, setFormData] = useState({
        username: '',
        password: ''
    })
    const [status, setStatus] = useState<{ message: string, type: 'success' | 'error' | null }>({
        message: '',
        type: null
    })
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setStatus({ message: '', type: null })

        try {
            const response = await axios.post(`${API_URL}/login`, formData)
            setStatus({ message: 'Login successful! Redirecting...', type: 'success' })
            setTimeout(() => {
                window.location.href = response.data.redirect
            }, 1500)
        } catch (err: any) {
            setStatus({
                message: err.response?.data?.message || 'Invalid credentials or server error.',
                type: 'error'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-top-4 duration-700">
            <h1 className="text-3xl font-bold text-white text-center mb-2">Welcome Back</h1>
            <p className="text-slate-400 text-center mb-8">Secure login to your account</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="User ID"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                </div>
                <div className="pb-4">
                    <input
                        type="password"
                        placeholder="Password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                    />
                </div>

                <GradientButton variant="variant" className="w-full" disabled={loading}>
                    {loading ? 'Logging in...' : 'Login'}
                </GradientButton>
            </form>

            {status.message && (
                <div className={`mt-6 p-3 rounded-lg text-center text-sm ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {status.message}
                </div>
            )}

            <p className="mt-8 text-center text-slate-400 text-sm">
                Don't have an account?{' '}
                <Link to="/register" className="text-indigo-400 font-semibold hover:underline">
                    Register here
                </Link>
            </p>
        </div>
    )
}

export default LoginPage
