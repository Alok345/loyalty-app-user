"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowDownLeft, ArrowUpRight, TrendingDown, TrendingUp } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { collection, query, where, orderBy, getDocs, Timestamp } from "firebase/firestore";

type Transaction = {
    id: string;
    type: "EARN" | "REDEEM";
    amount: number;
    description: string | null;
    created_at: any;
};

export default function HistoryPage() {
    const tNav = useTranslations("Navigation");
    const tDash = useTranslations("Dashboard");
    const tHist = useTranslations("History");
    const { user, profile } = useAuth();
    const [history, setHistory] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    const totalScanned = history
        .filter((item) => item.type === "EARN")
        .reduce((sum, item) => sum + item.amount, 0);

    const totalRedeemed = history
        .filter((item) => item.type === "REDEEM")
        .reduce((sum, item) => sum + item.amount, 0);

    useEffect(() => {
        if (!user) return;

        const fetchHistory = async () => {
            try {
                const q = query(
                    collection(db, "transactions"),
                    where("user_id", "==", user.id),
                    orderBy("created_at", "desc")
                );

                const querySnapshot = await getDocs(q);
                const data = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                })) as Transaction[];

                if (data) {
                    setHistory(data);
                }
            } catch (err) {
                console.error("Error fetching history:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchHistory();
    }, [user]);

    const formatDate = (dateInput: any) => {
        let date: Date;
        if (dateInput instanceof Timestamp) {
            date = dateInput.toDate();
        } else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
        } else if (dateInput?.seconds) {
            date = new Date(dateInput.seconds * 1000);
        } else {
            return "N/A";
        }
        return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    };

    return (
        <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold tracking-tight">{tNav("history")}</h1>

            <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:col-span-3">
                {/* Total Earned Card */}
                <Card className="border border-border transition-colors hover:border-primary/30 bg-card/50 backdrop-blur">
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {tHist("totalEarned")}
                            </span>
                            <div className="rounded-lg bg-green-500/10 p-2">
                                <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{totalScanned}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{tHist("points")}</p>
                    </CardContent>
                </Card>

                {/* Total Redeemed Card */}
                <Card className="border border-border transition-colors hover:border-primary/30 bg-card/50 backdrop-blur">
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {tHist("totalRedeemed")}
                            </span>
                            <div className="rounded-lg bg-orange-500/10 p-2">
                                <TrendingDown className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{totalRedeemed}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{tHist("points")}</p>
                    </CardContent>
                </Card>

                {/* Current Balance Card */}
                <Card className="border border-border transition-colors hover:border-primary/30 bg-card/50 backdrop-blur sm:col-span-2 lg:col-span-1">
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                {tHist("currentBalance")}
                            </span>
                            <div className="rounded-lg bg-blue-500/10 p-2">
                                <ArrowUpRight className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-foreground">{profile?.points_balance || 0}</p>
                        <p className="mt-1 text-xs text-muted-foreground">{tHist("points")}</p>
                    </CardContent>
                </Card>
            </div>

            <ScrollArea className="h-[calc(100vh-10rem)]">
                <div className="flex flex-col gap-3">
                    <h2 className="mb-4 text-lg font-semibold text-foreground px-1">
                        {tHist("transactionHistory")}
                    </h2>
                    {loading &&
                        [1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 bg-secondary/30 rounded animate-pulse" />
                        ))}

                    {!loading && history.length === 0 && (
                        <div className="text-center text-muted-foreground py-10">{tDash("noTransactions")}</div>
                    )}

                    {!loading &&
                        history.map((item) => (
                            <Card key={item.id} className="overflow-hidden transition-all hover:bg-muted/50">
                                <CardContent className="p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`p-2 rounded-full ${item.type === "EARN"
                                                ? "bg-green-100 text-green-700 dark:bg-green-900/30"
                                                : "bg-orange-100 text-orange-700 dark:bg-orange-900/30"
                                                }`}
                                        >
                                            {item.type === "EARN" ? (
                                                <ArrowDownLeft className="h-5 w-5" />
                                            ) : (
                                                <ArrowUpRight className="h-5 w-5" />
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-semibold">
                                                {item.description ||
                                                    (item.type === "EARN" ? tDash("pointsEarned") : tDash("pointsRedeemed"))}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
                                                {formatDate(item.created_at)}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1">
                                        <span
                                            className={`font-bold ${item.type === "EARN" ? "text-green-600" : "text-orange-600"
                                                }`}
                                        >
                                            {item.type === "EARN" ? "+" : "-"}
                                            {item.amount} {tHist("pointsShort")}
                                        </span>
                                        <Badge
                                            variant={item.type === "EARN" ? "secondary" : "outline"}
                                            className="text-xs"
                                        >
                                            {item.type}
                                        </Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                </div>
            </ScrollArea>
        </div>
    );
}
