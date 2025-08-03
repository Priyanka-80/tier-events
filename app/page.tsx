"use client";

import { useUser } from "@clerk/nextjs";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return; // ⏳ wait until Clerk is ready

    if (user) {
      router.push("/dashboard"); // ✅ only redirect if user is signed in
    }
    // ❌ don't do anything if user is not signed in
  }, [user, isLoaded, router]);

  return (
    <main className="flex justify-center items-center h-screen text-xl">
      Welcome! Please <a href="/sign-in" className="text-blue-600 underline ml-2">sign in</a>.
    </main>
  );
}
