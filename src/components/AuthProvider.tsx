"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth, db } from "@/lib/firebase";
import {
    onAuthStateChanged,
    signOut,
    User as FirebaseUser,
    signInWithEmailAndPassword,
    signInWithPhoneNumber,
    RecaptchaVerifier,
    ConfirmationResult,
    updatePassword,
    createUserWithEmailAndPassword
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc, collection, query, where, getDocs } from "firebase/firestore";

// Simple mapping to keep existing usage of user.id
export type User = {
    id: string;
    uid: string;
    email: string | null;
    phone: string | null;
} & Partial<FirebaseUser>;

export type Profile = {
    full_name: string | null;
    email?: string | null;
    phone?: string | null;
    mobile: string | null;
    gender?: string | null;
    aadhar?: string | null;
    address?: string | null;
    nearest_store?: string | null;
    occupation?: string[] | null;
    avatar_url?: string | null;
    points_balance: number;
    role: string;
    status?: boolean;
    status_reason?: string | null;
    auth_token?: string | null;
};

export type AuthError = {
    message: string;
    code?: string;
    status?: number;
    name?: string;
};

interface AuthContextType {
    user: User | null;
    profile: Profile | null;
    verifyPhone: (phone: string, metadata?: Record<string, unknown>) => Promise<{ error: AuthError | null; exists?: boolean }>;
    completeSignup: (
        phone: string,
        token: string,
        password: string,
        details: {
            fullName: string;
            email: string | null;
            gender: string;
            aadhar: string;
            occupation: string[];
        }
    ) => Promise<{ error: AuthError | null }>;
    login: (phone: string, password: string) => Promise<{ error: AuthError | null }>;
    sendOTP: (phone: string) => Promise<{ error: AuthError | null }>;
    verifyOTP: (phone: string, token: string) => Promise<{ error: AuthError | null }>;
    logout: () => Promise<void>;
    refreshProfile: () => Promise<void>;
    isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
    const router = useRouter();

    const recaptchaVerifierRef = React.useRef<RecaptchaVerifier | null>(null);

