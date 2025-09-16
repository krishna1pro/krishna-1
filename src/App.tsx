"use client";

import React, { useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle, useMemo } from 'react';
import { motion, AnimatePresence, useScroll, useMotionValueEvent, type Transition, type VariantLabels, type Target, type AnimationControls, type TargetAndTransition, type Variants } from 'framer-motion';
import { Moon, Sun, Menu, X, Download, Github, Linkedin, Mail, ExternalLink, ChevronDown, MapPin, Calendar, Award, Code, Database, Cloud, Users, TrendingUp, Star, Quote } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

function cn(...classes: (string | undefined | null | boolean)[]): string {
return classes.filter(Boolean).join(" ");
}

interface RotatingTextRef {
next: () => void;
previous: () => void;
jumpTo: (index: number) => void;
reset: () => void;
}

interface RotatingTextProps extends Omit<React.ComponentPropsWithoutRef<typeof motion.span>, "children" | "transition" | "initial" | "animate" | "exit"> {
texts: string[];
transition?: Transition;
initial?: boolean | Target | VariantLabels;
animate?: boolean | VariantLabels | AnimationControls | TargetAndTransition;
exit?: Target | VariantLabels;
animatePresenceMode?: "sync" | "wait";
animatePresenceInitial?: boolean;
rotationInterval?: number;
staggerDuration?: number;
staggerFrom?: "first" | "last" | "center" | "random" | number;
loop?: boolean;
auto?: boolean;
splitBy?: "characters" | "words" | "lines" | string;
onNext?: (index: number) => void;
mainClassName?: string;
splitLevelClassName?: string;
elementLevelClassName?: string;
}

