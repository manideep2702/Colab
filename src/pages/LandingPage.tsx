import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight, Play, Star,
    Globe, Code,
    Users,
    ChevronRight,
    Terminal,
    Activity,
    Cpu,
    Database,
    BarChart3,
    Check
} from 'lucide-react';
import { motion } from 'framer-motion';

// --- Global UI Elements ---

const Badge = ({ children }: { children: React.ReactNode }) => (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] backdrop-blur-md mb-8">
        <div className="w-1 h-1 rounded-full bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,1)]" />
        <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500">{children}</span>
    </div>
);

const PrimaryButton = ({ children, onClick, className = "" }: any) => (
    <button
        onClick={onClick}
        className={`px-8 py-4 bg-white text-black rounded-full font-bold text-[15px] hover:bg-zinc-200 transition-all active:scale-95 shadow-[0_20px_40px_rgba(255,255,255,0.1)] ${className}`}
    >
        {children}
    </button>
);

const GhostButton = ({ children, onClick, className = "" }: any) => (
    <button
        onClick={onClick}
        className={`px-8 py-4 bg-white/[0.03] border border-white/[0.06] text-white rounded-full font-bold text-[15px] hover:bg-white/[0.08] transition-all flex items-center gap-2 ${className}`}
    >
        {children}
    </button>
);

// --- Sections ---

const Navbar = () => {
    const navigate = useNavigate();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const handleScroll = () => setScrolled(window.scrollY > 20);
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${scrolled ? 'py-3 md:py-4' : 'py-4 md:py-8'}`}>
            <div className="max-w-7xl mx-auto px-4 md:px-6 flex items-center justify-between">
                <div className="flex items-center gap-2 md:gap-3 cursor-pointer group flex-shrink-0" onClick={() => navigate('/')}>
                    <img src="/logo.png" alt="Logo" className="h-8 md:h-10 w-auto" />
                </div>

                <div className={`hidden md:flex items-center gap-1 bg-white/[0.02] border border-white/[0.05] backdrop-blur-xl rounded-full px-2 py-1 transition-all duration-500 ${scrolled ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none'}`}>
                    {['Curriculum', 'Features', 'Community'].map((item) => (
                        <a key={item} href={`#${item.toLowerCase()}`} className="px-5 py-2 rounded-full text-[12px] font-bold text-zinc-500 hover:text-white transition-colors tracking-wide uppercase">
                            {item}
                        </a>
                    ))}
                </div>

                <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                    <button onClick={() => navigate('/login')} className="text-[10px] md:text-[12px] font-bold text-zinc-500 hover:text-white transition-colors px-2 md:px-4 uppercase tracking-wider md:tracking-widest">
                        Sign In
                    </button>
                    <button
                        onClick={() => navigate('/admission')}
                        className="bg-white text-black px-3 md:px-6 py-2 md:py-2.5 rounded-full text-[10px] md:text-[12px] font-bold hover:bg-zinc-200 transition-all active:scale-95 shadow-lg uppercase tracking-wider md:tracking-widest whitespace-nowrap"
                    >
                        Apply Now
                    </button>
                </div>
            </div>
        </nav>
    );
};

