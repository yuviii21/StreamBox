import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { GradientButton } from '@/components/ui/gradient-button'
import axios from 'axios'

const API_URL = 'http://localhost:3000'

function RegisterPage() {
    const [formData, setFormData] = useState({
        userId: '',
        username: '',
        email: '',
        phone: '',
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
            const response = await axios.post(`${API_URL}/register`, formData)
            setStatus({ message: response.data.message + ' Redirecting...', type: 'success' })
            setTimeout(() => navigate('/login'), 2000)
        } catch (err: any) {
            setStatus({
                message: err.response?.data?.message || 'Server error during registration.',
                type: 'error'
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="w-full max-w-md bg-white/5 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h1 className="text-3xl font-bold text-white text-center mb-2">Create Account</h1>
            <p className="text-slate-400 text-center mb-8">Join our premium platform</p>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <input
                        type="text"
                        placeholder="User ID (e.g., kodom01)"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                        value={formData.userId}
                        onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <input
                        type="text"
                        placeholder="Full Name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <input
                        type="email"
                        placeholder="Email Address"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                    />
                </div>
                <div>
                    <input
                        type="tel"
                        placeholder="Phone Number"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all font-sans"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
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

                <GradientButton className="w-full" disabled={loading}>
                    {loading ? 'Registering...' : 'Register Now'}
                </GradientButton>
            </form>

            {status.message && (
                <div className={`mt-6 p-3 rounded-lg text-center text-sm ${status.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {status.message}
                </div>
            )}

            <p className="mt-8 text-center text-slate-400 text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-indigo-400 font-semibold hover:underline">
                    Login here
                </Link>
            </p>
        </div>
    )
}

export default RegisterPage