const RotatingText = forwardRef<RotatingTextRef, RotatingTextProps>(
(
{
texts,
transition = { type: "spring", damping: 25, stiffness: 300 },
initial = { y: "100%", opacity: 0 },
animate = { y: 0, opacity: 1 },
exit = { y: "-120%", opacity: 0 },
animatePresenceMode = "wait",
animatePresenceInitial = false,
rotationInterval = 2200,
staggerDuration = 0.01,
staggerFrom = "last",
loop = true,
auto = true,
splitBy = "characters",
onNext,
mainClassName,
splitLevelClassName,
elementLevelClassName,
...rest
},
ref
) => {
const [currentTextIndex, setCurrentTextIndex] = useState<number>(0);

const splitIntoCharacters = (text: string): string[] => {
// Use simple character splitting for better TypeScript compatibility
return text.split('');
};

const elements = useMemo(() => {
const currentText: string = texts[currentTextIndex] ?? '';
if (splitBy === "characters") {
const words = currentText.split(/(\s+)/);
let charCount = 0;
return words.filter(part => part.length > 0).map((part) => {
const isSpace = /^\s+$/.test(part);
const chars = isSpace ? [part] : splitIntoCharacters(part);
const startIndex = charCount;
charCount += chars.length;
return { characters: chars, isSpace: isSpace, startIndex: startIndex };
});
}
if (splitBy === "words") {
return currentText.split(/(\s+)/).filter(word => word.length > 0).map((word, i) => ({
characters: [word], isSpace: /^\s+$/.test(word), startIndex: i
}));
}
if (splitBy === "lines") {
return currentText.split('\n').map((line, i) => ({
characters: [line], isSpace: false, startIndex: i
}));
}
return currentText.split(splitBy).map((part, i) => ({
characters: [part], isSpace: false, startIndex: i
}));
}, [texts, currentTextIndex, splitBy]);

const totalElements = useMemo(() => elements.reduce((sum, el) => sum + el.characters.length, 0), [elements]);

const getStaggerDelay = useCallback(
(index: number, total: number): number => {
if (total <= 1 || !staggerDuration) return 0;
const stagger = staggerDuration;
switch (staggerFrom) {
case "first": return index * stagger;
case "last": return (total - 1 - index) * stagger;
case "center":
const center = (total - 1) / 2;
return Math.abs(center - index) * stagger;
case "random": return Math.random() * (total - 1) * stagger;
default:
if (typeof staggerFrom === 'number') {
const fromIndex = Math.max(0, Math.min(staggerFrom, total - 1));
return Math.abs(fromIndex - index) * stagger;
}
return index * stagger;
}
},
[staggerFrom, staggerDuration]
);

const handleIndexChange = useCallback(
(newIndex: number) => {
setCurrentTextIndex(newIndex);
onNext?.(newIndex);
},
[onNext]
);

const next = useCallback(() => {
const nextIndex = currentTextIndex === texts.length - 1 ? (loop ? 0 : currentTextIndex) : currentTextIndex + 1;
if (nextIndex !== currentTextIndex) handleIndexChange(nextIndex);
}, [currentTextIndex, texts.length, loop, handleIndexChange]);

const previous = useCallback(() => {
const prevIndex = currentTextIndex === 0 ? (loop ? texts.length - 1 : currentTextIndex) : currentTextIndex - 1;
if (prevIndex !== currentTextIndex) handleIndexChange(prevIndex);
}, [currentTextIndex, texts.length, loop, handleIndexChange]);

const jumpTo = useCallback(
(index: number) => {
const validIndex = Math.max(0, Math.min(index, texts.length - 1));
if (validIndex !== currentTextIndex) handleIndexChange(validIndex);
},
[texts.length, currentTextIndex, handleIndexChange]
);

const reset = useCallback(() => {
if (currentTextIndex !== 0) handleIndexChange(0);
}, [currentTextIndex, handleIndexChange]);

useImperativeHandle(ref, () => ({ next, previous, jumpTo, reset }), [next, previous, jumpTo, reset]);

useEffect(() => {
if (!auto || texts.length <= 1) return;
const intervalId = setInterval(next, rotationInterval);
return () => clearInterval(intervalId);
}, [next, rotationInterval, auto, texts.length]);

return (
<motion.span
className={cn("inline-flex flex-wrap whitespace-pre-wrap relative align-bottom pb-[10px]", mainClassName)}
{...rest}
layout
>
<span className="sr-only">{texts[currentTextIndex]}</span>
<AnimatePresence mode={animatePresenceMode} initial={animatePresenceInitial}>
<motion.div
key={currentTextIndex}
className={cn(
"inline-flex flex-wrap relative",
splitBy === "lines" ? "flex-col items-start w-full" : "flex-row items-baseline"
)}
layout
aria-hidden="true"
initial="initial"
animate="animate"
exit="exit"
>
{elements.map((elementObj, elementIndex) => (
<span
key={elementIndex}
className={cn("inline-flex", splitBy === 'lines' ? 'w-full' : '', splitLevelClassName)}
style={{ whiteSpace: 'pre' }}
>
{elementObj.characters.map((char, charIndex) => {
const globalIndex = elementObj.startIndex + charIndex;
return (
<motion.span
key={`${char}-${charIndex}`}
initial={initial}
animate={animate}
exit={exit}
transition={{
...transition,
delay: getStaggerDelay(globalIndex, totalElements),
}}
className={cn("inline-block leading-none tracking-tight", elementLevelClassName)}
>
{char === ' ' ? '\u00A0' : char}
</motion.span>
);
})}
</span>
))}
</motion.div>
</AnimatePresence>
</motion.span>
);
}
);
RotatingText.displayName = "RotatingText";

interface CardHoverRevealContextValue {
isHovered: boolean
setIsHovered: React.Dispatch<React.SetStateAction<boolean>>
}
const CardHoverRevealContext = React.createContext<CardHoverRevealContextValue>(
{} as CardHoverRevealContextValue
)
const useCardHoverRevealContext = () => {
const context = React.useContext(CardHoverRevealContext)
if (!context) {
throw new Error(
"useCardHoverRevealContext must be used within a CardHoverRevealProvider"
)
}
return context
}
const CardHoverReveal = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
const [isHovered, setIsHovered] = React.useState<boolean>(false)

const handleMouseEnter = () => setIsHovered(true)
const handleMouseLeave = () => setIsHovered(false)

return (
<CardHoverRevealContext.Provider
value={{
isHovered,
setIsHovered,
}}
>
<div
ref={ref}
className={cn("relative overflow-hidden", className)}
onMouseEnter={handleMouseEnter}
onMouseLeave={handleMouseLeave}
{...props}
/>
</CardHoverRevealContext.Provider>
)
})
CardHoverReveal.displayName = "CardHoverReveal"

