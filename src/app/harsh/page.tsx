"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth, UserData } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, ShieldCheck, User, Newspaper, ExternalLink, Globe, Eye, Send, MapPin, Monitor, Smartphone, Tablet } from "lucide-react";
import Link from "next/link";
import { generateSlug } from "@/lib/utils";

interface NewsArticle {
    id: string;
    title: string;
    category: string;
    summary: string;
    status: string;
    created_at: unknown;
}

interface GeoLog {
    id: string;
    event_type: 'article_view' | 'article_publish';
    article_id: string | null;
    user_id: string | null;
    user_email: string | null;
    ip_address: string;
    country: string;
    state: string;
    city: string;
    device_type: string;
    user_agent: string | null;
    created_at: string;
    article_title?: string;
}

export default function AdminDashboard() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    const [usersList, setUsersList] = useState<UserData[]>([]);
    const [fetchingUsers, setFetchingUsers] = useState(true);

    // Key is uid of user, value is array of their articles
    const [userArticles, setUserArticles] = useState<Record<string, NewsArticle[]>>({});
    const [expandedUser, setExpandedUser] = useState<string | null>(null);

    // Geo logs state
    const [geoLogs, setGeoLogs] = useState<GeoLog[]>([]);
    const [fetchingGeoLogs, setFetchingGeoLogs] = useState(true);
    const [loadingTraceId, setLoadingTraceId] = useState<string | null>(null);
    const [geoFilter, setGeoFilter] = useState<'all' | 'article_view' | 'article_publish'>('all');
    const [showAllGeoLogs, setShowAllGeoLogs] = useState(false);

    // Add security listener
    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push("/login");
            } else if (!userData || userData.role !== "admin") {
                router.push("/");
            }
        }
    }, [user, userData, loading, router]);

    // Fetch User list
    useEffect(() => {
        let mounted = true;

        // Emergency safety timeout to forcefully kill the loader
        const emergencyTimeout = setTimeout(() => {
            if (mounted) setFetchingUsers(false);
        }, 3000);

        const fetchAllUsers = async () => {
            if (!userData || userData.role !== "admin") {
                if (mounted) setFetchingUsers(false);
                return;
            }
            try {
                // Ensure the Supabase client has initialized the session auth headers 
                // before making the request, otherwise RLS blocks it and returns 0 rows.
                await supabase.auth.getSession();

                const { data, error } = await supabase
                    .from("users")
                    .select("*");

                if (error) throw error;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const allUsers = (data || []).map((d: any) => ({
                    ...d,
                    uid: d.id,
                    approvedToPublish: d.approved_to_publish
                })) as UserData[];

                // Sort users: pending approval first
                allUsers.sort((a, b) => {
                    if (a.approvedToPublish === b.approvedToPublish) return 0;
                    return a.approvedToPublish ? 1 : -1;
                });
                
                if (mounted) setUsersList(allUsers);
            } catch (error) {
                console.error("Error fetching users roster:", error);
            } finally {
                if (mounted) setFetchingUsers(false);
            }
        };

        if (userData?.role === "admin") {
            fetchAllUsers();
        }

        return () => {
            mounted = false;
            clearTimeout(emergencyTimeout);
        };
    }, [userData?.uid, userData?.role]);

    // Fetch Geo Logs
    useEffect(() => {
        let mounted = true;

        const fetchGeoLogs = async () => {
            if (!userData || userData.role !== "admin") {
                if (mounted) setFetchingGeoLogs(false);
                return;
            }
            try {
                const { data, error } = await supabase
                    .from('geo_logs')
                    .select('*')
                    .order('created_at', { ascending: false })
                    .limit(100);

                if (error) throw error;

                // Fetch article titles for the logs
                const articleIds = Array.from(new Set((data || []).map((log: any) => log.article_id).filter(Boolean)));
                if (articleIds.length > 0) {
                    const { data: newsData } = await supabase
                        .from('news')
                        .select('id, title')
                        .in('id', articleIds);
                        
                    const titleMap: Record<string, string> = {};
                    (newsData || []).forEach((n: any) => {
                        titleMap[n.id] = n.title;
                    });
                    
                    data.forEach((log: any) => {
                        log.article_title = titleMap[log.article_id] || "Unknown Article";
                    });
                }

                if (mounted) setGeoLogs((data || []) as GeoLog[]);
            } catch (error) {
                console.error("Error fetching geo logs:", error);
            } finally {
                if (mounted) setFetchingGeoLogs(false);
            }
        };

        if (userData?.role === "admin") {
            fetchGeoLogs();
        }

        return () => { mounted = false; };
    }, [userData?.uid, userData?.role]);

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

    const fetchUserArticles = async (targetId: string) => {
        // Toggle expansion
        if (expandedUser === targetId) {
            setExpandedUser(null);
            return;
        }

        setExpandedUser(targetId);

        // Return if we already cached their articles
        if (userArticles[targetId]) return;

        setLoadingTraceId(targetId);
        try {
            const { data, error } = await supabase
                .from("news")
                .select("*")
                .eq("author_id", targetId)
                .order("created_at", { ascending: false });

            if (error) throw error;

            setUserArticles(prev => ({ ...prev, [targetId]: (data || []) as NewsArticle[] }));
        } catch (error) {
            console.error("Error fetching articles for user:", error);
        } finally {
            setLoadingTraceId(null);
        }
    };

    // Filter geo logs
    const filteredGeoLogs = geoFilter === 'all'
        ? geoLogs
        : geoLogs.filter(log => log.event_type === geoFilter);

    // Stats
    const totalViews = geoLogs.filter(l => l.event_type === 'article_view').length;
    const totalPublishes = geoLogs.filter(l => l.event_type === 'article_publish').length;
    const uniqueCountries = [...new Set(geoLogs.map(l => l.country).filter(c => c !== 'Unknown' && c !== 'Localhost'))].length;
    const uniqueStates = [...new Set(geoLogs.map(l => l.state).filter(s => s !== 'Unknown' && s !== 'Localhost'))].length;
    const uniqueCities = [...new Set(geoLogs.map(l => l.city).filter(c => c !== 'Unknown' && c !== 'Localhost'))].length;

    const getDeviceIcon = (device: string) => {
        switch (device) {
            case 'mobile': return <Smartphone className="h-3.5 w-3.5" />;
            case 'tablet': return <Tablet className="h-3.5 w-3.5" />;
            default: return <Monitor className="h-3.5 w-3.5" />;
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        const now = new Date();
        const date = new Date(dateStr);
        const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

        if (diff < 60) return `${diff}s ago`;
        if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
        if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
        return `${Math.floor(diff / 86400)}d ago`;
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
                        <p className="text-slate-600">Approve publishers and moderate Ministry of Cyber Affairs content flow.</p>
                    </div>
                </div>

                {/* ===== GEO SECURITY INTEL SECTION ===== */}
                <div className="mb-8">
                    <Card className="border-indigo-100 shadow-sm overflow-hidden">
                        <CardHeader className="bg-gradient-to-r from-indigo-50 via-blue-50 to-purple-50 border-b border-indigo-100">
                            <CardTitle className="text-lg font-bold flex items-center gap-2">
                                <Globe className="h-5 w-5 text-indigo-600" />
                                Geo Security Intelligence
                                <Badge variant="secondary" className="ml-auto bg-indigo-100 text-indigo-700 font-mono text-xs">
                                    {geoLogs.length} Events Tracked
                                </Badge>
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 bg-white">
                            {/* Stats Row */}
                            <div className="grid grid-cols-5 border-b border-slate-100">
                                <div className="p-5 text-center border-r border-slate-100">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Eye className="h-4 w-4 text-blue-500" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Views</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{totalViews}</p>
                                </div>
                                <div className="p-5 text-center border-r border-slate-100">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Send className="h-4 w-4 text-emerald-500" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Publishes</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{totalPublishes}</p>
                                </div>
                                <div className="p-5 text-center border-r border-slate-100">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <Globe className="h-4 w-4 text-indigo-500" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Countries</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{uniqueCountries}</p>
                                </div>
                                <div className="p-5 text-center border-r border-slate-100">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <MapPin className="h-4 w-4 text-purple-500" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">States</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{uniqueStates}</p>
                                </div>
                                <div className="p-5 text-center">
                                    <div className="flex items-center justify-center gap-2 mb-1">
                                        <MapPin className="h-4 w-4 text-rose-500" />
                                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Cities</span>
                                    </div>
                                    <p className="text-2xl font-bold text-slate-900">{uniqueCities}</p>
                                </div>
                            </div>

                            {/* Filter Tabs */}
                            <div className="flex items-center gap-2 px-6 pt-4 pb-3">
                                <button
                                    onClick={() => setGeoFilter('all')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all ${geoFilter === 'all' ? 'bg-indigo-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    All Events
                                </button>
                                <button
                                    onClick={() => setGeoFilter('article_view')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${geoFilter === 'article_view' ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Eye className="h-3 w-3" /> Views
                                </button>
                                <button
                                    onClick={() => setGeoFilter('article_publish')}
                                    className={`px-4 py-1.5 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 ${geoFilter === 'article_publish' ? 'bg-emerald-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                                >
                                    <Send className="h-3 w-3" /> Publishes
                                </button>
                            </div>


                            {/* Geo Logs Table */}
                            {fetchingGeoLogs ? (
                                <div className="flex justify-center p-12">
                                    <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                                </div>
                            ) : filteredGeoLogs.length === 0 ? (
                                <div className="p-8 text-center text-slate-500">
                                    No geo tracking events recorded yet. Events will appear here when users view or publish articles.
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-slate-100 bg-slate-50/50">
                                                <th className="text-left px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Event</th>
                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Article</th>
                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">User</th>
                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Country</th>
                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">State</th>
                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">City</th>
                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">IP Address</th>
                                                <th className="text-left px-4 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">Device</th>
                                                <th className="text-right px-6 py-3 text-xs font-bold text-slate-400 uppercase tracking-wider">When</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50">
                                            {filteredGeoLogs.slice(0, showAllGeoLogs ? undefined : 6).map((log) => (
                                                <tr key={log.id} className="hover:bg-slate-50/80 transition-colors group">
                                                    <td className="px-6 py-3.5">
                                                        {log.event_type === 'article_view' ? (
                                                            <Badge className="bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 text-[10px] font-bold gap-1">
                                                                <Eye className="h-3 w-3" />
                                                                VIEWED
                                                            </Badge>
                                                        ) : (
                                                            <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 text-[10px] font-bold gap-1">
                                                                <Send className="h-3 w-3" />
                                                                PUBLISHED
                                                            </Badge>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5 max-w-[200px]">
                                                        {log.article_id ? (
                                                            <Link href={`/news/${generateSlug(log.article_title || 'article')}-${log.article_id}`} target="_blank" className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline line-clamp-2" title={log.article_title || log.article_id}>
                                                                {log.article_title || "Unknown Article"}
                                                            </Link>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">N/A</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        {log.user_email ? (
                                                            <span className="text-xs text-slate-700 font-medium">{log.user_email}</span>
                                                        ) : (
                                                            <span className="text-xs text-slate-400 italic">Anonymous</span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <Globe className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                                                            <span className="font-semibold text-slate-900 text-sm">{log.country}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-purple-400 shrink-0" />
                                                            <span className="text-sm text-slate-700">{log.state}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5">
                                                            <MapPin className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                                                            <span className="text-sm font-medium text-slate-800">{log.city}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <code className="text-xs font-mono text-slate-600 bg-slate-100 px-2 py-1 rounded">
                                                            {log.ip_address}
                                                        </code>
                                                    </td>
                                                    <td className="px-4 py-3.5">
                                                        <div className="flex items-center gap-1.5 text-slate-500">
                                                            {getDeviceIcon(log.device_type)}
                                                            <span className="text-xs font-medium capitalize">{log.device_type}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-3.5 text-right">
                                                        <span className="text-xs text-slate-500 font-medium" title={new Date(log.created_at).toLocaleString()}>
                                                            {formatTimeAgo(log.created_at)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {!fetchingGeoLogs && filteredGeoLogs.length > 6 && (
                                <div className="p-4 border-t border-slate-50 text-center bg-slate-50/20">
                                    <Button 
                                        variant="ghost" 
                                        size="sm" 
                                        onClick={() => setShowAllGeoLogs(!showAllGeoLogs)}
                                        className="text-indigo-600 font-bold hover:text-indigo-800 hover:bg-indigo-50 px-8 py-2 h-auto transition-all"
                                    >
                                        {showAllGeoLogs ? "Collapse Security Ledger" : "View Full Intelligence List"}
                                        {showAllGeoLogs ? (
                                            <ShieldCheck className="ml-2 h-4 w-4" />
                                        ) : (
                                            <ExternalLink className="ml-2 h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* ===== EXISTING PUBLISHERS LIST ===== */}
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
                                                    variant={expandedUser === listUser.id ? "secondary" : "ghost"}
                                                    size="sm"
                                                    onClick={() => fetchUserArticles(listUser.id)}
                                                    disabled={loadingTraceId === listUser.id}
                                                    className="w-full md:w-auto text-slate-600 border border-slate-200 gap-2"
                                                >
                                                    {loadingTraceId === listUser.id ? (
                                                        <Loader2 className="h-4 w-4 animate-spin" />
                                                    ) : (
                                                        <Newspaper className="h-4 w-4 text-slate-400" />
                                                    )}
                                                    {expandedUser === listUser.id ? "Hide Trace History" : "View Trace History"}
                                                </Button>

                                                {listUser.role !== 'admin' && (
                                                    <Button
                                                        variant={listUser.approvedToPublish ? "outline" : "default"}
                                                        className={`w-full md:w-[160px] ${listUser.approvedToPublish ? "hover:bg-red-50 hover:text-red-700 hover:border-red-200" : "bg-emerald-600 hover:bg-emerald-700 text-white"}`}
                                                        onClick={() => handleToggleApproval(listUser.uid, listUser.approvedToPublish)}
                                                    >
                                                        {listUser.approvedToPublish ? "Revoke Publish" : "Allow to Publish"}
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
                                        {expandedUser === listUser.id && (
                                            <div className="bg-slate-50 px-6 py-6 border-t border-slate-100 inner-shadow-sm">
                                                <div className="flex items-center justify-between mb-4">
                                                    <h4 className="font-semibold text-sm text-slate-700 uppercase tracking-wider">
                                                        Content Log Ledger
                                                    </h4>
                                                </div>

                                                {userArticles[listUser.id] === undefined || loadingTraceId === listUser.id ? (
                                                    <div className="flex items-center text-sm text-slate-500 py-2">
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" /> Loading records from secure ledger...
                                                    </div>
                                                ) : userArticles[listUser.id].length === 0 ? (
                                                    <div className="bg-white border border-slate-200 border-dashed rounded text-center p-6 text-slate-500 text-sm">
                                                        This user hasn&apos;t published any articles yet.
                                                    </div>
                                                ) : (
                                                    <div className="grid gap-3">
                                                        {userArticles[listUser.id].map(article => (
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
                                                                    <Link href={`/news/${generateSlug(article.title)}-${article.id}`} target="_blank">
                                                                        <h5 className="font-semibold text-slate-900 group-hover/card:text-blue-700 transition-colors cursor-pointer">
                                                                            {article.title}
                                                                        </h5>
                                                                    </Link>
                                                                    <p className="text-sm text-slate-500 line-clamp-1 mt-1 font-serif max-w-2xl">
                                                                        {article.summary}
                                                                    </p>
                                                                </div>
                                                                <Link href={`/news/${generateSlug(article.title)}-${article.id}`} target="_blank" className="text-slate-400 hover:text-blue-700 p-2">
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
