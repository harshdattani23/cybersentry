"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserData } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, User, Newspaper, ExternalLink } from "lucide-react";
import Link from "next/link";

interface NewsArticle {
    id: string;
    title: string;
    category: string;
    summary: string;
    status: string;
    created_at: unknown;
}

export default function AdminDashboard() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    const [usersList, setUsersList] = useState<UserData[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(true);

    // Key is uid of user, value is array of their articles
    const [userArticles, setUserArticles] = useState<Record<string, NewsArticle[]>>({});
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    // Add security listener
    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (userData && userData.role !== "admin") {
                router.push("/");
            }
        }
    }, [user, userData, loading, router]);

    // Fetch User list
    useEffect(() => {
        const fetchAllUsers = async () => {
            if (!userData || userData.role !== "admin") return;
            try {
                const { data, error } = await supabase
                    .from("users")
                    .select("*");

                if (error) throw error;

                const allUsers = (data || []).map(d => ({
                    ...d,
                    uid: d.id,
                    approvedToPublish: d.approved_to_publish
                })) as UserData[];

                // Sort users: pending approval first
                allUsers.sort((a, b) => {
                    if (a.approvedToPublish === b.approvedToPublish) return 0;
                    return a.approvedToPublish ? 1 : -1;
                });
                setUsersList(allUsers);
            } catch (error) {
                console.error("Error fetching users roster:", error);
            } finally {
                setFetchingUsers(false);
            }
        };

        if (userData?.role === "admin") {
            fetchAllUsers();
        }
    }, [userData]);

    const handleToggleApproval = async (targetUid: string, currentStatus: boolean) => {
        try {
            const { error } = await supabase
                .from("users")
                .update({ approved_to_publish: !currentStatus })
                .eq("id", targetUid);

            if (error) throw error;

            // Update local state without refetching
            setUsersList(prev => prev.map(u =>
                u.uid === targetUid ? { ...u, approvedToPublish: !currentStatus } : u
            ));
        } catch (error) {
            console.error("Error updating approval status:", error);
            alert("Failed to update approval status. Please check console for details.");
        }
    };

    const fetchUserArticles = async (targetUid: string) => {
        // Toggle expansion
        if (expandedUser === targetUid) {
            setExpandedUser(null);
            return;
        }

        setExpandedUser(targetUid);

        // Return if we already cached their articles
        if (userArticles[targetUid]) return;

        try {
            const { data, error } = await supabase
                .from("news")
                .select("*")
                .eq("author_id", targetUid)
                .order("created_at", { ascending: false });

            if (error) throw error;

            const articles = (data || []) as NewsArticle[];

            setUserArticles(prev => ({ ...prev, [targetUid]: articles }));
        } catch (error) {
            console.error("Error fetching articles for user:", error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-32">
                <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
                <span className="ml-3 text-slate-600 font-medium">Loading Security Console...</span>
            </div>
        );
    }

    if (!userData || userData.role !== "admin") {
        return null; // Should redirect via useEffect
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4 max-w-5xl">
                <div className="flex items-center gap-3 mb-8">
                    <ShieldCheck className="h-8 w-8 text-blue-800" />
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900">Admin Security Dashboard</h1>
                        <p className="text-slate-600">Approve publishers and moderate CyberSentry content flow.</p>
                    </div>
                </div>

                <Card className="border-blue-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-white border-b border-slate-100">
                        <CardTitle className="text-lg font-bold flex items-center justify-between">
                            Registered Publishers Data List
                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-mono">
                                {usersList.length} Total Users
                            </Badge>
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0 bg-white">
                        {fetchingUsers ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                            </div>
                        ) : usersList.length === 0 ? (
                            <div className="p-8 text-center text-slate-500">
                                No registered users found.
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100">
                                {usersList.map((listUser) => (
                                    <div key={listUser.uid} className="group">
                                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-6 hover:bg-slate-50/50 transition-colors">
                                            <div className="flex items-start gap-4 mb-4 md:mb-0">
                                                <div className="bg-slate-100 p-3 rounded-full text-slate-500">
                                                    <User className="h-5 w-5" />
                                                </div>
                                                <div>
                                                    <h3 className="font-semibold text-slate-900 text-lg flex items-center gap-2">
                                                        {listUser.email}
                                                        {listUser.role === 'admin' && (
                                                            <Badge variant="outline" className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                                                                Admin Flag
                                                            </Badge>
                                                        )}
                                                    </h3>
                                                    <p className="text-xs font-mono text-slate-400 mt-1">UID: {listUser.uid}</p>
                                                </div>
                                            </div>

                                            <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => fetchUserArticles(listUser.uid)}
                                                    className="w-full md:w-auto text-slate-600 border border-slate-200"
                                                >
                                                    <Newspaper className="h-4 w-4 mr-2 text-slate-400" />
                                                    View Trace History
                                                </Button>

                                                {listUser.role !== 'admin' && (
                                                    <Button
                                                        variant={listUser.approvedToPublish ? "outline" : "default"}
                                                        className={`w-full md:w-[160px] ${listUser.approvedToPublish ? "hover:bg-red-50 hover:text-red-700 hover:border-red-200" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                                                        onClick={() => handleToggleApproval(listUser.uid, listUser.approvedToPublish)}
                                                    >
                                                        {listUser.approvedToPublish ? "Revoke Access" : "Approve Publisher"}
                                                    </Button>
                                                )}
                                                {listUser.role === 'admin' && (
                                                    <Button variant="outline" className="w-full md:w-[160px]" disabled>
                                                        System Admin
                                                    </Button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Dropdown for Articles showing exactly what they submitted */}
                                        {expandedUser === listUser.uid && (
                                            <div className="bg-slate-50 px-6 py-6 border-t border-slate-100 inner-shadow-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">
                                                        Content Log Ledger
                                                    </h4>
                                                </div>

                                                {userArticles[listUser.uid] === undefined ? (
                                                    <div className="flex items-center text-sm text-slate-500 py-2">
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading records...
                                                    </div>
                                                ) : userArticles[listUser.uid].length === 0 ? (
                                                    <div className="bg-white border border-slate-200 border-dashed rounded text-center p-6 text-slate-500 text-sm">
                                                        This user hasn&apos;t published any articles yet.
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-3">
                                                        {userArticles[listUser.uid].map(article => (
                                                            <div key={article.id} className="bg-white border border-slate-200 rounded p-4 flex justify-between items-center group/card hover:border-blue-300 transition-colors">
                                                                <div>
                                                                    <div className="flex items-center gap-2 mb-1.5">
                                                                        <Badge variant="secondary" className="text-[10px] font-medium bg-slate-100">
                                                                            {article.category}
                                                                        </Badge>
                                                                        <Badge variant="outline" className={`text-[10px] font-medium ${article.status === 'published' ? 'text-emerald-700 border-emerald-200 bg-emerald-50' : 'text-slate-500'}`}>
                                                                            {article.status.toUpperCase()}
                                                                        </Badge>
                                                                    </div>
                                                                    <h5 className="font-semibold text-slate-900 group-hover/card:text-blue-700 transition-colors">
                                                                        {article.title}
                                                                    </h5>
                                                                    <p className="text-sm text-slate-500 line-clamp-1 mt-1 font-serif max-w-2xl">
                                                                        {article.summary}
                                                                    </p>
                                                                </div>
                                                                <Link href={`/news/${article.id}`} target="_blank" className="text-slate-400 hover:text-blue-700 p-2">
                                                                    <ExternalLink className="h-5 w-5" />
                                                                </Link>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