interface CardHoverRevealMainProps {
initialScale?: number
hoverScale?: number
}
const CardHoverRevealMain = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement> & CardHoverRevealMainProps
>(({ className, initialScale = 1, hoverScale = 1.05, ...props }, ref) => {
const { isHovered } = useCardHoverRevealContext()
return (
<div
ref={ref}
className={cn("size-full transition-transform duration-300 ", className)}
style={
isHovered
? { transform: `scale(${hoverScale})`, ...props.style }
: { transform: `scale(${initialScale})`, ...props.style }
}
{...props}
/>
)
})
CardHoverRevealMain.displayName = "CardHoverRevealMain"

const CardHoverRevealContent = React.forwardRef<
HTMLDivElement,
React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
const { isHovered } = useCardHoverRevealContext()
return (
<div
ref={ref}
className={cn(
"absolute inset-[auto_1.5rem_1.5rem] p-6 backdrop-blur-lg transition-all duration-500 ease-in-out",
className
)}
style={
isHovered
? { translate: "0%", opacity: 1, ...props.style }
: { translate: "0% 120%", opacity: 0, ...props.style }
}
{...props}
/>
)
})
CardHoverRevealContent.displayName = "CardHoverRevealContent"

const KrishnaPortfolio = () => {
const [isDarkMode, setIsDarkMode] = useState(true);
const [isMenuOpen, setIsMenuOpen] = useState(false);
const [isScrolled, setIsScrolled] = useState(false);
const [activeSection, setActiveSection] = useState('hero');

const { scrollY } = useScroll();
useMotionValueEvent(scrollY, "change", (latest) => {
setIsScrolled(latest > 50);
});

const toggleTheme = () => {
setIsDarkMode(!isDarkMode);
document.documentElement.classList.toggle('dark');
};

const scrollToSection = (sectionId: string) => {
const element = document.getElementById(sectionId);
if (element) {
element.scrollIntoView({ behavior: 'smooth' });
setIsMenuOpen(false);
}
};

const navItems = [
{ id: 'hero', label: 'Home' },
{ id: 'about', label: 'About' },
{ id: 'experience', label: 'Experience' },
{ id: 'projects', label: 'Projects' },
{ id: 'skills', label: 'Skills' },
{ id: 'achievements', label: 'Achievements' },
{ id: 'testimonials', label: 'Testimonials' },
{ id: 'contact', label: 'Contact' }
];

const workExperience = [
{
title: "Associate Product Manager",
company: "GeeksforGeeks",
period: "2023 - Present",
location: "Noida, India",
achievements: [
"Led cross-functional teams to launch 3 major product features, increasing user engagement by 35%",
"Implemented data-driven decision making processes, resulting in 25% improvement in product metrics",
"Managed product roadmap for 500K+ active users",
"Collaborated with engineering teams to reduce feature delivery time by 40%"
],
technologies: ["Product Analytics", "A/B Testing", "User Research", "Agile", "SQL"]
}
];

const projects = [
{
title: "E-Commerce Analytics Dashboard",
description: "Built a comprehensive analytics platform for tracking user behavior and sales metrics",
image: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=500&h=300&fit=crop",
technologies: ["React", "Python", "PostgreSQL", "AWS"],
liveUrl: "https://example.com",
caseStudyUrl: "https://example.com/case-study",
metrics: ["40% increase in conversion", "Real-time data processing", "10+ KPIs tracked"]
},
{
title: "Mobile Learning Platform",
description: "Designed and launched a mobile-first learning platform for technical skills",
image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=500&h=300&fit=crop",
technologies: ["React Native", "Node.js", "MongoDB", "Firebase"],
liveUrl: "https://example.com",
caseStudyUrl: "https://example.com/case-study",
metrics: ["50K+ downloads", "4.8 star rating", "85% completion rate"]
},
{
title: "AI-Powered Content Recommendation",
description: "Developed ML-based content recommendation system improving user engagement",
image: "https://images.unsplash.com/photo-1677442136019-21780ecad995?w=500&h=300&fit=crop",
technologies: ["Python", "TensorFlow", "Docker", "GCP"],
liveUrl: "https://example.com",
caseStudyUrl: "https://example.com/case-study",
metrics: ["60% engagement boost", "ML accuracy 92%", "Reduced churn by 30%"]
}
];

const skills = {
"Product Management": ["Product Strategy", "Roadmap Planning", "User Research", "A/B Testing", "Analytics"],
"Technical Skills": ["SQL", "Python", "JavaScript", "React", "Node.js"],
"Cloud & Data": ["AWS", "Google Cloud", "PostgreSQL", "MongoDB", "Data Analysis"],
"Tools": ["Jira", "Figma", "Tableau", "Google Analytics", "Mixpanel"]
};

const achievements = [
{ title: "Product Excellence Award", description: "Recognized for outstanding product delivery at GeeksforGeeks", year: "2024" },
{ title: "AWS Cloud Practitioner", description: "Certified in AWS cloud fundamentals", year: "2023" },
{ title: "Google Analytics Certified", description: "Advanced certification in digital analytics", year: "2023" },
{ title: "Agile Product Owner", description: "Certified Scrum Product Owner (CSPO)", year: "2022" }
];

const testimonials = [
{
name: "Sarah Johnson",
role: "Engineering Manager",
company: "GeeksforGeeks",
content: "Krishna's ability to bridge technical and business requirements is exceptional. His data-driven approach has significantly improved our product decisions.",
avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=100&h=100&fit=crop&crop=face"
},
{
name: "Raj Patel",
role: "Senior Developer",
company: "GeeksforGeeks",
content: "Working with Krishna has been a great experience. He understands both user needs and technical constraints, making collaboration seamless.",
avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face"
}
];

return (
<div className={cn("min-h-screen transition-colors duration-300", isDarkMode ? "dark bg-background text-foreground" : "bg-white text-gray-900")}>
{/* Navigation */}
<motion.nav
className={cn(
"fixed top-0 left-0 right-0 z-50 transition-all duration-300",
isScrolled ? "bg-background/80 backdrop-blur-md border-b border-border" : "bg-transparent"
)}
initial={{ y: -100 }}
animate={{ y: 0 }}
transition={{ duration: 0.5 }}
>
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
<div className="flex justify-between items-center h-16">
<motion.div
className="text-xl font-bold"
whileHover={{ scale: 1.05 }}
>
Krishna
</motion.div>

{/* Desktop Navigation */}
<div className="hidden md:flex items-center space-x-8">
{navItems.map((item) => (
<button
key={item.id}
onClick={() => scrollToSection(item.id)}
className={cn(
"text-sm font-medium transition-colors hover:text-primary",
activeSection === item.id ? "text-primary" : "text-muted-foreground"
)}
>
{item.label}
</button>
))}
<Button
variant="ghost"
size="sm"
onClick={toggleTheme}
className="ml-4"
>
{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
</Button>
</div>

{/* Mobile Menu Button */}
<div className="md:hidden flex items-center space-x-2">
<Button variant="ghost" size="sm" onClick={toggleTheme}>
{isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
</Button>
<Button
variant="ghost"
size="sm"
onClick={() => setIsMenuOpen(!isMenuOpen)}
>
{isMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
</Button>
</div>
</div>

{/* Mobile Menu */}
<AnimatePresence>
{isMenuOpen && (
<motion.div
initial={{ opacity: 0, height: 0 }}
animate={{ opacity: 1, height: "auto" }}
exit={{ opacity: 0, height: 0 }}
className="md:hidden border-t border-border"
>
<div className="py-4 space-y-2">
{navItems.map((item) => (
<button
key={item.id}
onClick={() => scrollToSection(item.id)}
className="block w-full text-left px-4 py-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors"
>
{item.label}
</button>
))}
</div>
</motion.div>
)}
</AnimatePresence>
</div>
</motion.nav>

{/* Hero Section */}
<section id="hero" className="min-h-screen flex items-center justify-center px-4 pt-16">
<div className="max-w-4xl mx-auto text-center">
<motion.div
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8 }}
className="space-y-6"
>
<motion.h1
className="text-4xl md:text-6xl lg:text-7xl font-bold leading-tight"
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 0.2, duration: 0.8 }}
>
Vemakoti Krishnamurty
</motion.h1>

<motion.div
className="text-xl md:text-2xl text-muted-foreground"
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 0.4, duration: 0.8 }}
>
Associate Product Manager | Product Thinker |{" "}
<RotatingText
texts={["Data Enthusiast", "Cloud Expert", "Innovation Driver"]}
className="text-primary font-semibold"
rotationInterval={3000}
/>
</motion.div>

