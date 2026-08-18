/**
 * Identifiant sentinelle du shell prerendu de /seance/[logId].
 * Defini hors du module client : importe depuis un fichier 'use client', il
 * arriverait cote serveur sous forme de reference et non de chaine.
 */
export const SENTINELLE_SEANCE = '_'
