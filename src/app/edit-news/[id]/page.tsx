"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dynamic from 'next/dynamic';
const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });

import { supabase } from "@/lib/supabase";
import { editArticleAction } from "@/app/publish-news/actions";
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
import { Loader2 } from "lucide-react";

export default function EditNewsPage() {
    const params = useParams();
    const [articleId, setArticleId] = useState<string | null>(null);

    const [loadingData, setLoadingData] = useState(true);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);


    const { user, userData, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        platform: "",
        summary: "",
        content: "",
        sourceName: "",
        sourceUrl: "",
    });

    const [existingImageUrl, setExistingImageUrl] = useState<string>("");
    const [imageFile, setImageFile] = useState<File | null>(null);

    // Initial fetch of data
    useEffect(() => {
        const fetchArticleData = async () => {
            if (!params.id) return;
            const fullIdStr = Array.isArray(params.id) ? params.id[0] : params.id;
            const idComponents = fullIdStr.split('-');
            const extractedId = idComponents[idComponents.length - 1];
            setArticleId(extractedId);

            try {
                const { data, error } = await supabase
                    .from("news")
                    .select("*")
                    .eq("id", extractedId)
                    .single();

                if (error) {
                    setError("Article could not be found or loaded.");
                } else if (data) {
                    // Check ownership initially
                    if (user && data.author_id !== user.id) {
                        setError("Unauthorized: You are not the author of this article.");
                    } else {
                        setFormData({
                            title: data.title || "",
                            category: data.category || "",
                            platform: data.platform || "",
                            summary: data.summary || "",
                            content: data.content || "",
                            sourceName: data.source || "",
                            sourceUrl: data.source_url || "",
                        });
                        if (data.image_url) {
                            setExistingImageUrl(data.image_url);
                        }
                    }
                }
            } catch (err) {
                console.error(err);
                setError("Error loading article.");
            } finally {
                setLoadingData(false);
            }
        };

        if (user) {
            fetchArticleData();
        }
    }, [params.id, user]);

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
    };

    const handleContentChange = (newContent: string) => {
        setFormData((prev) => ({
            ...prev,
            content: newContent,
        }));
    };

    const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            if (!file.type.startsWith('image/')) {
                const errorMsg = "Only image files are allowed. Documents or videos are not accepted";
                setError(errorMsg);
                alert(errorMsg);
                e.target.value = ''; // Reset the input
                setImageFile(null);
                return;
            }
            setError(null);
            setImageFile(file);
        } else {
            setImageFile(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        setError(null);

        if (!articleId || !user) {
             setError("Cannot identify the article or user to edit.");
             setSubmitting(false);
             return;
        }

        // --- Client-Side Validation ---
        if (formData.title.trim().length < 10 || formData.title.length > 150) {
            setError("Title must be between 10 and 150 characters long.");
            setSubmitting(false);
            return;
        }

        if (formData.summary.trim().length < 10 || formData.summary.length > 500) {
            setError("Article summary must be between 10 and 500 characters long.");
            setSubmitting(false);
            return;
        }

        const strippedContent = formData.content.replace(/<[^>]+>/g, '').trim();
        if (strippedContent.length < 50) {
            setError("The article content is too short. Please provide more details.");
            setSubmitting(false);
            return;
        }

        if (strippedContent.length > 20000) {
            setError(`The article content exceeds the 20000 character limit by ${strippedContent.length - 20000} characters.`);
            setSubmitting(false);
            return;
        }

        if (imageFile) {
            const maxSize = 5 * 1024 * 1024; // 5MB limit
            if (!imageFile.type.startsWith('image/')) {
                setError("Only image files are allowed. Documents or videos are not accepted");
                setSubmitting(false);
                return;
            }
            if (imageFile.size > maxSize) {
                setError("The featured image exceeds the 5MB size limit.");
                setSubmitting(false);
                return;
            }
        }

        try {
            let imageUrl: string = existingImageUrl;

            // Convert the featured image file to base64 data URI for storage
            if (imageFile) {
                console.log("Converting featured image to base64...");
                imageUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error("Failed to read image file."));
                    reader.readAsDataURL(imageFile);
                });
            }

            const updatePayload = {
                title: formData.title,
                category: formData.category,
                platform: formData.platform,
                summary: formData.summary,
                content: formData.content,
                source: formData.sourceName,
                source_url: formData.sourceUrl,
                image_url: imageUrl,
            };

            // Extract session token from LocalStorage manually
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

            const result = await editArticleAction(articleId, user.id, updatePayload, token);

            if (!result.success) {
                throw new Error(result.error || "Failed to edit article database entry.");
            }

            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

        } catch (err) {
            console.error('CRITICAL Error editing article:', err);
            setError(err instanceof Error ? err.message : "An error occurred while updating the article.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading || loadingData) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
                <span className="ml-3 text-slate-600 font-medium">{loading ? 'Checking authentication...' : 'Loading article data...'}</span>
            </div>
        );
    }
    
    // Explicit protection against unauthorized viewing of form
    if (error && error.includes("Unauthorized")) {
        return (
            <div className="container mx-auto py-12 px-4 max-w-3xl">
                <Card className="border-red-200 bg-red-50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-red-800 text-2xl">Access Denied</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-red-700 mb-6 font-semibold">
                            {error}
                        </p>
                        <Button onClick={() => router.push("/")} className="bg-red-700 hover:bg-red-800 text-white">Return Home</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (userData && !userData?.approvedToPublish && userData?.role !== 'admin') {
        return (
            <div className="container mx-auto py-12 px-4 max-w-3xl">
                <Card className="border-amber-200 bg-amber-50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-amber-800 text-2xl">Pending Admin Approval</CardTitle>
                        <CardDescription className="text-amber-700 text-lg">
                            Your account is currently under review by an administrator.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-amber-700 mb-6">
                            For security purposes, all news publishers must be manually verified. You will be able to edit articles once an administrator approves your account.
                        </p>
                        <Button
                            onClick={() => router.push("/")}
                            className="bg-amber-700 hover:bg-amber-800 text-white"
                        >
                            Return Home
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="container mx-auto py-12 px-4 max-w-3xl">
                <Card className="border-green-200 bg-green-50 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-green-800 text-2xl">Edit Successful</CardTitle>
                        <CardDescription className="text-green-700 text-lg">
                            Your article has been successfully updated.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button
                            onClick={() => router.push(`/news/${articleId}`)}
                            className="bg-green-700 hover:bg-green-800 text-white"
                        >
                            View Updated Article
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Edit Published News Article</h1>
                <p className="text-slate-600">
                    Update the information for your verified cyber fraud article.
                </p>
            </div>

            <Card>
                <CardContent className="pt-6">
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-md">
                            {error}
                        </div>
                    )}
                    <form onSubmit={handleSubmit} className="space-y-6">

                        {/* Article Title */}
                        <div className="space-y-2">
                            <Label htmlFor="title">Article Title <span className="text-red-500">*</span></Label>
                            <Input
                                id="title"
                                required
                                maxLength={150}
                                placeholder="Enter the headline of the news article (max 150 characters)"
                                value={formData.title}
                                onChange={handleInputChange}
                            />
                        </div>

                        {/* News Category */}
                        <div className="space-y-2">
                            <Label htmlFor="category">News Category <span className="text-red-500">*</span></Label>
                            <div className="relative">
                                <select
                                    id="category"
                                    required
                                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                                    value={formData.category}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select a category</option>
                                    <option value="Banking Fraud">Banking Fraud</option>
                                    <option value="UPI Fraud">UPI Fraud</option>
                                    <option value="Cyber Advisory">Cyber Advisory</option>
                                    <option value="Policy Update">Policy Update</option>
                                    <option value="Emerging Scam">Emerging Scam</option>
                                    <option value="AI Fraud">AI Fraud</option>
                                </select>
                            </div>
                        </div>

                        {/* Platform Involved */}
                        <div className="space-y-2">
                            <Label htmlFor="platform">Platform Involved (Optional)</Label>
                            <div className="relative">
                                <select
                                    id="platform"
                                    className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                                    value={formData.platform}
                                    onChange={handleInputChange}
                                >
                                    <option value="">Select platform</option>
                                    <option value="whatsapp">WhatsApp</option>
                                    <option value="telegram">Telegram</option>
                                    <option value="instagram">Instagram</option>
                                    <option value="facebook">Facebook</option>
                                    <option value="email">Email</option>
                                    <option value="website">Website</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>
                        </div>

                        {/* Article Summary */}
                        <div className="space-y-2">
                            <Label htmlFor="summary">Article Summary <span className="text-red-500">*</span></Label>
                            <Textarea
                                id="summary"
                                required
                                maxLength={500}
                                placeholder="Brief summary of the article... (max 500 chars)"
                                className="min-h-[80px]"
                                value={formData.summary}
                                onChange={handleInputChange}
                            />
                            <p className="text-xs text-slate-400 mt-1 text-right">
                                {formData.summary.length} / 500
                            </p>
                        </div>

                        {/* Full Article Content */}
                        <div className="space-y-2">
                            <Label htmlFor="content" className="text-base font-semibold">Full Article Content <span className="text-red-500">*</span></Label>
                            <div>
                                <JoditEditor
                                    value={formData.content}
                                    config={{
                                        readonly: false,
                                        placeholder: 'Write the full news content here...',
                                        height: 500,
                                        uploader: { insertImageAsBase64URI: true },
                                    }}
                                    onBlur={(newContent) => handleContentChange(newContent)}
                                    onChange={() => {}}
                                />
                            </div>
                            <p className={`text-xs mt-1 text-right ${formData.content.replace(/<[^>]+>/g, '').trim().length > 20000 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                {formData.content.replace(/<[^>]+>/g, '').trim().length} / 20000
                            </p>
                        </div>

                        {/* Source Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="sourceName">Source / Organization Name <span className="text-red-500">*</span></Label>
                                <Input
                                    id="sourceName"
                                    required
                                    maxLength={100}
                                    placeholder="e.g. RBI, Cyber Cell, News Agency"
                                    value={formData.sourceName}
                                    onChange={handleInputChange}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sourceUrl">Source URL (Optional)</Label>
                                <Input
                                    id="sourceUrl"
                                    type="url"
                                    maxLength={500}
                                    placeholder="https://..."
                                    value={formData.sourceUrl}
                                    onChange={handleInputChange}
                                />
                                <p className="text-xs text-slate-400 mt-1 text-right">
                                    {formData.sourceUrl.length} / 500
                                </p>
                            </div>
                        </div>

                        {/* Featured Image */}
                        <div className="space-y-2">
                            <Label htmlFor="image">Replace Featured Image (Optional)</Label>
                            {existingImageUrl && !imageFile && (
                                <div className="mb-2 w-32 h-32 relative rounded-md overflow-hidden border border-slate-200">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img src={existingImageUrl} alt="Current Featured" className="object-cover w-full h-full" />
                                </div>
                            )}
                            <Input
                                id="image"
                                type="file"
                                accept="image/jpeg, image/png, image/webp"
                                className="cursor-pointer"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-slate-500">Supported formats: JPG, PNG, WebP. Max size: 5MB. Leave blank to keep existing image.</p>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4 flex items-center justify-between">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={submitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-blue-900 hover:bg-blue-800 text-white px-8"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save Changes"
                                )}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
