/**
 * Aperçu d'un brouillon dont le compte n'a pas (encore) de logement : lire, EN LECTURE SEULE, les types de chambre d'un
 * AUTRE propriétaire désigné par la configuration du serveur — pour que le client voie ses vraies villas avant la mise en
 * ligne (Nommos : le brouillon est sur un compte neutre sans logement, l'hôtel est un compte réel en production).
 *
 * `APERCU_LOGEMENTS_DE` = `<propriétaire du jeton>=<propriétaire lu>`, paires séparées par des virgules (24 hex chacun ;
 * le reste est ignoré ; VIDE par défaut = aucun effet). Garde-fous :
 *  - jamais pour un site publié : seule la route d'APERÇU (jeton signé valide) l'appelle ;
 *  - une seule correspondance par propriétaire de jeton, jamais « n'importe quel PM » : un autre propriétaire reste illisible ;
 *  - lecture seule : aucune écriture chez le propriétaire lu, et le parcours reste en démonstration (aucune réservation).
 */
const HEX24 = /^[0-9a-f]{24}$/i

export type EnvApercu = Record<string, string | undefined>

export function proprietaireLuPourApercu(proprietaireDuJeton: string, env: EnvApercu = process.env): string {
  const jeton = proprietaireDuJeton.trim().toLowerCase()
  for (const paire of String(env.APERCU_LOGEMENTS_DE ?? '').split(',')) {
    const [de, vers] = paire.split('=').map((v) => v?.trim().toLowerCase() ?? '')
    if (HEX24.test(de) && HEX24.test(vers) && de === jeton) return vers
  }
  return jeton
}
