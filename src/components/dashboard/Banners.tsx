'use client';

import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { db } from "@/lib/firebase";
import { collection, query, where, getDocs, QueryDocumentSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";

type Banner = {
    id: string;
    title: string | null;
    image_url: string;
    redirect_url: string | null;
    start_date: string | null;
    end_date: string | null;
    position: string | null;
};

export function Banners() {
    const [banners, setBanners] = useState<Banner[]>([]);
    const [loading, setLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const fetchBanners = async () => {
            try {
                const q = query(
                    collection(db, 'banners'),
                    where('active', '==', true)
                );

                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map((doc: QueryDocumentSnapshot) => ({
                    id: doc.id,
                    ...doc.data()
                })) as Banner[];

                if (data) {
                    const activeBanners = data.filter(banner => {
                        const start = banner.start_date ? new Date(banner.start_date) : null;
                        const end = banner.end_date ? new Date(banner.end_date) : null;
                        const today = new Date();

                        const isStarted = !start || start <= today;
                        const isNotEnded = !end || end >= today;

                        return isStarted && isNotEnded;
                    });

                    setBanners(activeBanners);
                }
            } catch (err) {
                console.error("Error fetching banners:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBanners();
    }, []);

    const handleBannerClick = (url: string | null) => {
        if (url) {
            router.push(url);
        }
    };

    if (loading) {
        return <div className="animate-pulse h-[160px] w-full bg-secondary/50 rounded-lg"></div>;
    }

    if (banners.length === 0) {
        return null;
    }

    return (
        <div className="w-full max-w-[calc(100vw-2rem)] overflow-x-auto pb-4 snap-x snap-mandatory no-scrollbar">
            <div className="flex gap-4 w-max px-1">
                {banners.map((banner) => (
                    <Card
                        key={banner.id}
                        className={`w-[calc(100vw-32px)] md:w-[600px] h-[160px] relative overflow-hidden shrink-0 snap-center shadow-md border-0 group ${banner.redirect_url ? 'cursor-pointer' : ''}`}
                        onClick={() => handleBannerClick(banner.redirect_url)}
                    >
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-transform group-hover:scale-105"
                            style={{ backgroundImage: `url(${banner.image_url})` }}
                        />
                        <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                        <CardContent className="flex items-center justify-center h-full relative z-10">
                            <span className="text-white font-bold text-xl text-center px-4">{banner.title}</span>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
