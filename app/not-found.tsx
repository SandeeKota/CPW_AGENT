import Image from "next/image";
import Link from "next/link";
import { Home, LogIn } from "lucide-react";
import Logo from "@/assets/app_logo_black.svg";
import { Button } from "@/app/components/ui/button";

export default function NotFound() {
  return (
    <main className="min-h-screen bg-[#f9f8f5] px-6 py-10 text-slate-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-5xl flex-col justify-center">
        <div className="mb-10 flex items-center gap-3">
          <Image
            src={Logo}
            alt="Community Pure Water"
            width={44}
            height={44}
            className="h-11 w-11 object-contain"
            priority
          />
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-[#227077]">
              Community Pure Water
            </p>
            <p className="text-sm text-slate-500">Dashboard</p>
          </div>
        </div>

        <div className="max-w-2xl">
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.22em] text-[#d46939]">
            404
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
            Page not found
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
            The page you are looking for is not available or may have been
            moved.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button asChild className="bg-[#227077] hover:bg-[#1c6268]">
              <Link href="/dashboard">
                <Home className="mr-2 h-4 w-4" />
                Go to Dashboard
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/auth">
                <LogIn className="mr-2 h-4 w-4" />
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </main>
  );
}