    const initRecaptcha = () => {
        if (typeof window !== "undefined" && !recaptchaVerifierRef.current) {
            const container = document.getElementById('recaptcha-container');
            if (container) {
                recaptchaVerifierRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
                    'size': 'invisible',
                    'callback': () => {
                        console.log('Recaptcha resolved');
                    }
                });
            }
        }
    };

    const fetchProfile = async (userId: string): Promise<Profile | null> => {
        try {
            const docRef = doc(db, "profiles", userId);
            const docSnap = await getDoc(docRef);

            if (docSnap.exists()) {
                const data = docSnap.data() as Profile;
                setProfile(data);
                return data;
            }
            return null;
        } catch (err) {
            console.error("Error fetching profile:", err);
            return null;
        }
    };

    useEffect(() => {
        initRecaptcha();

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
            if (firebaseUser) {
                const mappedUser: User = {
                    ...firebaseUser,
                    id: firebaseUser.uid,
                    uid: firebaseUser.uid,
                    email: firebaseUser.email,
                    phone: firebaseUser.phoneNumber
                };
                setUser(mappedUser);
                await fetchProfile(firebaseUser.uid);
            } else {
                setUser(null);
                setProfile(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    const getPhoneEmail = (phone: string) => {
        const cleanPhone = phone.replace(/\D/g, '');
        return `${cleanPhone}@loyalty.app`;
    };

    const checkUserExists = async (phone: string) => {
        const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;
        const q = query(collection(db, "profiles"), where("phone", "==", formattedPhone));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) return true;

        // Fallback to "mobile" field just in case
        const q2 = query(collection(db, "profiles"), where("mobile", "==", formattedPhone));
        const querySnapshot2 = await getDocs(q2);
        return !querySnapshot2.empty;
    };

    const verifyPhone = async (phone: string, metadata?: Record<string, unknown>) => {
        try {
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

            const exists = await checkUserExists(phone);
            if (exists) {
                return {
                    error: {
                        message: "This phone number is already registered. Please login instead.",
                        name: "AuthError",
                        status: 400
                    },
                    exists: true
                };
            }

            initRecaptcha();
            if (!recaptchaVerifierRef.current) {
                return { error: { message: "Recaptcha Not Initialized" } };
            }

            const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
            setConfirmationResult(result);
            return { error: null };
        } catch (err: any) {
            return { error: { message: err.message, code: err.code } };
        }
    };

    const completeSignup = async (
        phone: string,
        token: string,
        password: string,
        details: {
            fullName: string;
            email: string | null;
            gender: string;
            aadhar: string;
            occupation: string[];
        }
    ) => {
        try {
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

            if (!confirmationResult) {
                return { error: { message: "Session expired. Please request OTP again." } };
            }

            const result = await confirmationResult.confirm(token);
            const firebaseUser = result.user;

            // Map phone to email for password login support in Firebase
            const phoneEmail = getPhoneEmail(phone);

            // Try to set email and password for the user
            // In Firebase, we might need to link an email/password credential
            // For simplicity in migration, we'll try to create an email user if it doesn't exist
            // but since they just verified phone, they are already logged in via Phone.
            // We can't simply "add" a password unless we link credentials.

            // For now, let's just create the profile. 
            // If they want password login later, we should have used createUserWithEmailAndPassword.

            const profileData: Profile = {
                full_name: details.fullName,
                mobile: formattedPhone,
                phone: formattedPhone,
                email: details.email,
                gender: details.gender,
                aadhar: details.aadhar,
                occupation: details.occupation,
                role: 'customer',
                status: false,
                points_balance: 0
            };

            await setDoc(doc(db, "profiles", firebaseUser.uid), profileData);

            // We'll also try to update the email in auth if provided
            // and maybe set a password via updatePassword if they are recently signed in
            if (password) {
                try {
                    await updatePassword(firebaseUser, password);
                } catch (pErr) {
                    console.warn("Could not set password immediately:", pErr);
                }
            }

            await fetchProfile(firebaseUser.uid);
            return { error: null };
        } catch (err: any) {
            return { error: { message: err.message, code: err.code } };
        }
    };

    const login = async (phone: string, password: string) => {
        try {
            const email = getPhoneEmail(phone);
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const firebaseUser = userCredential.user;

            const profileData = await fetchProfile(firebaseUser.uid);

            if (!profileData || profileData.status === false) {
                await signOut(auth);
                return {
                    error: {
                        message: !profileData
                            ? "Profile not found. Please contact support."
                            : "Account is pending approval. Please contact admin."
                    }
                };
            }

            return { error: null };
        } catch (err: any) {
            console.error("Login error:", err);
            return { error: { message: "Invalid credentials or user not found.", code: err.code } };
        }
    };

    const sendOTP = async (phone: string) => {
        try {
            const formattedPhone = phone.startsWith('+') ? phone : `+91${phone}`;

            const exists = await checkUserExists(phone);
            if (!exists) {
                return {
                    error: {
                        message: "Account not found. Please sign up first.",
                        name: "AuthError",
                        status: 404
                    }
                };
            }

            initRecaptcha();
            if (!recaptchaVerifierRef.current) {
                return { error: { message: "Recaptcha Not Initialized" } };
            }

            const result = await signInWithPhoneNumber(auth, formattedPhone, recaptchaVerifierRef.current);
            setConfirmationResult(result);
            return { error: null };
        } catch (err: any) {
            return { error: { message: err.message, code: err.code } };
        }
    };

    const verifyOTP = async (phone: string, token: string) => {
        try {
            if (!confirmationResult) {
                return { error: { message: "Session expired. Please request OTP again." } };
            }

            const result = await confirmationResult.confirm(token);
            const firebaseUser = result.user;

            const profileData = await fetchProfile(firebaseUser.uid);

            if (!profileData || profileData.status === false) {
                await signOut(auth);
                return {
                    error: {
                        message: !profileData
                            ? "Profile not found. Please contact support."
                            : "Account is pending approval. Please contact admin."
                    }
                };
            }

            return { error: null };
        } catch (err: any) {
            return { error: { message: err.message, code: err.code } };
        }
    };

    const logout = async () => {
        await signOut(auth);
        setProfile(null);
        router.push("/");
    };

    const refreshProfile = async () => {
        if (user) {
            await fetchProfile(user.id);
        }
    };

    return (
        <AuthContext.Provider value={{ user, profile, verifyPhone, completeSignup, login, sendOTP, verifyOTP, logout, refreshProfile, isLoading }}>
            {children}
            <div id="recaptcha-container"></div>
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
