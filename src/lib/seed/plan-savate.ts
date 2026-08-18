/**
 * ============================================================================
 *  SEED DU PLAN — SEUL FICHIER A EDITER POUR CHANGER LE CONTENU
 * ============================================================================
 *  Aucun composant ne connait le contenu du plan. Modifier ce fichier, puis
 *  recharger l'app : le plan est reecrit en base au demarrage (les seances
 *  deja loggees ne sont jamais touchees).
 *
 *  Regles d'edition :
 *   - les `id` d'exercice doivent rester uniques ET stables : ce sont eux qui
 *     relient un log a un exercice, et qui alimentent le pre-remplissage
 *     "valeurs de la derniere seance identique". Renommer un id casse le
 *     rappel des charges, changer un `nom` ne casse rien.
 *   - `suitProgression: true` sur une mesure `rounds` = le nombre de rounds
 *     vient de la table de progression de la semaine.
 *   - `toursSuitProgression: true` sur un bloc `circuit` = le bloc est repete
 *     `renfoTours` fois.
 *   - `requiertCoupsHauts: true` = l'exercice disparait tant que la semaine
 *     n'autorise pas les coups hauts.
 * ============================================================================
 */
import type { Plan } from '@/lib/types'

export const PLAN: Plan = {
  id: 'savate-retour-8s',
  nom: 'Savate BF — retour progressif, 8 semaines',
  nbSemaines: 8,
  seanceMobiliteId: 'mobilite',
  avertissement:
    'Plan personnel, ce n’est pas un avis médical. En cas de douleur vive, qui réveille la nuit ou qui fait boiter, on arrête et on consulte.',

  // ---------------------------------------------------------------------
  //  Semaine type : quel jour, quelle seance
  // ---------------------------------------------------------------------
  jours: [
    { jour: 1, seanceId: 'bf-a', optionnel: false },
    { jour: 2, seanceId: 'renfo-a', optionnel: false },
    { jour: 3, seanceId: 'cardio', optionnel: false },
    { jour: 4, seanceId: 'bf-b', optionnel: false },
    { jour: 5, seanceId: 'renfo-b', optionnel: true },
    { jour: 6, seanceId: null, optionnel: false },
    { jour: 7, seanceId: 'mobilite', optionnel: true },
  ],

  // ---------------------------------------------------------------------
  //  Table de progression, semaine par semaine
  // ---------------------------------------------------------------------
  progression: [
    {
      semaine: 1,
      bfRounds: 3,
      bfIntensitePct: [50, 60],
      coupsHautsAutorises: false,
      renfoTours: 2,
      cardioFormat: '20 min de vélo, allure conversation',
      note: 'Reprise. Rien au-dessus de la ceinture, aucun coup en extension complète. On cherche le geste propre, pas la puissance.',
    },
    {
      semaine: 2,
      bfRounds: 4,
      bfIntensitePct: [55, 65],
      coupsHautsAutorises: false,
      renfoTours: 2,
      cardioFormat: '25 min de vélo, allure conversation',
      note: 'Même cadre, un round de plus. Le lendemain doit rester silencieux.',
    },
    {
      semaine: 3,
      bfRounds: 5,
      bfIntensitePct: [60, 70],
      coupsHautsAutorises: false,
      renfoTours: 3,
      cardioFormat: '6 × (2 min soutenu / 1 min souple)',
      note: 'Première semaine à 3 tours de renfo. Coups bas et médians uniquement.',
    },
    {
      semaine: 4,
      bfRounds: 5,
      bfIntensitePct: [65, 75],
      coupsHautsAutorises: true,
      renfoTours: 3,
      cardioFormat: '8 × (2 min soutenu / 1 min souple)',
      note: 'Réintroduction des coups hauts, jambe avant seulement, à vide puis au sac. Volume de rounds inchangé exprès.',
    },
    {
      semaine: 5,
      bfRounds: 6,
      bfIntensitePct: [70, 80],
      coupsHautsAutorises: true,
      renfoTours: 3,
      cardioFormat: '10 × (30 s vif / 30 s souple)',
      note: 'Coups hauts des deux jambes. Premiers enchaînements à vitesse réelle.',
    },
    {
      semaine: 6,
      bfRounds: 6,
      bfIntensitePct: [75, 85],
      coupsHautsAutorises: true,
      renfoTours: 4,
      cardioFormat: '12 × (30 s vif / 30 s souple)',
      note: 'Semaine la plus chargée en renfo. Si la séance BF du jeudi est terne, allège plutôt que de forcer.',
    },
    {
      semaine: 7,
      bfRounds: 7,
      bfIntensitePct: [80, 90],
      coupsHautsAutorises: true,
      renfoTours: 4,
      cardioFormat: '2 blocs de 8 × (40 s vif / 20 s souple), 3 min entre les blocs',
      note: 'Opposition souple possible sur les rounds d’intensité. Touche, ne casse pas.',
    },
    {
      semaine: 8,
      bfRounds: 8,
      bfIntensitePct: [85, 95],
      coupsHautsAutorises: true,
      renfoTours: 3,
      cardioFormat: '15 min souple + 6 × 10 s de sprint, récupération complète',
      note: 'Affûtage. Renfo redescendu à 3 tours pour arriver frais. Le volume de rounds est au maximum du plan.',
    },
  ],

  // ---------------------------------------------------------------------
  //  Seances
  // ---------------------------------------------------------------------
  seances: [
    // ================= BF A =================
    {
      id: 'bf-a',
      nom: 'BF A — Technique et déplacements',
      type: 'bf',
      dureeCibleMin: 60,
      blocs: [
        {
          bloc: 'echauffement',
          titre: 'Échauffement',
          exercices: [
            { id: 'bfa-e1', nom: 'Corde à sauter', mesure: 'duree', consigne: 'Appuis silencieux, épaules basses', cible: { dureeSec: 180 } },
            { id: 'bfa-e2', nom: 'Mobilité des hanches, ouverture-fermeture', mesure: 'duree', consigne: 'Debout, appui au mur, amplitude progressive', cible: { dureeSec: 120 } },
            { id: 'bfa-e3', nom: 'Montées de genoux puis talons-fesses', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'bfa-e4', nom: 'Gammes d’appuis en garde', mesure: 'duree', consigne: 'Avant, arrière, latéral, sans croiser les pieds', cible: { dureeSec: 180 } },
            { id: 'bfa-e5', nom: 'Armés de fouetté à vide', mesure: 'duree', consigne: 'Jambe avant puis arrière, sans extension finale', cible: { dureeSec: 120 } },
          ],
        },
        {
          bloc: 'technique',
          titre: 'Technique',
          exercices: [
            { id: 'bfa-t1', nom: 'Fouetté bas, jambe avant', mesure: 'reps', consigne: 'Lent, retour de jambe contrôlé', cible: { series: 3, reps: 10, reposSec: 30 } },
            { id: 'bfa-t2', nom: 'Chassé frontal, jambe arrière', mesure: 'reps', consigne: 'Pousse la hanche, ne claque pas le genou', cible: { series: 3, reps: 8, reposSec: 30 } },
            { id: 'bfa-t3', nom: 'Direct-direct puis chassé bas', mesure: 'reps', consigne: 'Enchaînement complet, garde haute', cible: { series: 3, reps: 10, reposSec: 30 } },
            { id: 'bfa-t4', nom: 'Revers frontal, jambe avant', mesure: 'reps', consigne: 'Amplitude moyenne, gainage', cible: { series: 3, reps: 8, reposSec: 30 } },
            { id: 'bfa-t5', nom: 'Esquive rotative puis fouetté médian', mesure: 'reps', consigne: 'Riposte immédiate, pas de temps mort', cible: { series: 3, reps: 8, reposSec: 30 } },
            { id: 'bfa-t6', nom: 'Fouetté figure, jambe avant', mesure: 'reps', consigne: 'À vide d’abord, puis au sac si rien ne tire', cible: { series: 3, reps: 6, reposSec: 40 }, requiertCoupsHauts: true },
          ],
        },
        {
          bloc: 'sac',
          titre: 'Sac',
          exercices: [
            { id: 'bfa-s1', nom: 'Rounds au sac, technique libre', mesure: 'rounds', consigne: 'Reste dans la fourchette d’intensité de la semaine : {intensite}', suitProgression: true },
          ],
        },
        {
          bloc: 'intensite',
          titre: 'Intensité',
          exercices: [
            { id: 'bfa-i1', nom: 'Rounds d’ombre, déplacements vifs', mesure: 'rounds', consigne: 'Vitesse de déplacement, pas de puissance', suitProgression: true },
          ],
        },
        {
          bloc: 'retour_au_calme',
          titre: 'Retour au calme',
          exercices: [
            { id: 'bfa-r1', nom: 'Étirement des adducteurs, assis', mesure: 'duree', consigne: 'Sans à-coup, jusqu’à la tension, jamais la douleur', cible: { dureeSec: 90 } },
            { id: 'bfa-r2', nom: 'Étirement des ischios, jambe tendue', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'bfa-r3', nom: 'Fente basse, ouverture du psoas', mesure: 'duree', consigne: '45 s par côté', cible: { dureeSec: 90 } },
            { id: 'bfa-r4', nom: 'Respiration nasale allongée', mesure: 'duree', consigne: 'Expiration deux fois plus longue que l’inspiration', cible: { dureeSec: 120 } },
          ],
        },
      ],
    },

    // ================= BF B =================
    {
      id: 'bf-b',
      nom: 'BF B — Puissance et enchaînements',
      type: 'bf',
      dureeCibleMin: 60,
      blocs: [
        {
          bloc: 'echauffement',
          titre: 'Échauffement',
          exercices: [
            { id: 'bfb-e1', nom: 'Corde à sauter', mesure: 'duree', consigne: 'Dont 30 s de pas chassés', cible: { dureeSec: 180 } },
            { id: 'bfb-e2', nom: 'Activation des fessiers à l’élastique', mesure: 'reps', consigne: 'Pas latéraux, genoux fléchis', cible: { series: 2, reps: 15 } },
            { id: 'bfb-e3', nom: 'Gammes de fouetté à vide', mesure: 'duree', consigne: 'Montée progressive en amplitude', cible: { dureeSec: 120 } },
            { id: 'bfb-e4', nom: 'Sautillés et changements de garde', mesure: 'duree', cible: { dureeSec: 90 } },
          ],
        },
        {
          bloc: 'technique',
          titre: 'Technique',
          exercices: [
            { id: 'bfb-t1', nom: 'Direct, crochet, fouetté médian', mesure: 'reps', consigne: 'Le pied suit le poing, pas l’inverse', cible: { series: 3, reps: 8, reposSec: 40 } },
            { id: 'bfb-t2', nom: 'Chassé latéral, jambe arrière', mesure: 'reps', consigne: 'Poussée franche, retour en garde', cible: { series: 3, reps: 8, reposSec: 40 } },
            { id: 'bfb-t3', nom: 'Revers groupé, jambe avant', mesure: 'reps', cible: { series: 3, reps: 8, reposSec: 40 } },
            { id: 'bfb-t4', nom: 'Dérobement puis riposte en chassé', mesure: 'reps', consigne: 'Recule d’un demi-pas, pas d’un pas entier', cible: { series: 3, reps: 6, reposSec: 40 } },
            { id: 'bfb-t5', nom: 'Fouetté figure, jambe arrière', mesure: 'reps', consigne: 'Le vrai test de la semaine. Au moindre tirage à l’aine, on arrête l’exercice', cible: { series: 3, reps: 6, reposSec: 45 }, requiertCoupsHauts: true },
          ],
        },
        {
          bloc: 'sac',
          titre: 'Sac',
          exercices: [
            { id: 'bfb-s1', nom: 'Rounds au sac, enchaînements en puissance', mesure: 'rounds', consigne: '3 à 4 enchaînements maximum, répétés proprement. Intensité {intensite}', suitProgression: true },
          ],
        },
        {
          bloc: 'intensite',
          titre: 'Intensité',
          exercices: [
            { id: 'bfb-i1', nom: 'Rounds intermittents 15 s / 15 s', mesure: 'rounds', consigne: '15 s à fond, 15 s en déplacement souple, sans sortir de la garde', suitProgression: true },
          ],
        },
        {
          bloc: 'retour_au_calme',
          titre: 'Retour au calme',
          exercices: [
            { id: 'bfb-r1', nom: 'Étirement des adducteurs, grenouille', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'bfb-r2', nom: 'Étirement des quadriceps, debout', mesure: 'duree', consigne: '45 s par côté', cible: { dureeSec: 90 } },
            { id: 'bfb-r3', nom: 'Ouverture thoracique au sol', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'bfb-r4', nom: 'Respiration nasale allongée', mesure: 'duree', cible: { dureeSec: 120 } },
          ],
        },
      ],
    },

    // ================= RENFO A =================
    {
      id: 'renfo-a',
      nom: 'Renfo A — Chaîne postérieure et gainage',
      type: 'renfo',
      dureeCibleMin: 45,
      blocs: [
        {
          bloc: 'echauffement',
          titre: 'Échauffement',
          exercices: [
            { id: 'rna-e1', nom: 'Vélo ou rameur, allure facile', mesure: 'duree', cible: { dureeSec: 300 } },
            { id: 'rna-e2', nom: 'Pont fessier au sol', mesure: 'reps', cible: { series: 2, reps: 15 } },
            { id: 'rna-e3', nom: 'Bird-dog', mesure: 'reps', consigne: '10 par côté, sans bouger le bassin', cible: { series: 1, reps: 20 } },
          ],
        },
        {
          bloc: 'circuit',
          titre: 'Circuit',
          toursSuitProgression: true,
          exercices: [
            { id: 'rna-c1', nom: 'Soulevé de terre roumain, haltères', mesure: 'reps_charge', consigne: 'Dos neutre, on descend jusqu’à la tension des ischios', cible: { reps: 10, reposSec: 45 } },
            { id: 'rna-c2', nom: 'Nordic curl excentrique', mesure: 'reps', consigne: 'Descente de 4 s, remontée aidée aux mains', cible: { reps: 6, reposSec: 45 } },
            { id: 'rna-c3', nom: 'Copenhagen adduction', mesure: 'duree', consigne: 'L’exercice clé pour l’aine. 20 s par côté, genou fléchi si c’est trop dur', cible: { dureeSec: 40, reposSec: 30 } },
            { id: 'rna-c4', nom: 'Hip thrust', mesure: 'reps_charge', consigne: 'Pause d’une seconde en haut', cible: { reps: 12, reposSec: 45 } },
            { id: 'rna-c5', nom: 'Gainage ventral', mesure: 'duree', consigne: 'Fessiers serrés, côtes basses', cible: { dureeSec: 40, reposSec: 30 } },
            { id: 'rna-c6', nom: 'Pallof press à l’élastique', mesure: 'reps', consigne: '12 par côté, résister à la rotation', cible: { reps: 24, reposSec: 45 } },
          ],
        },
        {
          bloc: 'retour_au_calme',
          titre: 'Retour au calme',
          exercices: [
            { id: 'rna-r1', nom: 'Étirement des ischios avec sangle', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'rna-r2', nom: 'Étirement des adducteurs, assis', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'rna-r3', nom: 'Respiration nasale allongée', mesure: 'duree', cible: { dureeSec: 90 } },
          ],
        },
      ],
    },

    // ================= RENFO B =================
    {
      id: 'renfo-b',
      nom: 'Renfo B — Appuis et unilatéral',
      type: 'renfo',
      dureeCibleMin: 45,
      blocs: [
        {
          bloc: 'echauffement',
          titre: 'Échauffement',
          exercices: [
            { id: 'rnb-e1', nom: 'Vélo ou corde, allure facile', mesure: 'duree', cible: { dureeSec: 300 } },
            { id: 'rnb-e2', nom: 'Squat au poids du corps', mesure: 'reps', cible: { series: 2, reps: 15 } },
            { id: 'rnb-e3', nom: 'Chevilles, genou au mur', mesure: 'reps', consigne: '10 par côté, talon au sol', cible: { series: 1, reps: 20 } },
          ],
        },
        {
          bloc: 'circuit',
          titre: 'Circuit',
          toursSuitProgression: true,
          exercices: [
            { id: 'rnb-c1', nom: 'Fente bulgare', mesure: 'reps_charge', consigne: '8 par jambe, genou dans l’axe', cible: { reps: 16, reposSec: 60 } },
            { id: 'rnb-c2', nom: 'Squat gobelet', mesure: 'reps_charge', consigne: 'Descente contrôlée, buste droit', cible: { reps: 12, reposSec: 45 } },
            { id: 'rnb-c3', nom: 'Montées de banc', mesure: 'reps_charge', consigne: '10 par jambe, sans élan', cible: { reps: 20, reposSec: 45 } },
            { id: 'rnb-c4', nom: 'Mollets debout', mesure: 'reps_charge', consigne: 'Amplitude complète, pause en haut', cible: { reps: 15, reposSec: 30 } },
            { id: 'rnb-c5', nom: 'Adduction à l’élastique, debout', mesure: 'reps', consigne: '15 par côté, lent au retour', cible: { reps: 30, reposSec: 30 } },
            { id: 'rnb-c6', nom: 'Gainage latéral', mesure: 'duree', consigne: '30 s par côté', cible: { dureeSec: 60, reposSec: 30 } },
          ],
        },
        {
          bloc: 'retour_au_calme',
          titre: 'Retour au calme',
          exercices: [
            { id: 'rnb-r1', nom: 'Étirement des quadriceps et du psoas', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'rnb-r2', nom: 'Étirement des mollets au mur', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'rnb-r3', nom: 'Respiration nasale allongée', mesure: 'duree', cible: { dureeSec: 90 } },
          ],
        },
      ],
    },

    // ================= CARDIO =================
    {
      id: 'cardio',
      nom: 'Cardio',
      type: 'cardio',
      dureeCibleMin: 35,
      blocs: [
        {
          bloc: 'echauffement',
          titre: 'Échauffement',
          exercices: [
            { id: 'car-e1', nom: 'Montée en allure progressive', mesure: 'duree', consigne: 'Vélo, rameur ou course, au choix', cible: { dureeSec: 480 } },
          ],
        },
        {
          bloc: 'intensite',
          titre: 'Bloc principal',
          exercices: [
            { id: 'car-i1', nom: 'Bloc principal', mesure: 'duree', consigne: '{cardioFormat}', cible: { dureeSec: 1200 } },
          ],
        },
        {
          bloc: 'retour_au_calme',
          titre: 'Retour au calme',
          exercices: [
            { id: 'car-r1', nom: 'Retour au calme actif', mesure: 'duree', consigne: 'Allure très facile jusqu’au retour du souffle', cible: { dureeSec: 300 } },
            { id: 'car-r2', nom: 'Étirements courts des jambes', mesure: 'duree', cible: { dureeSec: 120 } },
          ],
        },
      ],
    },

    // ================= MOBILITE (soupape) =================
    {
      id: 'mobilite',
      nom: 'Mobilité 15 min',
      type: 'mobilite',
      dureeCibleMin: 15,
      blocs: [
        {
          bloc: 'retour_au_calme',
          titre: 'Mobilité',
          exercices: [
            { id: 'mob-1', nom: 'Respiration et décompression du dos', mesure: 'duree', consigne: 'Allongé, jambes sur une chaise', cible: { dureeSec: 120 } },
            { id: 'mob-2', nom: 'Ouverture de hanches 90-90', mesure: 'duree', consigne: 'Bascule lente d’un côté à l’autre', cible: { dureeSec: 120 } },
            { id: 'mob-3', nom: 'Grenouille, adducteurs', mesure: 'duree', consigne: 'Va-et-vient doux, jamais en force', cible: { dureeSec: 120 } },
            { id: 'mob-4', nom: 'Ischios avec sangle', mesure: 'duree', consigne: '60 s par jambe', cible: { dureeSec: 120 } },
            { id: 'mob-5', nom: 'Chevilles, genou au mur', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'mob-6', nom: 'Ouverture thoracique', mesure: 'duree', cible: { dureeSec: 90 } },
            { id: 'mob-7', nom: 'Pigeon, fessiers', mesure: 'duree', consigne: '60 s par côté', cible: { dureeSec: 120 } },
            { id: 'mob-8', nom: 'Respiration finale', mesure: 'duree', consigne: 'Expiration longue, mâchoire relâchée', cible: { dureeSec: 120 } },
          ],
        },
      ],
    },
  ],

  // ---------------------------------------------------------------------
  //  Seuils de vigilance — affiches en fin de seance quand une gene de
  //  niveau 3 est declaree sur la zone.
  // ---------------------------------------------------------------------
  seuilsVigilance: [
    {
      zone: 'aine',
      seuil:
        'Adducteurs : retire les coups hauts et les chassés latéraux de la prochaine séance, garde le Copenhagen en isométrique court. Si ça tire encore après 48 h, la prochaine BF passe en mobilité.',
    },
    {
      zone: 'ischio',
      seuil:
        'Ischios : plus de fouetté en extension complète tant que ça tire. Le Nordic curl passe en excentrique assisté, amplitude réduite de moitié. Pas de sprint ni de fractionné court cette semaine.',
    },
    {
      zone: 'cheville',
      seuil:
        'Cheville : supprime la corde à sauter et les sautillés, remplace par du vélo. Vérifie l’appui du pied avant sur les chassés. Si l’articulation gonfle, glace et repos 48 h.',
    },
    {
      zone: 'epaule',
      seuil:
        'Épaule : garde haute uniquement, pas de sac en puissance sur les poings. Les rounds passent en travail de jambes seules. Ajoute les rotateurs externes à l’élastique à l’échauffement.',
    },
    {
      zone: 'genou',
      seuil:
        'Genou : stoppe les fentes bulgares et les montées de banc, remplace par du hip thrust. Aucun chassé à pleine extension. Un genou qui claque et qui fait mal, c’est consultation, pas patience.',
    },
    {
      zone: 'dos',
      seuil:
        'Dos : retire le soulevé de terre roumain chargé cette semaine, garde le gainage et le bird-dog. Rounds au sac à intensité basse. Si la douleur descend dans la jambe, on consulte avant la prochaine séance.',
    },
  ],
}