<motion.p
className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto"
initial={{ opacity: 0 }}
animate={{ opacity: 1 }}
transition={{ delay: 0.6, duration: 0.8 }}
>
Building user-first products with impact, speed, and clarity.
</motion.p>

<motion.div
className="flex flex-wrap justify-center gap-4 pt-8"
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ delay: 0.8, duration: 0.8 }}
>
<Button size="lg" className="gap-2">
<Download className="h-4 w-4" />
Download Resume
</Button>
<Button variant="outline" size="lg" className="gap-2">
<Linkedin className="h-4 w-4" />
LinkedIn
</Button>
<Button variant="outline" size="lg" className="gap-2">
<Github className="h-4 w-4" />
GitHub
</Button>
<Button variant="outline" size="lg" className="gap-2">
<Mail className="h-4 w-4" />
Contact Me
</Button>
</motion.div>
</motion.div>
</div>
</section>

{/* About Section */}
<section id="about" className="py-20 px-4">
<div className="max-w-4xl mx-auto">
<motion.div
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
className="text-center mb-16"
>
<h2 className="text-3xl md:text-4xl font-bold mb-6">About Me</h2>
<div className="space-y-6 text-lg text-muted-foreground max-w-3xl mx-auto">
<p>
I'm a passionate Associate Product Manager at GeeksforGeeks, where I bridge the gap between
technology and user needs. With a strong foundation in data analysis and cloud technologies,
I drive product decisions that create meaningful impact for our 500K+ active users.
</p>
<p>
Currently pursuing my career goals focused on joining top-tier technology companies,
I bring expertise in product strategy, user research, and cross-functional team leadership.
I speak English, Hindi, and Telugu fluently, enabling me to work effectively with diverse teams.
</p>
<div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8">
<div className="text-center">
<MapPin className="h-8 w-8 mx-auto mb-2 text-primary" />
<h3 className="font-semibold">Location</h3>
<p className="text-sm">Noida, India</p>
</div>
<div className="text-center">
<Users className="h-8 w-8 mx-auto mb-2 text-primary" />
<h3 className="font-semibold">Languages</h3>
<p className="text-sm">English, Hindi, Telugu</p>
</div>
<div className="text-center">
<TrendingUp className="h-8 w-8 mx-auto mb-2 text-primary" />
<h3 className="font-semibold">Focus</h3>
<p className="text-sm">Product Excellence</p>
</div>
</div>
</div>
</motion.div>
</div>
</section>

