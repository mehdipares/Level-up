// src/pages/Legal.jsx
import Navbar from '../components/Navbar';
import '../styles/Legal/Legal.css';

export default function Legal() {
  return (
    <div className="DashBoard legal-root">
      <Navbar />
      <div className="container py-3">

        {/* HERO */}
        <div className="p-3 p-sm-4 mb-3 legal-hero">
          <h1 className="m-0">Mentions légales & Politique de confidentialité</h1>
          <div className="sub mt-1">
            Transparence sur l’éditeur, l’hébergeur, l’usage des données et les cookies.
          </div>
          <div className="mt-2 small opacity-90">Dernière mise à jour : <strong>JJ/MM/AAAA</strong></div>
        </div>

        {/* ÉDITEUR */}
        <section className="legal-section">
          <h2>Éditeur du site</h2>
          <ul className="legal-kv">
            <li><span>Raison sociale / Nom</span><strong>🟪 Ta société / Ton nom</strong></li>
            <li><span>Statut</span><strong>🟪 SAS / Auto-entrepreneur / …</strong></li>
            <li><span>Siège social</span><strong>🟪 Adresse complète</strong></li>
            <li><span>SIREN / SIRET</span><strong>🟪 123 456 789 / 123 456 789 00012</strong></li>
            <li><span>TVA intracommunautaire</span><strong>🟪 FRXX123456789</strong></li>
            <li><span>Directeur de la publication</span><strong>🟪 Nom Prénom</strong></li>
            <li><span>Contact</span><strong><a href="mailto:🟪contact@domaine.com">🟪contact@domaine.com</a></strong></li>
          </ul>
        </section>

        {/* HÉBERGEUR */}
        <section className="legal-section">
          <h2>Hébergeur</h2>
          <ul className="legal-kv">
            <li><span>Nom</span><strong>🟪 (ex. OVHcloud / Scaleway / Vercel / Render)</strong></li>
            <li><span>Adresse</span><strong>🟪 Adresse complète</strong></li>
            <li><span>Téléphone</span><strong>🟪 +33 …</strong></li>
            <li><span>Site</span><strong><a href="🟪https://hebergeur.com" target="_blank" rel="noreferrer">🟪https://hebergeur.com</a></strong></li>
          </ul>
        </section>

        {/* PROPRIÉTÉ INTELLECTUELLE */}
        <section className="legal-section">
          <h2>Propriété intellectuelle</h2>
          <p>
            L’ensemble des contenus (textes, visuels, logos, marques, code) est protégé par la législation en vigueur.
            Toute reproduction, représentation, modification, publication, transmission, dénaturation, totale ou partielle, est interdite
            sans autorisation écrite préalable de l’éditeur.
          </p>
        </section>

        {/* DONNÉES PERSONNELLES (RGPD) */}
        <section className="legal-section">
          <h2>Données personnelles (RGPD)</h2>
          <ul className="legal-kv">
            <li><span>Responsable de traitement</span><strong>🟪 Ta société / contact</strong></li>
            <li><span>E-mail de contact RGPD</span><strong><a href="mailto:🟪privacy@domaine.com">🟪privacy@domaine.com</a></strong></li>
            <li><span>Finalités</span>
              <div className="legal-bullets">
                <ul>
                  <li>Gestion de compte et authentification</li>
                  <li>Suivi des objectifs, progression XP, gamification</li>
                  <li>Support et communication (e-mail)</li>
                  <li>Mesure d’audience (statistiques agrégées)</li>
                  <li>Sécurité, prévention de la fraude et respect des obligations légales</li>
                </ul>
              </div>
            </li>
            <li><span>Bases légales</span>
              <div className="legal-bullets">
                <ul>
                  <li>Exécution du contrat (CGU) pour les fonctionnalités du compte</li>
                  <li>Intérêt légitime (amélioration produit, sécurité)</li>
                  <li>Consentement (cookies non essentiels / marketing)</li>
                  <li>Obligation légale (comptabilité, demandes autorités)</li>
                </ul>
              </div>
            </li>
            <li><span>Données traitées</span>
              <div className="legal-bullets">
                <ul>
                  <li>Identité et contact : nom d’utilisateur, e-mail</li>
                  <li>Données d’usage : objectifs, validations, XP, préférences</li>
                  <li>Données techniques : logs, adresse IP, user-agent</li>
                </ul>
              </div>
            </li>
            <li><span>Durées de conservation</span>
              <div className="legal-bullets">
                <ul>
                  <li>Compte : pendant l’utilisation + 🟪12 mois après suppression</li>
                  <li>Logs techniques : 🟪6 mois à 13 mois max (selon finalité)</li>
                  <li>Support client : 🟪3 ans après dernier contact</li>
                </ul>
              </div>
            </li>
            <li><span>Destinataires</span>
              <div className="legal-bullets">
                <ul>
                  <li>Équipe interne habilitée</li>
                  <li>Sous-traitants (hébergement, e-mailing, analytics) – liés par contrat et DPA</li>
                </ul>
              </div>
            </li>
            <li><span>Transferts hors UE</span>
              <div>🟪 Aucun / Encadrés par des Clauses Contractuelles Types (SCC) si applicables.</div>
            </li>
            <li><span>Vos droits</span>
              <div className="legal-bullets">
                <ul>
                  <li>Accès, rectification, effacement, limitation, opposition, portabilité</li>
                  <li>Retrait du consentement à tout moment (pour les traitements fondés sur le consentement)</li>
                  <li>Réclamation : <a href="https://www.cnil.fr" target="_blank" rel="noreferrer">CNIL</a></li>
                </ul>
              </div>
            </li>
            <li><span>Exercer vos droits</span><strong>Écrivez-nous à <a href="mailto:🟪privacy@domaine.com">🟪privacy@domaine.com</a></strong></li>
            <li><span>Sécurité</span>
              <div>Mesures techniques et organisationnelles raisonnables sont mises en œuvre pour protéger vos données.</div>
            </li>
          </ul>
        </section>

        {/* COOKIES */}
        <section className="legal-section">
          <h2>Cookies & traceurs</h2>
          <p>
            Nous utilisons des cookies essentiels au fonctionnement du site et, avec votre consentement, des cookies
            de mesure d’audience et d’amélioration produit.
          </p>
          <div className="legal-cookies-grid">
            <div>
              <h3>Essentiels</h3>
              <p>Connexion, sécurité, préférences. Durée : session à 12 mois.</p>
            </div>
            <div>
              <h3>Mesure d’audience</h3>
              <p>Statistiques agrégées (pages vues, parcours). Durée : 6 à 13 mois.</p>
            </div>
            <div>
              <h3>Personnalisation</h3>
              <p>Expérience et recommandations (si activée). Durée : 6 à 13 mois.</p>
            </div>
          </div>
          <button
            className="btn btn-soft mt-2"
            onClick={() => window.dispatchEvent(new CustomEvent('cookies:open'))}
          >
            Gérer mes cookies
          </button>
          <div className="small text-muted mt-2">
            Vous pouvez également paramétrer votre navigateur pour refuser les cookies.
          </div>
        </section>

        {/* RESPONSABILITÉ */}
        <section className="legal-section">
          <h2>Limitation de responsabilité</h2>
          <p>
            L’éditeur ne saurait être tenu pour responsable des dommages directs ou indirects résultant de l’accès
            ou de l’utilisation du site, y compris l’inaccessibilité, les pertes de données ou la présence de virus.
          </p>
        </section>

        {/* DROIT APPLICABLE */}
        <section className="legal-section">
          <h2>Droit applicable</h2>
          <p>Le présent site est régi par le droit français. En cas de litige, et à défaut d’accord amiable, compétence des tribunaux de 🟪 Ville.</p>
        </section>

      </div>
    </div>
  );
}
