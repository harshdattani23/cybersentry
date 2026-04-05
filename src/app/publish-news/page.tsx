"use client";

import React, { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dynamic from 'next/dynamic';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

import { supabase } from "@/lib/supabase";
import { publishArticleAction } from "./actions";
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
import { Loader2, FileUp, Sparkles } from "lucide-react";
import { Toaster, toast } from "react-hot-toast";

export default function PublishNewsPage() {
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [extracting, setExtracting] = useState(false);
    const [aiFilledFields, setAiFilledFields] = useState({
        title: false,
        category: false,
        summary: false,
        content: false,
        sourceName: false,
    });

    const quillModules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            ['bold', 'italic', 'underline', 'strike'],
            ['blockquote', 'code-block'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            [{ 'script': 'sub'}, { 'script': 'super' }],
            [{ 'indent': '-1'}, { 'indent': '+1' }],
            [{ 'direction': 'rtl' }],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'align': [] }],
            ['link', 'image', 'video'],
            ['clean']
        ],
    };

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

    const [imageFile, setImageFile] = useState<File | null>(null);

    const mapCategory = (cat: string | undefined): string => {
        if (!cat) return "Emerging Scam";

        const c = cat.toLowerCase();

        if (c.includes("upi")) return "UPI Fraud";
        if (c.includes("bank") || c.includes("banking")) return "Banking Fraud";
        if (c.includes("ai")) return "AI Fraud";
        if (c.includes("policy") || c.includes("regulation")) return "Policy Update";
        if (c.includes("advisory") || c.includes("warning")) return "Cyber Advisory";
        if (c.includes("scam") || c.includes("fraud") || c.includes("phishing")) return "Emerging Scam";

        return "Emerging Scam";
    };

    const handlePdfChange = (e: ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setPdfFile(e.target.files[0]);
        } else {
            setPdfFile(null);
        }
    };

    const handleAutoFill = async () => {
        if (!pdfFile) return;

        setExtracting(true);
        setError(null);

        const toastId = toast.loading("Extracting data from PDF...");

        try {
            const fd = new FormData();
            fd.append("file", pdfFile);

            const res = await fetch("/api/extract-pdf", {
                method: "POST",
                body: fd,
            });

            const data = await res.json();

            if (data.success) {
                setFormData((prev) => ({
                    ...prev,
                    title: data.data.title || prev.title,
                    category: mapCategory(data.data.category),
                    summary: data.data.summary || prev.summary,
                    content: data.data.content || prev.content,
                    sourceName: data.data.source || prev.sourceName,
                }));
                setAiFilledFields({
                    title: !!data.data.title,
                    category: !!data.data.category,
                    summary: !!data.data.summary,
                    content: !!data.data.content,
                    sourceName: !!data.data.source,
                });
                toast.success("Fields auto-filled successfully!", { id: toastId });
            } else {
                const errMsg = data.error || "Failed to extract PDF content.";
                setError(errMsg);
                toast.error(errMsg, { id: toastId });
            }
        } catch (err) {
            console.error("Auto-fill error:", err);
            const errMsg = err instanceof Error ? err.message : "Failed to extract PDF content.";
            setError(errMsg);
            toast.error(errMsg, { id: toastId });
        } finally {
            setExtracting(false);
        }
    };

    const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [id]: value,
        }));
        if (id in aiFilledFields) {
            setAiFilledFields((prev) => ({ ...prev, [id]: false }));
        }
    };

    const handleContentChange = (content: string, delta: any, source: string, editor: any) => {
        if (editor.getLength() - 1 > 2000) {
            editor.deleteText(2000, editor.getLength());
            return;
        }
        setFormData((prev) => ({
            ...prev,
            content,
        }));
        if (aiFilledFields.content) {
            setAiFilledFields((prev) => ({ ...prev, content: false }));
        }
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

        // 1. Log the initial form data
        console.log("Form Submission Started");
        console.log("Current Form Data:", formData);

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

        if (strippedContent.length > 2000) {
            setError(`The article content exceeds the 2000 character limit by ${strippedContent.length - 2000} characters.`);
            setSubmitting(false);
            return;
        }

        if (formData.content.length > 50000) {
            setError("The article formatting is too large. Please reduce the size of embedded media.");
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
            let imageUrl: string = "";

            // Convert the featured image file to base64 data URI for storage
            if (imageFile) {
                console.log("Converting featured image to base64...");
                imageUrl = await new Promise<string>((resolve, reject) => {
                    const reader = new FileReader();
                    reader.onload = () => resolve(reader.result as string);
                    reader.onerror = () => reject(new Error("Failed to read image file."));
                    reader.readAsDataURL(imageFile);
                });
                console.log("Featured image converted successfully. Size:", Math.round(imageUrl.length / 1024), "KB");
            }

            // 3. Construct Payload perfectly matching the actual "news" database schema
            const insertPayload = {
                title: formData.title,
                category: formData.category,
                summary: formData.summary,
                content: formData.content,
                source: formData.sourceName,
                source_url: formData.sourceUrl,
                author_email: userData?.name || user?.email || "Unknown",
                author_id: user?.id || null,
                image_url: imageUrl,
                views: 0
            };

            console.log("Routing directly to secure Server Action instead of browser fetch.", insertPayload);

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

            // 5. Blast data directly through a NodeJS Server Action
            // This 100% bypasses any browser connection locks, extensions, or cross-origin limits
            const result = await publishArticleAction(insertPayload, token);

            if (!result.success) {
                console.error("Server Action Failed:", result.error);
                throw new Error(result.error || "Failed to insert article into database via server action.");
            }

            console.log("Article successfully saved to database with ID:", result.data?.id);

            setSubmitted(true);
            window.scrollTo({ top: 0, behavior: 'smooth' });

            // Reset form
            setFormData({
                title: "",
                category: "",
                platform: "",
                summary: "",
                content: "",
                sourceName: "",
                sourceUrl: "",
            });
            setImageFile(null);

        } catch (err) {
            console.error('CRITICAL Error submitting article:', err);
            setError(err instanceof Error ? err.message : "An error occurred while submitting the article.");
        } finally {
            setSubmitting(false);
            console.log("Form submission process finished.");
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-24">
                <Loader2 className="h-8 w-8 animate-spin text-blue-900" />
                <span className="ml-3 text-slate-600 font-medium">Checking authentication...</span>
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
                            For security purposes, all news publishers must be manually verified. You will be able to publish articles once an administrator approves your account.
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
                        <CardTitle className="text-green-800 text-2xl">Submission Successful</CardTitle>
                        <CardDescription className="text-green-700 text-lg">
                            Your article has been submitted for review.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-green-700 mb-6">
                            Our team will review the content for accuracy and relevance. Once approved, it will be published to the CyberSentry India news section.
                        </p>
                        <Button
                            onClick={() => setSubmitted(false)}
                            className="bg-green-700 hover:bg-green-800 text-white"
                        >
                            Submit Another Article
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-12 px-4 max-w-3xl">
            <Toaster position="top-right" toastOptions={{ style: { fontSize: '14px' } }} />
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-slate-900 mb-2">Publish Cyber Fraud News Article</h1>
                <p className="text-slate-600">
                    Submit verified cyber fraud–related news or advisories for review before being published on CyberSentry India.
                </p>
            </div>

            {/* PDF Auto-Fill Section */}
            <Card className="mb-6 border-dashed border-2 border-blue-300 bg-blue-50/40">
                <CardContent className="pt-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                        <div className="flex-1 space-y-2 w-full">
                            <Label htmlFor="pdfUpload" className="text-sm font-semibold text-blue-900 flex items-center gap-2">
                                <FileUp className="h-4 w-4" />
                                Auto-Fill from PDF
                            </Label>
                            <p className="text-xs text-slate-500 mb-1">Upload a PDF document to automatically extract and fill in the form fields below.</p>
                            <Input
                                id="pdfUpload"
                                type="file"
                                accept="application/pdf"
                                className="cursor-pointer bg-white"
                                onChange={handlePdfChange}
                            />
                        </div>
                        <Button
                            type="button"
                            onClick={handleAutoFill}
                            disabled={!pdfFile || extracting}
                            className="bg-blue-700 hover:bg-blue-800 text-white px-6 whitespace-nowrap"
                        >
                            {extracting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Extracting...
                                </>
                            ) : (
                                <>
                                    <FileUp className="mr-2 h-4 w-4" />
                                    Auto Fill from PDF
                                </>
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

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
                            <div className="flex items-center gap-2">
                                <Label htmlFor="title">Article Title <span className="text-red-500">*</span></Label>
                                {aiFilledFields.title && <span className="ai-badge"><Sparkles className="h-3 w-3" /> AI Suggested</span>}
                            </div>
                            <Input
                                id="title"
                                required
                                maxLength={150}
                                placeholder="Enter the headline of the news article (max 150 characters)"
                                value={formData.title}
                                onChange={handleInputChange}
                                className={aiFilledFields.title ? "ai-filled" : ""}
                            />
                        </div>

                        {/* News Category */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="category">News Category <span className="text-red-500">*</span></Label>
                                {aiFilledFields.category && <span className="ai-badge"><Sparkles className="h-3 w-3" /> AI Suggested</span>}
                            </div>
                            <div className="relative">
                                <select
                                    id="category"
                                    required
                                    className={`flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1 ${aiFilledFields.category ? "ai-filled" : ""}`}
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
                            <div className="flex items-center gap-2">
                                <Label htmlFor="summary">Article Summary <span className="text-red-500">*</span></Label>
                                {aiFilledFields.summary && <span className="ai-badge"><Sparkles className="h-3 w-3" /> AI Suggested</span>}
                            </div>
                            <Textarea
                                id="summary"
                                required
                                maxLength={500}
                                placeholder="Brief summary of the article... (max 500 chars)"
                                className={`min-h-[80px] ${aiFilledFields.summary ? "ai-filled" : ""}`}
                                value={formData.summary}
                                onChange={handleInputChange}
                            />
                            <p className="text-xs text-slate-400 mt-1 text-right">
                                {formData.summary.length} / 500
                            </p>
                        </div>

                        {/* Full Article Content */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2">
                                <Label htmlFor="content" className="text-base font-semibold">Full Article Content <span className="text-red-500">*</span></Label>
                                {aiFilledFields.content && <span className="ai-badge"><Sparkles className="h-3 w-3" /> AI Suggested</span>}
                            </div>
                            <div className={`react-quill-wrapper ${aiFilledFields.content ? "ai-filled-quill" : ""}`}>
                                <ReactQuill
                                    theme="snow"
                                    value={formData.content}
                                    onChange={handleContentChange}
                                    modules={quillModules}
                                    placeholder="Write the full news content here..."
                                />
                            </div>
                            <p className={`text-xs mt-1 text-right ${formData.content.replace(/<[^>]+>/g, '').trim().length > 2000 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                {formData.content.replace(/<[^>]+>/g, '').trim().length} / 2000
                            </p>
                        </div>

                        {/* Source Info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="flex items-center gap-2">
                                    <Label htmlFor="sourceName">Source / Organization Name <span className="text-red-500">*</span></Label>
                                    {aiFilledFields.sourceName && <span className="ai-badge"><Sparkles className="h-3 w-3" /> AI Suggested</span>}
                                </div>
                                <Input
                                    id="sourceName"
                                    required
                                    maxLength={100}
                                    placeholder="e.g. RBI, Cyber Cell, News Agency"
                                    value={formData.sourceName}
                                    onChange={handleInputChange}
                                    className={aiFilledFields.sourceName ? "ai-filled" : ""}
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
                            <Label htmlFor="image">Upload Featured Image (Optional)</Label>
                            <Input
                                id="image"
                                type="file"
                                accept="image/jpeg, image/png, image/webp"
                                className="cursor-pointer"
                                onChange={handleFileChange}
                            />
                            <p className="text-xs text-slate-500">Supported formats: JPG, PNG, WebP. Max size: 5MB.</p>
                        </div>

                        {/* Author Name */}
                        <div className="space-y-2">
                            <Label htmlFor="authorName">Author Name <span className="text-red-500">*</span></Label>
                            <Input
                                id="authorName"
                                readOnly
                                className="bg-slate-100 text-slate-500 cursor-not-allowed"
                                value={userData?.name || user?.email || "Loading..."}
                            />
                        </div>

                        {/* Declaration */}
                        <div className="flex items-start space-x-2 pt-2">
                            <input
                                type="checkbox"
                                id="declaration"
                                required
                                className="mt-1 h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-600"
                            />
                            <Label htmlFor="declaration" className="text-sm font-normal leading-tight cursor-pointer">
                                I confirm that this information is accurate to the best of my knowledge.
                            </Label>
                        </div>

                        {/* Submit Button */}
                        <div className="pt-4">
                            <Button
                                type="submit"
                                className="w-full md:w-auto bg-blue-900 hover:bg-blue-800 text-white px-8"
                                disabled={submitting}
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Submitting...
                                    </>
                                ) : (
                                    "Submit Article for Review"
                                )}
                            </Button>
                        </div>

                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
