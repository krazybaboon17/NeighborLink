import { motion } from "framer-motion";
import React from "react";

export const WavyBackground = ({
  children,
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={`relative w-full overflow-hidden bg-background ${className}`}>
      {/* Wave Layers */}
      <div className="absolute inset-0 z-0 opacity-30">
        <motion.div
          initial={{ y: -50 }}
          animate={{ y: 0 }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          className="absolute top-0 left-0 w-[200%] h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDMyMCI+PHBhdGggZmlsbD0iIzFmMjkzNyIgZmlsbC1vcGFjaXR5PSIwLjEiIGQ9Ik0wLDE2MEw0OCwxNTRDOTYsMTQ5LDE5MiwxMzksMjg4LDE1NC43QzM4NCwxNzEsNDgwLDIxMyw1NzYsMjEzLjNDNjcyLDIxMyw3NjgsMTcxLDg2NCwxNDkuM0M5NjAsMTI4LDEwNTYsMTI4LDExNTIsMTQ0QzEyNDgsMTYwLDEzNDQsMTkyLDEzOTIsMjA4TDE0NDAsMjI0TDE0NDAsMzIwTDAsMzIwWiI+PC9wYXRoPjwvc3ZnPg==')] bg-repeat-x bg-contain"
        />
        <motion.div
            initial={{ x: -100 }}
            animate={{ x: 0 }}
            transition={{
              duration: 20,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "linear",
            }}
            className="absolute top-[20%] left-0 w-[200%] h-full bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNDQwIDMyMCI+PHBhdGggZmlsbD0iIzFmMjkzNyIgZmlsbC1vcGFjaXR5PSIwLjEiIGQ9Ik0wLDE5Mkw4MCwxODFDMTYwLDE3MSwyNDAsMTQ5LDMyMCwxNTQuN0M0MDAsMTYwLDQ4MCwxOTIsNTYwLDE5N0M2NDAsMjAzLDcyMCwxODEsODAwLDE2MC4zQzg4MCwxMzksOTYwLDExNywxMDQwLDEyMkMxMTIwLDEyOCwxMjAwLDE2MCwxMjgwLDE3Ni4zQzEzNjAsMTkyLDE0NDAsMTkyLDE0ODAsMTkyTDE1MjAsMTkyTDE1MjAsMzIwTDAsMzIwWiI+PC9wYXRoPjwvc3ZnPg==')] bg-repeat-x bg-contain opacity-50"
            style={{ top: '40%' }}
        />
      </div>

      <div className="relative z-10">{children}</div>
    </div>
  );
};
