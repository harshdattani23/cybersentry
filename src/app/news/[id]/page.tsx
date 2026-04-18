import { supabase } from "@/lib/supabase";
import { Metadata } from "next";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { LogView } from "@/components/news/LogView";
import { NewsArticleClient, NewsArticle } from "@/components/news/NewsArticleClient";

export const dynamic = 'force-dynamic';

export async function generateMetadata({
    params,
}: {
    params: Promise<{ id: string }>;
}): Promise<Metadata> {
    const { id } = await params;
    
    // Extract actual UUID if a slug is present
    const match = id.match(/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/);
    const actualId = match ? match[1] : id;

    try {
        const { data: article, error } = await supabase
            .from("news")
            .select(`
                title, 
                summary, 
                image_url, 
                created_at, 
                author_name, 
                author_email,
                author:author_id (
                    name,
                    pseudo_name
                )
            `)
            .eq("id", actualId)
            .single();

        if (error || !article) {
            return {
                title: 'Article Not Found - Ministry of Cyber Affairs',
            };
        }

        // Prioritize Pseudo Name -> Full Name -> Email
        const authorProfile = (article as any).author;
        const authorDisplayName = authorProfile?.pseudo_name || article.author_name || 'Ministry of Cyber Affairs Team';

        return {
            title: `${article.title} - Ministry of Cyber Affairs News`,
            description: article.summary,
            openGraph: {
                title: article.title,
                description: article.summary,
                type: 'article',
                publishedTime: article.created_at,
                authors: [authorDisplayName],
                ...(article.image_url ? { images: [article.image_url] } : {}),
            },
            twitter: {
                card: 'summary_large_image',
                title: article.title,
                description: article.summary,
                ...(article.image_url ? { images: [article.image_url] } : {}),
            },
        };
    } catch {
        return {
            title: 'Article Not Found - Ministry of Cyber Affairs',
        };
    }
}

export default async function Page({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    // Extract actual UUID if a slug is present
    const match = id.match(/([a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{4}-[a-fA-F0-9]{12})$/);
    const actualId = match ? match[1] : id;

    console.log("Article ID:", actualId);

    // Guard: if id is missing or empty, show not found
    if (!id) {
        return (
            <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center min-h-[60vh]">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Article Not Found</h1>
                <p className="text-slate-600 mb-8 max-w-md">
                    The news article you are looking for does not exist or has been removed.
                </p>
                <Link href="/">
                    <Button>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Button>
                </Link>
            </div>
        );
    }

    let newsArticle: NewsArticle | null = null;
    let hasError = false;

    try {
        const { data: docData, error: dbError } = await supabase
            .from("news")
            .select(`
                *,
                author:author_id (
                    name,
                    pseudo_name
                )
            `)
            .eq("id", actualId)
            .single();

        if (dbError || !docData) {
            hasError = true;
        } else {
            const authorProfile = (docData as any).author;
            const authorDisplayName = authorProfile?.pseudo_name || docData.author_name || "Ministry of Cyber Affairs Team";

            newsArticle = {
                id: docData.id,
                title: docData.title || "",
                category: docData.category || "",
                summary: docData.summary || "",
                content: docData.content || "",
                author_name: authorDisplayName,
                source_name: docData.source || docData.source_name || "Unknown Source",
                source_url: docData.source_url || null,
                created_at: docData.created_at || "",
                image_url: docData.image_url || null,
                platform: docData.platform || null,
                status: docData.status || "",
                author_id: docData.author_id || null,
            };
        }
    } catch (error) {
        console.error("Error fetching article:", error);
        hasError = true;
    }

    if (hasError || !newsArticle) {
        return (
            <div className="container mx-auto px-4 py-20 flex flex-col items-center justify-center text-center min-h-[60vh]">
                <h1 className="text-3xl font-bold text-slate-900 mb-4">Article Not Found</h1>
                <p className="text-slate-600 mb-8 max-w-md">
                    The news article you are looking for does not exist or has been removed.
                </p>
                <Link href="/">
                    <Button>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back to Home
                    </Button>
                </Link>
            </div>
        );
    }

    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'NewsArticle',
        headline: newsArticle.title,
        image: newsArticle.image_url ? [newsArticle.image_url] : [],
        datePublished: newsArticle.created_at,
        dateModified: newsArticle.created_at, // Using created_at since updated_at isn't fetched separately
        author: [{
            '@type': 'Person',
            name: newsArticle.author_name,
        }],
        description: newsArticle.summary,
    };

    return (
        <>
            {/* JSON-LD Structured Data for Google search and LLMs */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />
            <LogView articleId={newsArticle.id} />
            <NewsArticleClient article={newsArticle} />
        </>
    );
}
