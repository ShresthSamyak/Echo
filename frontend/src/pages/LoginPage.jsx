import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../services/auth';
import '../styles/login.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const navigate = useNavigate();

    const handleEmailLogin = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage('');

        const { error } = await auth.signInWithEmail(email);

        if (error) {
            setMessage('❌ Error: ' + error.message);
        } else {
            setMessage('✅ Check your email for the magic link!');
        }
        setLoading(false);
    };

    const handleGoogleLogin = async () => {
        setLoading(true);
        await auth.signInWithGoogle();
    };

    return (
        <div className="login-page">
            <div className="login-card">
                <div className="logo">🏠 AquaTech</div>
                <h1>Continue to your products</h1>
                <p className="caption">Your product chats and history will be saved</p>

                <form onSubmit={handleEmailLogin}>
                    <input
                        type="email"
                        placeholder="Enter your email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                    />
                    <button type="submit" disabled={loading}>
                        {loading ? 'Sending...' : 'Continue with Email'}
                    </button>
                </form>

                <div className="divider">or</div>

                <button
                    className="btn-google"
                    onClick={handleGoogleLogin}
                    disabled={loading}
                >
                    <svg width="20" height="20" viewBox="0 0 20 20">
                        <path fill="#4285F4" d="M19.6 10.23c0-.82-.1-1.42-.25-2.05H10v3.72h5.5c-.15.96-.74 2.31-2.04 3.22v2.45h3.16c1.89-1.73 2.98-4.3 2.98-7.34z" />
                        <path fill="#34A853" d="M13.46 15.13c-.83.59-1.96 1-3.46 1-2.64 0-4.88-1.74-5.68-4.15H1.07v2.52C2.72 17.75 6.09 20 10 20c2.7 0 4.96-.89 6.62-2.42l-3.16-2.45z" />
                        <path fill="#FBBC05" d="M3.99 10c0-.69.12-1.35.32-1.97V5.51H1.07A9.973 9.973 0 000 10c0 1.61.39 3.14 1.07 4.49l3.24-2.52c-.2-.62-.32-1.28-.32-1.97z" />
                        <path fill="#EA4335" d="M10 3.88c1.88 0 3.13.81 3.85 1.48l2.84-2.76C14.96.99 12.7 0 10 0 6.09 0 2.72 2.25 1.07 5.51l3.24 2.52C5.12 5.62 7.36 3.88 10 3.88z" />
                    </svg>
                    Continue with Google
                </button>

                {message && <p className="message">{message}</p>}
            </div>
        </div>
    );
}
