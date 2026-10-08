export default function Laden() {
  return (
    <div className="animate-pulse" aria-busy="true" aria-label="Laden">
      <div className="h-8 w-56 rounded-md bg-lijn" />
      <div className="mt-3 h-4 w-80 rounded bg-lijn" />
      <div className="kaart mt-8 h-40" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1.6fr_1fr]">
        <div className="kaart h-72" />
        <div className="kaart h-72" />
      </div>
    </div>
  );
}
