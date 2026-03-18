import Link from "next/link";

export function Footer() {
    return (
        <footer className="bg-brand-primary text-white w-full py-16 px-8 flex flex-col items-center gap-6 mt-auto font-body text-xs uppercase tracking-widest border-t-4 border-brand-accent">
            <div className="w-full max-w-7xl grid md:grid-cols-4 gap-12 mb-12">
                <div className="col-span-1 md:col-span-2">
                    <div className="text-2xl font-extrabold text-white mb-6 font-headline tracking-tighter">CYBER SENTRY</div>
                    <p className="text-slate-400 normal-case tracking-normal max-w-md leading-relaxed mb-8">
                        The official national gateway for cybersecurity awareness, incident reporting, and threat analysis. Operated under the mandate of the Ministry of Electronics and IT, Govt of India.
                    </p>
                    <Link href="/report">
                        <button className="bg-brand-accent text-brand-primary font-black px-8 py-4 rounded-xl flex items-center gap-3 transition-opacity duration-300 hover:opacity-90">
                            REPORT ANONYMOUSLY
                            <span className="material-symbols-outlined text-sm">visibility_off</span>
                        </button>
                    </Link>
                </div>
                <div className="flex flex-col gap-6">
                    <span className="text-white font-bold text-sm">Legal &amp; Audit</span>
                    <div className="flex flex-col gap-3">
                        <Link href="#" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">Privacy Policy</Link>
                        <Link href="#" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">Terms of Service</Link>
                        <Link href="#" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">Security Audit</Link>
                        <Link href="#" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">RTI Disclosures</Link>
                    </div>
                </div>
                <div className="flex flex-col gap-6">
                    <span className="text-white font-bold text-sm">Assistance</span>
                    <div className="flex flex-col gap-3">
                        <Link href="/contact" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">Contact Support</Link>
                        <Link href="#" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">Citizen FAQ</Link>
                        <Link href="#" className="text-slate-400 hover:text-brand-accent transition-colors duration-300">Regional Offices</Link>
                        <div className="text-slate-400 mt-2">
                            <p className="text-[10px] uppercase text-brand-accent">National Helpine</p>
                            <p className="text-xl font-bold font-headline text-white mt-1">1930</p>
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full max-w-7xl pt-12 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="text-slate-500 font-medium normal-case tracking-normal">© {new Date().getFullYear()} Cyber Sentry. Ministry of Electronics and IT, Government of India.</div>
                <div className="flex gap-8">
                    <Link href="#" className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">share</span></Link>
                    <Link href="#" className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">rss_feed</span></Link>
                    <Link href="#" className="text-slate-400 hover:text-white transition-colors"><span className="material-symbols-outlined">mail</span></Link>
                </div>
            </div>
        </footer>
    );
}
