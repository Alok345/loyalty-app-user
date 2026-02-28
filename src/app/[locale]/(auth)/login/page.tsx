'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import Link from 'next/link';
import Image from 'next/image';
import { RecentWinners } from '@/components/auth/RecentWinners';

export default function LoginPage() {
    const [phone, setPhone] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [useOTP, setUseOTP] = useState(false);
    const [otpSent, setOtpSent] = useState(false);
    const [countdown, setCountdown] = useState(0);

    const t = useTranslations('Auth');
    const { login, sendOTP, verifyOTP } = useAuth();
    const router = useRouter();

    // Countdown timer for OTP resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    const handleSendOTP = async () => {
        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            return;
        }

        setLoading(true);
        setError(null);

        const { error } = await sendOTP(phone);

        if (error) {
            setError(error.message);
            setLoading(false);
        } else {
            setOtpSent(true);
            setCountdown(60); // 60 seconds countdown
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (phone.length !== 10) {
            setError('Please enter a valid 10-digit mobile number');
            setLoading(false);
            return;
        }

        let result;

        if (useOTP) {
            // OTP-based login
            if (!otp || otp.length !== 6) {
                setError('Please enter a valid 6-digit OTP');
                setLoading(false);
                return;
            }
            result = await verifyOTP(phone, otp);
        } else {
            // Password-based login
            if (!password) {
                setError('Please enter your password');
                setLoading(false);
                return;
            }
            result = await login(phone, password);
        }

        if (result.error) {
            setError(result.error.message);
            setLoading(false);
        } else {
            router.push('/');
            router.refresh();
        }
    };

    const toggleAuthMode = () => {
        setUseOTP(!useOTP);
        setError(null);
        setOtpSent(false);
        setOtp('');
        setPassword('');
    };

    return (
        <div className="relative flex items-center justify-center min-h-screen p-4 overflow-hidden">
            {/* Background Image with Blur */}
            <div className="absolute inset-0 z-0">
                <Image
                    src="/gifts-bg.png"
                    alt="Background"
                    fill
                    className="object-cover opacity-60 scale-105"
                    priority
                />
                <div className="absolute inset-0 bg-blue-950/40 backdrop-blur-[2px]" />
            </div>

            <div className="relative z-10 w-full max-w-sm">
                <Card className="w-full bg-white/80 backdrop-blur-xl border-white/40 shadow-2xl overflow-hidden animate-in slide-in-from-bottom-8 duration-700">
                    <CardHeader className="text-center">
                        {/* Logo Section */}
                        <div className="flex flex-col items-center animate-in fade-in zoom-in duration-700">
                            <div className="relative w-24 h-24">
                                <Image
                                    src="/icon.png"
                                    alt="Shubh Nirman Logo"
                                    fill
                                    className="object-contain p-2"
                                />
                            </div>
                        </div>


                        <CardTitle className="text-3xl font-bold bg-gradient-to-br from-blue-900 to-blue-700 bg-clip-text text-transparent">
                            {t('login')}
                        </CardTitle>
                        <CardDescription className="text-blue-900/60">
                            {useOTP ? 'Enter your mobile number to receive OTP' : t('signDesc')}
                        </CardDescription>
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="grid gap-4">
                            {error && (
                                <div className="text-sm text-red-600 bg-red-50 border border-red-100 p-3 rounded-lg font-medium text-center animate-in shake-in duration-300">
                                    {error}
                                </div>
                            )}

                            {/* Mobile Number Input */}
                            <div className="grid gap-2">
                                <Label htmlFor="phone" className="text-blue-900/70">{t('mobileNumber')}</Label>
                                <div className="flex gap-2">
                                    <div className="flex items-center px-3 border border-blue-100 rounded-lg bg-blue-50/50 text-blue-900/70 font-bold">
                                        +91
                                    </div>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        required
                                        value={phone}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={10}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 10) setPhone(val);
                                        }}
                                        disabled={otpSent && useOTP}
                                        className="h-12 border-blue-100 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                        placeholder="00000 00000"
                                    />
                                </div>
                            </div>

                            {/* Password Input (shown when not using OTP) */}
                            {!useOTP && (
                                <div className="grid gap-2">
                                    <Label htmlFor="password" className="text-blue-900/70">{t('password')}</Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="h-12 border-blue-100 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                    />
                                </div>
                            )}

                            {/* OTP Input (shown when using OTP and OTP is sent) */}
                            {useOTP && otpSent && (
                                <div className="grid gap-2 animate-in slide-in-from-right-4 duration-300">
                                    <Label htmlFor="otp" className="text-blue-900/70">Enter OTP</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        required
                                        value={otp}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={6}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 6) setOtp(val);
                                        }}
                                        className="h-12 text-center text-xl tracking-widest border-blue-100 focus:border-blue-500 focus:ring-blue-500 rounded-lg"
                                        placeholder="000000"
                                    />
                                    <div className="text-sm text-center">
                                        {countdown > 0 ? (
                                            <span className="text-blue-900/50 italic">Resend OTP in {countdown}s</span>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleSendOTP}
                                                className="text-blue-600 font-bold hover:underline"
                                            >
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Toggle between Password and OTP */}
                            <div className="text-center pt-2">
                                <button
                                    type="button"
                                    onClick={toggleAuthMode}
                                    className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition-colors mb-2"
                                >
                                    {useOTP ? 'Use Password Instead' : 'Use OTP Instead'}
                                </button>
                            </div>
                        </CardContent>
                        <CardFooter className="flex flex-col gap-4 pb-8">
                            {useOTP && !otpSent ? (
                                <Button
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 shadow-lg shadow-blue-200"
                                    type="button"
                                    onClick={handleSendOTP}
                                    disabled={loading || phone.length !== 10}
                                >
                                    {loading ? 'Sending...' : 'Send OTP'}
                                </Button>
                            ) : (
                                <Button
                                    className="w-full h-12 rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-800 hover:to-blue-700 shadow-lg shadow-blue-200"
                                    type="submit"
                                    disabled={loading}
                                >
                                    {loading ? t('signingIn') : t('login')}
                                </Button>
                            )}
                            <div className="text-center text-sm text-blue-900/60">
                                {t('noAccount')}{" "}
                                <Link href="./signup" className="font-bold text-blue-700 hover:underline">
                                    {t('signup')}
                                </Link>
                            </div>
                        </CardFooter>
                    </form>
                </Card>
            </div>

            {/* Bottom Ticker */}
            <RecentWinners />
        </div>
    );
}

