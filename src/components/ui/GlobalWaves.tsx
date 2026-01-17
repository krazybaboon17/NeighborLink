import { motion, useScroll, useTransform } from "framer-motion";

export const GlobalWaves = () => {
    const { scrollY } = useScroll();

    // Adjusted movement to keep it centered but dynamic
    // We want the "movement" to be noticeable but relative to the center
    const y1 = useTransform(scrollY, [0, 5000], [0, 500]);
    const y2 = useTransform(scrollY, [0, 5000], [0, 800]);
    const y3 = useTransform(scrollY, [0, 5000], [0, 400]);

    // Phase shift - kept large for visibility
    const x1 = useTransform(scrollY, [0, 5000], [0, 600]);
    const x2 = useTransform(scrollY, [0, 5000], [0, -800]);
    const x3 = useTransform(scrollY, [0, 5000], [0, 400]);

    return (
        <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-background flex items-center justify-center">
            {/* Container forced to center vertically */}
            <div className="relative w-full h-[150vh] min-h-[1000px] flex items-center justify-center">

                {/* Wave 1 - Base Layer */}
                <motion.div
                    style={{ y: y1, x: x1 }}
                    className="absolute w-[200%] h-full opacity-[0.03] text-foreground flex items-center"
                >
                    <svg viewBox="0 0 1440 600" preserveAspectRatio="none" className="w-full h-full fill-current">
                        {/* Midline at 300 (50% of 600) */}
                        <path d="M0,300 C360,100 1080,500 1440,300 V900 H0 V300 Z" />
                        <path d="M0,300 C360,500 1080,100 1440,300 V-300 H0 V300 Z" opacity="0.5" />
                    </svg>
                </motion.div>

                {/* Wave 2 - Middle Layer (Blue Tint) */}
                <motion.div
                    style={{ y: y2, x: x2 }}
                    className="absolute w-[200%] h-full opacity-15 text-primary flex items-center"
                >
                    <svg viewBox="0 0 1440 600" preserveAspectRatio="none" className="w-full h-full fill-current">
                        <path d="M0,300 C480,150 960,450 1440,300 V900 H0 V300 Z" />
                    </svg>
                </motion.div>

                {/* Wave 3 - Top Layer (Accent Tint) */}
                <motion.div
                    style={{ y: y3, x: x3 }}
                    className="absolute w-[200%] h-full opacity-10 text-secondary-foreground flex items-center"
                >
                    <svg viewBox="0 0 1440 600" preserveAspectRatio="none" className="w-full h-full fill-current">
                        <path d="M0,300 C720,200 720,400 1440,300 V900 H0 V300 Z" />
                    </svg>
                </motion.div>
            </div>
        </div>
    );
};