const Hero = () => {
    const navigate = useNavigate();
    return (
        <section className="relative pt-32 md:pt-44 pb-16 md:pb-32 min-h-screen flex flex-col items-center justify-center overflow-hidden">
            <div className="absolute inset-0 z-0 bg-grid-white mask-linear-fade opacity-20 pointer-events-none" />
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] md:w-[1000px] h-[400px] md:h-[600px] bg-indigo-600/10 rounded-full blur-[160px] opacity-50" />
                <div className="noise" />
            </div>

            <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 text-center">
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                    <Badge>New Cohort Starting January 2026</Badge>
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.1 }}
                    className="text-4xl sm:text-5xl md:text-7xl lg:text-9xl font-black tracking-tight md:tracking-tightest leading-[0.9] md:leading-[0.85] text-white mb-6 md:mb-10"
                >
                    Master the <br />
                    <span className="text-transparent bg-clip-text bg-gradient-to-b from-white to-zinc-600">Art of Data.</span>
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.2 }}
                    className="text-base sm:text-lg md:text-2xl text-zinc-500 max-w-3xl mx-auto mb-8 md:mb-14 leading-relaxed font-medium px-2"
                >
                    The definitive learning platform for data scientists. <br className="hidden md:block" />
                    Go from raw data to production-grade AI models with expert guidance.
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.7, delay: 0.3 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6 px-4"
                >
                    <PrimaryButton onClick={() => navigate('/admission')} className="w-full sm:w-auto text-sm md:text-[15px] px-6 md:px-8 py-3 md:py-4">
                        Apply for Admission
                    </PrimaryButton>
                    <GhostButton className="w-full sm:w-auto text-sm md:text-[15px] px-6 md:px-8 py-3 md:py-4">
                        <Play className="w-4 h-4 fill-current" /> Watch Curriculum
                    </GhostButton>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    className="mt-12 md:mt-24 pt-8 md:pt-12 border-t border-white/[0.05] overflow-hidden w-full"
                >
                    <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] text-zinc-600 mb-6 md:mb-12">
                        Trusted by Engineering Teams at
                    </p>

                    <div className="relative flex overflow-hidden w-full">
                        <motion.div
                            className="flex items-center gap-6 md:gap-12 whitespace-nowrap"
                            animate={{
                                x: [0, -1030],
                            }}
                            transition={{
                                duration: 30,
                                ease: "linear",
                                repeat: Infinity,
                            }}
                            style={{ width: "fit-content" }}
                        >
                            {[
                                'GOOGLE', 'AMAZON', 'OPENAI', 'META', 'STRIPE',
                                'APPLE', 'MICROSOFT', 'NETFLIX', 'TESLA', 'UBER',
                                'GOOGLE', 'AMAZON', 'OPENAI', 'META', 'STRIPE',
                                'APPLE', 'MICROSOFT', 'NETFLIX', 'TESLA', 'UBER'
                            ].map((logo, i) => (
                                <span
                                    key={i}
                                    className="text-lg md:text-2xl font-black text-white tracking-tighter cursor-default opacity-20 hover:opacity-100 transition-opacity duration-500"
                                >
                                    {logo}
                                </span>
                            ))}
                        </motion.div>

                        {/* Gradient Fades */}
                        <div className="absolute inset-y-0 left-0 w-16 md:w-32 bg-gradient-to-r from-[#020203] to-transparent z-10" />
                        <div className="absolute inset-y-0 right-0 w-16 md:w-32 bg-gradient-to-l from-[#020203] to-transparent z-10" />
                    </div>
                </motion.div>
            </div>
        </section>
    );
};

const FeatureCard = ({ icon: Icon, title, desc, delay }: any) => (
    <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay }}
        className="group p-6 md:p-10 rounded-2xl md:rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] card-hover"
    >
        <div className="w-12 md:w-14 h-12 md:h-14 rounded-xl md:rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-4 md:mb-8 group-hover:bg-white/[0.06] group-hover:scale-110 transition-all duration-500">
            <Icon className="w-5 md:w-6 h-5 md:h-6 text-zinc-400 group-hover:text-white" />
        </div>
        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 md:mb-4 tracking-tight">{title}</h3>
        <p className="text-zinc-500 text-sm md:text-[15px] leading-relaxed font-medium">{desc}</p>
    </motion.div>
);

const Features = () => (
    <section id="features" className="py-16 md:py-32 bg-[#020203] relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-small-white mask-linear-fade opacity-10 pointer-events-none" />
        <div className="max-w-7xl mx-auto px-4 md:px-6 relative z-10">
            <div className="max-w-3xl mb-12 md:mb-24">
                <Badge>Platform Features</Badge>
                <h2 className="text-3xl sm:text-4xl md:text-7xl font-black tracking-tight md:tracking-tighter text-white mb-4 md:mb-8">Engineering excellence <br className="hidden sm:block" />in every module.</h2>
                <p className="text-base md:text-xl text-zinc-500 font-medium">We've stripped away the fluff to focus on what actually gets you hired.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <FeatureCard icon={Cpu} title="Cloud GPUs" desc="Pre-configured environments with zero setup required for deep learning." delay={0.1} />
                <FeatureCard icon={Database} title="Real Assets" desc="Practice on datasets sourced from leading Fortune 500 companies." delay={0.2} />
                <FeatureCard icon={Terminal} title="Shell Access" desc="Full terminal control to master the entire machine learning lifecycle." delay={0.3} />
                <FeatureCard icon={BarChart3} title="Deep Metrics" desc="Visualize your learning progress with detailed behavioral analytics." delay={0.4} />
            </div>
        </div>
    </section>
);

