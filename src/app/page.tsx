import HomeDashboard from '@/components/HomeDashboard';

export default function Page() {
  return (
    <div className="space-y-8">
      <section className="space-y-2">
        <h1 className="text-2xl font-semibold">Preporuke koncerata</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Odaberi omiljene izvođače, a aplikacija predlaže nadolazeće koncerte u tvom gradu. Sustav koristi profile sadržaja,
          globalnu popularnost i personalizirane preporuke.
        </p>
      </section>
      <HomeDashboard />
    </div>
  );
}
