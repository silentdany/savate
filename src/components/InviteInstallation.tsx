'use client'

import { useEffect, useState } from 'react'
import { Bouton } from '@/components/ui/Bouton'
import { cn } from '@/lib/cn'
import { useMonte } from '@/lib/hooks'

type EvenementInstall = Event & { prompt: () => Promise<void>; userChoice: Promise<unknown> }

// Simple preference d'interface, pas une donnee de seance : localStorage suffit.
const CLE_REFUS = 'savate:invite-install-masquee'

/**
 * Etat de la plateforme, lu une seule fois au chargement du module (donc hors
 * du rendu) : ni display-mode ni user-agent ne changent en cours de session.
 */
const PLATEFORME =
  typeof window === 'undefined'
    ? null
    : {
        ios: /iPad|iPhone|iPod/.test(navigator.userAgent),
        standalone:
          window.matchMedia('(display-mode: standalone)').matches ||
          (navigator as Navigator & { standalone?: boolean }).standalone === true,
        masquee: window.localStorage.getItem(CLE_REFUS) === '1',
      }

/**
 * Invite d'installation. L'app n'a d'interet qu'installee : depuis l'ecran
 * d'accueil elle demarre en plein ecran, sans barre d'adresse, et le service
 * worker garantit le fonctionnement hors ligne.
 */
export function InviteInstallation({ className }: { className?: string }) {
  const monte = useMonte()
  const [evenement, setEvenement] = useState<EvenementInstall | null>(null)
  const [refuse, setRefuse] = useState(false)
  const [installee, setInstallee] = useState(false)

  useEffect(() => {
    if (!PLATEFORME || PLATEFORME.standalone || PLATEFORME.masquee || PLATEFORME.ios) return
    const surInvite = (e: Event) => {
      e.preventDefault()
      setEvenement(e as EvenementInstall)
    }
    const surInstall = () => setInstallee(true)
    window.addEventListener('beforeinstallprompt', surInvite)
    window.addEventListener('appinstalled', surInstall)
    return () => {
      window.removeEventListener('beforeinstallprompt', surInvite)
      window.removeEventListener('appinstalled', surInstall)
    }
  }, [])

  if (!monte || !PLATEFORME) return null
  if (PLATEFORME.standalone || PLATEFORME.masquee || refuse || installee) return null
  // Hors iOS, on n'affiche rien tant que le navigateur n'a pas juge l'app
  // installable : autrement l'invite promet un bouton qui n'existe pas.
  if (!PLATEFORME.ios && !evenement) return null

  const refuser = () => {
    window.localStorage.setItem(CLE_REFUS, '1')
    setRefuse(true)
  }

  return (
    <aside
      className={cn('rounded-card border border-line bg-surface p-5', className)}
      aria-label="Installer l’application"
    >
      <p className="text-[18px] font-bold">Installe Savate sur ton écran d’accueil</p>
      <p className="mt-1 text-[17px] leading-relaxed text-ink-2">
        {PLATEFORME.ios
          ? 'Bouton Partager, puis « Sur l’écran d’accueil ». L’app s’ouvre alors en plein écran et fonctionne sans réseau.'
          : 'Plein écran, démarrage instantané, et tout marche sans réseau au dojo.'}
      </p>
      <div className="mt-4 flex gap-3">
        {evenement && (
          <Bouton
            variante="primaire"
            taille="md"
            pleineLargeur
            onClick={async () => {
              await evenement.prompt()
              setEvenement(null)
            }}
          >
            Installer
          </Bouton>
        )}
        <Bouton variante="fantome" taille="md" pleineLargeur onClick={refuser}>
          Non merci
        </Bouton>
      </div>
    </aside>
  )
}