const RoadmapItem = ({ number, title, items }: any) => (
    <div className="p-6 md:p-12 border-b sm:border-b-0 sm:border-r sm:even:border-r-0 md:even:border-r border-white/[0.05] last:border-0 hover:bg-white/[0.01] transition-colors group">
        <span className="text-[10px] md:text-[11px] font-black text-zinc-700 uppercase tracking-[0.3em] md:tracking-[0.4em] mb-6 md:mb-12 block group-hover:text-indigo-500 transition-colors">Phase {number}</span>
        <h4 className="text-xl md:text-2xl font-bold text-white mb-6 md:mb-10 tracking-tight">{title}</h4>
        <div className="space-y-3 md:space-y-5">
            {items.map((item: string) => (
                <div key={item} className="flex items-center gap-3 md:gap-4 text-zinc-500 text-[11px] md:text-[13px] font-bold uppercase tracking-wider md:tracking-widest group-hover:text-zinc-300 transition-colors">
                    <Check className="w-3 md:w-3.5 h-3 md:h-3.5 text-indigo-500 flex-shrink-0" />
                    {item}
                </div>
            ))}
        </div>
    </div>
);

const Curriculum = () => (
    <section id="curriculum" className="py-16 md:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="text-center mb-12 md:mb-24">
                <Badge>Full Curriculum</Badge>
                <h2 className="text-3xl sm:text-4xl md:text-8xl font-black tracking-tight md:tracking-tightest uppercase italic text-white">The Path to Pro.</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 bg-white/[0.02] border border-white/[0.05] rounded-2xl md:rounded-[3rem] overflow-hidden">
                <RoadmapItem number="01" title="Core Stack" items={['Python Internals', 'SQL Mastery', 'Data Ops']} />
                <RoadmapItem number="02" title="Analysis" items={['Statistics', 'Probability', 'Bi-Variate']} />
                <RoadmapItem number="03" title="Machine Learning" items={['Supervised', 'Unsupervised', 'Tuning']} />
                <RoadmapItem number="04" title="Deep AI" items={['Neural Nets', 'LLM Architect', 'Deployment']} />
            </div>
        </div>
    </section>
);

