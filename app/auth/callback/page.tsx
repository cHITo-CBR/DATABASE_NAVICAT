"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { syncGoogleUser } from "@/app/actions/oauth";
import { Loader2 } from "lucide-react";

export default function AuthCallbackPage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const handling = useRef(false);

  useEffect(() => {
    async function handleAuth() {
      if (handling.current) return;
      handling.current = true;

      // Supabase's browser client automatically parses the #access_token from the URL here
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        setError("Failed to get session from Google. Make sure your browser allows cookies.");
        setTimeout(() => router.push("/login"), 3000);
        return;
      }

      // Securely pass the access token to the server to create our custom JWT session
      const res = await syncGoogleUser(session.access_token);
      
      // Cleanup the Supabase session footprint since we use a custom JWT
      await supabase.auth.signOut();

      if (res?.error) {
        setError(res.error);
        setTimeout(() => router.push("/login"), 3000);
      } else if (res?.redirect) {
        // Use window.location for hard reload to initialize cookies properly
        window.location.href = res.redirect;
      }
    }

    handleAuth();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#F4F7F6]">
      {error ? (
        <div className="text-red-600 font-bold p-4 bg-red-100 rounded-lg max-w-sm text-center">
          {error}
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <Loader2 className="h-12 w-12 animate-spin text-[#005914] mb-4" />
          <p className="text-[#005914] font-medium text-lg">Authenticating with Google...</p>
        </div>
      )}
    </div>
  );
}
