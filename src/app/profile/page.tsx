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
import { Loader2, UserCircle, Upload } from "lucide-react";

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

    const [avatarFile, setAvatarFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setAvatarFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

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
            let finalPhotoUrl = formData.photo_url;

            if (avatarFile) {
                const fileExt = avatarFile.name.split('.').pop();
                const fileName = `${user.id}-${Date.now()}.${fileExt}`;
                const filePath = `${fileName}`;

                const { error: uploadError } = await supabase.storage
                    .from("avatars")
                    .upload(filePath, avatarFile);

                if (uploadError) {
                    throw new Error("Failed to upload avatar: " + uploadError.message + " (Check if 'avatars' bucket exists in Supabase Storage and is set to 'Public')");
                }

                const { data: { publicUrl } } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(filePath);

                finalPhotoUrl = publicUrl;
            }

            // Extract session token from LocalStorage manually to avoid session manager deadlocks
            let token = "";
            if (typeof window !== 'undefined') {
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && key.includes('-auth-token')) {
                        try {
                            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                            token = parsed.access_token || "";
                            break;
                        } catch(e) {}
                    }
                }
            }

            if (!token) {
                throw new Error("No active session token found. Please log in again.");
            }

            // Prepare exactly what goes to the database
            const profilePayload = {
                id: user.id,
                email: user.email,
                name: formData.name,
                designation: formData.designation,
                bio: formData.bio,
                photo_url: finalPhotoUrl,
            };

            // 5. Blast data directly through a NodeJS Server Action
            const { updateProfileAction } = await import("./actions");
            const result = await updateProfileAction(profilePayload, token);

            if (!result.success) {
                throw new Error(result.error || "Failed to save profile via server action.");
            }

            setSuccessMessage("Profile saved successfully!");

            // Reload after a delay to pick up new userData
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
                            <div className="relative group cursor-pointer h-16 w-16 shrink-0">
                                {previewUrl || formData.photo_url ? (
                                    <img 
                                        src={previewUrl || formData.photo_url} 
                                        alt="Avatar" 
                                        className="w-16 h-16 rounded-full object-cover border-2 border-surface-container transition-opacity group-hover:opacity-75"
                                    />
                                ) : (
                                    <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center text-slate-400 transition-opacity group-hover:opacity-75">
                                        <UserCircle className="w-8 h-8" />
                                    </div>
                                )}
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full bg-black/40 pointer-events-none">
                                    <Upload className="w-5 h-5 text-white" />
                                </div>
                                <input 
                                    type="file" 
                                    accept="image/*" 
                                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                    onChange={handleFileChange}
                                    title="Upload Profile Picture"
                                />
                            </div>
                            <div className="space-y-1 w-full max-w-[300px]">
                                <Label htmlFor="photo_url" className="text-sm font-bold text-brand-primary">Avatar URL 🔗</Label>
                                <Input
                                    id="photo_url"
                                    placeholder="Or enter image URL"
                                    value={formData.photo_url}
                                    onChange={(e) => {
                                        setAvatarFile(null);
                                        setPreviewUrl(null);
                                        handleInputChange(e);
                                    }}
                                    className="w-full text-sm"
                                />
                                <p className="text-xs text-slate-500">Click avatar to upload, or paste a URL.</p>
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