const Testimonials = () => (
    <section className="py-16 md:py-32 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8">
                {[
                    { text: "The most technical curriculum I've encountered. No wasted time.", author: "Marcus L.", role: "ML at Google" },
                    { text: "Built my entire portfolio here. The cloud labs are a game changer.", author: "Elena S.", role: "Data Ops at Stripe" },
                    { text: "Direct path to mastery. Highly recommended for engineers.", author: "David K.", role: "Senior DS at Meta" }
                ].map((t, i) => (
                    <motion.div key={i} className="p-6 md:p-12 rounded-2xl md:rounded-[2.5rem] bg-white/[0.02] border border-white/[0.05] hover:border-white/10 transition-all duration-500 group">
                        <div className="flex gap-1 mb-6 md:mb-10">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 md:w-4 h-3.5 md:h-4 fill-indigo-500 text-indigo-500" />)}
                        </div>
                        <p className="text-lg md:text-xl font-bold text-white mb-6 md:mb-10 leading-snug tracking-tight">"{t.text}"</p>
                        <div className="flex items-center gap-3 md:gap-4">
                            <div className="w-10 md:w-12 h-10 md:h-12 rounded-full bg-white/[0.05] border border-white/[0.1] flex items-center justify-center text-zinc-500 font-bold group-hover:border-indigo-500/50 transition-colors text-sm md:text-base">
                                {t.author[0]}
                            </div>
                            <div>
                                <div className="font-bold text-white text-sm md:text-[15px]">{t.author}</div>
                                <div className="text-zinc-600 font-bold uppercase tracking-wider md:tracking-widest text-[9px] md:text-[10px]">{t.role}</div>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    </section>
);

const CTA = () => {
    const navigate = useNavigate();
    return (
        <section className="py-16 md:py-32 px-4 md:px-6">
            <div className="max-w-6xl mx-auto relative rounded-2xl md:rounded-[4rem] border border-white/[0.05] bg-white/[0.01] overflow-hidden group">
                {/* Refined Glowing Background */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-indigo-600/[0.03] blur-[120px] pointer-events-none" />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-indigo-600/[0.05] opacity-0 group-hover:opacity-100 transition-opacity duration-1000" />

                <div className="relative z-10 p-8 sm:p-12 md:p-20 lg:p-32 text-center">
                    <Badge>Limited Availability</Badge>
                    <h2 className="text-3xl sm:text-4xl md:text-7xl lg:text-9xl font-black tracking-tight md:tracking-tightest text-white mb-6 md:mb-10 leading-none uppercase italic">Ready to build?</h2>
                    <p className="text-base sm:text-lg md:text-2xl text-zinc-500 font-medium mb-8 md:mb-16 max-w-2xl mx-auto leading-relaxed">
                        Join an elite community of data scientists. <br className="hidden sm:block" />
                        Access the curriculum, labs, and mentors today.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 md:gap-6">
                        <PrimaryButton onClick={() => navigate('/admission')} className="w-full sm:w-auto px-8 md:px-12 py-4 md:py-6 text-base md:text-lg">
                            Apply for Admission
                        </PrimaryButton>
                    </div>
                </div>

                {/* Noise texture overlay for premium feel */}
                <div className="noise opacity-[0.03]" />
            </div>
        </section>
    );
};

const Footer = () => (
    <footer className="py-12 md:py-24 border-t border-white/[0.05]">
        <div className="max-w-7xl mx-auto px-4 md:px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 md:gap-12 mb-12 md:mb-20 text-center md:text-left">
                <div className="col-span-2">
                    <div className="flex items-center gap-3 mb-6 md:mb-8 justify-center md:justify-start">
                        <img src="/logo.png" alt="Logo" className="h-8 md:h-9 w-auto" />
                    </div>
                    <p className="text-zinc-600 font-medium max-w-sm mb-6 md:mb-10 leading-relaxed mx-auto md:mx-0 text-sm md:text-base">
                        The professional standard for data science education.
                    </p>
                    <div className="flex gap-3 md:gap-4 justify-center md:justify-start">
                        {[Globe, Users, Activity].map((Icon, i) => (
                            <a key={i} href="#" className="w-10 md:w-11 h-10 md:h-11 rounded-lg md:rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center text-zinc-600 hover:text-white hover:border-white/20 transition-all">
                                <Icon className="w-4 md:w-5 h-4 md:h-5" />
                            </a>
                        ))}
                    </div>
                </div>

                <div className="hidden lg:block" />

                {[
                    { title: 'Learn', links: ['Curriculum', 'Cloud Labs', 'Mentors'] },
                    { title: 'Join', links: ['About', 'Careers', 'Contact'] },
                    { title: 'Legal', links: ['Privacy', 'Terms'] }
                ].map(col => (
                    <div key={col.title}>
                        <h4 className="text-zinc-300 font-bold mb-4 md:mb-8 text-[10px] md:text-[11px] uppercase tracking-[0.15em] md:tracking-[0.2em]">{col.title}</h4>
                        <ul className="space-y-2 md:space-y-4">
                            {col.links.map(link => (
                                <li key={link}>
                                    <a href="#" className="text-zinc-500 hover:text-white transition-colors text-[11px] md:text-[13px] font-bold uppercase tracking-wider md:tracking-widest">{link}</a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="pt-6 md:pt-10 border-t border-white/[0.05] flex flex-col md:flex-row justify-between items-center gap-4 md:gap-6 opacity-50">
                <p className="text-[9px] md:text-[10px] font-black text-zinc-700 uppercase tracking-[0.3em] md:tracking-[0.4em]">
                    © 2026 DATALEARN INC.
                </p>
                <div className="flex items-center gap-2">
                    <div className="w-1 h-1 rounded-full bg-emerald-500" />
                    <span className="text-[8px] md:text-[9px] font-black text-zinc-700 uppercase tracking-[0.3em] md:tracking-[0.4em]">Systems Operational</span>
                </div>
            </div>
        </div>
    </footer>
);

const LandingPage = () => {
    return (
        <div className="bg-[#020203] text-white selection:bg-indigo-600/30 font-sans overflow-x-hidden w-full max-w-[100vw]">
            <Navbar />
            <Hero />
            <Features />
            <Curriculum />
            <Testimonials />
            <CTA />
            <Footer />
        </div>
    );
};

export default LandingPage;
