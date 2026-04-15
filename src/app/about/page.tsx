import React from "react";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "About Us | Ministry of Cyber Affairs",
    description: "About the Ministry of Cyber Affairs initiative.",
};

export default function AboutPage() {
    return (
        <div className="container mx-auto py-16 px-4 sm:px-6 lg:px-8 max-w-4xl min-h-[60vh]">
            <h1 className="text-4xl md:text-5xl font-extrabold text-brand-primary mb-8 tracking-tight font-headline">
                About Us
            </h1>
            
            <div className="prose prose-lg text-slate-700 max-w-none">
                <p className="leading-relaxed mb-6 font-body text-lg">
                    We are a group of individuals who believe in bringing the good work done by Governments and Civil Servants across the world to the main stream internet. Policy can be made only after feedback from the ground.
                </p>
                
                <p className="leading-relaxed mb-6 font-body text-lg">
                    The initiative will help researchers understand abuse trends - for providing accurate fix.
                </p>
                
                <p className="leading-relaxed mb-6 font-body text-lg bg-blue-50 p-6 rounded-xl border border-blue-100 italic">
                    Regarding <strong>Ministry of Cyber Affairs</strong> name, its a need of the hour. If there could be Ministry of Beer, why can&apos;t there by Ministry of Cyber ! Anyways, in Latin - Ministry means &quot;Service&quot;, while it also comes from Greek words like diakoneo (&quot;to serve&quot;) and douleuo (&quot;to serve as a slave&quot;).
                </p>
                
                <p className="leading-relaxed mb-6 font-body text-lg">
                    The Initiative Ministry of Cyber Affairs aims to serve the Cyber Space, by highlighting important events, news related to the cyberworld. This includes cybercrime, cybersecurity, Ai, Digitalisation etc.
                </p>
                
                <p className="leading-relaxed mb-6 font-body text-lg">
                    Platform also aims to highlight the contributions of Cyber Police all around the world, which conventional media does not cover owing to various reasons.
                </p>
                
                <p className="leading-relaxed mb-6 font-body text-lg">
                    Besides, public policy, regulations and Government Guidelines around the world, which actually makes an impact are posted for others countries to learn and implement.
                </p>
                
                <p className="leading-relaxed text-slate-800 font-semibold font-body text-xl mt-8">
                    We don&apos;t represent Government, we suppliment Government in Cyber Service.
                </p>
            </div>
        </div>
    );
}
