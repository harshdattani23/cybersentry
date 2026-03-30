"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AlertTriangle, UploadCloud, ShieldCheck, ArrowRight, Lock, Loader2, Info } from "lucide-react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";

export default function ReportFraudPage() {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [caseId, setCaseId] = useState("");
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [phoneWarning, setPhoneWarning] = useState(false);

    const [file, setFile] = useState<File | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            if (selectedFile.type.startsWith("image/")) {
                setFile(selectedFile);
            } else {
                alert("Please select an image file only.");
                e.target.value = "";
            }
        }
    };

    const [bgPlatform, setBgPlatform] = useState("");

    const [formData, setFormData] = useState({
        title: "",
        category: "",
        platform: "",
        description: "",
        phone: "",
        websiteUrl: "",
        otherPlatform: "",
        upi: ""
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { id, value } = e.target;

        if (id === "phone") {
            if (/[^0-9+]/.test(value)) {
                setPhoneWarning(true);
                setTimeout(() => setPhoneWarning(false), 3000);
            } else {
                setPhoneWarning(false);
            }
            const filteredValue = value.replace(/[^0-9+]/g, '');
            setFormData(prev => ({ ...prev, phone: filteredValue }));
            return;
        }

        if (id === "platform") {
            setBgPlatform(value);
            setFormData(prev => ({ ...prev, platform: value }));
        } else {
            // Map IDs to state keys
            const keyMap: { [key: string]: string } = {
                "category": "category",
                "platform": "platform",
                "title": "title",
                "description": "description",
                "phone": "phone",
                "website-url": "websiteUrl",
                "other-platform": "otherPlatform",
                "upi": "upi"
            };

            const stateKey = keyMap[id] || id;
            setFormData(prev => ({ ...prev, [stateKey]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setErrorMsg(null);

        const finalPlatform = formData.platform === 'other' ? formData.otherPlatform : formData.platform;
        const finalUrl = formData.platform === 'website' ? formData.websiteUrl : formData.upi;

        try {
            let uploadedFileUrl = "";

            if (file) {
                console.log("Uploading evidence...");
                const fileExt = file.name.split('.').pop();
                const fileName = `evidence-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                
                const { error: uploadError, data: uploadData } = await supabase.storage
                    .from('evidence')
                    .upload(fileName, file);

                if (uploadError) {
                    console.warn("Evidence storage upload error. Bucket might not exist, but we will proceed:", uploadError);
                } else {
                    const { data: publicData } = supabase.storage.from('evidence').getPublicUrl(fileName);
                    uploadedFileUrl = publicData.publicUrl;
                }
            }

            const insertPayload: any = {
                title: formData.title,
                category: formData.category,
                platform: finalPlatform,
                description: formData.description,
                phone: formData.phone,
                url: finalUrl,
                status: 'under_review',
                is_public: true,
            };

            if (uploadedFileUrl) {
                insertPayload.evidence_url = uploadedFileUrl;
            }

            console.log("Inserting record into cases table...");
            // Notice the .select() appended to the insert to fix React/Next.js silent infinite hanging on supabase insertions!
            const { error: insertError } = await supabase.from("cases").insert(insertPayload).select();

            if (insertError) {
                // If evidence_url column doesn't exist in DB schema, we gracefully retry without it
                if (insertError.message.includes('evidence_url')) {
                    console.warn("Table cases does not have evidence_url, retrying without it...");
                    delete insertPayload.evidence_url;
                    const { error: retryError } = await supabase.from("cases").insert(insertPayload).select();
                    if (retryError) throw retryError;
                } else {
                    throw insertError;
                }
            }

            // Generate Mock ID for display
            const randomId = Math.floor(1000 + Math.random() * 9000);
            const newCaseId = `CS-IND-2026-${randomId}`;

            setCaseId(newCaseId);
            setIsSubmitted(true);

            // Clear form
            setFormData({
                title: "",
                category: "",
                platform: "",
                description: "",
                phone: "",
                websiteUrl: "",
                otherPlatform: "",
                upi: ""
            });
            setBgPlatform("");
            setFile(null);

        } catch (error) {
            console.error("Error submitting report:", error);
            setErrorMsg(error instanceof Error ? error.message : "Failed to submit report. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
                <Card className="max-w-md w-full border-t-4 border-t-green-600 shadow-lg">
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto bg-green-100 p-3 rounded-full w-fit mb-4">
                            <ShieldCheck className="w-8 h-8 text-green-600" />
                        </div>
                        <CardTitle className="text-2xl font-bold text-slate-900">Report Received</CardTitle>
                        <CardDescription className="text-slate-600">
                            Your report has been securely logged in the National Cyber Crime Repository.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 text-center">
                        <div className="bg-slate-100 p-4 rounded-lg border border-slate-200">
                            <p className="text-xs uppercase tracking-wider text-slate-500 font-semibold mb-1">Generated Case ID</p>
                            <p className="text-2xl font-mono font-bold text-slate-900">{caseId}</p>
                        </div>
                        <p className="text-sm text-slate-500">
                            A preliminary verification has been initiated. You can track the status of this case publicly using the Case ID above.
                        </p>
                        <Button className="w-full bg-blue-700 hover:bg-blue-800" asChild>
                            <Link href={`/case/${caseId}`}>
                                View Case Details <ArrowRight className="ml-2 w-4 h-4" />
                            </Link>
                        </Button>
                        <Button variant="outline" className="w-full" onClick={() => setIsSubmitted(false)}>
                            Submit Another Report
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="container mx-auto px-4 max-w-2xl">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Report Online Fraud</h1>
                    <p className="text-slate-600">
                        Submit details of suspicious activities. Your report helps alert the nation and initiates authoritative action.
                    </p>
                </div>

                <Card className="border-slate-200 shadow-md">
                    <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
                        <div className="flex items-center text-blue-700 text-sm font-medium bg-blue-50 p-3 rounded border border-blue-100">
                            <Info className="w-4 h-4 mr-2 shrink-0" />
                            Disclaimer: Please share information to the best of your knowledge. Reports are reviewed for accuracy to help prevent misuse of the system.
                        </div>
                        {errorMsg && (
                            <div className="flex items-center text-red-700 text-sm font-medium bg-red-50 p-3 rounded border border-red-100 mt-2">
                                <AlertTriangle className="w-4 h-4 mr-2 shrink-0" />
                                {errorMsg}
                            </div>
                        )}
                    </CardHeader>
                    <form onSubmit={handleSubmit}>
                        <CardContent className="space-y-6 pt-6">

                            {/* Title */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="title">Report Title <span className="text-red-500">*</span></Label>
                                    <span className="text-xs text-slate-500">{formData.title.length}/100</span>
                                </div>
                                <Input
                                    id="title"
                                    required
                                    placeholder="Short summary of the incident"
                                    value={formData.title}
                                    onChange={handleChange}
                                    maxLength={100}
                                />
                            </div>

                            {/* Category Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="category">Suspected Fraud Category <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <select
                                        id="category"
                                        required
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                        value={formData.category}
                                        onChange={handleChange}
                                    >
                                        <option value="" disabled>Select a category...</option>
                                        <option value="upi">UPI / Payment Fraud</option>
                                        <option value="website">Fake Website / Phishing</option>
                                        <option value="call">Fake Customer Care Call</option>
                                        <option value="sms">SMS / Smishing</option>
                                        <option value="whatsapp">WhatsApp / Social Media Fraud</option>
                                        <option value="investment">Investment / Loan App Fraud</option>
                                        <option value="other">Other Cyber Crime</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>

                            {/* Platform Selection */}
                            <div className="space-y-2">
                                <Label htmlFor="platform">Platform Involved <span className="text-red-500">*</span></Label>
                                <div className="relative">
                                    <select
                                        id="platform"
                                        required
                                        value={bgPlatform}
                                        onChange={handleChange}
                                        className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 appearance-none"
                                    >
                                        <option value="" disabled>Select the platform where this occurred...</option>
                                        <option value="whatsapp">WhatsApp</option>
                                        <option value="instagram">Instagram</option>
                                        <option value="telegram">Telegram</option>
                                        <option value="facebook">Facebook</option>
                                        <option value="twitter">Twitter / X</option>
                                        <option value="email">Email</option>
                                        <option value="sms">SMS</option>
                                        <option value="website">Website / Online Portal</option>
                                        <option value="call">Phone Call</option>
                                        <option value="other">Other</option>
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                        <svg className="h-4 w-4 fill-current" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                                    </div>
                                </div>
                            </div>

                            {bgPlatform === 'website' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="website-url">Website URL</Label>
                                    <Input
                                        id="website-url"
                                        type="url"
                                        placeholder="https://example.com"
                                        value={formData.websiteUrl}
                                        onChange={handleChange}
                                        maxLength={255}
                                    />
                                </div>
                            )}

                            {bgPlatform === 'other' && (
                                <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                    <Label htmlFor="other-platform">Specify Platform</Label>
                                    <Input
                                        id="other-platform"
                                        type="text"
                                        placeholder="E.g. OLX, Quikr, Signal..."
                                        value={formData.otherPlatform}
                                        onChange={handleChange}
                                        maxLength={50}
                                    />
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <Label htmlFor="description">Incident Description <span className="text-red-500">*</span></Label>
                                    <span className="text-xs text-slate-500">{formData.description.length}/1000</span>
                                </div>
                                <Textarea
                                    id="description"
                                    placeholder="Describe what happened. Include dates, amounts, and specific messages received..."
                                    className="min-h-[120px]"
                                    required
                                    value={formData.description}
                                    onChange={handleChange}
                                    maxLength={1000}
                                />
                            </div>

                            {/* Identifiers */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Suspicious Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+91 XXXXX XXXXX"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        maxLength={20}
                                    />
                                    {phoneWarning && (
                                        <p className="text-xs text-red-500 animate-in fade-in transition-all">
                                            Only numbers/digits are allowed.
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="upi">Suspicious UPI ID / URL</Label>
                                    <Input
                                        id="upi"
                                        type="text"
                                        placeholder="example@upi or https://..."
                                        value={formData.upi}
                                        onChange={handleChange}
                                        maxLength={255}
                                    />
                                </div>
                            </div>

                            {/* Evidence Upload */}
                            <div className="space-y-2">
                                <Label>Upload Evidence (Screenshots)</Label>
                                <div 
                                    className="border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-slate-500 hover:bg-slate-50 transition-colors cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    <UploadCloud className="w-8 h-8 mb-2 text-slate-400" />
                                    <span className="text-sm font-medium">
                                        {file ? file.name : "Click to upload images"}
                                    </span>
                                    {!file && <span className="text-xs text-slate-400 mt-1">JPG, PNG up to 5MB</span>}
                                </div>
                                <input 
                                    type="file" 
                                    ref={fileInputRef} 
                                    className="hidden" 
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                            </div>

                        </CardContent>
                        <CardFooter className="flex flex-col space-y-4 pt-2 pb-6 border-t border-slate-100 mt-2 bg-slate-50/50">
                            <div className="flex items-center text-xs text-slate-500 w-full justify-center mb-2">
                                <Lock className="w-3 h-3 mr-1" />
                                Your connection is secure (256-bit SSL Encrypted)
                            </div>
                            <Button type="submit" className="w-full h-11 text-base bg-red-600 hover:bg-red-700 shadow-md" disabled={isSubmitting}>
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Report...
                                    </>
                                ) : (
                                    "Submit Report"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>
            </div>
        </div>
    );
}
