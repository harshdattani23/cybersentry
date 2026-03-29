
'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface LogViewProps {
    articleId: string;
}

export function LogView({ articleId }: LogViewProps) {
    useEffect(() => {
        const logView = async () => {
            try {
                // Fetch current user from Supabase session
                const { data: { user } } = await supabase.auth.getUser();

                await fetch('/api/log-article-view', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ 
                        article_id: articleId,
                        user_id: user?.id || null,
                        user_email: user?.email || null,
                    }),
                });
            } catch (error) {
                console.error('Error logging article view:', error);
            }
        };

        logView();
    }, [articleId]);

    return null;
}