{/* Experience Section */}
<section id="experience" className="py-20 px-4 bg-muted/50">
<div className="max-w-6xl mx-auto">
<motion.div
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
className="text-center mb-16"
>
<h2 className="text-3xl md:text-4xl font-bold mb-6">Work Experience</h2>
</motion.div>

<div className="space-y-8">
{workExperience.map((job, index) => (
<motion.div
key={index}
initial={{ opacity: 0, x: -20 }}
whileInView={{ opacity: 1, x: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8, delay: index * 0.2 }}
>
<Card className="p-6">
<div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4">
<div>
<h3 className="text-xl font-bold">{job.title}</h3>
<p className="text-lg text-primary font-semibold">{job.company}</p>
<div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
<span className="flex items-center gap-1">
<Calendar className="h-4 w-4" />
{job.period}
</span>
<span className="flex items-center gap-1">
<MapPin className="h-4 w-4" />
{job.location}
</span>
</div>
</div>
</div>

<div className="space-y-4">
<div>
<h4 className="font-semibold mb-2">Key Achievements:</h4>
<ul className="space-y-2">
{job.achievements.map((achievement, i) => (
<li key={i} className="flex items-start gap-2">
<Star className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
<span className="text-muted-foreground">{achievement}</span>
</li>
))}
</ul>
</div>

<div>
<h4 className="font-semibold mb-2">Technologies:</h4>
<div className="flex flex-wrap gap-2">
{job.technologies.map((tech, i) => (
<Badge key={i} variant="secondary">{tech}</Badge>
))}
</div>
</div>
</div>
</Card>
</motion.div>
))}
</div>
</div>
</section>

{/* Projects Section */}
<section id="projects" className="py-20 px-4">
<div className="max-w-6xl mx-auto">
<motion.div
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
className="text-center mb-16"
>
<h2 className="text-3xl md:text-4xl font-bold mb-6">Featured Projects</h2>
<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
Showcasing impactful products and solutions I've built and managed
</p>
</motion.div>

