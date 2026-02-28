'use client';

import { useState } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiSelect } from "@/components/ui/multi-select";
import Link from 'next/link';

export default function SignupPage() {
    // Step 1: Details, Step 2: OTP Verification
    const [step, setStep] = useState<1 | 2>(1);

    // Form State
    const [phone, setPhone] = useState('');
    const [otp, setOtp] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [gender, setGender] = useState('');
    const [aadhar, setAadhar] = useState('');
    const [occupation, setOccupation] = useState<string[]>([]);

    // UI State
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const t = useTranslations('Auth');
    const tOcc = useTranslations('Occupations');

    // Updated Auth Hook
    const { verifyPhone, completeSignup } = useAuth();
    const router = useRouter();

    const handleSendOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Validation
        if (phone.length !== 10) {
            setError(t("mobileLength"));
            setLoading(false);
            return;
        }

        if (aadhar.length !== 12) {
            setError(t("aadharLength"));
            setLoading(false);
            return;
        }

        if (occupation.length === 0) {
            setError(t("selectOccupation"));
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            setLoading(false);
            return;
        }

        if (password !== confirmPassword) {
            setError(t("passNotMatch"));
            setLoading(false);
            return;
        }

        // Call API to send OTP
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        const emailValue = email.trim() === '' ? null : email;

        const metadata: Record<string, unknown> = {
            full_name: fullName,
            mobile: formattedPhone,
            gender,
            aadhar,
            occupation,
            user_type: 'customer'
        };

        if (emailValue) {
            metadata.email = emailValue;
        }

        const { error } = await verifyPhone(phone, metadata);

        if (error) {
            setError(error.message);
        } else {
            setStep(2); // Move to OTP step
        }
        setLoading(false);
    };

    const handleVerifyOTP = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (otp.length !== 6) {
            setError("Please enter a valid 6-digit OTP");
            setLoading(false);
            return;
        }

        const emailValue = email.trim() === '' ? null : email;

        const { error } = await completeSignup(
            phone,
            otp,
            password,
            {
                fullName,
                email: emailValue,
                gender,
                aadhar,
                occupation
            }
        );

        if (error) {
            setError(error.message);
        } else {
            alert(t("accountCreated"));
            router.push('/login');
        }
        setLoading(false);
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-muted/40 p-4">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle className="text-2xl">
                        {step === 1 ? t('signupTitle') : "Verify Mobile Number"}
                    </CardTitle>
                    <CardDescription>
                        {step === 1 ? t('signupDesc') : `Enter the OTP sent to +91 ${phone}`}
                    </CardDescription>
                </CardHeader>

                <form onSubmit={step === 1 ? handleSendOTP : handleVerifyOTP}>
                    <CardContent className="grid gap-4">
                        {error && <div className="text-sm text-red-500 font-medium text-center">{error}</div>}

                        {step === 1 && (
                            <>
                                {/* Mobile Number */}
                                <div className="grid gap-2">
                                    <Label htmlFor="mobile">{t('mobileNumber')} <span className="text-red-500">*</span></Label>
                                    <div className="flex gap-2">
                                        <div className="flex items-center px-3 border rounded-md bg-muted text-muted-foreground">
                                            +91
                                        </div>
                                        <Input
                                            id="mobile"
                                            type="tel"
                                            required
                                            value={phone}
                                            inputMode="numeric"
                                            pattern="[0-9]*"
                                            maxLength={10}
                                            onChange={e => {
                                                const val = e.target.value.replace(/\D/g, '');
                                                if (val.length <= 10) setPhone(val);
                                            }}
                                        />
                                    </div>
                                </div>

                                {/* Full Name */}
                                <div className="grid gap-2">
                                    <Label htmlFor="fullname">{t('fullName')} <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="fullname"
                                        required
                                        value={fullName}
                                        onChange={e => setFullName(e.target.value)}
                                    />
                                </div>

                                {/* Gender */}
                                <div className="grid gap-2">
                                    <Label htmlFor="gender">{t('gender')} <span className="text-red-500">*</span></Label>
                                    <Select onValueChange={setGender} required value={gender}>
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder={t('selectGender')} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">{t('male')}</SelectItem>
                                            <SelectItem value="female">{t('female')}</SelectItem>
                                            <SelectItem value="other">{t('other')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Aadhar Number */}
                                <div className="grid gap-2">
                                    <Label htmlFor="aadhar">{t('aadharNumber')} <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="aadhar"
                                        type="text"
                                        required
                                        value={aadhar}
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={12}
                                        onChange={e => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 12) setAadhar(val);
                                        }}
                                        placeholder={t('aadharPlaceholder')}
                                    />
                                </div>

                                <div className="grid gap-2">
                                    <Label htmlFor="occupation">{t('occupation')} <span className="text-red-500">*</span></Label>
                                    <MultiSelect
                                        options={[
                                            { value: "missionary", label: tOcc('missionary') },
                                            { value: "engineer", label: tOcc('engineer') },
                                            { value: "electrician", label: tOcc('electrician') },
                                            { value: "plumber", label: tOcc('plumber') },
                                            { value: "painter", label: tOcc('painter') },
                                            { value: "carpenter", label: tOcc('carpenter') },
                                            { value: "tiles", label: tOcc('tiles') },
                                            { value: "welder", label: tOcc('welder') },
                                        ]}
                                        selected={occupation}
                                        onChange={setOccupation}
                                        placeholder={t('selectOccupation')}
                                    />
                                </div>

                                {/* Email */}
                                <div className="grid gap-2">
                                    <Label htmlFor="email">
                                        {t('email')} <span className="text-muted-foreground text-xs">(Optional)</span>
                                    </Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                    />
                                </div>

                                {/* Password */}
                                <div className="grid gap-2">
                                    <Label htmlFor="password">{t('password')} <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="password"
                                        type="password"
                                        required
                                        value={password}
                                        onChange={e => setPassword(e.target.value)}
                                    />
                                </div>

                                {/* Confirm Password */}
                                <div className="grid gap-2">
                                    <Label htmlFor="confirm-password">{t('confirmPassword')} <span className="text-red-500">*</span></Label>
                                    <Input
                                        id="confirm-password"
                                        type="password"
                                        required
                                        value={confirmPassword}
                                        onChange={e => setConfirmPassword(e.target.value)}
                                    />
                                </div>
                            </>
                        )}

                        {step === 2 && (
                            <div className="grid gap-4 py-4">
                                <div className="text-center space-y-2">
                                    <Label htmlFor="otp" className="text-lg">Enter 6-digit OTP</Label>
                                    <Input
                                        id="otp"
                                        type="text"
                                        inputMode="numeric"
                                        maxLength={6}
                                        className="text-center text-2xl tracking-widest h-14"
                                        value={otp}
                                        onChange={(e) => {
                                            const val = e.target.value.replace(/\D/g, '');
                                            if (val.length <= 6) setOtp(val);
                                        }}
                                        autoFocus
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Use validation code sent to your mobile
                                    </p>
                                </div>
                                <Button
                                    type="button"
                                    variant="link"
                                    className="px-0 text-muted-foreground"
                                    onClick={() => setStep(1)}
                                >
                                    Change Mobile Number
                                </Button>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex flex-col gap-4 py-4">
                        <Button className="w-full" type="submit" disabled={loading}>
                            {loading ? "Processing..." : (step === 1 ? "Verify Mobile Number" : "Verify & Create Account")}
                        </Button>

                        {step === 1 && (
                            <div className="text-center text-sm">
                                {t('hasAccount')}{" "}
                                <Link href="./login" className="underline">
                                    {t('login')}
                                </Link>
                            </div>
                        )}
                    </CardFooter>
                </form>
            </Card>
        </div>
    );
}
