"use client";

import React, { useState, useEffect, ChangeEvent } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import {
    Card,
    CardHeader,
    CardTitle,
    CardDescription,
    CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Loader2, UserCircle } from "lucide-react";

export default function ProfilePage() {
    const { user, userData, loading } = useAuth();
    const router = useRouter();

    const [saving, setSaving] = useState(false);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: "",
        designation: "",
        bio: "",
        photo_url: "",
    });

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    // Pre-fill form when userData is available
    useEffect(() => {
        if (userData) {
            setFormData({
                name: userData.name || "",
                designation: userData.designation || "",
                bio: userData.bio || "",
                photo_url: userData.photo_url || "",
            });
        }
    }, [userData]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setError(null);
        setSuccessMessage(null);

        if (!user) {
            setError("You must be logged in to save your profile.");
            setSaving(false);
            return;
        }

        try {
            const { error: updateError } = await supabase
                .from("users")
                .update({
                    name: formData.name,
                    designation: formData.designation,
                    bio: formData.bio,
                    photo_url: formData.photo_url,
                })
                .eq("id", user.id);

            if (updateError) {
                throw new Error("Failed to update profile: " + updateError.message);
            }

            setSuccessMessage("Profile saved successfully!");

            // Normally, mutating the AuthContext isn't immediately reactive without a full refresh 
            // since it depends on the remote DB state. However, on next load or Auth refresh it picks up.
            // For forced visual updates, reload the page after a brief delay.
            setTimeout(() => {
                window.location.reload();
            }, 1500);

        } catch (err: any) {
            console.error("Profile save error:", err);
            setError(err.message || "An error occurred while saving.");
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24 min-h-screen">
                <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
            </div>
        );
    }

    if (!user) return null;

    return (
        <div className="container mx-auto py-12 px-4 max-w-2xl min-h-[80vh]">
            <div className="mb-8 relative z-10">
                <h1 className="text-3xl font-extrabold text-brand-primary font-headline tracking-tight mb-2">Author Settings</h1>
                <p className="text-slate-500 font-medium">Update your public author identity.</p>
            </div>

            <Card className="glass-panel border-outline-variant/30 relative z-10 overflow-hidden shadow-xl shadow-brand-primary/5">
                <div className="w-full h-1 bg-bastion-gradient" />
                <CardHeader>
                    <CardTitle className="text-xl font-bold font-headline text-brand-primary">Public Profile</CardTitle>
                    <CardDescription>
                        This information will be displayed to readers when your published articles are viewed.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm font-medium">
                            {error}
                        </div>
                    )}
                    {successMessage && (
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-md text-sm font-medium">
                            {successMessage}
                        </div>
                    )}

                    <form onSubmit={handleSaveProfile} className="space-y-6">
                        {/* Avatar Display Logic */}
                        <div className="flex items-center gap-4 mb-2">
                            {formData.photo_url ? (
                                <img 
                                    src={formData.photo_url} 
                                    alt="Avatar" 
                                    className="w-16 h-16 rounded-full object-cover border-2 border-surface-container"
                                />
                            ) : (
                                <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-slate-400">
                                    <UserCircle className="w-8 h-8" />
                                </div>
                            )}
                            <div className="space-y-1">
                                <Label htmlFor="photo_url" className="text-sm font-bold text-brand-primary">Avatar URL 🔗</Label>
                                <Input
                                    id="photo_url"
                                    placeholder="https://example.com/photo.jpg"
                                    value={formData.photo_url}
                                    onChange={handleInputChange}
                                    className="w-full md:w-[300px] text-sm"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="name" className="text-sm font-bold text-brand-primary">Full Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="name"
                                required
                                placeholder="Your full name"
                                className="border-outline-variant/50 focus-visible:ring-brand-accent focus-visible:border-brand-accent transition-all"
                                value={formData.name}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="designation" className="text-sm font-bold text-brand-primary">Designation / Title</Label>
                            <Input
                                id="designation"
                                placeholder="e.g. Cyber Security Analyst"
                                className="border-outline-variant/50 focus-visible:ring-brand-accent focus-visible:border-brand-accent transition-all"
                                value={formData.designation}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="bio" className="text-sm font-bold text-brand-primary">Short Bio</Label>
                            <Textarea
                                id="bio"
                                placeholder="A few sentences about yourself and your expertise..."
                                className="min-h-[100px] border-outline-variant/50 focus-visible:ring-brand-accent focus-visible:border-brand-accent transition-all"
                                value={formData.bio}
                                onChange={handleInputChange}
                            />
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex justify-end gap-4">
                            <Button 
                                type="button" 
                                variant="outline" 
                                onClick={() => router.push('/')}
                                className="font-bold cursor-pointer"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-brand-primary text-white hover:bg-brand-primary/90 font-bold px-8 shadow-md hover:shadow-lg transition-all"
                                disabled={saving}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Profile"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>

            {/* Decorative Grid Pattern behind form */}
            <div className="fixed inset-0 grid-pattern opacity-50 z-0 pointer-events-none" />
        </div>
    );
}
