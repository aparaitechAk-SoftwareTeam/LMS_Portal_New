import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Award,
  BookOpen,
  CheckCircle2,
  PlayCircle,
  Globe2,
  Instagram,
  Linkedin,
  Mail,
  MapPin,
  Menu,
  Moon,
  Phone,
  Send,
  Sparkles,
  Users,
  X,
  Youtube,
  Sun,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../../services/api";

const logo = "/aparaitech-logo.png";
const socials = [
  ["LinkedIn", "https://www.linkedin.com/company/aparaitech", Linkedin],
  ["YouTube", "https://www.youtube.com/@Aparaitech", Youtube],
  ["Instagram", "https://www.instagram.com/aparaitech_global/", Instagram],
  ["X", "https://x.com/Aparaitech", Globe2],
];
const NavLink = ({ children, to, href, active = false }) => {
  const content = (
    <>
      {children}
      {active && (
        <span className="absolute bottom-[5px] left-1/2 h-[2px] w-[46px] -translate-x-1/2 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(34,211,238,.8)]" />
      )}
    </>
  );
  const className = `relative flex h-[54px] items-center justify-center px-2 text-[14px] font-medium transition-colors duration-200 ${active ? "text-teal-600 dark:text-teal-300" : "text-slate-600 hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-300"}`;
  return to ? (
    <Link to={to} className={className}>
      {content}
    </Link>
  ) : (
    <a href={href} className={className}>
      {content}
    </a>
  );
};

