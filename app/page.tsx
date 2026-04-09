import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex h-screen flex-col items-center justify-center bg-gradient-to-br from-bga-dark to-bga-darker p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        {/* Logo */}
        <div>
          <h1 className="text-6xl font-bold text-bga-accent">UNO</h1>
          <p className="mt-2 text-xl text-gray-300">Play Online with Friends</p>
        </div>

        {/* CTA Buttons */}
        <div className="space-y-3">
          <Link
            href="/auth/login"
            className="block w-full rounded-lg bg-bga-accent px-4 py-3 font-semibold text-bga-dark transition hover:bg-opacity-90"
          >
            Sign In
          </Link>
          <Link
            href="/auth/register"
            className="block w-full rounded-lg border-2 border-bga-accent px-4 py-3 font-semibold text-bga-accent transition hover:bg-bga-accent hover:text-bga-dark"
          >
            Create Account
          </Link>
        </div>

        {/* Features */}
        <div className="space-y-2 pt-8 text-sm text-gray-400">
          <p>✓ Play with up to 10 players</p>
          <p>✓ Casual and Ranked modes</p>
          <p>✓ Real-time friend status</p>
          <p>✓ Unlockable achievements</p>
        </div>
      </div>
    </main>
  )
}
