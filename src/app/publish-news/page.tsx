"use client";

import React, { useState, ChangeEvent, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import dynamic from 'next/dynamic';
const JoditEditor = dynamic(() => import('jodit-react'), { ssr: false });


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


    const { user, userData, loading } = useAuth();
    const router = useRouter();
    const editorRef = useRef(null);

    const config: any = useMemo(() => ({
        readonly: false,
        placeholder: 'Write the full news content here...',
        height: 500,
        uploader: { insertImageAsBase64URI: true },
        // Fix for pasting: disable confirmation dialogs and set default action
        askBeforePasteFromWord: false,
        askBeforePasteHTML: false,
        defaultActionOnPaste: 'insert_clear_html',
        buttons: [
            'bold', 'italic', 'underline', 'strikethrough', '|',
            'superscript', 'subscript', '|',
            'ul', 'ol', '|',
            'outdent', 'indent', '|',
            'font', 'fontsize', 'brush', 'paragraph', '|',
            'image', 'table', 'link', '|',
            'align', 'undo', 'redo', '|',
            'hr', 'eraser', 'copyformat', '|',
            'fullsize', 'selectall', 'print', 'source'
        ],
    }), []);

    useEffect(() => {
        if (!loading && !user) {
            router.push("/login");
        }
    }, [user, loading, router]);

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        subcategory: "",
        platform: "",
        summary: "",
        content: "",
        sourceName: "",
        sourceUrl: "",
    });

    const [imageFile, setImageFile] = useState<File | null>(null);

    const mapCategory = (cat: string | undefined): string => {
        if (!cat) return "Cybersecurity";

        const c = cat.toLowerCase();

        if (c.includes("ai") || c.includes("artificial intelligence")) return "AI Updates";
        if (c.includes("cybercrime") || c.includes("crime") || c.includes("fraud") || c.includes("scam") || c.includes("phishing")) return "Cybercrime Trends";
        if (c.includes("global") || c.includes("world") || c.includes("international")) return "Global Trends";
        if (c.includes("governance") || c.includes("internet") || c.includes("regulation")) return "Internet Governance";
        if (c.includes("event") || c.includes("conference") || c.includes("summit")) return "Events";
        if (c.includes("internship") || c.includes("job") || c.includes("career") || c.includes("opportunity")) return "Internship and Job Opportunities";
        if (c.includes("cyber") || c.includes("security") || c.includes("hack")) return "Cybersecurity";
        if (c.includes("law") || c.includes("policy") || c.includes("legal") || c.includes("act")) return "Laws and Policies";

        return "Cybersecurity";
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

            const text = await res.text();
            console.log("API RAW RESPONSE:", text);

            let data;

            try {
                data = JSON.parse(text);
            } catch (e) {
                throw new Error("Invalid JSON response: " + text);
            }

            if (!res.ok) {
                throw new Error(data?.error || data?.message || "Request failed");
            }

            console.log("Parsed API Response:", data);

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

    const handleContentChange = (newContent: string) => {
        setFormData((prev) => ({
            ...prev,
            content: newContent,
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

        if (strippedContent.length > 100000) {
            setError(`The article content exceeds the 100,000 character limit by ${strippedContent.length - 100000} characters.`);
            setSubmitting(false);
            return;
        }

        if (formData.content.length > 20000000) {
            setError("The article media is too large. Please reduce the size or number of embedded images.");
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

            const authorDisplayName = userData?.pseudo_name || userData?.name || user?.email || "Unknown";

            // 3. Construct Payload perfectly matching the actual "news" database schema
            const insertPayload = {
                title: formData.title,
                // Merge subcategory into category if it exists, since the DB column is missing
                category: formData.subcategory 
                    ? `${formData.category} (${formData.subcategory})` 
                    : formData.category,
                summary: formData.summary,
                content: formData.content,
                source: formData.sourceName,
                source_url: formData.sourceUrl,
                author_name: authorDisplayName,
                author_email: user?.email || "Unknown",
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
                subcategory: "",
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
                            Our team will review the content for accuracy and relevance. Once approved, it will be published to the Ministry of Cyber Affairs India news section.
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
                    Submit verified cyber fraud–related news or advisories for review before being published on Ministry of Cyber Affairs India.
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
                                    onChange={(e) => {
                                        handleInputChange(e);
                                        // Reset subcategory when category changes
                                        setFormData((prev) => ({ ...prev, subcategory: "" }));
                                    }}
                                >
                                    <option value="">Select a category</option>
                                    <option value="AI Updates">AI Updates</option>
                                    <option value="Cybercrime Trends">Cybercrime Trends</option>
                                    <option value="Global Trends">Global Trends</option>
                                    <option value="Internet Governance">Internet Governance</option>
                                    <option value="Events">Events</option>
                                    <option value="Internship and Job Opportunities">Internship and Job Opportunities</option>
                                    <option value="Cybersecurity">Cybersecurity</option>
                                    <option value="Laws and Policies">Laws and Policies</option>
                                </select>
                            </div>
                        </div>

                        {/* Subcategory — shown for Cybercrime Trends & Laws and Policies */}
                        {formData.category === "Cybercrime Trends" && (
                            <div className="space-y-2">
                                <Label htmlFor="subcategory">Subcategory <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <select
                                        id="subcategory"
                                        required
                                        className="flex h-9 w-full items-center justify-between whitespace-nowrap rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1"
                                        value={formData.subcategory}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select subcategory</option>
                                        <option value="News">News</option>
                                        <option value="Tutorials">Tutorials</option>
                                    </select>
                                </div>
                            </div>
                        )}

                        {formData.category === "Laws and Policies" && (
                            <div className="space-y-2">
                                <Label htmlFor="subcategory">Country <span className="text-red-500">*</span></Label>
                                <Input
                                    id="subcategory"
                                    required
                                    maxLength={100}
                                    placeholder="e.g. India, USA, UK"
                                    value={formData.subcategory}
                                    onChange={handleInputChange}
                                />
                            </div>
                        )}

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
                            <div className={aiFilledFields.content ? "ai-filled-quill border border-blue-400 rounded p-1" : ""}>
                                <JoditEditor
                                    ref={editorRef}
                                    value={formData.content}
                                    config={config}
                                    onBlur={(newContent) => handleContentChange(newContent)}
                                    onChange={() => {}}
                                />
                            </div>
                            <p className={`text-xs mt-1 text-right ${formData.content.replace(/<[^>]+>/g, '').trim().length > 100000 ? 'text-red-500 font-bold' : 'text-slate-400'}`}>
                                {formData.content.replace(/<[^>]+>/g, '').trim().length} / 100000
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
                                value={userData?.pseudo_name || userData?.name || user?.email || "Loading..."}
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