export default function Landing() {
  const [intro, setIntro] = useState(true),
    [phase, setPhase] = useState(0),
    [menu, setMenu] = useState(false),
    [darkMode, setDarkMode] = useState(() => localStorage.getItem("aparaitech-theme") === "dark"),
    [email, setEmail] = useState(""),
    [sending, setSending] = useState(false);
  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 250),
      setTimeout(() => setPhase(2), 1550),
      setTimeout(() => setPhase(3), 2600),
      setTimeout(() => setIntro(false), 4100),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);
  useEffect(() => {
    localStorage.setItem("aparaitech-theme", darkMode ? "dark" : "light");
  }, [darkMode]);
  const subscribe = async (e) => {
    e.preventDefault();
    setSending(true);
    try {
      await api.post("/public/inquiries", {
        name: "Newsletter subscriber",
        email,
        subject: "Newsletter subscription",
        message: "Please send Aparaitech LMS updates to this email.",
      });
      toast.success("You are on the list!");
      setEmail("");
    } catch {
    } finally {
      setSending(false);
    }
  };
  return (
    <div className={`${darkMode ? "dark" : ""} min-h-screen overflow-x-hidden bg-[linear-gradient(135deg,#f8fcff_0%,#f5f2ff_50%,#f0fffc_100%)] text-slate-900 selection:bg-teal-200 dark:bg-[linear-gradient(135deg,#071b22_0%,#10142a_54%,#111827_100%)] dark:text-slate-100`}>
      {intro && (
        <div className="pointer-events-none fixed inset-0 z-[100]">
          <div
            className={`absolute inset-0 bg-white transition-opacity duration-[1100ms] ${phase >= 3 ? "opacity-0" : "opacity-100"}`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_43%,rgba(124,58,237,.12),transparent_29%),radial-gradient(circle_at_76%_22%,rgba(14,165,233,.09),transparent_22%)]" />
          </div>
          <div
            className={`fixed z-[110] transition-all duration-[1450ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${phase >= 3 ? "left-[21px] top-[18px] translate-x-0 translate-y-0" : "left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"}`}
          >
            <div
              className={`flex transition-all duration-[1450ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${phase >= 3 ? "flex-row items-center gap-[13px]" : "flex-col items-center gap-[18px]"}`}
            >
              <div
                className={`relative shrink-0 transition-all duration-[1450ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${phase >= 1 ? "scale-100 opacity-100 blur-0" : "scale-[.55] opacity-0 blur-md"} ${phase >= 3 ? "h-[42px] w-[42px]" : "h-[126px] w-[126px]"}`}
              >
                <div
                  className={`absolute -inset-7 rounded-full bg-violet-500/20 blur-3xl transition-opacity duration-700 ${phase >= 3 ? "opacity-0" : "opacity-100"}`}
                />
                <img
                  src={logo}
                  alt="Aparaitech"
                  className={`relative z-10 h-full w-full object-cover transition-all duration-1000 ${phase >= 3 ? "rounded-[12px]" : "rounded-[18px] shadow-[0_18px_48px_rgba(109,40,217,.25)]"}`}
                />
                {phase === 1 && (
                  <div className="absolute inset-0 z-20 overflow-hidden rounded-[18px]">
                    <div className="landing-logo-scan absolute -left-[120%] top-[-20%] h-[140%] w-[16px] -skew-x-[18deg] bg-gradient-to-r from-transparent via-white to-transparent blur-[2px]" />
                  </div>
                )}
              </div>
              <div
                className={`whitespace-nowrap transition-all duration-[850ms] ${phase >= 2 ? "translate-y-0 opacity-100" : "translate-y-3 opacity-0"}`}
              >
                <div
                  className={`font-semibold uppercase transition-all duration-[1450ms] ${phase >= 3 ? "text-left text-[16px] tracking-[.18em] text-slate-900" : "text-center text-[23px] tracking-[.36em] text-slate-900"}`}
                >
                  APARAITECH
                </div>
                <div
                  className={`mt-[7px] text-center text-[9px] uppercase tracking-[.28em] text-violet-600 transition-all duration-500 ${phase >= 3 ? "h-0 overflow-hidden opacity-0" : "h-auto opacity-80"}`}
                >
                  Learning Management System
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(20,184,166,.12),transparent_27%),radial-gradient(circle_at_86%_9%,rgba(59,130,246,.10),transparent_23%),radial-gradient(circle_at_68%_80%,rgba(168,85,247,.10),transparent_26%)]" />
      <header
        className={`fixed left-0 right-0 top-[6px] z-40 transition-all duration-700 ${phase >= 3 ? "translate-y-0 opacity-100" : "-translate-y-3 opacity-0"}`}
      >
        <div className="mx-auto flex h-[76px] w-[99.2%] items-center rounded-[17px] border border-white/80 bg-white/85 px-[18px] shadow-[0_10px_32px_rgba(15,23,42,.10)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/85 dark:shadow-[0_10px_32px_rgba(0,0,0,.35)]">
          <Link
            to="/"
            className={`hidden w-[300px] shrink-0 items-center gap-[13px] transition-opacity lg:flex ${intro ? "opacity-0" : "opacity-100"}`}
          >
            <img src={logo} className="h-[42px] w-[42px] rounded-[12px]" />
            <span className="text-[16px] font-semibold tracking-[.18em] text-slate-900 dark:text-white">
              APARAITECH
            </span>
          </Link>
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <img src={logo} className="h-10 w-10 rounded-xl" />
            <span className="text-sm font-bold tracking-[.16em]">
              APARAITECH
            </span>
          </Link>
          <div className="hidden flex-1 items-center justify-center lg:flex">
            <nav className="flex w-full max-w-[650px] items-center justify-between">
              <NavLink href="#journey" active>
                Home
              </NavLink>
              <NavLink to="/courses">Courses</NavLink>
              <NavLink href="#outcomes">Features</NavLink>
              <NavLink href="#journey">About</NavLink>
              <NavLink to="/contact">Contact</NavLink>
            </nav>
          </div>
          <div className="ml-auto hidden w-[300px] shrink-0 items-center justify-end lg:flex">
            <button
              onClick={() => setDarkMode((value) => !value)}
              aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
              className="mr-3 flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm transition hover:border-teal-300 hover:text-teal-600 dark:border-slate-700 dark:bg-slate-900 dark:text-amber-300"
            >
              {darkMode ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <div className="mr-[20px] h-[34px] w-px bg-slate-200 dark:bg-slate-700" />
            <Link
              to="/login"
              className="flex h-[42px] min-w-[96px] items-center justify-center rounded-[10px] border border-slate-200 bg-white px-5 text-[14px] font-medium text-slate-700 transition hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200"
            >
              Login
            </Link>
            <Link
              to="/courses"
              className="ml-[14px] flex h-[42px] min-w-[150px] items-center justify-center gap-2 rounded-[10px] bg-gradient-to-r from-[#1469ff] via-[#0f8fff] to-[#08c7c4] px-5 text-[14px] font-semibold text-white shadow-[0_8px_20px_rgba(0,144,255,.28)] transition hover:-translate-y-[1px]"
            >
              Get Started <ArrowRight size={15} />
            </Link>
          </div>
          <button onClick={() => setMenu(!menu)} className="ml-auto lg:hidden">
            {menu ? <X /> : <Menu />}
          </button>
        </div>
        {menu && (
          <div className="mx-3 mt-2 rounded-2xl border border-slate-200 bg-white p-5 text-slate-800 shadow-xl lg:hidden">
            <div className="flex flex-col gap-4 text-sm">
              <a href="#journey">Home</a>
              <Link to="/courses">Courses</Link>
              <a href="#outcomes">Features</a>
              <Link to="/contact">Contact</Link>
              <Link to="/login">Login</Link>
            </div>
          </div>
        )}
      </header>
      <main className="relative z-10 pt-[98px]">
        <section className="relative isolate mx-auto min-h-[620px] max-w-[1440px] overflow-hidden px-5 sm:min-h-[700px] lg:min-h-[790px]">
          <div
            aria-hidden="true"
            className="hidden"
            style={{ backgroundImage: "url('/landing-office-bg.png')" }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#ffffff_0%,#fbfdff_58%,rgba(239,249,255,.88)_100%)] dark:bg-[linear-gradient(180deg,rgba(7,27,34,.95)_0%,rgba(15,23,42,.86)_58%,rgba(15,23,42,.58)_100%)]"
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_18%_30%,rgba(45,212,191,.14),transparent_25%),radial-gradient(circle_at_78%_35%,rgba(96,165,250,.12),transparent_28%)]"
          />
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: intro ? 0 : 1, y: intro ? 24 : 0 }}
            transition={{ duration: 0.8 }}
            className="absolute inset-x-5 top-5 z-10 mx-auto max-w-3xl text-center sm:top-8"
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-teal-200 bg-white/70 px-3 py-1.5 text-xs text-teal-700 shadow-sm backdrop-blur dark:border-teal-400/30 dark:bg-slate-950/65 dark:text-teal-200">
              <Sparkles size={14} />
              The modern internship learning platform
            </span>
            <h1 className="mt-4 text-5xl font-semibold leading-[1.03] tracking-[-.06em] sm:text-6xl lg:text-[4.5rem]">
              Learn with intent.
              <br />
              <span className="bg-gradient-to-r from-teal-600 via-sky-500 to-violet-600 bg-clip-text text-transparent">
                Build with proof.
              </span>
            </h1>
            <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-600 dark:text-slate-300 sm:text-lg">
              Structured learning tracks, real-world projects and verified
              milestones - designed to turn potential into professional
              momentum.
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link
                to="/courses"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-600 via-cyan-600 to-sky-600 px-6 py-3.5 text-sm font-bold text-white shadow-[0_15px_40px_rgba(8,145,178,.25)] transition hover:-translate-y-1"
              >
                Explore learning tracks <ArrowRight size={16} />
              </Link>
              <Link
                to="/contact"
                className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm backdrop-blur transition hover:border-teal-200 dark:border-slate-600 dark:bg-slate-950/65 dark:text-slate-100"
              >
                <PlayCircle size={17} />
                Talk to our team
              </Link>
            </div>
            <div className="hidden">
              <Metric n="10K+" t="Learner stories" />
              <Metric n="100%" t="Project-led learning" />
              <Metric n="24/7" t="Learning access" />
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: intro ? 0 : 1, scale: 1 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="hidden"
          >
            <div className="absolute -inset-8 rounded-[3.5rem] bg-gradient-to-br from-teal-300/35 via-sky-300/25 to-violet-300/30 blur-3xl" />
            <div className="relative rounded-[2rem] border border-white/90 bg-white/85 p-6 text-slate-900 shadow-[0_24px_70px_rgba(30,64,175,.17)] backdrop-blur-xl">
              <div className="flex justify-between">
                <div className="flex gap-3">
                  <div className="rounded-2xl bg-teal-100 p-3 text-teal-700">
                    <BookOpen />
                  </div>
                  <div>
                    <b>Your learning command center</b>
                    <p className="text-xs text-slate-500">
                      Designed for real outcomes
                    </p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">LIVE PROGRESS</span>
              </div>
              <div className="mt-7 rounded-2xl border border-slate-100 bg-slate-50/90 p-5">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-xs text-slate-500">CURRENT MILESTONE</p>
                    <p className="mt-2 text-2xl font-semibold">
                      Project completion
                    </p>
                  </div>
                  <b className="text-3xl text-teal-600">75%</b>
                </div>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-slate-200">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: "75%" }}
                    transition={{ delay: 1.2, duration: 1.2 }}
                    className="h-full rounded-full bg-gradient-to-r from-violet-500 to-cyan-300"
                  />
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {[
                    ["Learn", BookOpen],
                    ["Build", Users],
                    ["Achieve", Award],
                  ].map(([x, I], i) => (
                    <div
                      key={x}
                      className="rounded-xl border border-white/10 p-3"
                    >
                      <I
                        size={16}
                        className={i < 2 ? "text-violet-300" : "text-slate-500"}
                      />
                      <p className="mt-2 text-xs font-semibold">{x}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-5 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 p-5">
                <p className="text-xs text-violet-100">VERIFIED ACHIEVEMENT</p>
                <p className="mt-1 font-bold">Certificates that matter</p>
              </div>
            </div>
          </motion.div>
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 z-0 hidden h-[420px] overflow-hidden lg:block">
            <img
              src="/hero-library.png"
              alt=""
              className="absolute bottom-8 -left-8 w-[430px] drop-shadow-[0_25px_24px_rgba(14,116,144,.14)] xl:bottom-10 xl:w-[510px]"
            />
            <div className="absolute bottom-[-55px] left-1/2 h-[365px] w-[540px] -translate-x-1/2 overflow-hidden xl:h-[400px] xl:w-[620px]">
              <img
                src="/learning-campus-hero.png"
                alt=""
                className="absolute left-1/2 top-[-185px] w-[1080px] max-w-none -translate-x-1/2 xl:top-[-205px] xl:w-[1210px]"
              />
            </div>
            <img
              src="/hero-office.png"
              alt=""
              className="absolute bottom-8 -right-8 w-[430px] drop-shadow-[0_25px_24px_rgba(14,116,144,.14)] xl:bottom-10 xl:w-[510px]"
            />
          </div>
          <img
            src="/learning-campus-hero.png"
            alt="Aparaitech collaborative learning campus"
            className="pointer-events-none absolute inset-0 z-0 h-full w-full object-cover object-center lg:hidden"
          />
        </section>
        <section
          id="journey"
          className="relative overflow-hidden border-y border-teal-100 bg-[radial-gradient(circle_at_12%_22%,rgba(45,212,191,.18),transparent_24%),radial-gradient(circle_at_86%_28%,rgba(96,165,250,.18),transparent_25%),linear-gradient(135deg,#f0fdfa_0%,#f8fbff_48%,#f7f3ff_100%)] dark:border-slate-800 dark:bg-[radial-gradient(circle_at_12%_22%,rgba(20,184,166,.16),transparent_24%),radial-gradient(circle_at_86%_28%,rgba(99,102,241,.15),transparent_25%),linear-gradient(135deg,#0b1f27_0%,#111827_48%,#19142b_100%)]"
        >
          <div className="relative mx-auto max-w-7xl px-5 py-20 lg:px-8">
            <p className="text-center text-xs font-bold tracking-[.22em] text-violet-600">
              A CLEARER PATH FORWARD
            </p>
            <h2 className="mx-auto mt-4 max-w-2xl text-center text-3xl font-semibold tracking-[-.04em] sm:text-4xl">
              Everything you need to move from learning to doing.
            </h2>
            <div className="mt-12 grid gap-4 md:grid-cols-3">
              <Feature
                n="01"
                icon={BookOpen}
                title="Learn with structure"
                text="Focused tracks, practical lessons and a pace that keeps you moving."
              />
              <Feature
                n="02"
                icon={Users}
                title="Build in the real world"
                text="Turn concepts into portfolio-ready work through guided projects."
              />
              <Feature
                n="03"
                icon={Award}
                title="Earn proof of progress"
                text="Assessments, milestones and certificates make growth visible."
              />
            </div>
          </div>
        </section>
        <section
          id="outcomes"
          className="mx-auto grid max-w-7xl gap-10 px-5 py-24 lg:grid-cols-[.8fr_1.2fr] lg:px-8"
        >
          <div>
            <p className="text-xs font-bold tracking-[.22em] text-teal-600">
              BUILT FOR MOMENTUM
            </p>
            <h2 className="mt-4 text-4xl font-semibold tracking-[-.045em]">
              An experience as serious as your ambition.
            </h2>
            <p className="mt-5 leading-7 text-slate-600 dark:text-slate-300">
              Show up consistently, stay accountable and leave with work you can
              confidently share.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              ["Clear next actions", CheckCircle2, "border-emerald-100 bg-[linear-gradient(135deg,#ffffff_0%,#f0fdf4_100%)]", "text-emerald-600"],
              ["Skill signals", Sparkles, "border-amber-100 bg-[linear-gradient(135deg,#ffffff_0%,#fffbeb_100%)]", "text-amber-600"],
              ["Mentored collaboration", Users, "border-violet-100 bg-[linear-gradient(135deg,#ffffff_0%,#f5f3ff_100%)]", "text-violet-600"],
              ["Career-ready milestones", Award, "border-rose-100 bg-[linear-gradient(135deg,#ffffff_0%,#fff1f2_100%)]", "text-rose-600"],
            ].map(([x, I, cardTone, iconTone]) => (
              <div
                key={x}
                className={`rounded-3xl border p-6 shadow-[0_12px_30px_rgba(15,23,42,.06)] transition hover:-translate-y-1 hover:shadow-[0_18px_38px_rgba(15,23,42,.10)] dark:border-slate-700 dark:bg-slate-900/85 dark:shadow-none ${cardTone}`}
              >
                <I className={iconTone} />
                <h3 className="mt-5 font-bold dark:text-white">{x}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-300">
                  Practical tools built around learner outcomes.
                </p>
              </div>
            ))}
          </div>
        </section>
        <section className="mx-auto max-w-7xl px-5 pb-24 lg:px-8">
          <div className="rounded-[2rem] bg-gradient-to-r from-[#14532d] via-[#0f766e] to-[#0f766e] p-10 text-white shadow-[0_18px_45px_rgba(15,118,110,.20)]">
            <p className="text-xs font-bold tracking-[.2em] text-emerald-100">
              READY FOR YOUR NEXT CHAPTER?
            </p>
            <div className="mt-4 flex flex-wrap items-end justify-between gap-5">
              <h2 className="max-w-xl text-3xl font-semibold text-white">
                Choose a track. Build something real. Let your work speak.
              </h2>
              <Link
                to="/courses"
                className="rounded-full bg-white px-6 py-3.5 text-sm font-bold text-slate-950"
              >
                Find your track
              </Link>
            </div>
          </div>
        </section>
      </main>
      <footer className="relative z-10 border-t border-teal-100 bg-[linear-gradient(120deg,#ffffff_0%,#f4fffc_52%,#f6f5ff_100%)] text-slate-800 dark:border-slate-800 dark:bg-[linear-gradient(120deg,#071b22_0%,#101827_52%,#18132c_100%)] dark:text-slate-100">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 lg:grid-cols-[1.2fr_.9fr_.9fr] lg:px-8">
          <div>
            <div className="flex gap-3">
              <img src={logo} className="h-11 w-11 rounded-xl" />
              <b className="pt-3 text-sm tracking-[.2em]">APARAITECH</b>
            </div>
            <p className="mt-5 max-w-sm text-sm leading-6 text-slate-600 dark:text-slate-300">
              A focused ecosystem for learners who want practical skills and
              professional confidence.
            </p>
            <div className="mt-6 flex gap-2">
              {socials.map(([l, h, I]) => (
                <a
                  key={l}
                  href={h}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 shadow-sm outline-none transition hover:-translate-y-0.5 hover:border-teal-300 hover:text-teal-600 hover:shadow-md focus-visible:ring-2 focus-visible:ring-teal-300 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300"
                >
                  <I size={17} />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h3 className="font-bold">Contact us</h3>
            <div className="mt-5 space-y-4 text-sm text-slate-600 dark:text-slate-300">
              <a href="tel:+916364326342" className="flex gap-3">
                <Phone size={16} className="text-violet-300" />
                +91 63643 26342
              </a>
              <a
                href="mailto:info@aparaitechsoftware.org"
                className="flex gap-3"
              >
                <Mail size={16} className="text-violet-300" />
                info@aparaitechsoftware.org
              </a>
              <p className="flex gap-3">
                <MapPin size={16} className="shrink-0 text-violet-300" />
                360, Neeladri Rd, Electronic City Phase I, Bengaluru, Karnataka
                560100
              </p>
              <p className="flex gap-3">
                <MapPin size={16} className="shrink-0 text-violet-300" />
                Mukti Complex, Near Prashaskiya Bhawan, Baramati
              </p>
            </div>
          </div>
          <div>
            <h3 className="font-bold">Stay in the loop</h3>
            <p className="mt-4 text-sm leading-6 text-slate-600 dark:text-slate-300">
              New tracks and useful opportunities, sent when useful.
            </p>
            <form
              onSubmit={subscribe}
              className="mt-5 flex rounded-2xl border border-teal-100 bg-white p-1.5 shadow-[0_10px_24px_rgba(15,118,110,.08)] dark:border-slate-700 dark:bg-slate-900"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="min-w-0 flex-1 bg-transparent px-3 text-sm outline-none"
                placeholder="Your email address"
              />
              <button
                disabled={sending}
                className="rounded-xl bg-gradient-to-br from-teal-500 to-violet-600 p-2.5 text-white shadow-sm transition hover:scale-105"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
        <div className="border-t border-teal-100 px-5 py-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:text-slate-400">
          © {new Date().getFullYear()} Aparaitech. Built for ambitious learners.
        </div>
      </footer>
    </div>
  );
}
const Metric = ({ n, t }) => (
  <div>
    <b className="text-xl">{n}</b>
    <p className="mt-1 text-xs text-slate-500">{t}</p>
  </div>
);
const Feature = ({ n, icon: I, title, text }) => (
  <motion.article
    whileHover={{ y: -6 }}
    className={`rounded-3xl border p-6 shadow-[0_18px_40px_rgba(15,23,42,.08)] backdrop-blur transition-all hover:shadow-[0_24px_48px_rgba(14,116,144,.16)] ${n === "01" ? "border-teal-100 bg-gradient-to-br from-white via-teal-50 to-cyan-100/70" : n === "02" ? "border-sky-100 bg-gradient-to-br from-white via-sky-50 to-indigo-100/70" : "border-violet-100 bg-gradient-to-br from-white via-violet-50 to-fuchsia-100/60"}`}
  >
    <div className="flex justify-between">
      <div className={`rounded-2xl p-3 ${n === "01" ? "bg-teal-600 text-white shadow-lg shadow-teal-200" : n === "02" ? "bg-sky-600 text-white shadow-lg shadow-sky-200" : "bg-violet-600 text-white shadow-lg shadow-violet-200"}`}>
        <I size={22} />
      </div>
      <span className={`text-xs font-semibold ${n === "01" ? "text-teal-600" : n === "02" ? "text-sky-600" : "text-violet-600"}`}>{n}</span>
    </div>
    <h3 className="mt-8 text-lg font-bold">{title}</h3>
    <p className="mt-3 text-sm leading-6 text-slate-500">{text}</p>
  </motion.article>
);
