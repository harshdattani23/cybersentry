"use client";

import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { User, AuthChangeEvent, Session } from "@supabase/supabase-js";

export interface UserData {
    id: string;
    email: string;
    role: "user" | "admin";
    approved_to_publish: boolean;
    created_at?: string;
    // New Profile Fields
    name?: string;
    pseudo_name?: string;
    designation?: string;
    bio?: string;
    photo_url?: string;
    // Map existing structure for compatibility with older code
    uid: string;
    approvedToPublish: boolean;
}

interface AuthContextType {
    user: User | null;
    userData: UserData | null;
    loading: boolean;
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [userData, setUserData] = useState<UserData | null>(null);
    const [loading, setLoading] = useState(true);
    const pendingFetchRef = useRef<string | null>(null);

    useEffect(() => {
        let mounted = true;

        // Emergency fallback: never let the app get stuck in a loading state for more than 4 seconds
        const emergencyTimeout = setTimeout(() => {
            if (mounted) setLoading(false);
        }, 4000);

        async function fetchUserData(currentUser: User) {
            // Prevent concurrent overlapping fetches for the same user
            if (pendingFetchRef.current === currentUser.id) return;
            pendingFetchRef.current = currentUser.id;

            // Guarantee loading state drops after 3s even if Supabase queue freezes
            let dataResolved = false;
            const failSafe = setTimeout(() => {
                if (mounted && !dataResolved) setLoading(false);
            }, 3000);

            try {
                const { data, error } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", currentUser.id)
                    .single();

                dataResolved = true;

                if (data && !error) {
                    const userObj = {
                        ...data,
                        uid: data.id,
                        approvedToPublish: data.approved_to_publish
                    } as UserData;
                    setUserData(userObj);
                    try { localStorage.setItem('cs_userData', JSON.stringify(userObj)); } catch(e){}
                } else {
                    // SEEDING LOGIC: If the public.users table row is missing, try to create it as a fallback.
                    // This fixes cases where the Supabase trigger is missing or failed.
                    console.log("No public.users profile found. Attempting to auto-create profile...");
                    const { data: upsertData, error: upsertError } = await supabase
                        .from("users")
                        .upsert({
                            id: currentUser.id,
                            email: currentUser.email,
                            role: currentUser.email?.includes('admin') || currentUser.email === 'harshdattani12@gmail.com' ? "admin" : "user", // Auto-elevate owner email
                            approved_to_publish: false
                        })
                        .select("*")
                        .single();

                    if (!upsertError && upsertData) {
                        const newUserObj = {
                            ...upsertData,
                            uid: upsertData.id,
                            approvedToPublish: upsertData.approved_to_publish
                        } as UserData;
                        setUserData(newUserObj);
                        try { localStorage.setItem('cs_userData', JSON.stringify(newUserObj)); } catch(e){}
                    } else {
                        // A DOMException (like AbortError) or native Error won't show properties in a generic console.log sometimes,
                        // so we log its message or serialize it manually to prevent the cryptic `{}` output.
                        const errorDetails = upsertError instanceof Error 
                            ? upsertError.message 
                            : typeof upsertError === 'object' && upsertError !== null 
                                ? JSON.stringify(upsertError, Object.getOwnPropertyNames(upsertError)) 
                                : String(upsertError);

                        // Handle "Lock broken" specifically to avoid noisy error logs
                        const isLockError = errorDetails.includes("Lock broken") || errorDetails.includes("steal");
                        
                        if (isLockError) {
                            console.warn("User profile sync postponed: Auth lock contested.");
                        } else {
                            console.error(`Failed to auto-create user profile: ${errorDetails}`);
                        }
                        
                        setUserData(null);
                        try { localStorage.removeItem('cs_userData'); } catch(e){}
                    }
                }
            } catch (error) {
                console.error("fetchUserData error:", error);
                setUserData(null);
            } finally {
                clearTimeout(failSafe);
                if (mounted) {
                    setLoading(false);
                    if (pendingFetchRef.current === currentUser.id) {
                        pendingFetchRef.current = null;
                    }
                }
            }
        }

        async function initAuth() {
            try {
                // Optimistic load from cache
                try {
                    const cachedUser = localStorage.getItem('cs_user');
                    const cachedUserData = localStorage.getItem('cs_userData');
                    if (cachedUser && cachedUserData) {
                        setUser(JSON.parse(cachedUser));
                        setUserData(JSON.parse(cachedUserData));
                        setLoading(false); // Instant load!
                    } else {
                        setLoading(true);
                    }
                } catch (e) {
                    setLoading(true);
                }

                const { data: { session }, error } = await supabase.auth.getSession();
                if (error) {
                    if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
                        await supabase.auth.signOut();
                    } else if (error.message.includes('Lock broken')) {
                        // This is a transient locking issue, usually from multiple tabs or HMR.
                        // We can ignore it as onAuthStateChange will eventually provide the session.
                        console.warn("Auth session lock contested (transient).");
                    } else {
                        console.error("Session error:", error);
                    }
                }
                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    try { localStorage.setItem('cs_user', JSON.stringify(currentUser)); } catch(e){}
                    await fetchUserData(currentUser);
                } else {
                    setUser(null);
                    setUserData(null);
                    try {
                        localStorage.removeItem('cs_user');
                        localStorage.removeItem('cs_userData');
                    } catch(e){}
                    setLoading(false);
                }
            } catch (e) {
                console.error("Auth init error:", e);
            } finally {
                setLoading(false);
            }
        }

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event: AuthChangeEvent, session: Session | null) => {
                // Ignore INITIAL_SESSION to prevent race condition with getSession()
                if (event === 'INITIAL_SESSION') return;

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    // Only show hard loading spinner if we are explicitly missing user data
                    setLoading((prev) => prev ? true : false); // Ensure we don't trigger a new loader over existing UI
                    try { localStorage.setItem('cs_user', JSON.stringify(currentUser)); } catch(e){}
                    await fetchUserData(currentUser);
                } else {
                    setUser(null);
                    setUserData(null);
                    try {
                        localStorage.removeItem('cs_user');
                        localStorage.removeItem('cs_userData');
                    } catch(e){}
                    setLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            clearTimeout(emergencyTimeout);
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
