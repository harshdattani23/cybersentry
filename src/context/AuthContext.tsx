"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";

export interface UserData {
    id: string;
    email: string;
    role: "user" | "admin";
    approved_to_publish: boolean;
    created_at?: string;
    // New Profile Fields
    name?: string;
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

    useEffect(() => {
        let mounted = true;

        async function fetchUserData(currentUser: User) {
            try {
                const { data, error } = await supabase
                    .from("users")
                    .select("*")
                    .eq("id", currentUser.id)
                    .single();

                if (data && !error) {
                    setUserData({
                        ...data,
                        uid: data.id,
                        approvedToPublish: data.approved_to_publish
                    } as UserData);
                } else {
                    setUserData(null);
                }
            } catch (error) {
                setUserData(null);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        async function initAuth() {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            const currentUser = session?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                await fetchUserData(currentUser);
            } else {
                setUserData(null);
                if (mounted) setLoading(false);
            }
        }

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                // Ignore INITIAL_SESSION to prevent race condition with getSession()
                if (event === 'INITIAL_SESSION') return;

                const currentUser = session?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    // Only show hard loading spinner on initial sign in, not background refreshes
                    if (event === 'SIGNED_IN') setLoading(true);
                    await fetchUserData(currentUser);
                } else {
                    setUser(null);
                    setUserData(null);
                    if (mounted) setLoading(false);
                }
            }
        );

        return () => {
            mounted = false;
            subscription.unsubscribe();
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, userData, loading }}>
            {children}
        </AuthContext.Provider>
    );
};