<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
{projects.map((project, index) => (
<motion.div
key={index}
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8, delay: index * 0.2 }}
>
<CardHoverReveal className="h-96 rounded-xl">
<CardHoverRevealMain>
<img
src={project.image}
alt={project.title}
className="w-full h-full object-cover"
/>
</CardHoverRevealMain>
<CardHoverRevealContent className="bg-background/90 backdrop-blur-md rounded-xl border border-border">
<div className="space-y-4">
<div>
<h3 className="text-lg font-bold">{project.title}</h3>
<p className="text-sm text-muted-foreground">{project.description}</p>
</div>

<div className="space-y-2">
<h4 className="text-sm font-semibold">Key Metrics:</h4>
<div className="space-y-1">
{project.metrics.map((metric, i) => (
<div key={i} className="text-xs text-primary">{metric}</div>
))}
</div>
</div>

<div className="flex flex-wrap gap-1">
{project.technologies.slice(0, 3).map((tech, i) => (
<Badge key={i} variant="outline" className="text-xs">{tech}</Badge>
))}
</div>

<div className="flex gap-2">
<Button size="sm" className="flex-1">
<ExternalLink className="h-3 w-3 mr-1" />
Live Demo
</Button>
<Dialog>
<DialogTrigger asChild>
<Button size="sm" variant="outline" className="flex-1">
Case Study
</Button>
</DialogTrigger>
<DialogContent className="max-w-2xl">
<DialogHeader>
<DialogTitle>{project.title}</DialogTitle>
<DialogDescription>
Detailed case study and project insights
</DialogDescription>
</DialogHeader>
<div className="space-y-4">
<img src={project.image} alt={project.title} className="w-full h-48 object-cover rounded-lg" />
<p>{project.description}</p>
<div>
<h4 className="font-semibold mb-2">Technologies Used:</h4>
<div className="flex flex-wrap gap-2">
{project.technologies.map((tech, i) => (
<Badge key={i} variant="secondary">{tech}</Badge>
))}
</div>
</div>
</div>
</DialogContent>
</Dialog>
</div>
</div>
</CardHoverRevealContent>
</CardHoverReveal>
</motion.div>
))}
</div>
</div>
</section>

{/* Skills Section */}
<section id="skills" className="py-20 px-4 bg-muted/50">
<div className="max-w-6xl mx-auto">
<motion.div
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
className="text-center mb-16"
>
<h2 className="text-3xl md:text-4xl font-bold mb-6">Skills & Expertise</h2>
</motion.div>

<Tabs defaultValue="Product Management" className="w-full">
<TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
{Object.keys(skills).map((category) => (
<TabsTrigger key={category} value={category} className="text-xs lg:text-sm">
{category}
</TabsTrigger>
))}
</TabsList>

{Object.entries(skills).map(([category, skillList]) => (
<TabsContent key={category} value={category} className="mt-8">
<motion.div
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.5 }}
className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4"
>
{skillList.map((skill, index) => (
<motion.div
key={skill}
initial={{ opacity: 0, scale: 0.8 }}
animate={{ opacity: 1, scale: 1 }}
transition={{ duration: 0.3, delay: index * 0.1 }}
>
<TooltipProvider>
<Tooltip>
<TooltipTrigger asChild>
<Card className="p-4 text-center hover:shadow-lg transition-shadow cursor-pointer">
<div className="flex flex-col items-center space-y-2">
{category === "Product Management" && <Users className="h-6 w-6 text-primary" />}
{category === "Technical Skills" && <Code className="h-6 w-6 text-primary" />}
{category === "Cloud & Data" && <Cloud className="h-6 w-6 text-primary" />}
{category === "Tools" && <Database className="h-6 w-6 text-primary" />}
<span className="text-sm font-medium">{skill}</span>
</div>
</Card>
</TooltipTrigger>
<TooltipContent>
<p>Proficient in {skill}</p>
</TooltipContent>
</Tooltip>
</TooltipProvider>
</motion.div>
))}
</motion.div>
</TabsContent>
))}
</Tabs>
</div>
</section>

{/* Achievements Section */}
<section id="achievements" className="py-20 px-4">
<div className="max-w-6xl mx-auto">
<motion.div
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
className="text-center mb-16"
>
<h2 className="text-3xl md:text-4xl font-bold mb-6">Achievements & Certifications</h2>
</motion.div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
{achievements.map((achievement, index) => (
<motion.div
key={index}
initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
whileInView={{ opacity: 1, x: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8, delay: index * 0.2 }}
>
<Card className="p-6 h-full">
<div className="flex items-start space-x-4">
<div className="bg-primary/10 p-3 rounded-full">
<Award className="h-6 w-6 text-primary" />
</div>
<div className="flex-1">
<h3 className="text-lg font-bold mb-2">{achievement.title}</h3>
<p className="text-muted-foreground mb-2">{achievement.description}</p>
<Badge variant="outline">{achievement.year}</Badge>
</div>
</div>
</Card>
</motion.div>
))}
</div>
</div>
</section>

