"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { TrendUp, Shield, Clock } from "@phosphor-icons/react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials. Please try again.");
      } else {
        router.push("/");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    {
      icon: TrendUp,
      title: "Real-time Operations",
      description: "Live tracking, instant updates, zero-refresh workflows",
    },
    {
      icon: Shield,
      title: "Enterprise Security",
      description: "Role-based access, audit trails, SOC 2 compliance path",
    },
    {
      icon: Clock,
      title: "Modern Experience",
      description: "Web-native design, mobile-first, premium interface",
    },
  ];

  return (
    <div className="flex min-h-[100dvh] bg-zinc-50">
      {/* Left side - Branding & Value Prop */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:justify-between bg-gradient-to-br from-apollo-cyan-600 to-apollo-cyan-700 px-12 py-16 text-white">
        <div>
          {/* Logo & Brand */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
            className="flex items-center gap-3"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 backdrop-blur-sm">
              <span className="font-mono text-lg font-bold">A</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight">Apollo TMS</h1>
              <p className="text-sm text-apollo-cyan-100">Operations, modernized</p>
            </div>
          </motion.div>

          {/* Value Proposition */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
            className="mt-16"
          >
            <h2 className="text-3xl font-bold leading-tight tracking-tight">
              Move smarter.
            </h2>
            <p className="mt-4 text-lg text-apollo-cyan-100 leading-relaxed">
              A web-native transportation management system built for modern carriers.
              Everything McLeod does, with a 10x better experience.
            </p>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
            className="mt-16 space-y-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{
                  duration: 0.5,
                  delay: 0.6 + index * 0.1,
                  type: "spring",
                  stiffness: 120
                }}
                className="flex items-start gap-3"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
                  <feature.icon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-white">{feature.title}</h3>
                  <p className="text-sm text-apollo-cyan-100">{feature.description}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Footer */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ type: "spring", stiffness: 240, damping: 24, delay: 0.8 }}
          className="text-sm text-apollo-cyan-200"
        >
          Apollo TMS v1.0 — Built for asset-based trucking companies
        </motion.p>
      </div>

      {/* Right side - Login Form */}
      <div className="flex flex-1 flex-col justify-center px-8 py-12 lg:px-16 lg:py-16">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: "spring", stiffness: 100 }}
              className="flex items-center gap-3"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-apollo-cyan-600 text-white">
                <span className="font-mono text-lg font-bold">A</span>
              </div>
              <div>
                <h1 className="text-xl font-semibold tracking-tight text-zinc-950">Apollo TMS</h1>
                <p className="text-sm text-zinc-500">Operations, modernized</p>
              </div>
            </motion.div>
          </div>

          {/* Form Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-bold tracking-tight text-zinc-950">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-zinc-500">
              Sign in to your account to continue to Apollo TMS
            </p>
          </motion.div>

          {/* Form */}
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4, type: "spring", stiffness: 100 }}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-200 p-3">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium text-zinc-700">
                Email address
              </label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="jake@apollotrucking.com"
                className="h-12 text-base"
                required
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label htmlFor="password" className="text-sm font-medium text-zinc-700">
                  Password
                </label>
                <button
                  type="button"
                  className="text-sm font-medium text-apollo-cyan-600 hover:text-apollo-cyan-700"
                >
                  Forgot password?
                </button>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-12 text-base"
                required
              />
            </div>

            <motion.div
              whileTap={{ scale: 0.98 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
            >
              <Button
                type="submit"
                disabled={isLoading}
                className="h-12 w-full text-base font-semibold rounded-xl"
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}
