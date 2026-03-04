"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api";
import { CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await apiClient.forgotPassword(email);
      setSubmitted(true);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-8 text-center">
        <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
        <div>
          <h1 className="text-2xl font-bold">Check your email</h1>
          <p className="text-sm text-gray-500 mt-2">
            If an account exists with that email address, you will receive a
            password reset link shortly.
          </p>
        </div>
        <Button variant="outline" asChild>
          <Link href="/login">← Back to login</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-gray-500 mt-1">
          Enter your email and we&apos;ll send you a reset link
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-2">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@university.edu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="text-base min-h-[44px]"
            required
          />
        </div>
        <Button
          type="submit"
          className="w-full h-11"
          disabled={isLoading}
        >
          {isLoading ? "Sending…" : "Send reset link"}
        </Button>
      </form>

      <p className="text-center text-sm text-gray-500">
        <Link href="/login" className="text-indigo-600 hover:underline">
          ← Back to login
        </Link>
      </p>
    </div>
  );
}
