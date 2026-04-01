import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-brand-primary text-white w-full py-16 px-8 flex flex-col items-center gap-6 mt-auto font-body text-xs uppercase tracking-widest border-t-4 border-brand-accent">
            <div className="w-full max-w-7xl grid md:grid-cols-3 gap-12 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="text-2xl font-extrabold text-white mb-6 font-headline tracking-tighter">CYBER SENTRY</div>
                    <p className="text-slate-400 normal-case tracking-normal max-w-md leading-relaxed mb-8">
                        Your source for the latest cybersecurity news, advisories, and threat updates.
                    </p>

                </div>
                <div className="flex flex-col gap-6">
                    <span className="text-white font-bold text-sm">Assistance</span>
                    <div className="flex flex-col gap-3">
                        <Link href="/contact" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">Contact Support</Link>
                        <Link href="#" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">Citizen FAQ</Link>
                        <Link href="#" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">Regional Offices</Link>
                        <div className="text-slate-400 mt-2">
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full max-w-7xl pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-slate-500 font-medium normal-case tracking-normal">© {new Date().getFullYear()} Cyber Sentry. All rights reserved.</div>
                <div className="flex gap-8">
                    <Link href="#" className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">share</span></Link>
                    <Link href="#" className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">rss_feed</span></Link>
                    <Link href="#" className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">mail</span></Link>
                </div>
            </div>
        </footer>
    );
}
