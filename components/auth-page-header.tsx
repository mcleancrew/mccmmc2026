export function AuthPageHeader() {
  return (
    <div className="text-center mb-3">
      <img
        src="/images/mclean-crew-logo.png"
        alt="McLean Crew Logo"
        className="h-20 w-20 object-contain mx-auto mb-2"
      />
      <h1 className="text-2xl font-bold text-brand leading-tight">
        Mclean Crew Club
        <br />
        Million Meters Challenge
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
        Developed and maintained by Adrian Wiklund
      </p>
    </div>
  )
}
