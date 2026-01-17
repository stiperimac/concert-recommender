import AccessibilityControls from '@/components/AccessibilityControls';

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">Postavke</h1>
        <p className="text-sm" style={{ color: 'rgb(var(--muted))' }}>
          Uključuje dvije komponente inkluzivnog dizajna: high-contrast mode i povećanje fonta.
        </p>
      </header>

      <AccessibilityControls />
    </div>
  );
}
