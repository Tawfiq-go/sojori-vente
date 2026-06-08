import './coming-soon.css';

export default function ComingSoonPage() {
  return (
    <main className="cs-page">
      <div className="cs-grain" aria-hidden="true" />
      <div className="cs-inner">
        <div className="cs-brand">
          <span className="cs-dot" />
          <span className="cs-name">sojori</span>
        </div>

        <h1 className="cs-title">
          Bientôt <em>disponible</em>
        </h1>

        <p className="cs-lead">
          Nous préparons une nouvelle expérience pour vos séjours premium au Maroc.
          Riads, villas et appartements triés par des experts locaux — très bientôt en ligne.
        </p>

        <p className="cs-note">
          Property managers &amp; hôtes professionnels →{' '}
          <a href="https://business.sojori.com" rel="noopener noreferrer">
            business.sojori.com
          </a>
        </p>
      </div>
    </main>
  );
}
