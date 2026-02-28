'use client';

import { useEffect, useState } from "react";
import { db } from "@/lib/firebase";
import { collection, query, orderBy, limit, getDocs } from "firebase/firestore";
import { motion, AnimatePresence } from "framer-motion";

type Winner = {
    id: string;
    full_name: string;
    item_name: string;
};

export function RecentWinners() {
    const [winners, setWinners] = useState<Winner[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        const fetchWinners = async () => {
            try {
                const q = query(
                    collection(db, 'winners'),
                    orderBy('created_at', 'desc'),
                    limit(5)
                );

                const querySnapshot = await getDocs(q);
                if (!querySnapshot.empty) {
                    const data = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    })) as Winner[];
                    setWinners(data);
                    return;
                }
            } catch (err) {
                console.error("Error fetching winners:", err);
            }

            // Fallback mock data if no real redemptions exist yet
            setWinners([
                { id: '1', full_name: 'Gourav', item_name: 'Premium Gift Box' },
                { id: '2', full_name: 'Amit', item_name: 'Voucher code' },
                { id: '3', full_name: 'Suresh', item_name: 'Iron Box' },
                { id: '4', full_name: 'Rajesh', item_name: 'Smart Watch' },
            ]);
        };

        fetchWinners();
    }, []);

    useEffect(() => {
        if (winners.length > 0) {
            const timer = setInterval(() => {
                setCurrentIndex((prev) => (prev + 1) % winners.length);
            }, 4000);
            return () => clearInterval(timer);
        }
    }, [winners]);

    if (winners.length === 0) return null;

    const currentWinner = winners[currentIndex];

    return (
        <div className="fixed bottom-10 left-0 right-0 flex justify-center z-50 pointer-events-none">
            <AnimatePresence mode="wait">
                <motion.div
                    key={currentWinner.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-2 rounded-full shadow-2xl flex items-center gap-3"
                >
                    <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="text-white text-sm font-medium">
                        <span className="text-amber-400 font-bold">{currentWinner.full_name}</span> has just won <span className="text-blue-300 italic">{currentWinner.item_name}</span>!
                    </p>
                </motion.div>
            </AnimatePresence>
        </div>
    );
}
