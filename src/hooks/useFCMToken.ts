'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/components/AuthProvider';
import { db } from '@/lib/firebase';
import { requestFCMToken, getMessagingInstance, onMessage } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

export function useFCMToken() {
    const { user } = useAuth();
    const tokenSaved = useRef(false);

    useEffect(() => {
        if (!user || tokenSaved.current) return;

        const registerToken = async () => {
            try {
                const token = await requestFCMToken();
                if (!token) return;

                // Save token to profiles.auth_token
                try {
                    const docRef = doc(db, 'profiles', user.id);
                    await updateDoc(docRef, { auth_token: token });
                    console.log('FCM token saved successfully');
                    tokenSaved.current = true;
                } catch (error) {
                    console.error('Failed to save FCM token:', error);
                }

                // Listen for foreground messages
                const messaging = await getMessagingInstance();
                if (messaging) {
                    onMessage(messaging, (payload) => {
                        console.log('Foreground message:', payload);
                        // Show a browser notification for foreground messages
                        if (Notification.permission === 'granted' && payload.notification) {
                            new Notification(payload.notification.title || 'Shubh Nirman', {
                                body: payload.notification.body,
                                icon: '/icon.png',
                            });
                        }
                    });
                }
            } catch (err) {
                console.error('FCM registration error:', err);
            }
        };

        registerToken();
    }, [user]);
}