{/* Testimonials Section */}
<section id="testimonials" className="py-20 px-4 bg-muted/50">
<div className="max-w-6xl mx-auto">
<motion.div
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
className="text-center mb-16"
>
<h2 className="text-3xl md:text-4xl font-bold mb-6">What Colleagues Say</h2>
</motion.div>

<div className="grid grid-cols-1 md:grid-cols-2 gap-8">
{testimonials.map((testimonial, index) => (
<motion.div
key={index}
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8, delay: index * 0.2 }}
>
<Card className="p-6 h-full">
<div className="space-y-4">
<Quote className="h-8 w-8 text-primary" />
<p className="text-muted-foreground italic">"{testimonial.content}"</p>
<div className="flex items-center space-x-3">
<img
src={testimonial.avatar}
alt={testimonial.name}
className="w-12 h-12 rounded-full object-cover"
/>
<div>
<h4 className="font-semibold">{testimonial.name}</h4>
<p className="text-sm text-muted-foreground">
{testimonial.role} at {testimonial.company}
</p>
</div>
</div>
</div>
</Card>
</motion.div>
))}
</div>
</div>
</section>

{/* Contact Section */}
<section id="contact" className="py-20 px-4">
<div className="max-w-4xl mx-auto">
<motion.div
initial={{ opacity: 0, y: 20 }}
whileInView={{ opacity: 1, y: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
className="text-center mb-16"
>
<h2 className="text-3xl md:text-4xl font-bold mb-6">Let's Connect</h2>
<p className="text-lg text-muted-foreground max-w-2xl mx-auto">
Ready to discuss opportunities or collaborate on exciting projects?
I'd love to hear from you.
</p>
</motion.div>

<div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
<motion.div
initial={{ opacity: 0, x: -20 }}
whileInView={{ opacity: 1, x: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
className="space-y-6"
>
<Card className="p-6">
<h3 className="text-xl font-bold mb-4">Get in Touch</h3>
<div className="space-y-4">
<div className="flex items-center space-x-3">
<Mail className="h-5 w-5 text-primary" />
<span>krishna@example.com</span>
</div>
<div className="flex items-center space-x-3">
<Linkedin className="h-5 w-5 text-primary" />
<span>linkedin.com/in/krishnamurty</span>
</div>
<div className="flex items-center space-x-3">
<Github className="h-5 w-5 text-primary" />
<span>github.com/krishnamurty</span>
</div>
</div>
</Card>

<div className="flex space-x-4">
<Button className="flex-1 gap-2">
<Linkedin className="h-4 w-4" />
LinkedIn
</Button>
<Button variant="outline" className="flex-1 gap-2">
<Github className="h-4 w-4" />
GitHub
</Button>
</div>
</motion.div>

<motion.div
initial={{ opacity: 0, x: 20 }}
whileInView={{ opacity: 1, x: 0 }}
viewport={{ once: true }}
transition={{ duration: 0.8 }}
>
<Card className="p-6">
<h3 className="text-xl font-bold mb-4">Send a Message</h3>
<form className="space-y-4">
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
<div>
<label className="text-sm font-medium mb-2 block">Name</label>
<Input placeholder="Your name" />
</div>
<div>
<label className="text-sm font-medium mb-2 block">Email</label>
<Input type="email" placeholder="your@email.com" />
</div>
</div>
<div>
<label className="text-sm font-medium mb-2 block">Message</label>
<Textarea
placeholder="Tell me about your project or opportunity..."
rows={4}
/>
</div>
<Button className="w-full">Send Message</Button>
</form>
</Card>
</motion.div>
</div>
</div>
</section>

{/* Footer */}
<footer className="py-8 px-4 border-t border-border">
<div className="max-w-6xl mx-auto text-center">
<p className="text-muted-foreground">
© 2024 Vemakoti Krishnamurty. Built with passion for great products.
</p>
</div>
</footer>
</div>
);
};

export default App
