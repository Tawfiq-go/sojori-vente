/** Le lien d'aperçu (15 min) est expiré ou inconnu : un message neutre, sans marque ni lien de la plateforme. */
export function LienApercuExpire() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '24px', background: '#faf8f4', color: '#2a2522', fontFamily: 'system-ui, sans-serif', textAlign: 'center' }}>
      <div style={{ maxWidth: 460 }}>
        <h1 style={{ fontSize: 24, fontWeight: 600, margin: '0 0 12px' }}>Lien d’aperçu expiré</h1>
        <p style={{ margin: '0 0 6px', lineHeight: 1.6 }}>Ce lien n’est plus valable. Demandez-en un nouveau.</p>
        <p style={{ margin: 0, lineHeight: 1.6, opacity: 0.7 }}>This preview link has expired. Please ask for a new one.</p>
      </div>
    </main>
  )
}
